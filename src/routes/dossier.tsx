import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PrevyaShell } from "@/components/PrevyaShell";
import { SectionHeader } from "@/components/SectionHeader";
import { supabase } from "@/integrations/supabase/client";
import {
  Download,
  Loader2,
  Mail,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { generateDossier, DEMO_USER_ID } from "@/services/api";

export const Route = createFileRoute("/dossier")({
  head: () => ({
    meta: [
      { title: "My Dossier · Prevya" },
      { name: "description", content: "An auto-generated clinical summary you can send to any specialist." },
    ],
  }),
  component: Dossier,
});

type UserRow = {
  name: string | null;
  age: number | null;
  current_goal: string | null;
  fertility_intent: boolean | null;
  conditions_suspected: string[] | null;
  created_at: string | null;
};

type Checkin = {
  date: string | null;
  created_at: string | null;
  pain_score: number | null;
  fatigue_score: number | null;
  distress_score: number | null;
};

type TimelineEvent = {
  id: string;
  date: string | null;
  content: string | null;
  source: string | null;
  event_type: string | null;
  clinical_flag: boolean | null;
};

type Pattern = {
  id: string;
  pattern_description: string | null;
  clinical_significance: string | null;
};

type Diagnosis = {
  doctor_summary: string | null;
  recommended_tests: unknown;
  conditions: unknown;
};

const DEMO_SARAH: UserRow = {
  name: "Sarah",
  age: 34,
  current_goal: "Get a real diagnosis for the pelvic pain — and a plan.",
  fertility_intent: true,
  conditions_suspected: ["Endometriosis", "APS", "Lupus"],
  created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 180).toISOString(),
};

const DEMO_DIAGNOSIS: Diagnosis = {
  doctor_summary:
    "I've been managing chronic, cyclical pelvic pain for several years. Over the last 12 months it has worsened in both intensity and the breadth of symptoms it produces — fatigue, cognitive fog, and dyspareunia. Pattern analysis flagged a high probability of APS (ANA positive, 2 prior miscarriages, joint pain pattern). I'm here because the current management plan is no longer enough, and I'd like a partner in figuring out what's actually driving this.",
  recommended_tests: [
    { name: "Pelvic MRI (endometriosis protocol)", rationale: "Persistent cyclical pelvic pain.", urgency: "urgent" },
    { name: "Anticardiolipin antibodies + lupus anticoagulant", rationale: "APS probability HIGH from pattern analysis.", urgency: "urgent" },
    { name: "ANA + anti-dsDNA panel", rationale: "Autoimmune contribution suspected.", urgency: "urgent" },
    { name: "Thyroid panel (TSH, fT4, anti-TPO)", rationale: "Rising TSH + fatigue pattern.", urgency: "soon" },
    { name: "Ferritin recheck", rationale: "Monitor recovery on supplementation.", urgency: "routine" },
  ],
  conditions: ["Endometriosis", "APS (Antiphospholipid Syndrome)", "Possible Lupus"],
};

