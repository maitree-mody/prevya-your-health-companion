import { createFileRoute } from "@tanstack/react-router";
import { useConversation } from "@elevenlabs/react";
import { useCallback, useEffect, useState } from "react";
import { ChevronDown, Mic, MicOff, Sparkles, CheckCircle2, Loader2 } from "lucide-react";
import { PrevyaShell } from "@/components/PrevyaShell";
import { SectionHeader } from "@/components/SectionHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { DEMO_USER_ID } from "@/services/api";

const PREVYA_AGENT_ID = "agent_5901kth9g167f7grv0ndphzkz8ss";

export const Route = createFileRoute("/coach")({
  head: () => ({
    meta: [
      { title: "Appointment coach · Prevya" },
      {
        name: "description",
        content:
          "Prepare for your appointment with Prevya — talking points, tests to ask for, and coached responses for when doctors dismiss you.",
      },
    ],
  }),
  component: CoachPage,
});

const SPECIALISTS = [
  "GP",
  "Rheumatologist",
  "Gynaecologist",
  "Endocrinologist",
  "Neurologist",
] as const;
type Specialist = (typeof SPECIALISTS)[number];

const TALKING_POINTS: Record<Specialist, Array<{ title: string; body: string; hint: string }>> = {
  GP: [
    {
      title: "I've tracked a 3-month pattern, not a one-off",
      body: "Symptoms recur on the same days of my cycle. This is not anxiety, it is biology that deserves investigation.",
      hint: "Lead with the data: \"I've logged this daily for 12 weeks.\"",
    },
    {
      title: "My bloods have shifted, not just sat in range",
      body: "TSH up 40% across three tests. ANA positive in 2022. I want to understand the trajectory, not just today's number.",
      hint: "Say: \"I'm asking about the change, not the absolute value.\"",
    },
    {
      title: "I'd like a rheumatology referral today",
      body: "Six years of records together show a pattern no single appointment has captured. I have a summary I can leave with you.",
      hint: "Be direct: \"I'd like a referral to rule this out.\"",
    },
  ],
  Rheumatologist: [
    {
      title: "ANA positive + 2 pregnancy losses",
      body: "I want APS and lupus formally evaluated against ACR/EULAR criteria. This is why I asked to be seen.",
      hint: "Name the criteria — it signals you've done the reading.",
    },
    {
      title: "Symptom pattern is cyclical and inflammatory",
      body: "Joint pain, fatigue, and brain fog cluster in the luteal phase. I have 12 weeks of tracked data.",
      hint: "Offer the data: \"I can share my log if helpful.\"",
    },
    {
      title: "I want a clear test plan today",
      body: "Anti-dsDNA, complement levels, antiphospholipid panel. I'd like to leave with a requisition.",
      hint: "Ask for specifics, not a vague \"we'll see.\"",
    },
  ],
  Gynaecologist: [
    {
      title: "Pelvic pain is cyclical and worsening",
      body: "It's not just period pain. It affects work, sleep, and mood for 10 days a month.",
      hint: "Quantify the impact in days lost.",
    },
    {
      title: "Two pregnancy losses — I want them investigated together",
      body: "Both in the first trimester. Recurrent loss work-up is overdue.",
      hint: "Say: \"I'd like a recurrent pregnancy loss panel.\"",
    },
    {
      title: "Fertility intent is on the table",
      body: "I'm planning to try again within 12 months. I want to be optimised, not reactive.",
      hint: "Frame it as planning, not panic.",
    },
  ],
  Endocrinologist: [
    {
      title: "TSH trend, not absolute value",
      body: "Three readings moving in one direction over 18 months. I want to understand why.",
      hint: "\"My TSH has changed by 40% — what's driving it?\"",
    },
    {
      title: "Symptoms align with thyroid dysfunction",
      body: "Fatigue, cold intolerance, brain fog, weight change. The cluster matters.",
      hint: "Group symptoms — don't list them as separate complaints.",
    },
    {
      title: "I'd like antibody testing",
      body: "TPO and TgAb to rule out autoimmune thyroid disease.",
      hint: "Name the antibodies directly.",
    },
  ],
  Neurologist: [
    {
      title: "Brain fog and word-finding are new and consistent",
      body: "Daily for 4+ months. Not stress, not sleep — I've controlled for both.",
      hint: "\"I've ruled out the obvious causes.\"",
    },
    {
      title: "Migraines correlate with my cycle and inflammation markers",
      body: "Hormonal trigger plus inflammatory pattern. Both matter.",
      hint: "Mention the overlap — neurologists often miss the hormonal link.",
    },
    {
      title: "I want imaging considered",
      body: "Given symptom progression, I'd like to discuss whether an MRI is warranted.",
      hint: "Frame as discussion, not demand.",
    },
  ],
};

