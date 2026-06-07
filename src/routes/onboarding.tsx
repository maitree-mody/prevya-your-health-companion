import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Play, Loader2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { synthesizeSpeech } from "@/lib/tts.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/onboarding")({
  component: OnboardingPage,
  head: () => ({
    meta: [
      { title: "Onboarding — Prevya" },
      { name: "description", content: "Tell Prevya a bit about you to get started." },
    ],
  }),
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
  "APS",
  "MS",
];

const INTRO = "Hi, I'm Prevya. I'm here to help you find answers, advocate for your care, and make sure you're heard. Let's get started.";

function OnboardingPage() {
  const navigate = useNavigate();
  const tts = useServerFn(synthesizeSpeech);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [conditions, setConditions] = useState<string[]>([]);
  const [fertility, setFertility] = useState(false);
  const [cycleDate, setCycleDate] = useState("");
  const [saving, setSaving] = useState(false);

  async function playIntro() {
    try {
      setPlaying(true);
      const { audio } = await tts({ data: { text: INTRO } });
      const el = audioRef.current ?? new Audio();
      el.src = audio;
      audioRef.current = el;
      el.onended = () => setPlaying(false);
      await el.play();
    } catch (e) {
      console.error(e);
      toast.error("Couldn't play audio");
      setPlaying(false);
    }
  }

  function toggleCondition(c: string) {
    setConditions((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  }

  async function handleSubmit() {
    if (!name.trim()) {
      toast.error("Please tell me your name");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from("users").insert({
        name: name.trim(),
        age: age ? parseInt(age, 10) : null,
        conditions_suspected: conditions,
        fertility_intent: fertility,
        cycle_start_dates: cycleDate ? [cycleDate] : [],
      });
      if (error) throw error;
      toast.success("Welcome to Prevya");
      navigate({ to: "/home" });
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? "Couldn't save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FAF8F5", color: "#2D2A26" }}>
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <span className="text-xl">🌿</span>
          <span className="font-display text-xl font-semibold">Prevya</span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 pb-24">
        <div className="text-[11px] font-medium uppercase tracking-[0.22em]" style={{ color: "#C4614A" }}>
          A new kind of advocate
        </div>
        <h1 className="mt-3 font-display text-5xl font-semibold leading-tight">Hi. I'm Prevya.</h1>
        <p className="mt-4 max-w-lg text-base leading-relaxed text-foreground/70">
          Tell me a little about you. The more I know, the harder I can fight for the answers you deserve.
        </p>

        <button
          onClick={playIntro}
          disabled={playing}
          className="mt-6 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition hover:bg-foreground/5"
          style={{ borderColor: "#C4614A33", color: "#C4614A" }}
        >
          {playing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 fill-current" />}
          Hear Prevya introduce herself
        </button>

        <div className="mt-10 space-y-6 rounded-2xl border border-foreground/10 bg-white/60 p-6 shadow-sm">
          <div>
            <label className="block text-sm font-medium">Your name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Sarah"
              className="mt-1.5 w-full rounded-lg border border-foreground/15 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#C4614A]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Age</label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="32"
              className="mt-1.5 w-full rounded-lg border border-foreground/15 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#C4614A]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Conditions you suspect or have</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {CONDITIONS.map((c) => {
                const on = conditions.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleCondition(c)}
                    className="rounded-full border px-3 py-1.5 text-xs font-medium transition"
                    style={{
                      borderColor: on ? "#C4614A" : "#2D2A2620",
                      backgroundColor: on ? "#C4614A" : "transparent",
                      color: on ? "#FAF8F5" : "#2D2A26",
                    }}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>

          <label className="flex items-center justify-between rounded-lg border border-foreground/10 px-4 py-3">
            <span className="text-sm font-medium">Trying to conceive / fertility focus</span>
            <input
              type="checkbox"
              checked={fertility}
              onChange={(e) => setFertility(e.target.checked)}
              className="h-4 w-4 accent-[#C4614A]"
            />
          </label>

          <div>
            <label className="block text-sm font-medium">Last cycle start date</label>
            <input
              type="date"
              value={cycleDate}
              onChange={(e) => setCycleDate(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-foreground/15 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#C4614A]"
            />
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              className="rounded-lg border border-foreground/15 px-4 py-2.5 text-sm font-medium hover:bg-foreground/5"
            >
              Connect Gmail
            </button>
            <button
              type="button"
              onClick={() => navigate({ to: "/upload" })}
              className="rounded-lg border border-foreground/15 px-4 py-2.5 text-sm font-medium hover:bg-foreground/5"
            >
              Upload medical records
            </button>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="mt-8 w-full rounded-full px-6 py-4 text-base font-medium text-white shadow-sm transition hover:opacity-90 disabled:opacity-60"
          style={{ backgroundColor: "#C4614A" }}
        >
          {saving ? "Saving..." : "Let's begin"}
        </button>
      </main>
    </div>
  );
}
