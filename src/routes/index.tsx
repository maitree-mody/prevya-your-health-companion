import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRight,
  Heart,
  Mail,
  Mic,
  Play,
  Sparkles,
  Upload,
} from "lucide-react";
import { PrevyaShell } from "@/components/PrevyaShell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Welcome to Prevya" },
      {
        name: "description",
        content:
          "Tell Prevya about yourself so she can begin advocating for you from day one.",
      },
    ],
  }),
  component: Onboarding,
});

const CONDITIONS = [
  "Endometriosis",
  "PCOS",
  "Hashimoto's",
  "Lupus",
  "Rheumatoid arthritis",
  "Sjögren's",
  "Adenomyosis",
  "MCAS",
];

function Onboarding() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [conditions, setConditions] = useState<string[]>([]);
  const [fertility, setFertility] = useState(false);
  const [cycleStart, setCycleStart] = useState("");
  const [playingIntro, setPlayingIntro] = useState(false);

  const toggle = (c: string) =>
    setConditions((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
    );

  const playIntro = () => {
    setPlayingIntro(true);
    const utter = new SpeechSynthesisUtterance(
      "Hi, I'm Prevya. I'm going to read everything you've ever been given by a doctor, listen to you every day, and work to get you the answers you deserve. Let's start.",
    );
    utter.rate = 0.95;
    utter.pitch = 1.0;
    utter.onend = () => setPlayingIntro(false);
    window.speechSynthesis.speak(utter);
  };

  return (
    <PrevyaShell>
      <div className="mx-auto max-w-2xl">
        <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-accent">
          A new kind of advocate
        </div>
        <h1 className="font-display text-4xl font-semibold tracking-tight md:text-5xl">
          Hi. I'm <span className="text-accent">Prevya</span>.
        </h1>
        <p className="mt-3 max-w-lg text-base leading-relaxed text-muted-foreground">
          Tell me a little about you. The more I know, the harder I can fight for the answers
          you deserve.
        </p>

        {/* Voice intro */}
        <button
          onClick={playIntro}
          className="mt-6 group inline-flex items-center gap-3 rounded-full border bg-card px-5 py-3 text-sm font-medium shadow-sm transition hover:border-accent hover:shadow-md"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-accent-foreground">
            {playingIntro ? <Mic className="h-4 w-4 animate-pulse" /> : <Play className="h-4 w-4" />}
          </span>
          <span className="text-foreground">
            {playingIntro ? "Listening to Prevya…" : "Hear Prevya introduce herself"}
          </span>
        </button>

        <form
          className="mt-10 space-y-7"
          onSubmit={(e) => {
            e.preventDefault();
            navigate({ to: "/home" });
          }}
        >
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="Your name">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Maya"
                className="input"
              />
            </Field>
            <Field label="Age">
              <input
                value={age}
                onChange={(e) => setAge(e.target.value)}
                inputMode="numeric"
                placeholder="29"
                className="input"
              />
            </Field>
          </div>

          <Field label="Conditions you suspect">
            <div className="flex flex-wrap gap-2">
              {CONDITIONS.map((c) => {
                const active = conditions.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggle(c)}
                    className={[
                      "rounded-full border px-3.5 py-1.5 text-sm transition",
                      active
                        ? "border-accent bg-accent text-accent-foreground"
                        : "border-border bg-card text-foreground/80 hover:border-accent/50",
                    ].join(" ")}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </Field>

          <div className="surface flex items-center justify-between p-4">
            <div className="flex items-start gap-3">
              <Heart className="mt-0.5 h-5 w-5 text-accent" />
              <div>
                <div className="text-sm font-medium">Fertility is part of your goal</div>
                <div className="text-xs text-muted-foreground">
                  I'll prioritise reproductive-health pathways.
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setFertility((v) => !v)}
              className={[
                "relative h-6 w-11 rounded-full transition",
                fertility ? "bg-accent" : "bg-muted",
              ].join(" ")}
            >
              <span
                className={[
                  "absolute top-0.5 h-5 w-5 rounded-full bg-background shadow transition",
                  fertility ? "left-5" : "left-0.5",
                ].join(" ")}
              />
            </button>
          </div>

          <Field label="When did your last cycle start?">
            <input
              type="date"
              value={cycleStart}
              onChange={(e) => setCycleStart(e.target.value)}
              className="input"
            />
          </Field>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              className="flex items-center justify-center gap-2 rounded-xl border bg-card px-4 py-3 text-sm font-medium transition hover:border-accent"
            >
              <Mail className="h-4 w-4" /> Connect Gmail
            </button>
            <button
              type="button"
              className="flex items-center justify-center gap-2 rounded-xl border bg-card px-4 py-3 text-sm font-medium transition hover:border-accent"
            >
              <Upload className="h-4 w-4" /> Upload medical records
            </button>
          </div>

          <button
            type="submit"
            className="group mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-4 text-base font-medium text-primary-foreground shadow-sm transition hover:opacity-95"
          >
            <Sparkles className="h-4 w-4" />
            Start with Prevya
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </button>
        </form>
      </div>

      <style>{`
        .input {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid var(--border);
          background: var(--card);
          padding: 0.75rem 1rem;
          font-size: 0.95rem;
          color: var(--foreground);
          outline: none;
          transition: border-color .15s, box-shadow .15s;
        }
        .input:focus { border-color: var(--accent); box-shadow: 0 0 0 4px color-mix(in oklab, var(--accent) 18%, transparent); }
      `}</style>
    </PrevyaShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-2 text-sm font-medium text-foreground/80">{label}</div>
      {children}
    </label>
  );
}
