import { createFileRoute } from "@tanstack/react-router";
import { PrevyaShell } from "@/components/PrevyaShell";
import { SectionHeader } from "@/components/SectionHeader";
import { MonitoringDashboard } from "@/components/MonitoringDashboard";
import { OrchestratorPanel } from "@/components/OrchestratorPanel";
import {
  Activity,
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  Loader2,
  Mic,
  Target,
} from "lucide-react";

export const Route = createFileRoute("/home")({
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

const feed = [
  { t: "2 min ago", agent: "ReaderAgent", text: "Parsed bloodwork from Apr 14 — flagged low ferritin (24 ng/mL).", status: "done" as const },
  { t: "11 min ago", agent: "InboxAgent", text: "Drafted reply to Dr. Chen requesting CA-125 + AMH panel.", status: "pending" as const },
  { t: "38 min ago", agent: "PatternAgent", text: "Detected pain spikes correlate with luteal phase across 3 cycles.", status: "done" as const },
  { t: "1 h ago", agent: "SchedulerAgent", text: "Found 2 rheumatology openings within 20km — awaiting your pick.", status: "blocked" as const },
  { t: "3 h ago", agent: "DossierAgent", text: "Regenerated clinical summary v8 with new pattern.", status: "done" as const },
];

const actions = [
  { title: "Book rheumatology consult", detail: "Two slots open this week — pick one and I'll confirm.", urgency: "high" },
  { title: "Send Dr. Chen lab request", detail: "Reply drafted, waiting on your approval.", urgency: "medium" },
  { title: "Re-test ferritin in 4 weeks", detail: "I'll remind you and pre-fill the requisition.", urgency: "low" },
];

function Home() {
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
                    ]
                      .filter(Boolean)
                      .join(" ")}
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
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success/30 px-2.5 py-1 text-xs font-medium text-success-foreground">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" /> 4 agents working
            </span>
          </div>
          <ul className="mt-4 divide-y">
            {feed.map((f, i) => (
              <li key={i} className="flex gap-3 py-3.5">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                  {f.status === "done" && <CheckCircle2 className="h-4 w-4 text-success-foreground" />}
                  {f.status === "pending" && <Loader2 className="h-4 w-4 animate-spin text-accent" />}
                  {f.status === "blocked" && <AlertCircle className="h-4 w-4 text-warning-foreground" />}
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="text-sm font-medium">{f.agent}</span>
                    <span className="text-xs text-muted-foreground">{f.t}</span>
                  </div>
                  <p className="text-sm text-foreground/80">{f.text}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <Activity className="h-3.5 w-3.5" /> Updated continuously
          </div>
        </div>
      </div>
    </PrevyaShell>
  );
}
