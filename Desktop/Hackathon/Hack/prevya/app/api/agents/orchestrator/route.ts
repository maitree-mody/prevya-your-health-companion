import type { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const maxDuration = 30;

const DEMO_USER_ID = "00000000-0000-0000-0000-000000000001";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const userId: string = body.userId ?? DEMO_USER_ID;
    const trigger: string = body.trigger ?? "manual";
    const highConditions: string[] = body.high_conditions ?? [];
    const urgency: string = body.overall_urgency ?? "routine";
    const specialist: string = body.priority_specialist ?? "";

    // Log the trigger to agent_actions so the live feed picks it up
    await supabaseAdmin.from("agent_actions").insert({
      user_id: userId,
      agent_name: "orchestrator",
      action_type: "orchestration_triggered",
      action_detail: JSON.stringify({
        trigger,
        high_conditions: highConditions,
        overall_urgency: urgency,
        priority_specialist: specialist,
      }),
      status: "complete",
      verified_boolean: true,
      timestamp: new Date().toISOString(),
    });

    // If high-urgency: queue an advocate action as a follow-up task
    if (urgency === "urgent" || urgency === "soon") {
      await supabaseAdmin.from("agent_actions").insert({
        user_id: userId,
        agent_name: "advocate_agent",
        action_type: "specialist_booking_queued",
        action_detail: specialist
          ? `Booking search queued: ${specialist} (${urgency})`
          : `Specialist booking queued (${urgency})`,
        status: "pending",
        verified_boolean: false,
        timestamp: new Date().toISOString(),
      });
    }

    return Response.json({ success: true, trigger, actions_queued: urgency !== "routine" ? 1 : 0 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("orchestrator error:", msg);
    return Response.json({ error: msg }, { status: 500 });
  }
}
