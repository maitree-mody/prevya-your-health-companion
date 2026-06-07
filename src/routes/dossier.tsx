import { createFileRoute } from "@tanstack/react-router";
import { PrevyaShell } from "@/components/PrevyaShell";
import { SectionHeader } from "@/components/SectionHeader";
import { Download, Mail, Sparkles } from "lucide-react";

export const Route = createFileRoute("/dossier")({
  head: () => ({
    meta: [
      { title: "My Dossier · Prevya" },
      { name: "description", content: "An auto-generated clinical summary you can send to any specialist." },
    ],
  }),
  component: Dossier,
});

function Dossier() {
  return (
    <PrevyaShell>
      <SectionHeader
        eyebrow="My dossier"
        title="The story I'd hand any new doctor."
        description="Always up to date. Always ready to send."
        action={
          <div className="flex flex-wrap gap-2">
            <button className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm font-medium transition hover:border-accent">
              <Download className="h-4 w-4" /> Download PDF
            </button>
            <button className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-95">
              <Mail className="h-4 w-4" /> Email to doctor
            </button>
          </div>
        }
      />

      <div className="surface p-8 md:p-10">
        <div className="flex items-center justify-between border-b pb-5">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-accent">
              Clinical summary · v8
            </div>
            <div className="mt-1 font-display text-2xl font-semibold tracking-tight">
              Maya R. — 29F
            </div>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <div>Last updated</div>
            <div className="font-medium text-foreground">Today · 09:42</div>
          </div>
        </div>

        <div className="mt-6 space-y-6 text-[15px] leading-relaxed text-foreground/85">
          <Section title="Chief concern">
            Chronic cyclical pelvic pain (3+ years), worsening over the last 12 months. Pain consistently
            peaks in the 48h preceding menses, scoring 7–9/10. Associated symptoms include severe fatigue,
            cognitive fog, and dyspareunia.
          </Section>

          <Section title="Working differentials (Prevya estimate)">
            <ul className="ml-5 list-disc space-y-1">
              <li>Endometriosis — <strong>72%</strong> (cyclical pattern, family hx, imaging suggestive)</li>
              <li>Adenomyosis — <strong>58%</strong> (uterine tenderness, heavy menses)</li>
              <li>Hashimoto's thyroiditis — <strong>41%</strong> (TSH trending up, fatigue)</li>
            </ul>
          </Section>

          <Section title="Patterns Prevya has detected">
            <ul className="ml-5 list-disc space-y-1">
              <li>Pain follows luteal phase across 3 consecutive cycles.</li>
              <li>Fatigue scores rise 36h after high-histamine meals.</li>
              <li>Ferritin recovering on supplementation (18 → 34 ng/mL over 6 months).</li>
            </ul>
          </Section>

          <Section title="What we're asking for">
            Pelvic MRI with endometriosis protocol; rheumatology consult to rule in/out autoimmune
            contribution; consideration of empirical hormonal trial if imaging negative.
          </Section>

          <div className="rounded-xl bg-secondary/30 p-5 text-sm">
            <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-secondary-foreground">
              <Sparkles className="h-3.5 w-3.5" /> Prevya note for the clinician
            </div>
            <p className="mt-2 text-foreground/85">
              Maya has been an exceptionally consistent reporter. Daily structured check-ins are
              available on request. Please reply to this email — I (Prevya) keep her records in sync
              and will surface your guidance to her in plain language.
            </p>
          </div>
        </div>
      </div>
    </PrevyaShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {title}
      </h3>
      <div>{children}</div>
    </div>
  );
}