const DEFAULT_TESTS = [
  { name: "ANA panel", rationale: "to screen for autoimmune activity (lupus, mixed connective tissue disease)" },
  { name: "Anti-dsDNA", rationale: "specific marker for lupus — high specificity, low false positive rate" },
  { name: "Antiphospholipid antibodies", rationale: "key for APS given recurrent pregnancy loss history" },
  { name: "Complement C3/C4", rationale: "low complement suggests active autoimmune disease" },
  { name: "TSH + TPO antibodies", rationale: "to investigate thyroid trajectory and autoimmune thyroid disease" },
  { name: "Inflammatory markers (ESR, CRP)", rationale: "baseline inflammation tracking across visits" },
];

const DISMISSALS = [
  {
    doctor: "Your blood tests look normal",
    you: "I understand the values are within standard range — but my TSH has changed by 40% across three tests and my ANA came back positive in 2022. I'd like to understand what's driving that change.",
  },
  {
    doctor: "These symptoms could just be stress",
    you: "I've tracked these symptoms daily for 3 months and they follow a consistent pattern tied to my cycle — that doesn't feel like stress to me. I'd like to rule out an autoimmune cause.",
  },
  {
    doctor: "Let's wait and see",
    you: "I've been waiting and watching for years. I'd like to be proactive — can we run an ANA panel, anti-dsDNA, and antiphospholipid antibodies today?",
  },
  {
    doctor: "I don't think a referral is necessary yet",
    you: "I have a clinical summary here that shows patterns across 6 years of records that no single doctor has seen together. I'd really appreciate a rheumatology opinion.",
  },
  {
    doctor: "A lot of women feel this way",
    you: "I understand — and I want to make sure we're not missing something. I've brought documentation of my symptoms over time. Can we go through it together?",
  },
];

const ROLEPLAY_PROMPT = `You are Prevya's appointment coach.
Help this woman prepare for her medical appointment.

Phase 1 — brief her:
Tell her the 3 most important things to raise.
Tell her exactly which tests to ask for.

Phase 2 — handle dismissal:
If doctor says 'your bloods are normal' coach her to say:
'I understand they're within range but I'd like to
understand why my TSH has shifted 40% across three tests'

If doctor says 'it's probably stress' coach her to say:
'I've tracked these symptoms daily for 3 months and
they follow a consistent pattern — I'd like to rule
out an autoimmune cause'

Phase 3 — roleplay:
Offer to play a skeptical doctor so she can practise.
After each exchange give her one specific tip.

Always remind her: she is not a difficult patient,
she is an informed one.`;

const ROLEPLAY_FIRST = "Let's prepare for your appointment. Which specialist are you seeing?";

