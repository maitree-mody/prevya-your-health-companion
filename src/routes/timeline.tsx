import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PrevyaShell } from "@/components/PrevyaShell";
import { SectionHeader } from "@/components/SectionHeader";
import { FileText, Heart, Mail, Mic, Upload } from "lucide-react";

export const Route = createFileRoute("/timeline")({
  head: () => ({
    meta: [
      { title: "Timeline · Prevya" },
      { name: "description", content: "Your full chronological medical history, with symptoms, emotions and cycle phase overlaid." },
    ],
  }),
  component: Timeline,
});

type Source = "upload" | "checkin" | "email" | "appointment";

const events: { date: string; source: Source; title: string; detail: string; pain?: number; emotion?: string; cycle?: string }[] = [
  { date: "Jun 5", source: "checkin", title: "Daily check-in", detail: "Sharp left-side pain on waking. Slept 5h.", pain: 7, emotion: "Frustrated", cycle: "Luteal" },
  { date: "Jun 3", source: "email", title: "Dr. Chen replied", detail: "Agreed to order CA-125. Awaiting requisition.", emotion: "Hopeful" },
  { date: "May 30", source: "appointment", title: "GP follow-up", detail: "Discussed pelvic pain pattern. Referral to gynae pending.", emotion: "Heard", cycle: "Follicular" },
  { date: "May 24", source: "upload", title: "Bloodwork uploaded", detail: "Ferritin 24, TSH 2.6, B12 normal.", emotion: "Anxious" },
  { date: "May 18", source: "checkin", title: "Daily check-in", detail: "Fatigue 8/10, brain fog all day.", pain: 4, emotion: "Defeated", cycle: "Menstrual" },
  { date: "May 12", source: "upload", title: "Pelvic ultrasound report", detail: "Small ovarian cyst, otherwise unremarkable.", emotion: "Confused" },
];

const sourceMeta: Record<Source, { label: string; Icon: typeof FileText; color: string }> = {
  upload: { label: "Upload", Icon: Upload, color: "bg-secondary text-secondary-foreground" },
  checkin: { label: "Check-in", Icon: Mic, color: "bg-accent text-accent-foreground" },
  email: { label: "Email", Icon: Mail, color: "bg-warning text-warning-foreground" },
  appointment: { label: "Appointment", Icon: Heart, color: "bg-success text-success-foreground" },
};

function Timeline() {
  const [filter, setFilter] = useState<Source | "all">("all");
  const filtered = events.filter((e) => filter === "all" || e.source === filter);
  return (
    <PrevyaShell>
      <SectionHeader
        eyebrow="Timeline"
        title="Everything that's happened, in order."
        description="Symptoms, emotions, cycle phase, and clinical events — woven into one story."
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {(["all", "upload", "checkin", "email", "appointment"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={[
              "rounded-full border px-3.5 py-1.5 text-xs font-medium capitalize transition",
              filter === s
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground/70 hover:border-accent/50",
            ].join(" ")}
          >
            {s === "all" ? "All sources" : sourceMeta[s].label + "s"}
          </button>
        ))}
      </div>

      <div className="surface p-6">
        <ol className="relative ml-4 border-l border-border">
          {filtered.map((e, i) => {
            const m = sourceMeta[e.source];
            return (
              <li key={i} className="mb-7 ml-6 last:mb-0">
                <span className={["absolute -left-[13px] flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-background", m.color].join(" ")}>
                  <m.Icon className="h-3 w-3" />
                </span>
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-sm font-medium">{e.title}</span>
                  <span className="text-xs text-muted-foreground">{e.date}</span>
                  {e.cycle && (
                    <span className="rounded-full bg-secondary/40 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-secondary-foreground">
                      {e.cycle}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-foreground/80">{e.detail}</p>
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  {typeof e.pain === "number" && (
                    <span>
                      pain <span className="font-semibold text-foreground">{e.pain}/10</span>
                    </span>
                  )}
                  {e.emotion && (
                    <span>
                      felt <span className="font-semibold text-foreground">{e.emotion}</span>
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </PrevyaShell>
  );
}
