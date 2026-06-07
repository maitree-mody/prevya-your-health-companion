import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  CalendarDays,
  Check,
  Leaf,
  Loader2,
  Mail,
  Play,
  Sparkles,
  Square,
  Upload,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DEMO_USER_ID } from "@/services/api";
import { synthesizeSpeech } from "@/lib/tts.functions";

export const Route = createFileRoute("/onboarding")({
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

const serif = { fontFamily: '"Playfair Display", "Cormorant Garamond", Georgia, serif' };

const PALETTE = {
  bg: "#FAF8F5",
  ink: "#2A1F1A",
  inkSoft: "#5C4A3F",
  terracotta: "#C4614A",
  cream: "#F3EBE3",
  border: "#EDE3D7",
};

const CONDITIONS = [
  "Endometriosis",
  "PCOS",
  "Hashimoto's",
  "Lupus",
  "Rheumatoid arthritis",
  "Sjögren's",
  "Adenomyosis",
  "MCAS",
  "APS",
  "MS",
];

const INTRO_TEXT =
  "Hi, I'm Prevya. I'm going to read everything you've ever been given by a doctor, listen to you every day, and work to get you the answers you deserve. Let's start.";

function Onboarding() {
  const navigate = useNavigate();
  const tts = useServerFn(synthesizeSpeech);

  const [name, setName] = useState("");
  const [age, setAge] = useState<string>("");
  const [conditions, setConditions] = useState<string[]>([]);
  const [fertility, setFertility] = useState(false);
  const [cycleDate, setCycleDate] = useState("");
  const [saving, setSaving] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playState, setPlayState] = useState<"idle" | "loading" | "playing">("idle");

  const toggleCondition = (c: string) =>
    setConditions((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
    );

  const playIntro = async () => {
    if (playState === "playing" && audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setPlayState("idle");
      return;
    }
    try {
      setPlayState("loading");
      const { audioBase64 } = await tts({ data: { text: INTRO_TEXT } });
      const audio = new Audio(`data:audio/mpeg;base64,${audioBase64}`);
      audioRef.current = audio;
      audio.onended = () => setPlayState("idle");
      audio.onerror = () => setPlayState("idle");
      await audio.play();
      setPlayState("playing");
    } catch (e) {
      console.error(e);
      setPlayState("idle");
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const payload = {
        id: DEMO_USER_ID,
        name: name || null,
        age: age ? parseInt(age, 10) : null,
        conditions_suspected: conditions.length ? conditions : null,
        fertility_intent: fertility,
        cycle_start_dates: cycleDate ? [cycleDate] : null,
      };
      await supabase.from("users").upsert(payload, { onConflict: "id" });
      navigate({ to: "/home" });
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ background: PALETTE.bg, color: PALETTE.ink }} className="min-h-screen">
      <header className="mx-auto flex max-w-[900px] items-center justify-between px-6 py-6">
        <a href="/" className="flex items-center gap-2">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full"
            style={{ background: `${PALETTE.terracotta}1A` }}
          >
            <Leaf className="h-4 w-4" style={{ color: PALETTE.terracotta }} />
          </div>
          <span className="text-xl tracking-tight" style={{ ...serif, color: PALETTE.ink }}>
            Prevya
          </span>
        </a>
      </header>

      <main className="mx-auto max-w-[720px] px-6 pb-24 pt-6">
        <div
          className="text-[11px] font-medium uppercase tracking-[0.2em]"
          style={{ color: PALETTE.terracotta }}
        >
          A new kind of advocate
        </div>
        <h1
          className="mt-4 text-[clamp(2.4rem,5vw,3.5rem)] font-medium leading-[1.05] tracking-tight"
          style={{ ...serif, color: PALETTE.ink }}
        >
          Hi. I'm <em style={{ color: PALETTE.terracotta, fontStyle: "italic" }}>Prevya.</em>
        </h1>
        <p
          className="mt-5 max-w-xl text-base leading-relaxed lg:text-lg"
          style={{ color: PALETTE.inkSoft }}
        >
          Tell me a little about you. The more I know, the harder I can fight for the answers you
          deserve.
        </p>

        <button
          onClick={playIntro}
          disabled={playState === "loading"}
          className="mt-7 inline-flex items-center gap-3 rounded-full border px-5 py-3 text-sm font-medium transition-all hover:bg-white disabled:opacity-60"
          style={{ borderColor: PALETTE.border, color: PALETTE.ink, background: "#FFFFFFAA" }}
        >
          <span
            className="flex h-8 w-8 items-center justify-center rounded-full"
            style={{ background: PALETTE.terracotta, color: "#FFF8F3" }}
          >
            {playState === "loading" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : playState === "playing" ? (
              <Square className="h-3 w-3" fill="currentColor" />
            ) : (
              <Play className="h-3.5 w-3.5" fill="currentColor" />
            )}
          </span>
          {playState === "playing"
            ? "Stop"
            : playState === "loading"
              ? "Loading Prevya's voice…"
              : "Hear Prevya introduce herself"}
        </button>

        <div
          className="mt-10 rounded-3xl p-8"
          style={{ background: "#FFFFFF", border: `1px solid ${PALETTE.border}` }}
        >
          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="Your name">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Maya"
                maxLength={80}
                className="w-full rounded-xl border bg-transparent px-4 py-3 text-sm outline-none"
                style={{ borderColor: PALETTE.border, color: PALETTE.ink }}
              />
            </Field>
            <Field label="Age">
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="29"
                min={1}
                max={120}
                className="w-full rounded-xl border bg-transparent px-4 py-3 text-sm outline-none"
                style={{ borderColor: PALETTE.border, color: PALETTE.ink }}
              />
            </Field>
          </div>

          <div className="mt-6">
            <Label>Conditions you suspect</Label>
            <div className="mt-3 flex flex-wrap gap-2">
              {CONDITIONS.map((c) => {
                const active = conditions.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleCondition(c)}
                    className="inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all"
                    style={{
                      background: active ? PALETTE.terracotta : "#FFFFFF",
                      color: active ? "#FFF8F3" : PALETTE.ink,
                      borderColor: active ? PALETTE.terracotta : PALETTE.border,
                    }}
                  >
                    {active && <Check className="h-3 w-3" />}
                    {c}
                  </button>
                );
              })}
            </div>
          </div>

          <div
            className="mt-7 flex items-start justify-between gap-4 rounded-2xl border p-4"
            style={{ borderColor: PALETTE.border, background: PALETTE.cream }}
          >
            <div>
              <div className="text-sm font-medium" style={{ color: PALETTE.ink }}>
                Fertility is part of your goal
              </div>
              <div className="mt-1 text-xs" style={{ color: PALETTE.inkSoft }}>
                I'll prioritise reproductive-health pathways.
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={fertility}
              onClick={() => setFertility((v) => !v)}
              className="relative h-7 w-12 shrink-0 rounded-full transition-all"
              style={{ background: fertility ? PALETTE.terracotta : "#D9CFC2" }}
            >
              <span
                className="absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all"
                style={{ left: fertility ? "calc(100% - 1.625rem)" : "0.125rem" }}
              />
            </button>
          </div>

          <div className="mt-6">
            <Label>When did your last cycle start?</Label>
            <div className="relative mt-2">
              <CalendarDays
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2"
                style={{ color: PALETTE.inkSoft }}
              />
              <input
                type="date"
                value={cycleDate}
                onChange={(e) => setCycleDate(e.target.value)}
                className="w-full rounded-xl border bg-transparent py-3 pl-10 pr-4 text-sm outline-none"
                style={{ borderColor: PALETTE.border, color: PALETTE.ink }}
              />
            </div>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <OutlineBtn icon={Mail}>Connect Gmail</OutlineBtn>
            <OutlineBtn icon={Upload}>Upload medical records</OutlineBtn>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full px-9 py-4 text-base font-medium transition-all hover:opacity-95 hover:shadow-md disabled:opacity-60"
          style={{
            background: PALETTE.terracotta,
            color: "#FFF8F3",
            boxShadow: "0 8px 24px -10px rgba(196,97,74,0.6)",
          }}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {saving ? "Saving…" : "Let's begin"}
        </button>
      </main>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="text-[11px] font-medium uppercase tracking-[0.16em]"
      style={{ color: PALETTE.inkSoft }}
    >
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function OutlineBtn({
  icon: Icon,
  children,
}: {
  icon: typeof Mail;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className="inline-flex items-center justify-center gap-2 rounded-full border px-5 py-3 text-sm font-medium transition-all hover:bg-white/60"
      style={{ borderColor: PALETTE.terracotta, color: PALETTE.terracotta, background: "transparent" }}
    >
      <Icon className="h-4 w-4" />
      {children}
    </button>
  );
}