function CoachPage() {
  const [specialist, setSpecialist] = useState<Specialist>("Rheumatologist");
  const [tests, setTests] = useState(DEFAULT_TESTS);
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [rpStatus, setRpStatus] = useState<"idle" | "connecting" | "live" | "ended">("idle");
  const [rpError, setRpError] = useState<string | null>(null);
  const [sessionSummary, setSessionSummary] = useState<string[] | null>(null);
  

  const conversation = useConversation({
    onConnect: () => setRpStatus("live"),
    onDisconnect: () => {
      setRpStatus("ended");
      setSessionSummary(TALKING_POINTS[specialist].map((p) => p.title));
    },
    onError: (e) => {
      console.error("[Prevya coach] roleplay error", e);
      setRpError(typeof e === "string" ? e : "Roleplay disconnected.");
      setRpStatus("idle");
    },
  });

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("diagnosis_results")
        .select("recommended_tests")
        .eq("user_id", DEMO_USER_ID)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      const rec = (data?.recommended_tests as unknown) as
        | Array<{ name?: string; rationale?: string } | string>
        | null;
      if (Array.isArray(rec) && rec.length) {
        setTests(
          rec.map((t) =>
            typeof t === "string"
              ? { name: t, rationale: "recommended by your Prevya dossier" }
              : { name: t.name ?? "Test", rationale: t.rationale ?? "recommended by your Prevya dossier" },
          ),
        );
      }
    })();
  }, []);

  const startRoleplay = useCallback(async () => {
    setRpError(null);
    setRpStatus("connecting");
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      await conversation.startSession({
        agentId: PREVYA_AGENT_ID,
        connectionType: "webrtc",
        overrides: {
          agent: {
            prompt: { prompt: ROLEPLAY_PROMPT },
            firstMessage: ROLEPLAY_FIRST,
            language: "en",
          },
        },
      });
      await supabase.from("agent_actions").insert({
        user_id: DEMO_USER_ID,
        agent_name: "voice_agent",
        action_type: "roleplay_started",
        action_detail: `🗣️ Voice: roleplay started — ${specialist} appointment prep`,
        status: "running",
      });
    } catch (err) {
      console.error("[Prevya coach] failed to start roleplay", err);
      setRpError(err instanceof Error ? err.message : "Could not start roleplay.");
      setRpStatus("idle");
    }
  }, [conversation, specialist]);

  const stopRoleplay = useCallback(async () => {
    await conversation.endSession();
    await supabase.from("agent_actions").insert({
      user_id: DEMO_USER_ID,
      agent_name: "voice_agent",
      action_type: "roleplay_ended",
      action_detail: `🗣️ Voice: roleplay debriefed — ${specialist}`,
      status: "complete",
    });
  }, [conversation, specialist]);

  const points = TALKING_POINTS[specialist];

  return (
    <PrevyaShell>
      <div className="space-y-8">
        <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <SectionHeader
            eyebrow="Appointment coach"
            title="Let's prepare for your appointment"
            description="Three talking points, the tests to ask for, and the exact words to use when a doctor pushes back."
          />
          <div className="w-full md:w-64">
            <label className="mb-1.5 block text-xs uppercase tracking-[0.14em] text-muted-foreground">
              Specialist
            </label>
            <Select value={specialist} onValueChange={(v) => setSpecialist(v as Specialist)}>
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SPECIALISTS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </header>

        {/* Briefing */}
        <section className="space-y-4">
          <h2 className="font-display text-xl tracking-tight">Your 3 most important points</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {points.map((p, i) => (
              <Card key={i} className="overflow-hidden border-border/70">
                <CardContent className="space-y-3 p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary font-display text-lg text-primary-foreground">
                    {i + 1}
                  </div>
                  <h3 className="font-display text-lg leading-snug tracking-tight">{p.title}</h3>
                  <p className="text-sm leading-relaxed text-foreground/80">{p.body}</p>
                  <p className="border-t pt-3 text-xs italic text-muted-foreground">
                    How to say it: {p.hint}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Tests to request */}
        <section className="space-y-4">
          <h2 className="font-display text-xl tracking-tight">Tests to request</h2>
          <Card>
            <CardContent className="divide-y p-0">
              {tests.map((t, i) => {
                const isChecked = checked.has(i);
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      const next = new Set(checked);
                      if (isChecked) next.delete(i);
                      else next.add(i);
                      setChecked(next);
                    }}
                    className="flex w-full items-start gap-4 px-6 py-4 text-left transition-colors hover:bg-muted/40"
                  >
                    <div
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
                        isChecked ? "border-accent bg-accent" : "border-border bg-background"
                      }`}
                    >
                      {isChecked && <CheckCircle2 className="h-4 w-4 text-accent-foreground" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-foreground">{t.name}</div>
                      <div className="mt-0.5 text-sm text-muted-foreground">
                        Ask for this because {t.rationale}.
                      </div>
                    </div>
                  </button>
                );
              })}
            </CardContent>
          </Card>
        </section>

        {/* Advocacy */}
        <section className="space-y-4">
          <SectionHeader
            eyebrow="The most important section"
            title="If your doctor dismisses you"
            description="The average woman waits 7 years for an autoimmune diagnosis. Prevya is here to close that gap."
          />
          <div className="space-y-3">
            {DISMISSALS.map((d, i) => (
              <Collapsible key={i}>
                <Card className="overflow-hidden border-l-4 border-l-accent">
                  <CollapsibleTrigger asChild>
                    <button
                      type="button"
                      className="flex w-full items-start gap-4 px-6 py-5 text-left transition-colors hover:bg-muted/40"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                          Doctor says
                        </div>
                        <div className="mt-1 font-display text-base leading-snug tracking-tight">
                          "{d.doctor}"
                        </div>
                      </div>
                      <ChevronDown className="mt-1 h-5 w-5 shrink-0 text-muted-foreground transition-transform data-[state=open]:rotate-180" />
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="border-t bg-muted/30 px-6 py-5">
                      <div className="text-[11px] uppercase tracking-[0.16em] text-accent">
                        Prevya coached response
                      </div>
                      <p className="mt-2 text-base leading-relaxed text-foreground">"{d.you}"</p>
                    </div>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            ))}
          </div>
        </section>

        {/* Remember card */}
        <Card className="border-0 bg-primary text-primary-foreground shadow-lg">
          <CardContent className="space-y-3 p-8 md:p-10">
            <Sparkles className="h-6 w-6 opacity-70" />
            <p className="font-display text-2xl leading-snug tracking-tight md:text-3xl">
              You are not a difficult patient.
              <br />
              You are an informed one.
            </p>
            <p className="max-w-2xl text-base leading-relaxed text-primary-foreground/80">
              You have every right to ask for the tests that could change your life. Prevya is
              behind you.
            </p>
          </CardContent>
        </Card>

        {/* Roleplay */}
        <Card className="border-0 bg-primary text-primary-foreground">
          <CardContent className="space-y-6 p-8 md:p-10">
            <div className="space-y-2">
              <div className="text-[11px] uppercase tracking-[0.16em] text-primary-foreground/60">
                Practise out loud
              </div>
              <h3 className="font-display text-2xl tracking-tight">Practise with Prevya</h3>
              <p className="max-w-2xl text-sm leading-relaxed text-primary-foreground/80">
                Prevya will play a dismissive doctor so you can practise advocating for yourself out
                loud — because saying it once makes it easier to say for real.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {rpStatus !== "live" ? (
                <Button
                  onClick={startRoleplay}
                  disabled={rpStatus === "connecting"}
                  className="h-11 rounded-xl bg-accent px-6 text-accent-foreground hover:bg-accent/90"
                >
                  {rpStatus === "connecting" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Connecting…
                    </>
                  ) : (
                    <>
                      <Mic className="h-4 w-4" />
                      Start Roleplay
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={stopRoleplay}
                  variant="outline"
                  className="h-11 rounded-xl border-primary-foreground/30 bg-transparent px-6 text-primary-foreground hover:bg-primary-foreground/10"
                >
                  <MicOff className="h-4 w-4" />
                  End Roleplay
                </Button>
              )}
              {rpStatus === "live" && (
                <span className="inline-flex items-center gap-2 text-sm text-primary-foreground/80">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
                  {conversation.isSpeaking ? "Doctor is speaking…" : "Listening to you…"}
                </span>
              )}
            </div>

            {rpError && (
              <p className="rounded-lg border border-accent/40 bg-accent/10 p-3 text-sm text-primary-foreground/90">
                {rpError}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Post-session */}
        {sessionSummary && (
          <Card className="border-l-4 border-l-accent">
            <CardContent className="space-y-4 p-6 md:p-8">
              <div>
                <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                  Your talking points
                </div>
                <h3 className="mt-1 font-display text-xl tracking-tight">
                  You're ready. You know what to say.
                </h3>
              </div>
              <ul className="space-y-2">
                {sessionSummary.map((s, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
              <p className="text-sm italic text-muted-foreground">
                Prevya will call after to hear how it went.
              </p>
              <Button className="h-11 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90">
                How did it go?
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </PrevyaShell>
  );
}
