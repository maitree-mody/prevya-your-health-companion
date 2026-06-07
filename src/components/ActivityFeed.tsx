import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type AgentKey =
  | "orchestrator"
  | "intake"
  | "diagnosis"
  | "monitor"
  | "advocate"
  | "voice"
  | "nutrition";

type Action = {
  id: string;
  agent_name: string | null;
  action_type: string | null;
  action_detail: string | null;
  status: string | null;
  result: string | null;
  timestamp: string | null;
};

const AGENT_META: Record<AgentKey, { emoji: string; label: string; color: string }> = {
  orchestrator: { emoji: "🧠", label: "Orchestrator", color: "#2D2A26" },
  intake: { emoji: "📂", label: "Intake", color: "#C4B5D4" },
  diagnosis: { emoji: "🔬", label: "Diagnosis", color: "#B5673A" },
  monitor: { emoji: "👁️", label: "Monitor", color: "#6B8A5C" },
  advocate: { emoji: "📣", label: "Advocate", color: "#B45766" },
  voice: { emoji: "🗣️", label: "Voice", color: "#6B8AA8" },
  nutrition: { emoji: "🥗", label: "Nutrition", color: "#5E8A6B" },
};

function resolveAgent(name: string | null | undefined): AgentKey {
  const n = (name ?? "").toLowerCase();
  if (n.includes("orchestrat")) return "orchestrator";
  if (n.includes("intake") || n.includes("reader") || n.includes("inbox")) return "intake";
  if (n.includes("diagnos") || n.includes("pattern")) return "diagnosis";
  if (n.includes("monitor")) return "monitor";
  if (n.includes("advocate") || n.includes("scheduler") || n.includes("dossier")) return "advocate";
  if (n.includes("voice") || n.includes("call")) return "voice";
  if (n.includes("nutrition") || n.includes("food")) return "nutrition";
  return "orchestrator";
}

function timeAgo(iso: string | null) {
  if (!iso) return "—";
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const DEMO: Action[] = [
  { id: "d1", agent_name: "orchestrator", action_type: "decision", action_detail: "APS probability high — initiating specialist booking", status: "complete", result: null, timestamp: new Date(Date.now() - 1000 * 60 * 42).toISOString() },
  { id: "d2", agent_name: "advocate_agent", action_type: "search", action_detail: "Searching for rheumatologists...", status: "running", result: null, timestamp: new Date(Date.now() - 1000 * 60 * 36).toISOString() },
  { id: "d3", agent_name: "advocate_agent", action_type: "booking", action_detail: "Appointment found — Dr. Sarah Chen, March 24th, London Bridge", status: "complete", result: null, timestamp: new Date(Date.now() - 1000 * 60 * 22).toISOString() },
  { id: "d4", agent_name: "advocate_agent", action_type: "email", action_detail: "Dossier emailed to clinic", status: "complete", result: null, timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString() },
  { id: "d5", agent_name: "monitor", action_type: "alert", action_detail: "Pain elevated 3 days running — alerting orchestrator", status: "needs_attention", result: null, timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString() },
  { id: "d6", agent_name: "nutrition", action_type: "protocol", action_detail: "Flare detected — anti-inflammatory protocol activated", status: "complete", result: null, timestamp: new Date(Date.now() - 1000 * 60 * 6).toISOString() },
  { id: "d7", agent_name: "voice", action_type: "call", action_detail: "Outbound call initiated", status: "running", result: null, timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString() },
];

function StatusBadge({ status }: { status: string | null }) {
  const s = (status ?? "").toLowerCase();
  if (s.includes("retry")) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-foreground/10 px-2 py-0.5 text-[10px] font-medium text-foreground/80">
        <span className="inline-block h-2 w-2 animate-spin rounded-full border border-foreground/70 border-t-transparent" />
        retrying
      </span>
    );
  }
  if (s.includes("attention") || s.includes("blocked") || s.includes("warn")) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#B5673A]/15 px-2 py-0.5 text-[10px] font-medium text-[#8A4A22]">
        ⚠️ needs attention
      </span>
    );
  }
  if (s.includes("complete") || s.includes("done") || s.includes("success")) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#6B8A5C]/15 px-2 py-0.5 text-[10px] font-medium text-[#4A6741] animate-fade-in">
        ✅ complete
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-foreground/10 px-2 py-0.5 text-[10px] font-medium text-foreground/70">
      <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-foreground/70" />
      ⏳ running
    </span>
  );
}

function FeedRow({ action }: { action: Action }) {
  const agent = resolveAgent(action.agent_name);
  const meta = AGENT_META[agent];
  const isRunning = !action.status || /run|pending|progress/i.test(action.status);

  return (
    <li
      className={`flex items-start gap-3 border-b border-foreground/10 px-5 py-3.5 animate-fade-in ${
        isRunning ? "[animation:pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]" : ""
      }`}
    >
      <span className="mt-0.5 text-lg leading-none" aria-hidden>
        {meta.emoji}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-sm font-semibold" style={{ color: meta.color }}>
            {meta.label}
          </span>
          <span className="text-[11px] text-foreground/50">{timeAgo(action.timestamp)}</span>
        </div>
        <p className="mt-0.5 text-sm leading-snug text-foreground/85">
          {action.action_detail ?? action.result ?? action.action_type ?? "—"}
        </p>
      </div>
      <div className="shrink-0 pt-0.5">
        <StatusBadge status={action.status} />
      </div>
    </li>
  );
}

export function ActivityFeed() {
  const [actions, setActions] = useState<Action[]>(DEMO);
  const scrollRef = useRef<HTMLDivElement>(null);

  async function load() {
    const { data } = await supabase
      .from("agent_actions")
      .select("id, agent_name, action_type, action_detail, status, result, timestamp")
      .order("timestamp", { ascending: false })
      .limit(50);
    if (data && data.length > 0) {
      setActions(data as Action[]);
    }
  }

  useEffect(() => {
    load();
    const poll = setInterval(load, 8000);

    const channel = supabase
      .channel("agent_actions_feed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "agent_actions" },
        () => load(),
      )
      .subscribe();

    return () => {
      clearInterval(poll);
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [actions]);

  // Display oldest → newest so latest sits at the bottom (auto-scroll target)
  const ordered = [...actions].sort((a, b) => {
    const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    return ta - tb;
  });

  return (
    <section className="mt-6 overflow-hidden rounded-2xl shadow-sm" style={{ backgroundColor: "#1B2A4A" }}>
      <header className="flex items-center justify-between border-b border-white/10 px-6 py-5">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/50">
            Mission Control
          </div>
          <h2 className="mt-1 font-display text-xl font-semibold text-white">
            Prevya's agents working for you
          </h2>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white/80">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#A8C5A0]" />
          live
        </span>
      </header>

      <div ref={scrollRef} className="max-h-[480px] overflow-y-auto">
        {ordered.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-white/60">
            Prevya hasn't taken any actions yet.
          </div>
        ) : (
          <ul>
            {ordered.map((a) => (
              <FeedRow key={a.id} action={a} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
