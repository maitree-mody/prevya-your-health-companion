import type { NextRequest } from "next/server";
import groq from "@/lib/anthropic";
import { supabaseAdmin } from "@/lib/supabase";
import { retrieveGuidelines } from "@/lib/guidelines";

export const maxDuration = 60;

const DEMO_USER_ID = "00000000-0000-0000-0000-000000000001";

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are a medical evidence analyst.
You do NOT diagnose.
You identify patterns consistent with diagnostic criteria for clinical investigation.

RULES:
- Never say "you have [condition]"
- Always say "patterns consistent with"
- Always say "warrants investigation for"

Analyze this patient history against the provided clinical guidelines.

Conditions to screen:
- Lupus (SLE)
- Antiphospholipid Syndrome
- Hashimoto's Thyroiditis
- Endometriosis
- Multiple Sclerosis
- Premature Ovarian Insufficiency

Return ONLY valid JSON with exactly this structure (no markdown, no explanation):
{
  "conditions": [
    {
      "condition": "string",
      "probability": "low|moderate|high",
      "matching_evidence": ["string"],
      "missing_evidence": ["string"],
      "cross_specialty_patterns": ["string"],
      "recommended_tests": [
        {
          "test_name": "string",
          "clinical_rationale": "string",
          "urgency": "routine|soon|urgent"
        }
      ]
    }
  ],
  "priority_specialist": "string",
  "overall_urgency": "routine|soon|urgent",
  "patterns_no_doctor_saw": ["string"],
  "summary_for_doctor": "string",
  "summary_for_patient": "string"
}`;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type RawCondition = {
  condition: string;
  probability: "low" | "moderate" | "high";
  matching_evidence: string[];
  missing_evidence: string[];
  cross_specialty_patterns: string[];
  recommended_tests: Array<{
    test_name: string;
    clinical_rationale: string;
    urgency: "routine" | "soon" | "urgent";
  }>;
};

type RawAnalysis = {
  conditions: RawCondition[];
  priority_specialist: string;
  overall_urgency: "routine" | "soon" | "urgent";
  patterns_no_doctor_saw: string[];
  summary_for_doctor: string;
  summary_for_patient: string;
};

// Shape stored in diagnosis_results and consumed by picture.tsx
type StoredCondition = {
  name: string;
  level: "low" | "moderate" | "high";
  evidence: string[];
  missing: string[];
};

type StoredTest = {
  name: string;
  priority: "routine" | "soon" | "urgent";
  rationale: string;
};

type StoredPattern = {
  title: string;
  body: string;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function safeParseJson(raw: string | null | undefined): RawAnalysis | null {
  if (!raw) return null;
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
  try {
    return JSON.parse(cleaned) as RawAnalysis;
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]) as RawAnalysis; } catch { /* fall through */ }
    }
    return null;
  }
}

function buildTimelineString(
  events: Array<{ date: string | null; content: string | null; event_type: string | null; source: string | null }>,
  checkins: Array<{ created_at: string | null; pain_score: number | null; fatigue_score: number | null; distress_score: number | null }>,
  docs: Array<{ extracted_json: unknown }>,
): string {
  const lines: string[] = [];

  // Documents
  for (const doc of docs) {
    const json = doc.extracted_json as Record<string, unknown> | null;
    if (!json) continue;
    const date = json.date as string | null;
    const type = (json.document_type as string) ?? "document";
    const symptoms = (json.symptoms_mentioned as string[]) ?? [];
    const diagnoses = (json.diagnoses_mentioned as string[]) ?? [];
    const labs = (json.lab_values as Array<{ name: string; value: string; unit: string; flag: string }>) ?? [];
    const meds = (json.medications_mentioned as Array<{ name: string; dose: string }>) ?? [];

    if (date) lines.push(`[${date}] Document: ${type}`);
    if (symptoms.length) lines.push(`  Symptoms: ${symptoms.join(", ")}`);
    if (diagnoses.length) lines.push(`  Mentioned diagnoses: ${diagnoses.join(", ")}`);
    if (labs.length) lines.push(`  Labs: ${labs.map((l) => `${l.name} ${l.value} ${l.unit} (${l.flag})`).join("; ")}`);
    if (meds.length) lines.push(`  Medications: ${meds.map((m) => `${m.name} ${m.dose}`).join(", ")}`);
    if (json.clinical_notes) lines.push(`  Notes: ${json.clinical_notes}`);
  }

  // Timeline events sorted by date
  const sortedEvents = [...events].sort((a, b) => {
    const da = a.date ? new Date(a.date).getTime() : 0;
    const db = b.date ? new Date(b.date).getTime() : 0;
    return da - db;
  });

  for (const ev of sortedEvents) {
    const date = ev.date ? new Date(ev.date).toLocaleDateString() : "unknown date";
    lines.push(`[${date}] ${ev.event_type ?? "event"} (${ev.source ?? "?"}): ${ev.content ?? "—"}`);
  }

  // Recent check-ins (last 14, summarised)
  const recentCheckins = [...checkins]
    .sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime())
    .slice(0, 14);

  if (recentCheckins.length) {
    lines.push("\nRecent daily check-ins (newest first):");
    for (const c of recentCheckins) {
      const date = c.created_at ? new Date(c.created_at).toLocaleDateString() : "?";
      lines.push(
        `  [${date}] pain=${c.pain_score ?? "?"}/10  fatigue=${c.fatigue_score ?? "?"}/10  distress=${c.distress_score ?? "?"}/10`,
      );
    }
  }

  return lines.join("\n").slice(0, 12000); // stay well within token budget
}

function transformToStorageShape(raw: RawAnalysis): {
  conditions: StoredCondition[];
  recommended_tests: StoredTest[];
  cross_patterns: StoredPattern[];
  doctor_summary: string;
} {
  const conditions: StoredCondition[] = raw.conditions.map((c) => ({
    name: c.condition,
    level: c.probability,
    evidence: c.matching_evidence ?? [],
    missing: c.missing_evidence ?? [],
  }));

  // Flatten and deduplicate tests across all conditions
  const seen = new Set<string>();
  const recommended_tests: StoredTest[] = [];
  for (const c of raw.conditions) {
    for (const t of c.recommended_tests ?? []) {
      if (!seen.has(t.test_name)) {
        seen.add(t.test_name);
        recommended_tests.push({
          name: t.test_name,
          priority: t.urgency,
          rationale: t.clinical_rationale,
        });
      }
    }
  }
  // Sort by urgency
  const urgencyOrder = { urgent: 0, soon: 1, routine: 2 };
  recommended_tests.sort((a, b) => urgencyOrder[a.priority] - urgencyOrder[b.priority]);

  // Cross-specialty patterns
  const cross_patterns: StoredPattern[] = (raw.patterns_no_doctor_saw ?? []).map((p, i) => ({
    title: `Cross-specialty pattern ${i + 1}`,
    body: p,
  }));

  // Add per-condition cross-specialty patterns
  for (const c of raw.conditions) {
    for (const p of c.cross_specialty_patterns ?? []) {
      cross_patterns.push({ title: c.condition, body: p });
    }
  }

  return {
    conditions,
    recommended_tests,
    cross_patterns,
    doctor_summary: raw.summary_for_doctor ?? "",
  };
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const userId: string = body.userId ?? DEMO_USER_ID;

    // STEP 1 — fetch all user data in parallel
    const [userRes, docsRes, eventsRes, checkinsRes] = await Promise.all([
      supabaseAdmin.from("users").select("*").eq("id", userId).maybeSingle(),
      supabaseAdmin
        .from("documents")
        .select("extracted_json, source, upload_date")
        .eq("user_id", userId)
        .eq("processed_boolean", true)
        .order("upload_date", { ascending: true })
        .limit(50),
      supabaseAdmin
        .from("timeline_events")
        .select("date, content, event_type, source, clinical_flag")
        .eq("user_id", userId)
        .order("date", { ascending: true })
        .limit(100),
      supabaseAdmin
        .from("checkins")
        .select("created_at, pain_score, fatigue_score, distress_score")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(30),
    ]);

    const user = userRes.data;
    const docs = docsRes.data ?? [];
    const events = eventsRes.data ?? [];
    const checkins = checkinsRes.data ?? [];

    // STEP 2 — retrieve relevant guidelines via FTS
    const symptomText = [
      ...(user?.conditions_suspected ?? []),
      ...events.map((e) => e.content ?? "").filter(Boolean).slice(0, 20),
    ].join(" ");

    let guidelineContext = "";
    try {
      const guidelines = await retrieveGuidelines(symptomText || "pelvic pain fatigue", 5);
      guidelineContext = guidelines
        .map((g) => `[${g.condition} — ${g.guideline_source}]\n${g.content}`)
        .join("\n\n");
    } catch (e) {
      // Guidelines retrieval is best-effort
      console.error("Guidelines retrieval failed:", e);
    }

    // STEP 3 — build timeline string
    const timeline = buildTimelineString(events, checkins, docs);

    if (!timeline.trim() && !user) {
      return Response.json({ error: "No patient data found for this user." }, { status: 404 });
    }

    // STEP 4 — send to Groq
    const userMessage = [
      user
        ? `Patient: ${user.name ?? "Unknown"}, age ${user.age ?? "unknown"}, conditions suspected: ${(user.conditions_suspected ?? []).join(", ") || "none stated"}, fertility intent: ${user.fertility_intent ? "yes" : "no"}.`
        : "Patient: unknown profile.",
      "",
      guidelineContext
        ? `CLINICAL GUIDELINES:\n${guidelineContext}`
        : "No specific guidelines retrieved.",
      "",
      `PATIENT HISTORY:\n${timeline || "No history available."}`,
    ].join("\n");

    const chat = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
      max_tokens: 3000,
    });

    const rawAnalysis = safeParseJson(chat.choices[0].message.content);
    if (!rawAnalysis) {
      return Response.json(
        { error: "Model returned unparseable response.", raw: chat.choices[0].message.content },
        { status: 502 },
      );
    }

    // STEP 5 — transform and store
    const { conditions, recommended_tests, cross_patterns, doctor_summary } =
      transformToStorageShape(rawAnalysis);

    const { data: resultRow, error: insertErr } = await supabaseAdmin
      .from("diagnosis_results")
      .insert({
        user_id: userId,
        conditions,
        recommended_tests,
        cross_patterns,
        doctor_summary,
      })
      .select("id")
      .single();

    if (insertErr) {
      console.error("diagnosis_results insert:", insertErr.message);
    }

    // Log to agent_actions
    const highCount = rawAnalysis.conditions.filter((c) => c.probability === "high").length;
    await supabaseAdmin.from("agent_actions").insert({
      user_id: userId,
      agent_name: "diagnosis_agent",
      action_type: "diagnosis_complete",
      action_detail: JSON.stringify({
        conditions_screened: rawAnalysis.conditions.length,
        high_probability: highCount,
        overall_urgency: rawAnalysis.overall_urgency,
        priority_specialist: rawAnalysis.priority_specialist,
      }),
      status: "complete",
      verified_boolean: true,
      timestamp: new Date().toISOString(),
    });

    // Trigger orchestrator if any high-probability condition found
    if (highCount > 0) {
      const origin = new URL(req.url).origin;
      fetch(`${origin}/api/agents/orchestrator`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          trigger: "high_probability_condition",
          diagnosis_id: resultRow?.id ?? null,
          high_conditions: rawAnalysis.conditions
            .filter((c) => c.probability === "high")
            .map((c) => c.condition),
          overall_urgency: rawAnalysis.overall_urgency,
          priority_specialist: rawAnalysis.priority_specialist,
        }),
      }).catch((e) => console.error("Orchestrator trigger failed:", e));
    }

    return Response.json({
      success: true,
      diagnosis_id: resultRow?.id ?? null,
      conditions,
      recommended_tests,
      cross_patterns,
      doctor_summary,
      summary_for_patient: rawAnalysis.summary_for_patient,
      overall_urgency: rawAnalysis.overall_urgency,
      priority_specialist: rawAnalysis.priority_specialist,
      high_probability_count: highCount,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("diagnosis agent error:", msg);
    return Response.json({ error: msg }, { status: 500 });
  }
}
