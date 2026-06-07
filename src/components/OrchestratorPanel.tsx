import { useEffect, useState } from "react";
import { Brain, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Goal = {
  id: string;
  goal_description: string | null;
  priority: number | null;
  status: string | null;
  created_at: string | null;
  completed_at: string | null;
  blocked_reason: string | null;
};

type Decision = {
  id: string;
  action_detail: string | null;
  result: string | null;
  timestamp: string | null;
};

function daysAgo(iso: string | null) {
  if (!iso) return "—";
  const d = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000));
  if (d === 0) return "today";
  if (d === 1) return "1 day ago";
  return `${d} days ago`;
}

function priorityMeta(p: number | null) {
  if (p === 1) return { label: "urgent", dot: "🔴", chip: "bg-accent text-accent-foreground" };
  if (p === 2) return { label: "important", dot: "🟡", chip: "bg-warning text-warning-foreground" };
  return { label: "routine", dot: "🟢", chip: "bg-success text-success-foreground" };
}

export function OrchestratorPanel() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [decisions, setDecisions] = useState<Decision[]>([]);

  async function load() {
    const [g, d] = await Promise.all([
      supabase
        .from("agent_goals")
        .select("id, goal_description, priority, status, created_at, completed_at, blocked_reason")
        .neq("status", "complete")
        .order("priority", { ascending: true })
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("agent_actions")
        .select("id, action_detail, result, timestamp")
        .eq("agent_name", "orchestrator")
        .order("timestamp", { ascending: false })
        .limit(3),
    ]);
    if (g.data) setGoals(g.data as Goal[]);
    if (d.data) setDecisions(d.data as Decision[]);
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  const primary = goals[0];
  const rest = goals.slice(1);
  const primaryMeta = priorityMeta(primary?.priority ?? 3);

  return (
    <section className="mt-6 grid gap-5">
      {/* Primary goal card */}
      <div className="rounded-2xl bg-primary p-6 text-primary-foreground shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-foreground/10">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[11px] font-medium uppercase tracking-[0.16em] opacity-70">
                Prevya's current goal
              </div>
              <div className="mt-1 font-display text-xl font-semibold leading-snug">
                {primary?.goal_description ?? "No active goal yet — start a check-in to set one."}
              </div>
              {primary && (
                <div className="mt-2 text-sm opacity-80">
                  Started {daysAgo(primary.created_at)}
                  {primary.status ? ` · ${primary.status}` : ""}
                </div>
              )}
            </div>
          </div>
          {primary && (
            <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${primaryMeta.chip}`}>
              {primaryMeta.label}
            </span>
          )}
        </div>
      </div>

      {/* Goal stack */}
      {rest.length > 0 && (
        <div className="surface p-6">
          <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Active goal stack
          </div>
          <ul className="mt-3 divide-y">
            {rest.map((g) => {
              const m = priorityMeta(g.priority);
              return (
                <li key={g.id} className="flex items-start gap-3 py-3">
                  <span className="mt-0.5 text-base leading-none">{m.dot}</span>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{g.goal_description}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      Active {daysAgo(g.created_at)} · {g.status ?? "in progress"}
                      {g.blocked_reason ? ` · blocked: ${g.blocked_reason}` : ""}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Decision log */}
      {decisions.length > 0 && (
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            <Brain className="h-3.5 w-3.5" /> Recent orchestrator decisions
          </div>
          <ul className="mt-3 space-y-2">
            {decisions.map((d) => (
              <li key={d.id} className="text-xs text-muted-foreground leading-relaxed">
                <span className="mr-1">🧠</span>
                Orchestrator decided: {d.action_detail ?? d.result ?? "—"}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
