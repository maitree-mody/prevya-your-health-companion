import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PrevyaShell } from "@/components/PrevyaShell";
import { SectionHeader } from "@/components/SectionHeader";
import { MonitoringDashboard } from "@/components/MonitoringDashboard";
import { OrchestratorPanel } from "@/components/OrchestratorPanel";
import { AdvocatePanel } from "@/components/AdvocatePanel";
import { ActivityFeed } from "@/components/ActivityFeed";
import {
  Activity,
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  Loader2,
  Mic,
  Target,
  Play,
  RotateCcw,
} from "lucide-react";
import {
  getAgentFeed,
  subscribeToFeed,
  runFullDemo,
  resetDemo,
} from "@/services/api";

export const Route = createFileRoute("/home")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Mission Control · Prevya" },
      {
        name: "description",
        content:
          "Live view of everything Prevya is doing on your behalf right now.",
      },
    ],
  }),
  component: Home,
});

type LiveFeedItem = {
  id: string;
  agent_name: string | null;
  action_type: string | null;
  action_detail: string | null;
  status: string | null;
  timestamp: string | null;
};

function feedStatus(status: string | null): "done" | "pending" | "blocked" {
  const s = (status ?? "").toLowerCase();
  if (s === "complete" || s === "done" || s === "confirmed") return "done";
  if (s === "blocked" || s === "attention" || s === "needs_attention") return "blocked";
  return "pending";
}

