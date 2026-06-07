import type { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function GET(req: NextRequest) {
  const userId =
    req.nextUrl.searchParams.get("userId") ?? "00000000-0000-0000-0000-000000000001";

  const { data, error } = await supabaseAdmin
    .from("agent_actions")
    .select("id, agent_name, action_type, action_detail, status, timestamp, verified_boolean")
    .eq("user_id", userId)
    .order("timestamp", { ascending: false })
    .limit(50);

  if (error) {
    return Response.json({ error: error.message }, { status: 500, headers: CORS });
  }

  return Response.json({ feed: data ?? [] }, { headers: CORS });
}
