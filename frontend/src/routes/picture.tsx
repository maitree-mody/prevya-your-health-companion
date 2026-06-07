import { createFileRoute } from "@tanstack/react-router";
import { PrevyaShell } from "@/components/PrevyaShell";
import { SectionHeader } from "@/components/SectionHeader";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Sparkles, AlertCircle } from "lucide-react";
import { DEMO_USER_ID } from "@/services/api";

export const Route = createFileRoute("/picture")({
  head: () => ({
    meta: [
      { title: "My Picture · Prevya" },
      { name: "description", content: "Condition probabilities, recommended tests, and patterns Prevya found across your records." },
    ],
  }),
  component: Picture,
});

type Level = "low" | "moderate" | "high";
type Condition = { name: string; level: Level; evidence: string[] };
type Test = { name: string; priority: "urgent" | "soon" | "routine"; rationale: string };
type Pattern = { title: string; body: string };

type Result = {
  conditions: Condition[];
  recommended_tests: Test[];
  cross_patterns: Pattern[];
  doctor_summary: string;
};

const LOADING_STEPS = [
  "Reading your records…",
  "Finding patterns…",
  "Building your picture…",
];

const levelStyles: Record<Level, { pill: string; label: string }> = {
  low:      { pill: "bg-success/30 text-foreground border-success/50",  label: "Low likelihood"      },
  moderate: { pill: "bg-warning/30 text-foreground border-warning/60",  label: "Moderate likelihood" },
  high:     { pill: "bg-accent/30 text-foreground border-accent/60",    label: "High likelihood"     },
};

const priorityDot: Record<Test["priority"], string> = {
  urgent:  "bg-accent",
  soon:    "bg-warning",
  routine: "bg-success",
};

const priorityLabel: Record<Test["priority"], string> = {
  urgent:  "Urgent",
  soon:    "Soon",
  routine: "Routine",
};

function Picture() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<Result | null>(null);

  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 1100);
    const t2 = setTimeout(() => setStep(2), 2200);
    const t3 = setTimeout(async () => {
      const { data: rows } = await supabase
        .from("diagnosis_results")
        .select("conditions, recommended_tests, cross_patterns, doctor_summary")
        .eq("user_id", DEMO_USER_ID)
        .order("created_at", { ascending: false })
        .limit(1);
      const row = rows?.[0];
      if (row) {
        setData({
          conditions:        (row.conditions        as unknown as Condition[]) ?? [],
          recommended_tests: (row.recommended_tests as unknown as Test[])     ?? [],
          cross_patterns:    (row.cross_patterns    as unknown as Pattern[])  ?? [],
          doctor_summary:    row.doctor_summary ?? "",
        });
      } else {
        setData({ conditions: [], recommended_tests: [], cross_patterns: [], doctor_summary: "" });
      }
    }, 3200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  return (
    <PrevyaShell>
      <SectionHeader
        eyebrow="My picture"
        title="What I think is going on."
        description="A working hypothesis built from everything you've shared — your records, your check-ins, your cycle."
      />

      {!data ? (
        <div className="surface flex flex-col items-center justify-center gap-4 p-16 text-center">
          <Loader2 className="h-7 w-7 animate-spin text-accent" />
          <div className="space-y-1">
            <p className="font-display text-lg font-medium tracking-tight">{LOADING_STEPS[step]}</p>
            <p className="text-xs text-muted-foreground">This usually takes a few seconds.</p>
          </div>
          <div className="mt-2 flex gap-1.5">
            {LOADING_STEPS.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 w-8 rounded-full transition-colors ${
                  i <= step ? "bg-accent" : "bg-muted"
                }`}
              />
            ))}
          </div>
        </div>
      ) : data.conditions.length === 0 ? (
        <div className="surface flex flex-col items-center gap-3 p-16 text-center">
          <Sparkles className="h-7 w-7 text-muted-foreground" />
          <p className="font-display text-lg font-medium tracking-tight">No diagnosis results yet.</p>
          <p className="text-sm text-muted-foreground">
            Upload your records and press <strong>Analyse My History</strong> to generate your picture.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Section 1 */}
          <section>
            <h2 className="font-display text-lg font-semibold tracking-tight">Condition probability map</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Bayesian estimates from your records · not a diagnosis
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.conditions.map((c) => {
                const s = levelStyles[c.level];
                return (
                  <div key={c.name} className="surface p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-display text-base font-semibold leading-tight">{c.name}</h3>
                      <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${s.pill}`}>
                        {c.level}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">{s.label}</p>
                    <ul className="mt-3 space-y-1.5">
                      {c.evidence.map((e) => (
                        <li key={e} className="flex gap-2 text-xs text-foreground/80">
                          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-foreground/40" />
                          <span>{e}</span>
                        </li>
                      ))}
                    </ul>
                    {(c.level === "moderate" || c.level === "high") && (
                      <div className="mt-4 flex items-center gap-1.5 border-t pt-3 text-[10px] font-medium uppercase tracking-wider text-accent">
                        <AlertCircle className="h-3 w-3" />
                        Warrants investigation
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Section 2 */}
          <section className="surface p-6">
            <h2 className="font-display text-lg font-semibold tracking-tight">Recommended tests</h2>
            <p className="mt-1 text-xs text-muted-foreground">Prioritised by clinical urgency</p>
            <ul className="mt-5 divide-y">
              {data.recommended_tests.map((t) => (
                <li key={t.name} className="flex items-start gap-3 py-3.5">
                  <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${priorityDot[t.priority]}`} />
                  <div className="flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-sm font-medium">{t.name}</span>
                      <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                        {priorityLabel[t.priority]}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{t.rationale}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Section 3 */}
          <section
            className="rounded-2xl border p-6"
            style={{ background: "color-mix(in oklab, var(--secondary) 30%, var(--background))" }}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-secondary-foreground" />
              <h2 className="font-display text-lg font-semibold tracking-tight">
                What Prevya found across your records
              </h2>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Cross-specialty patterns no single doctor was positioned to see.
            </p>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {data.cross_patterns.map((p) => (
                <div key={p.title} className="rounded-xl bg-card/80 p-4 backdrop-blur">
                  <h3 className="text-sm font-semibold leading-tight">{p.title}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-foreground/75">{p.body}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Section 4 */}
          <section className="rounded-2xl bg-primary p-7 text-primary-foreground">
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-primary-foreground/70">
              What to tell your doctor
            </p>
            <p className="mt-3 font-display text-lg leading-relaxed">{data.doctor_summary}</p>
            <p className="mt-4 text-[11px] text-primary-foreground/60">
              Read this aloud. It's everything they need in three sentences.
            </p>
          </section>
        </div>
      )}
    </PrevyaShell>
  );
}