function timeAgo(iso: string | null) {
  if (!iso) return "just now";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const actions = [
  { title: "Book rheumatology consult", detail: "Two slots open this week — pick one and I'll confirm.", urgency: "high" },
  { title: "Send Dr. Chen lab request", detail: "Reply drafted, waiting on your approval.", urgency: "medium" },
  { title: "Re-test ferritin in 4 weeks", detail: "I'll remind you and pre-fill the requisition.", urgency: "low" },
];

function Home() {
  const [liveFeed, setLiveFeed] = useState<LiveFeedItem[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [demoRunning, setDemoRunning] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    getAgentFeed().then((data) => {
      setLiveFeed(data as LiveFeedItem[]);
      setFeedLoading(false);
    });

    const channel = subscribeToFeed((action) => {
      setLiveFeed((prev) => [action as LiveFeedItem, ...prev].slice(0, 50));
    });

    return () => { channel.unsubscribe(); };
  }, []);

  const handleRunDemo = async () => {
    setDemoRunning(true);
    try {
      await runFullDemo();
      // Items trickle in over 14s via setTimeout; real-time subscription picks them up
      setTimeout(() => setDemoRunning(false), 15000);
    } catch (err) {
      console.error(err);
      setDemoRunning(false);
    }
  };

  const handleReset = async () => {
    setResetting(true);
    try {
      await resetDemo();
      setLiveFeed([]);
    } catch (err) {
      console.error(err);
    } finally {
      setResetting(false);
    }
  };

  const runningCount = liveFeed.filter((f) => feedStatus(f.status) === "pending").length;

  return (
    <PrevyaShell>
      <SectionHeader
        eyebrow="Mission control"
        title="Good morning. Here's what I'm working on."
        description="Prevya runs in the background — reading, listening, advocating. Tap anything to dive in."
        action={
          <button className="flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground shadow-sm transition hover:opacity-95">
            <Mic className="h-4 w-4" /> Daily check-in
          </button>
        }
      />

      {/* Prominent demo controls */}
      <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-foreground/10 bg-card p-5 shadow-sm">
        <button
          onClick={handleRunDemo}
          disabled={demoRunning}
          className="flex items-center gap-3 rounded-full px-8 py-4 text-base font-semibold text-white shadow-md transition hover:opacity-95 disabled:opacity-60"
          style={{ backgroundColor: "#B5673A" }}
        >
          {demoRunning
            ? <Loader2 className="h-5 w-5 animate-spin" />
            : <Play className="h-5 w-5 fill-current" />
          }
          {demoRunning ? "Running demo…" : "Run Demo"}
        </button>
        <button
          onClick={handleReset}
          disabled={resetting}
          className="flex items-center gap-2 rounded-full border-2 px-6 py-4 text-base font-medium transition hover:bg-foreground/5 disabled:opacity-60"
          style={{ borderColor: "#B5673A", color: "#B5673A" }}
        >
          {resetting
            ? <Loader2 className="h-5 w-5 animate-spin" />
            : <RotateCcw className="h-5 w-5" />
          }
          Reset
        </button>
        <p className="ml-auto text-sm text-muted-foreground">
          Watch all agents fire in real time ↓
        </p>
      </div>

      <ActivityFeed />

      <OrchestratorPanel />

      {/* Goal + appointment row */}
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="surface lg:col-span-2 p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
              <Target className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Current goal</div>
              <div className="mt-1 font-display text-xl font-semibold tracking-tight">
                Get a real diagnosis for the pelvic pain — and a plan.
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Set 6 weeks ago · Prevya estimates you're <span className="text-foreground font-medium">68%</span> of the way there.
              </p>
              <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full w-[68%] rounded-full bg-gradient-to-r from-accent to-secondary" />
              </div>
            </div>
          </div>
        </div>

        <div className="surface p-6">
          <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            <CalendarClock className="h-3.5 w-3.5" /> Next appointment
          </div>
          <div className="mt-3 font-display text-lg font-semibold">Dr. Adesina — Rheumatology</div>
          <div className="mt-1 text-sm text-muted-foreground">Thu, Jun 12 · 2:30pm · Riverside Clinic</div>
          <div className="mt-4 flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 rounded-full bg-success/30 px-2.5 py-1 font-medium text-success-foreground">
              <CheckCircle2 className="h-3 w-3" /> Dossier sent
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 font-medium text-foreground/70">
              Questions prepared
            </span>
          </div>
        </div>
      </div>

      <MonitoringDashboard />

      <AdvocatePanel />

      {/* Urgent + Feed */}
      <div className="mt-6 grid gap-5 lg:grid-cols-5">
        <div className="surface lg:col-span-2 p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold tracking-tight">Top 3 actions</h2>
            <span className="text-xs text-muted-foreground">Prioritised by Prevya</span>
          </div>
          <ul className="mt-4 space-y-3">
            {actions.map((a) => (
              <li key={a.title} className="rounded-xl border bg-card p-4 transition hover:border-accent/40">
                <div className="flex items-start gap-3">
                  <span
                    className={[
                      "mt-1 h-2 w-2 shrink-0 rounded-full",
                      a.urgency === "high" && "bg-accent",
                      a.urgency === "medium" && "bg-warning",
                      a.urgency === "low" && "bg-secondary",
                    ].filter(Boolean).join(" ")}
                  />
                  <div>
                    <div className="text-sm font-medium">{a.title}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">{a.detail}</div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="surface lg:col-span-3 p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold tracking-tight">Live activity</h2>
            {feedLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-success/30 px-2.5 py-1 text-xs font-medium text-success-foreground">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
                {runningCount > 0 ? `${runningCount} agent${runningCount > 1 ? "s" : ""} working` : "Live"}
              </span>
            )}
          </div>

          {!feedLoading && liveFeed.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
              No activity yet — press <strong>Run Demo</strong> to watch agents fire in real time.
            </div>
          ) : (
            <ul className="mt-4 divide-y">
              {liveFeed.slice(0, 8).map((f, i) => {
                const s = feedStatus(f.status);
                return (
                  <li key={f.id ?? i} className="flex gap-3 py-3.5">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                      {s === "done"    && <CheckCircle2 className="h-4 w-4 text-success-foreground" />}
                      {s === "pending" && <Loader2 className="h-4 w-4 animate-spin text-accent" />}
                      {s === "blocked" && <AlertCircle className="h-4 w-4 text-warning-foreground" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-baseline gap-2">
                        <span className="text-sm font-medium">{f.agent_name ?? "Agent"}</span>
                        <span className="text-xs text-muted-foreground">{timeAgo(f.timestamp)}</span>
                      </div>
                      <p className="text-sm text-foreground/80">{f.action_detail}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <Activity className="h-3.5 w-3.5" /> Updated continuously
          </div>
        </div>
      </div>
    </PrevyaShell>
  );
}
