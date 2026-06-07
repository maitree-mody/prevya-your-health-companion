import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Calendar,
  Mail,
  ClipboardList,
  CheckCircle2,
  Clock,
  AlertCircle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

type AgentAction = {
  id: string;
  action_type: string | null;
  action_detail: string | null;
  status: string | null;
  result: string | null;
  timestamp: string | null;
  verified_boolean: boolean | null;
};

function iconFor(type: string | null) {
  const t = (type ?? "").toLowerCase();
  if (t.includes("book") || t.includes("appointment")) return Calendar;
  if (t.includes("email") || t.includes("inbox")) return Mail;
  if (t.includes("referral") || t.includes("chase")) return ClipboardList;
  if (t.includes("confirm") || t.includes("complete")) return CheckCircle2;
  return Sparkles;
}

function emojiFor(type: string | null) {
  const t = (type ?? "").toLowerCase();
  if (t.includes("book") || t.includes("appointment")) return "📅";
  if (t.includes("email")) return "📧";
  if (t.includes("referral")) return "📋";
  if (t.includes("confirm")) return "✅";
  return "✨";
}

function timeAgo(iso: string | null) {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  const w = Math.floor(d / 7);
  return `${w}w ago`;
}

function statusMeta(status: string | null) {
  const s = (status ?? "").toLowerCase();
  if (s.includes("complete") || s.includes("done") || s.includes("confirmed"))
    return { label: "Complete", className: "bg-success/30 text-success-foreground", Icon: CheckCircle2 };
  if (s.includes("attention") || s.includes("blocked") || s.includes("needs"))
    return { label: "Needs attention", className: "bg-warning/30 text-warning-foreground", Icon: AlertCircle };
  return { label: "Pending", className: "bg-muted text-foreground/70", Icon: Clock };
}

const upcoming = [
  { when: "48 hrs before appointment", what: "Send dossier to specialist", Icon: Mail },
  { when: "24 hrs before appointment", what: "Coaching session — what to ask, how to advocate", Icon: ShieldCheck },
  { when: "After appointment", what: "Debrief call — capture outcomes, plan next step", Icon: CheckCircle2 },
];

export function AdvocatePanel() {
  const [actions, setActions] = useState<AgentAction[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const { data } = await supabase
      .from("agent_actions")
      .select("id, action_type, action_detail, status, result, timestamp, verified_boolean")
      .eq("agent_name", "advocate_agent")
      .order("timestamp", { ascending: false })
      .limit(50);
    setActions((data as AgentAction[]) ?? []);
    setLoading(false);
  }

  async function verify(id: string) {
    await supabase.from("agent_actions").update({ verified_boolean: true, status: "complete" }).eq("id", id);
    load();
  }

  useEffect(() => {
    load();
    const i = setInterval(load, 30_000);
    return () => clearInterval(i);
  }, []);

  const active = actions.filter((a) => {
    const s = (a.status ?? "").toLowerCase();
    return !s.includes("complete") && !s.includes("done");
  }).slice(0, 4);

  return (
    <section className="mt-6 grid gap-5 lg:grid-cols-5">
      {/* Status card */}
      <div className="surface lg:col-span-3 p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Advocate agent
              </div>
              <h2 className="font-display text-xl font-semibold tracking-tight">
                Prevya is acting for you
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Booking, chasing, emailing — so you don't have to.
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-success/30 px-2.5 py-1 text-xs font-medium text-success-foreground">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" /> Live
          </span>
        </div>

        {loading ? (
          <div className="mt-6 text-sm text-muted-foreground">Loading advocate actions…</div>
        ) : active.length === 0 ? (
          <EmptyState />
        ) : (
          <ul className="mt-5 space-y-3">
            {active.map((a) => {
              const Icon = iconFor(a.action_type);
              const meta = statusMeta(a.status);
              return (
                <li key={a.id} className="rounded-xl border bg-card p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <Icon className="h-4 w-4 text-foreground/70" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-baseline gap-2">
                        <span className="text-sm font-medium capitalize">
                          {emojiFor(a.action_type)} {a.action_type ?? "Action"}
                        </span>
                        <span className="text-xs text-muted-foreground">{timeAgo(a.timestamp)}</span>
                      </div>
                      {a.action_detail && (
                        <p className="mt-0.5 text-sm text-foreground/80">{a.action_detail}</p>
                      )}
                      <div className="mt-2 flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${meta.className}`}>
                          <meta.Icon className="h-3 w-3" /> {meta.label}
                        </span>
                        {!a.verified_boolean && meta.label !== "Complete" && (
                          <button
                            onClick={() => verify(a.id)}
                            className="rounded-full border border-accent/40 px-2.5 py-1 text-xs font-medium text-accent hover:bg-accent/10"
                          >
                            Verify
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Upcoming */}
      <div className="surface lg:col-span-2 p-6">
        <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Upcoming
        </div>
        <h3 className="mt-1 font-display text-lg font-semibold tracking-tight">
          What Prevya will do next
        </h3>
        <ul className="mt-4 space-y-3">
          {upcoming.map((u) => (
            <li key={u.what} className="flex items-start gap-3 rounded-xl border bg-card p-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary/40 text-secondary-foreground">
                <u.Icon className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {u.when}
                </div>
                <div className="text-sm text-foreground/90">{u.what}</div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Log */}
      <div className="surface lg:col-span-5 p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold tracking-tight">Actions log</h3>
          <span className="text-xs text-muted-foreground">{actions.length} total</span>
        </div>
        {actions.length === 0 ? (
          <div className="mt-4 text-sm text-muted-foreground">No actions logged yet.</div>
        ) : (
          <ul className="mt-3 max-h-80 divide-y overflow-y-auto pr-1">
            {actions.map((a) => {
              const meta = statusMeta(a.status);
              return (
                <li key={a.id} className="flex items-start gap-3 py-3">
                  <div className="mt-0.5 text-base">{emojiFor(a.action_type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="text-sm font-medium capitalize">{a.action_type ?? "Action"}</span>
                      <span className="text-xs text-muted-foreground">{timeAgo(a.timestamp)}</span>
                    </div>
                    {a.action_detail && (
                      <p className="text-sm text-foreground/75 truncate">{a.action_detail}</p>
                    )}
                  </div>
                  <span className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${meta.className}`}>
                    {meta.label}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

function EmptyState() {
  return (
    <div className="mt-6 rounded-xl border border-dashed bg-muted/30 p-6 text-center">
      <Sparkles className="mx-auto h-6 w-6 text-muted-foreground" />
      <p className="mt-2 text-sm text-foreground/80">
        Prevya will start acting once your history is analysed.
      </p>
    </div>
  );
}