function fmtTime(d: Date) {
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function sourceColor(source: string | null | undefined) {
  switch ((source || "").toLowerCase()) {
    case "upload": return "bg-[#C4B5D4]";
    case "checkin": return "bg-[#A8C99A]";
    case "email": return "bg-[#E8A87C]";
    default: return "bg-muted-foreground/40";
  }
}

function Sparkline({ values, stroke }: { values: number[]; stroke: string }) {
  if (!values.length) return <div className="h-10 rounded bg-muted/40" />;
  const w = 120, h = 36;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(1, max - min);
  const step = values.length > 1 ? w / (values.length - 1) : w;
  const points = values.map((v, i) => `${i * step},${h - ((v - min) / range) * h}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-10 w-full">
      <polyline fill="none" stroke={stroke} strokeWidth={2} points={points} />
    </svg>
  );
}

function Dossier() {
  const [user, setUser] = useState<UserRow | null>(null);
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  async function load() {
    setLoading(true);
    const [u, c, e, p, d] = await Promise.all([
      supabase.from("users").select("*").eq("id", DEMO_USER_ID).maybeSingle(),
      supabase.from("checkins").select("*").eq("user_id", DEMO_USER_ID).order("created_at", { ascending: false }).limit(14),
      supabase.from("timeline_events").select("*").eq("user_id", DEMO_USER_ID).order("date", { ascending: false }).limit(20),
      supabase.from("patterns").select("*").eq("user_id", DEMO_USER_ID).order("first_detected", { ascending: false }).limit(10),
      supabase.from("diagnosis_results").select("*").eq("user_id", DEMO_USER_ID).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    ]);
    setUser((u.data as UserRow) ?? DEMO_SARAH);
    setCheckins(((c.data as Checkin[]) ?? []).reverse());
    setEvents((e.data as TimelineEvent[]) ?? []);
    setPatterns((p.data as Pattern[]) ?? []);
    setDiagnosis((d.data as Diagnosis) ?? DEMO_DIAGNOSIS);
    setLastUpdated(new Date());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await generateDossier();
      await load();
    } catch (err) {
      console.error("Dossier generation error:", err);
    } finally {
      setGenerating(false);
    }
  };

  const painSeries = useMemo(() => checkins.map((x) => x.pain_score ?? 0), [checkins]);
  const fatigueSeries = useMemo(() => checkins.map((x) => x.fatigue_score ?? 0), [checkins]);
  const distressSeries = useMemo(() => checkins.map((x) => x.distress_score ?? 0), [checkins]);

  const tests = useMemo(() => {
    const t = diagnosis?.recommended_tests;
    if (Array.isArray(t)) return t as Array<{ name?: string; rationale?: string; urgency?: string }>;
    return [
      { name: "Pelvic MRI (endometriosis protocol)", rationale: "Persistent cyclical pelvic pain.", urgency: "urgent" },
      { name: "Thyroid panel (TSH, fT4, anti-TPO)", rationale: "Rising TSH + fatigue pattern.", urgency: "soon" },
      { name: "Ferritin recheck", rationale: "Monitor recovery on supplementation.", urgency: "routine" },
    ];
  }, [diagnosis]);

  const questions = useMemo(() => [
    "Given the cyclical pattern, is empirical hormonal therapy reasonable if imaging is negative?",
    "What is the threshold for referral to a specialist endometriosis center?",
    "Should I be screened for autoimmune contribution given the fatigue trajectory?",
    "How should we sequence imaging vs. diagnostic laparoscopy?",
  ], []);

  async function emailDoctor() {
    await supabase.from("agent_actions").insert({
      user_id: DEMO_USER_ID,
      agent_name: "advocate_agent",
      action_type: "email_sent",
      action_detail: "Dossier emailed to clinician",
      status: "pending",
    });
    alert("Prevya is sending your dossier to your doctor.");
  }

  return (
    <PrevyaShell>
      <SectionHeader
        eyebrow="Your clinical dossier"
        title="Your Clinical Dossier"
        description={`Last updated ${fmtTime(lastUpdated)}`}
        action={
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleGenerate}
              disabled={generating || loading}
              className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition hover:opacity-95 disabled:opacity-60"
            >
              {generating
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Sparkles className="h-4 w-4" />
              }
              {generating ? "Generating…" : diagnosis ? "Regenerate" : "Generate Dossier"}
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-95"
            >
              <Download className="h-4 w-4" /> Download PDF
            </button>
            <button
              onClick={emailDoctor}
              className="inline-flex items-center gap-2 rounded-full border-2 border-[#E8A4B8] bg-transparent px-4 py-2 text-sm font-medium text-[#C46B85] transition hover:bg-[#E8A4B8]/10"
            >
              <Mail className="h-4 w-4" /> Email to Doctor
            </button>
          </div>
        }
      />

      {generating && (
        <div className="flex items-center gap-3 rounded-xl border border-accent/30 bg-accent/5 p-5">
          <Loader2 className="h-5 w-5 animate-spin text-accent" />
          <div>
            <p className="text-sm font-medium">Prevya is generating your dossier…</p>
            <p className="text-xs text-muted-foreground">Reading records, detecting patterns, drafting summary.</p>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <Card title="Patient summary" eyebrow="01 · Identity">
          <div className="grid gap-x-8 gap-y-4 text-sm sm:grid-cols-2 md:grid-cols-3">
            <Field label="Name" value={user?.name ?? "—"} />
            <Field label="Age" value={user?.age ? `${user.age}` : "—"} />
            <Field label="Symptomatic since" value={user?.created_at ? new Date(user.created_at).toLocaleDateString() : "—"} />
            <Field label="Conditions suspected" value={(user?.conditions_suspected ?? []).join(", ") || "None recorded"} />
            <Field label="Fertility intent" value={user?.fertility_intent ? "Yes" : "Not at this time"} />
            <Field label="Current goal" value={user?.current_goal ?? "—"} />
          </div>
        </Card>

        <Card title="Why I am here" eyebrow="02 · Narrative">
          <div className="border-l-4 border-primary pl-5">
            <p className="text-[15px] leading-relaxed text-foreground/85">
              {diagnosis?.doctor_summary ??
                "I've been managing chronic, cyclical pelvic pain for several years. Over the last 12 months it has worsened in both intensity and the breadth of symptoms it produces — fatigue, cognitive fog, and dyspareunia. I'm here because the current management plan is no longer enough, and I'd like a partner in figuring out what's actually driving this."}
            </p>
          </div>
        </Card>

        <Card title="Symptom timeline" eyebrow="03 · Evidence">
          {events.length === 0 ? (
            <Empty text="Timeline will appear here as Prevya collects events." />
          ) : (
            <ol className="relative ml-2 space-y-5 border-l border-border pl-6">
              {events.map((ev) => (
                <li key={ev.id} className="relative">
                  <span className={`absolute -left-[31px] top-1.5 h-3 w-3 rounded-full ring-4 ring-background ${sourceColor(ev.source)}`} />
                  <div className="flex flex-wrap items-baseline gap-x-3">
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {ev.date ? new Date(ev.date).toLocaleDateString() : "—"}
                    </span>
                    <span className="text-[11px] uppercase tracking-wider text-accent">
                      {ev.source ?? ev.event_type ?? "event"}
                    </span>
                    {ev.clinical_flag && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-medium text-rose-700">
                        <AlertTriangle className="h-3 w-3" /> flagged
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-foreground/85">{ev.content ?? "—"}</p>
                </li>
              ))}
            </ol>
          )}
        </Card>

        <Card title="Patterns identified" eyebrow="04 · Synthesis">
          {patterns.length === 0 ? (
            <Empty text="Patterns will surface once Prevya has enough data." />
          ) : (
            <div className="divide-y divide-border">
              {patterns.map((p) => {
                const high = (p.clinical_significance ?? "").toLowerCase().includes("high");
                return (
                  <div key={p.id} className="flex items-start gap-4 py-4">
                    <span className={`mt-1.5 h-2.5 w-2.5 flex-shrink-0 rounded-full ${high ? "bg-[#E8A4B8]" : "bg-muted-foreground/40"}`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{p.pattern_description ?? "—"}</p>
                      {p.clinical_significance && (
                        <p className="mt-1 text-xs text-muted-foreground">{p.clinical_significance}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card title="Current picture" eyebrow="05 · Trends">
          <div className="grid gap-4 sm:grid-cols-3">
            <Metric label="Pain trend" series={painSeries} stroke="#E8A87C" />
            <Metric label="Fatigue trend" series={fatigueSeries} stroke="#C4B5D4" />
            <Metric label="Distress trend" series={distressSeries} stroke="#E8A4B8" />
          </div>
        </Card>

        <Card title="Recommended investigations" eyebrow="06 · Asks">
          <ul className="space-y-3">
            {tests.map((t, i) => {
              const urgency = (t.urgency ?? "routine").toLowerCase();
              const dot = urgency === "urgent" ? "bg-rose-500" : urgency === "soon" ? "bg-amber-500" : "bg-emerald-500";
              return (
                <li key={i} className="flex items-start gap-3 rounded-xl border bg-card/40 p-4">
                  <span className={`mt-1.5 h-2.5 w-2.5 flex-shrink-0 rounded-full ${dot}`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{t.name ?? "Investigation"}</p>
                    {t.rationale && <p className="mt-0.5 text-xs text-muted-foreground">{t.rationale}</p>}
                  </div>
                  <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{urgency}</span>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card title="Questions for my doctor" eyebrow="07 · Conversation">
          <ol className="space-y-3">
            {questions.map((q, i) => (
              <li key={i} className="flex items-start gap-4 rounded-2xl bg-secondary/30 p-4">
                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  {i + 1}
                </span>
                <p className="text-[15px] leading-relaxed text-foreground/85">{q}</p>
              </li>
            ))}
          </ol>
        </Card>

        <div className="rounded-2xl bg-secondary/30 p-5 text-sm">
          <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-secondary-foreground">
            <Sparkles className="h-3.5 w-3.5" /> Prevya note for the clinician
          </div>
          <p className="mt-2 text-foreground/85">
            This dossier is auto-generated from {checkins.length} recent check-ins,{" "}
            {events.length} timeline events, and {patterns.length} detected patterns. Reply to
            the sender — I keep these records in sync.
          </p>
        </div>

        <div className="flex justify-center pt-2">
          <button
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-95 disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Rebuilding…" : "Refresh Dossier"}
          </button>
        </div>
      </div>
    </PrevyaShell>
  );
}

function Card({ title, eyebrow, children }: { title: string; eyebrow?: string; children: React.ReactNode }) {
  return (
    <section className="surface p-6 md:p-8">
      {eyebrow && <div className="mb-1 text-[11px] font-medium uppercase tracking-[0.18em] text-accent">{eyebrow}</div>}
      <h2 className="mb-5 font-display text-xl font-semibold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm text-foreground">{value}</div>
    </div>
  );
}

function Metric({ label, series, stroke }: { label: string; series: number[]; stroke: string }) {
  const latest = series[series.length - 1] ?? 0;
  const prev = series[series.length - 2] ?? latest;
  const delta = latest - prev;
  return (
    <div className="rounded-xl border bg-card/40 p-4">
      <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="font-display text-2xl font-semibold">{latest}</span>
        <span className="text-xs text-muted-foreground">
          {delta === 0 ? "no change" : delta > 0 ? `▲ ${delta}` : `▼ ${Math.abs(delta)}`}
        </span>
      </div>
      <div className="mt-2"><Sparkline values={series} stroke={stroke} /></div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-dashed bg-muted/20 p-6 text-sm text-muted-foreground">
      <CheckCircle2 className="h-4 w-4" /> {text}
    </div>
  );
}
