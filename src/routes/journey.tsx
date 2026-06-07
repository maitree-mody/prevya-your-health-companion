import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PrevyaShell } from "@/components/PrevyaShell";
import { SectionHeader } from "@/components/SectionHeader";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Heart, Mic, Sparkles } from "lucide-react";

export const Route = createFileRoute("/journey")({
  head: () => ({
    meta: [
      { title: "My Journey · Prevya" },
      { name: "description", content: "Not just tracked — seen. Your moments, your wins, your story with Prevya." },
    ],
  }),
  component: Journey,
});

const moments = [
  { week: "Week 6", title: "Pattern added to your dossier", detail: "Your symptoms follow your cycle. Now every doctor will see it.", tone: "win" },
  { week: "Week 5", title: "Rheumatology appointment booked", detail: "Thursday, June 12. I'll be ready with your full story.", tone: "win" },
  { week: "Week 4", title: "A really hard day", detail: "Pain 9/10. You still showed up for your check-in. I noticed.", tone: "hard" },
  { week: "Week 3", title: "First time a doctor took you seriously", detail: "Dr. Chen read the dossier before the visit. Things changed.", tone: "breakthrough" },
  { week: "Week 2", title: "We found the histamine link", detail: "Your fatigue after certain meals wasn't random.", tone: "breakthrough" },
  { week: "Week 1", title: "You told me your story", detail: "And I started reading everything.", tone: "start" },
];

const trend = [
  { w: "W1", distress: 8.2 },
  { w: "W2", distress: 7.6 },
  { w: "W3", distress: 6.1 },
  { w: "W4", distress: 6.8 },
  { w: "W5", distress: 5.2 },
  { w: "W6", distress: 4.3 },
];

function Journey() {
  const [playing, setPlaying] = useState(false);
  const playReflection = () => {
    setPlaying(true);
    const u = new SpeechSynthesisUtterance(
      "This week was hard. Your pain scores were highest on Wednesday. But you showed up every day and we found something important — your symptoms follow your cycle. That's now in your dossier. You're closer than you were last week.",
    );
    u.rate = 0.95;
    u.onend = () => setPlaying(false);
    window.speechSynthesis.speak(u);
  };

  return (
    <PrevyaShell>
      <SectionHeader
        eyebrow="My journey"
        title="You've been on this journey for 6 weeks."
        description="Not just numbers. The moments. The wins. The days you showed up."
      />

      {/* Weekly reflection */}
      <div className="surface relative overflow-hidden p-7 md:p-9">
        <div className="absolute inset-0 -z-0 bg-gradient-to-br from-accent/20 via-secondary/15 to-transparent" />
        <div className="relative">
          <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-accent">
            <Sparkles className="h-3.5 w-3.5" /> Sunday reflection from Prevya
          </div>
          <p className="mt-3 max-w-2xl font-display text-xl leading-snug tracking-tight md:text-2xl">
            "This week was hard. Your pain scores were highest on Wednesday. But you showed up every day
            — and we found something important. Your symptoms follow your cycle. That's now in your dossier.
            You're closer than you were last week."
          </p>
          <button
            onClick={playReflection}
            className="mt-5 inline-flex items-center gap-3 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-95"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-foreground/15">
              <Mic className={["h-3.5 w-3.5", playing ? "animate-pulse" : ""].join(" ")} />
            </span>
            {playing ? "Prevya is speaking…" : "Listen to this week (60s)"}
          </button>
        </div>
      </div>

      {/* Trend */}
      <div className="mt-6 grid gap-5 lg:grid-cols-5">
        <div className="surface lg:col-span-3 p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold tracking-tight">Distress, gently coming down</h2>
            <span className="text-xs text-muted-foreground">6-week trend</span>
          </div>
          <div className="mt-4 h-56">
            <ResponsiveContainer>
              <AreaChart data={trend} margin={{ left: 0, right: 8, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="dg" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.55} />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="w" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis domain={[0, 10]} stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Area type="monotone" dataKey="distress" stroke="var(--accent)" strokeWidth={2.5} fill="url(#dg)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="surface lg:col-span-2 p-6">
          <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            <Heart className="h-3.5 w-3.5 text-accent" /> What Prevya wants you to know
          </div>
          <p className="mt-3 text-[15px] leading-relaxed text-foreground/85">
            You've been heard <strong>42 times</strong> this month. You showed up for{" "}
            <strong>38 check-ins</strong>. You sent <strong>3 messages</strong> to your care team —
            and they replied to all of them.
          </p>
          <p className="mt-3 text-[15px] leading-relaxed text-foreground/85">
            That's not nothing. That's everything.
          </p>
        </div>
      </div>

      {/* Moments */}
      <div className="mt-6 surface p-6">
        <h2 className="font-display text-lg font-semibold tracking-tight">Moments</h2>
        <ol className="mt-5 relative ml-3 border-l border-border">
          {moments.map((m) => (
            <li key={m.week} className="mb-7 ml-6 last:mb-0">
              <span
                className={[
                  "absolute -left-[9px] h-4 w-4 rounded-full ring-4 ring-background",
                  m.tone === "win" && "bg-success",
                  m.tone === "breakthrough" && "bg-accent",
                  m.tone === "hard" && "bg-secondary",
                  m.tone === "start" && "bg-primary",
                ]
                  .filter(Boolean)
                  .join(" ")}
              />
              <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                {m.week}
              </div>
              <div className="mt-1 text-base font-medium text-foreground">{m.title}</div>
              <div className="mt-1 text-sm text-foreground/75">{m.detail}</div>
            </li>
          ))}
        </ol>
      </div>
    </PrevyaShell>
  );
}
