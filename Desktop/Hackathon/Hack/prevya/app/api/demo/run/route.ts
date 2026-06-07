import type { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const maxDuration = 60;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

const DEMO_USER_ID = "00000000-0000-0000-0000-000000000001";

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function log(
  userId: string,
  agent: string,
  type: string,
  detail: string,
  status: "running" | "complete" | "pending" = "complete",
) {
  await supabaseAdmin.from("agent_actions").insert({
    user_id: userId,
    agent_name: agent,
    action_type: type,
    action_detail: detail,
    status,
    verified_boolean: status === "complete",
    timestamp: new Date().toISOString(),
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const userId: string = body.userId ?? DEMO_USER_ID;

  // ── Step 1: Intake ──────────────────────────────────────────────────────
  await log(userId, "intake_agent", "demo",
    "📂 Intake: Reading 6 years of medical records...", "running");
  await wait(2000);

  await log(userId, "intake_agent", "demo",
    "📂 Intake: 3 GP letters, 8 blood tests, 2 referral letters processed ✅");
  await wait(2000);

  // ── Step 2: Diagnosis ───────────────────────────────────────────────────
  await log(userId, "diagnosis_agent", "demo",
    "🔬 Diagnosis: Analyzing patterns against ACR/EULAR clinical criteria...", "running");
  await wait(2000);

  await log(userId, "diagnosis_agent", "demo",
    "🔬 Diagnosis: APS probability HIGH — ANA positive + 2 miscarriages + joint pain pattern identified ✅");
  await wait(2000);

  // ── Step 3: Orchestrator ────────────────────────────────────────────────
  await log(userId, "orchestrator", "demo",
    "🧠 Orchestrator: High probability APS detected — initiating rheumatology booking sequence");
  await wait(2000);

  // ── Step 4: Advocate — booking ──────────────────────────────────────────
  await log(userId, "advocate_agent", "demo",
    "📣 Advocate: Searching for rheumatologists accepting new patients...", "running");
  await wait(2000);

  await log(userId, "advocate_agent", "demo",
    "📣 Advocate: Appointment found — Dr. Sarah Chen, March 24th ✅");
  await wait(2000);

  await log(userId, "advocate_agent", "demo",
    "📣 Advocate: Booking confirmed — confirmation sent to patient ✅");
  await wait(2000);

  // ── Step 5: Dossier ─────────────────────────────────────────────────────
  await log(userId, "advocate_agent", "demo",
    "📣 Advocate: Generating clinical dossier for Dr. Chen...", "running");
  await wait(2000);

  await log(userId, "advocate_agent", "demo",
    "📣 Advocate: Dossier emailed to clinic ✅");
  await wait(2000);

  // ── Step 6: Monitor ─────────────────────────────────────────────────────
  await log(userId, "monitor_agent", "demo",
    "👁️ Monitor: Pain scores elevated 3 consecutive days — correlates with luteal phase ✅");

  await log(userId, "monitor_agent", "demo",
    "👁️ Monitor: Pattern added to dossier ✅");
  await wait(2000);

  // ── Step 7: Nutrition ───────────────────────────────────────────────────
  await log(userId, "nutrition_agent", "demo",
    "🥗 Nutrition: Flare risk detected — anti-inflammatory protocol activated ✅");
  await wait(2000);

  // ── Step 8: Voice ───────────────────────────────────────────────────────
  await log(userId, "voice_agent", "demo",
    "🗣️ Voice: Initiating outbound call to patient...", "running");

  return Response.json({ success: true, steps_completed: 8 }, { headers: CORS });
}
