import type { NextRequest } from "next/server";
import groq from "@/lib/anthropic";
import { supabaseAdmin } from "@/lib/supabase";

export const maxDuration = 60;

const DEMO_USER_ID = "00000000-0000-0000-0000-000000000001";

const EXTRACTION_SYSTEM_PROMPT = `You are a medical document analyzer. Extract all clinically relevant information.
Return ONLY valid JSON with exactly this structure (no markdown, no explanation):
{
  "date": "string or null",
  "document_type": "string",
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
    document_type: "unknown",
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
  // Strip markdown code fences if present
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
  try {
    return JSON.parse(cleaned) as ExtractedData;
  } catch {
    // Try extracting just the JSON object
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]) as ExtractedData; } catch { /* fall through */ }
    }
    return emptyExtraction();
  }
}

async function extractFromText(text: string): Promise<ExtractedData> {
  const chat = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: EXTRACTION_SYSTEM_PROMPT },
      { role: "user", content: `Medical document:\n\n${text.slice(0, 8000)}` },
    ],
    response_format: { type: "json_object" },
    temperature: 0,
    max_tokens: 2048,
  });
  return safeParseJson(chat.choices[0].message.content);
}

async function extractFromImage(base64: string, mimeType: string): Promise<ExtractedData> {
  const chat = await groq.chat.completions.create({
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
    messages: [
      { role: "system", content: EXTRACTION_SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: { url: `data:${mimeType};base64,${base64}` },
          },
          { type: "text", text: "Extract all clinically relevant information from this medical document. Return only JSON." },
        ],
      },
    ],
    temperature: 0,
    max_tokens: 2048,
  });
  return safeParseJson(chat.choices[0].message.content);
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const userId = (formData.get("userId") as string | null) ?? DEMO_USER_ID;

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const storagePath = `${userId}/${Date.now()}-${file.name}`;

    // 1. Upload to Supabase Storage (best-effort — don't fail if bucket missing)
    await supabaseAdmin.storage
      .from("medical-records")
      .upload(storagePath, buffer, { contentType: file.type, upsert: false })
      .catch(() => null);

    // 2. Extract data based on file type
    let extracted: ExtractedData;

    if (file.type === "application/pdf") {
      // pdf-parse ships ESM without a .default; handle both CJS and ESM shapes
      const pdfMod = await import("pdf-parse");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pdfParse: (buf: Buffer) => Promise<{ text: string }> = (pdfMod as any).default ?? pdfMod;
      const pdf = await pdfParse(buffer);
      extracted = await extractFromText(pdf.text);
    } else if (file.type.startsWith("image/")) {
      const base64 = buffer.toString("base64");
      extracted = await extractFromImage(base64, file.type);
    } else {
      // Treat as plain text
      extracted = await extractFromText(buffer.toString("utf-8"));
    }

    // 3. Store document record
    const { data: docRow, error: docErr } = await supabaseAdmin
      .from("documents")
      .insert({
        user_id: userId,
        source: "upload",
        file_url: storagePath,
        processed_boolean: true,
        extracted_json: extracted,
      })
      .select("id")
      .single();

    if (docErr) {
      console.error("documents insert:", docErr.message);
    }

    // 4. Create timeline events for symptoms + lab values
    const now = new Date().toISOString();
    const timelineRows: object[] = [];

    for (const symptom of extracted.symptoms_mentioned) {
      timelineRows.push({
        user_id: userId,
        date: extracted.date ?? now,
        content: symptom,
        source: "document",
        event_type: "symptom",
        clinical_flag: false,
      });
    }

    for (const lab of extracted.lab_values) {
      timelineRows.push({
        user_id: userId,
        date: extracted.date ?? now,
        content: `${lab.name}: ${lab.value} ${lab.unit} (ref ${lab.reference_range})`,
        source: "document",
        event_type: "lab_result",
        clinical_flag: lab.flag === "high" || lab.flag === "low",
      });
    }

    if (timelineRows.length > 0) {
      await supabaseAdmin.from("timeline_events").insert(timelineRows).then(({ error }) => {
        if (error) console.error("timeline_events insert:", error.message);
      });
    }

    // 5. Log to agent_actions
    const itemsFound =
      extracted.symptoms_mentioned.length +
      extracted.lab_values.length +
      extracted.diagnoses_mentioned.length;

    await supabaseAdmin.from("agent_actions").insert({
      user_id: userId,
      agent_name: "intake_agent",
      action_type: "document_processed",
      action_detail: JSON.stringify({ filename: file.name, items_found: itemsFound }),
      status: "complete",
      verified_boolean: true,
      timestamp: now,
    });

    // 6. Return
    return Response.json({
      success: true,
      document_id: docRow?.id ?? null,
      extracted,
      items_found: itemsFound,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("process-document error:", msg);
    return Response.json({ error: msg }, { status: 500 });
  }
}
