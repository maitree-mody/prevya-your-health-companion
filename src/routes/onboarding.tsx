import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Play, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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

function OnboardingPage() {
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState(false);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [conditions, setConditions] = useState<string[]>([]);
  const [fertility, setFertility] = useState(false);
  const [cycleDate, setCycleDate] = useState("");
  const [saving, setSaving] = useState(false);

  const speakIntro = async () => {
    try {
      setIsPlaying(true);
      const response = await fetch(
        "https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM",
        {
          method: "POST",
          headers: {
            "xi-api-key": import.meta.env.VITE_ELEVENLABS_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: "Hi, I'm Prevya. I'm going to read everything you've ever been given by a doctor, listen to you every day, and work to get you the answers you deserve. You've been dismissed too many times. That stops now. Let's start.",
            model_id: "eleven_monolingual_v1",
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
            },
          }),
        },
      );
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.play();
      audio.onended = () => setIsPlaying(false);
    } catch (e) {
      console.error("TTS error", e);
      setIsPlaying(false);
    }
  };

  function toggleCondition(c: string) {
    setConditions((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  }

  async function handleSubmit() {
    setSaving(true);
    try {
      await supabase.from("users").insert({
        name: name.trim() || "Sarah",
        age: age ? parseInt(age, 10) : null,
        conditions_suspected: conditions,
        fertility_intent: fertility,
        cycle_start_dates: cycleDate ? [cycleDate] : [],
      });
    } catch (e) {
      console.error("Onboarding save error:", e);
    } finally {
      setSaving(false);
      navigate({ to: "/home" });
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
          onClick={speakIntro}
          disabled={isPlaying}
          className="mt-6 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition hover:bg-foreground/5"
          style={{ borderColor: "#C4614A33", color: "#C4614A" }}
        >
          {isPlaying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 fill-current" />}
          {isPlaying ? "Playing..." : "Hear Prevya introduce herself"}
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
