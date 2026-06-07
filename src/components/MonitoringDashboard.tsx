import { useEffect, useMemo, useState } from "react";
import { Eye, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Checkin = {
  id: string;
  created_at: string | null;
  date: string | null;
  pain_score: number | null;
  fatigue_score: number | null;
  distress_score: number | null;
};

type Pattern = {
  id: string;
  pattern_description: string | null;
  clinical_significance: string | null;
  added_to_dossier: boolean | null;
  first_detected: string | null;
};

function scoreColor(score: number) {
  if (score < 30) return { bg: "bg-success/30", text: "text-success-foreground", dot: "bg-success", label: "improving" };
  if (score <= 60) return { bg: "bg-warning/30", text: "text-warning-foreground", dot: "bg-warning", label: "watch" };
  return { bg: "bg-accent/20", text: "text-accent", dot: "bg-accent", label: "flagged" };
}

function timeAgo(iso: string | null) {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.floor(h / 24);
  return `${d} d ago`;
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const w = 240;
  const h = 48;
  if (data.length === 0) return <svg width={w} height={h} />;
  const max = 100;
  const step = data.length > 1 ? w / (data.length - 1) : 0;
  const points = data
    .map((v, i) => `${i * step},${h - (v / max) * h}`)
    .join(" ");
  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" points={points} />
      {data.map((v, i) => (
        <circle key={i} cx={i * step} cy={h - (v / max) * h} r={2.5} fill={color} />
      ))}
    </svg>
  );
}

export function MonitoringDashboard() {
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [patterns, setPatterns] = useState<Pattern[]>([]);

  async function load() {
    const [c, p] = await Promise.all([
      supabase
        .from("checkins")
        .select("id, created_at, date, pain_score, fatigue_score, distress_score")
        .order("created_at", { ascending: false })
        .limit(14),
      supabase
        .from("patterns")
        .select("id, pattern_description, clinical_significance, added_to_dossier, first_detected")
        .order("first_detected", { ascending: false })
        .limit(3),
    ]);
    if (c.data) setCheckins(c.data as Checkin[]);
    if (p.data) setPatterns(p.data as Pattern[]);
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  const last = checkins[0];
  const pain = last?.pain_score ?? 0;
  const fatigue = last?.fatigue_score ?? 0;
  const distress = last?.distress_score ?? 0;

  const week = useMemo(() => {
    const sorted = [...checkins].sort(
      (a, b) => new Date(a.created_at ?? 0).getTime() - new Date(b.created_at ?? 0).getTime(),
    );
    return sorted.slice(-7);
  }, [checkins]);

  const painSeries = week.map((c) => c.pain_score ?? 0);
  const fatigueSeries = week.map((c) => c.fatigue_score ?? 0);

  const nextCheckin = (() => {
    const base = last?.created_at ? new Date(last.created_at) : new Date();
    const next = new Date(base.getTime() + 24 * 60 * 60 * 1000);
    return next.toLocaleString(undefined, { weekday: "short", hour: "numeric", minute: "2-digit" });
  })();

  return (
    <section className="mt-6 grid gap-5">
      {/* Status card */}
      <div className="surface p-6 bg-secondary/30">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-background shadow-sm">
              <Eye className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="font-display text-xl font-semibold tracking-tight">Prevya is watching</div>
              <div className="mt-1 text-sm text-muted-foreground">
                Last check-in: <span className="text-foreground font-medium">{timeAgo(last?.created_at ?? null)}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                Next check-in scheduled: <span className="text-foreground font-medium">{nextCheckin}</span>
              </div>
            </div>
          </div>

          {/* Trend pills */}
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Pain", value: pain },
              { label: "Fatigue", value: fatigue },
              { label: "Distress", value: distress },
            ].map((m) => {
              const c = scoreColor(m.value);
              return (
                <div key={m.label} className={`flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-medium ${c.bg} ${c.text}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
                  {m.label}: {m.value}/100
                </div>
              );
            })}
          </div>
        </div>

        {/* Weekly trajectory */}
        <div className="mt-6 rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Your week at a glance
            </div>
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-accent" /> Pain</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-secondary" /> Fatigue</span>
            </div>
          </div>
          <div className="mt-3 flex items-end gap-6">
            <Sparkline data={painSeries.length ? painSeries : [0]} color="hsl(347 47% 65%)" />
            <Sparkline data={fatigueSeries.length ? fatigueSeries : [0]} color="hsl(265 25% 77%)" />
          </div>
        </div>
      </div>

      {/* Pattern alerts */}
      {patterns.length > 0 && (
        <div className="grid gap-3 md:grid-cols-3">
          {patterns.map((p) => (
            <div key={p.id} className="rounded-2xl bg-accent p-5 text-accent-foreground shadow-sm">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] opacity-90">
                <Search className="h-3.5 w-3.5" /> Pattern detected
              </div>
              <div className="mt-2 text-sm font-medium leading-snug">
                {p.pattern_description ?? "New correlation found in your records."}
              </div>
              {p.clinical_significance && (
                <div className="mt-1.5 text-xs opacity-90">{p.clinical_significance}</div>
              )}
              {p.added_to_dossier && (
                <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-background/20 px-2.5 py-1 text-xs font-medium">
                  Added to your dossier ✓
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
