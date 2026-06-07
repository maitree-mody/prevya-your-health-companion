import { createFileRoute } from "@tanstack/react-router";
import { PrevyaShell } from "@/components/PrevyaShell";
import { SectionHeader } from "@/components/SectionHeader";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CheckCircle2, Circle, Sparkles } from "lucide-react";

export const Route = createFileRoute("/picture")({
  head: () => ({
    meta: [
      { title: "My Picture · Prevya" },
      { name: "description", content: "Probable diagnoses, recommended tests, and patterns Prevya has detected." },
    ],
  }),
  component: Picture,
});

const probs = [
  { name: "Endometriosis", p: 72, color: "bg-accent" },
  { name: "Adenomyosis", p: 58, color: "bg-secondary" },
  { name: "Hashimoto's", p: 41, color: "bg-warning" },
  { name: "PCOS", p: 28, color: "bg-success" },
  { name: "Lupus", p: 14, color: "bg-secondary/70" },
  { name: "MCAS", p: 9, color: "bg-warning/70" },
];

const tests = [
  { t: "Transvaginal ultrasound (specialist)", done: true },
  { t: "AMH + FSH + LH panel", done: true },
  { t: "CA-125 marker", done: false },
  { t: "Pelvic MRI with endo protocol", done: false },
  { t: "Anti-TPO antibodies", done: false },
  { t: "Vitamin D, B12, ferritin", done: true },
];

const patterns = [
  { t: "Pain peaks 2 days before period — every cycle for 3 months.", flag: "Cyclical" },
  { t: "Fatigue scores rise 36h after high-histamine meals.", flag: "Diet" },
  { t: "Distress spikes correlate with unanswered doctor messages.", flag: "Care" },
];

const labs = [
  { m: "Jan", ferritin: 18, tsh: 3.4 },
  { m: "Feb", ferritin: 20, tsh: 3.1 },
  { m: "Mar", ferritin: 22, tsh: 2.9 },
  { m: "Apr", ferritin: 24, tsh: 2.6 },
  { m: "May", ferritin: 29, tsh: 2.3 },
  { m: "Jun", ferritin: 34, tsh: 2.1 },
];

function Picture() {
  return (
    <PrevyaShell>
      <SectionHeader
        eyebrow="My picture"
        title="What I think is going on."
        description="Probabilities, recommended next tests, and the patterns that are starting to show."
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="surface lg:col-span-2 p-6">
          <h2 className="font-display text-lg font-semibold tracking-tight">Diagnosis probability map</h2>
          <p className="mt-1 text-xs text-muted-foreground">Bayesian estimates updated nightly · not a diagnosis</p>
          <ul className="mt-5 space-y-4">
            {probs.map((p) => (
              <li key={p.name}>
                <div className="mb-1.5 flex items-baseline justify-between">
                  <span className="text-sm font-medium">{p.name}</span>
                  <span className="text-sm tabular-nums text-muted-foreground">{p.p}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div className={["h-full rounded-full", p.color].join(" ")} style={{ width: `${p.p}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="surface p-6">
          <h2 className="font-display text-lg font-semibold tracking-tight">Recommended tests</h2>
          <ul className="mt-4 space-y-2.5">
            {tests.map((t) => (
              <li key={t.t} className="flex items-start gap-2.5 text-sm">
                {t.done ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success-foreground" />
                ) : (
                  <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                <span className={t.done ? "text-muted-foreground line-through" : "text-foreground"}>{t.t}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-5">
        <div className="surface lg:col-span-2 p-6">
          <h2 className="font-display text-lg font-semibold tracking-tight">Patterns detected</h2>
          <ul className="mt-4 space-y-3">
            {patterns.map((p) => (
              <li key={p.t} className="rounded-xl border bg-card p-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-accent" />
                  <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-accent">{p.flag}</span>
                </div>
                <div className="mt-1.5 text-sm text-foreground/85">{p.t}</div>
              </li>
            ))}
          </ul>
        </div>
        <div className="surface lg:col-span-3 p-6">
          <h2 className="font-display text-lg font-semibold tracking-tight">Lab trends</h2>
          <p className="mt-1 text-xs text-muted-foreground">Ferritin ng/mL · TSH mIU/L</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer>
              <LineChart data={labs} margin={{ left: 0, right: 8, top: 10, bottom: 0 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis dataKey="m" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Line type="monotone" dataKey="ferritin" stroke="var(--accent)" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="tsh" stroke="var(--secondary)" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </PrevyaShell>
  );
}
