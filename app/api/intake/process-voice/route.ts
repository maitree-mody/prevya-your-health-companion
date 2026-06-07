import type { NextRequest } from "next/server";
import groq from "@/lib/anthropic";
import elevenlabs from "@/lib/elevenlabs";
import { supabaseAdmin } from "@/lib/supabase";

export const maxDuration = 60;

const DEMO_USER_ID = "00000000-0000-0000-0000-000000000001";

const EXTRACTION_SYSTEM_PROMPT = `You are a medical symptom and history analyzer.
The user has spoken about their health. Extract all clinically relevant information they mentioned.
Return ONLY valid JSON with exactly this structure (no markdown, no explanation):
{
  "date": "string or null",
  "document_type": "verbal_history",
  "doctor_name": "string or null",
  "symptoms_mentioned": ["string"],
  "diagnoses_mentioned": ["string"],
  "medications_mentioned": [
    {"name": "string", "dose": "string", "frequency": "string"}
  ],
  "lab_values": [
    {"name": "string", "value": "string", "unit": "string", "reference_range": "string", "flag": "normal|high|low"}
  ],
  "clinical_notes": "string",
  "specialist_type": "string or null"
}`;

type ExtractedData = {
  date: string | null;
  document_type: string;
  doctor_name: string | null;
  symptoms_mentioned: string[];
  diagnoses_mentioned: string[];
  medications_mentioned: Array<{ name: string; dose: string; frequency: string }>;
  lab_values: Array<{ name: string; value: string; unit: string; reference_range: string; flag: string }>;
  clinical_notes: string;
  specialist_type: string | null;
};

function emptyExtraction(): ExtractedData {
  return {
    date: null,
    document_type: "verbal_history",
    doctor_name: null,
    symptoms_mentioned: [],
    diagnoses_mentioned: [],
    medications_mentioned: [],
    lab_values: [],
    clinical_notes: "",
    specialist_type: null,
  };
}

function safeParseJson(raw: string | null | undefined): ExtractedData {
  if (!raw) return emptyExtraction();
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
  try {
    return JSON.parse(cleaned) as ExtractedData;
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]) as ExtractedData; } catch { /* fall through */ }
    }
    return emptyExtraction();
  }
}

async function extractFromTranscript(transcript: string): Promise<ExtractedData> {
  const chat = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: EXTRACTION_SYSTEM_PROMPT },
      { role: "user", content: `Patient verbal history:\n\n${transcript.slice(0, 6000)}` },
    ],
    response_format: { type: "json_object" },
    temperature: 0,
    max_tokens: 2048,
  });
  return safeParseJson(chat.choices[0].message.content);
}

async function transcribeAudio(audioBuffer: Buffer, mimeType: string, filename: string): Promise<string> {
  // Copy into a fresh ArrayBuffer — avoids SharedArrayBuffer assignability error in strict TS
  const ab = new ArrayBuffer(audioBuffer.length);
  new Uint8Array(ab).set(audioBuffer);
  const blob = new Blob([ab], { type: mimeType });
  const file = new File([blob], filename, { type: mimeType });

  const result = await elevenlabs.speechToText.convert({
    file,
    model_id: "scribe_v1",
  });

  // result.text contains the transcript
  return (result as unknown as { text: string }).text ?? "";
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audio = formData.get("audio") as File | null;
    const userId = (formData.get("userId") as string | null) ?? DEMO_USER_ID;

    if (!audio) {
      return Response.json({ error: "No audio provided" }, { status: 400 });
    }

    const bytes = await audio.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const mimeType = audio.type || "audio/webm";
    const filename = audio.name || `voice-${Date.now()}.webm`;
    const storagePath = `${userId}/voice/${Date.now()}-${filename}`;

    // 1. Store audio in Supabase Storage
    await supabaseAdmin.storage
      .from("medical-records")
      .upload(storagePath, buffer, { contentType: mimeType, upsert: false })
      .catch(() => null);

    // 2. Transcribe via ElevenLabs
    let transcript = "";
    try {
      transcript = await transcribeAudio(buffer, mimeType, filename);
    } catch (transcribeErr) {
      console.error("ElevenLabs transcription error:", transcribeErr);
      return Response.json(
        { error: "Transcription failed. Check ELEVENLABS_API_KEY and audio format." },
        { status: 502 },
      );
    }

    if (!transcript.trim()) {
      return Response.json({ error: "Empty transcript — no speech detected." }, { status: 422 });
    }

    // 3. Extract medical data from transcript
    const extracted = await extractFromTranscript(transcript);

    // 4. Store document record for the voice entry
    const now = new Date().toISOString();

    const { data: docRow } = await supabaseAdmin
      .from("documents")
      .insert({
        user_id: userId,
        source: "voice",
        file_url: storagePath,
        processed_boolean: true,
        extracted_json: { ...extracted, transcript },
      })
      .select("id")
      .single();

    // 5. Create timeline events for symptoms + lab values
    const timelineRows: object[] = [];

    for (const symptom of extracted.symptoms_mentioned) {
      timelineRows.push({
        user_id: userId,
        date: extracted.date ?? now,
        content: symptom,
        source: "voice",
        event_type: "symptom",
        clinical_flag: false,
      });
    }

    for (const lab of extracted.lab_values) {
      timelineRows.push({
        user_id: userId,
        date: extracted.date ?? now,
        content: `${lab.name}: ${lab.value} ${lab.unit} (ref ${lab.reference_range})`,
        source: "voice",
        event_type: "lab_result",
        clinical_flag: lab.flag === "high" || lab.flag === "low",
      });
    }

    if (timelineRows.length > 0) {
      await supabaseAdmin.from("timeline_events").insert(timelineRows).then(({ error }) => {
        if (error) console.error("timeline_events insert:", error.message);
      });
    }

    // 6. Log to agent_actions
    const itemsFound =
      extracted.symptoms_mentioned.length +
      extracted.lab_values.length +
      extracted.diagnoses_mentioned.length;

    await supabaseAdmin.from("agent_actions").insert({
      user_id: userId,
      agent_name: "intake_agent",
      action_type: "voice_processed",
      action_detail: JSON.stringify({ filename, items_found: itemsFound, transcript_length: transcript.length }),
      status: "complete",
      verified_boolean: true,
      timestamp: now,
    });

    // 7. Return
    return Response.json({
      success: true,
      document_id: docRow?.id ?? null,
      transcript,
      extracted,
      items_found: itemsFound,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("process-voice error:", msg);
    return Response.json({ error: msg }, { status: 500 });
  }
}
