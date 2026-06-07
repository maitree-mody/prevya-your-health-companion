import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Mic, Activity, Heart, Zap } from "lucide-react";
import { PrevyaShell } from "@/components/PrevyaShell";
import { SectionHeader } from "@/components/SectionHeader";

export const Route = createFileRoute("/checkin")({
  head: () => ({
    meta: [
      { title: "Daily check-in · Prevya" },
      { name: "description", content: "Talk to Prevya. She listens, finds patterns, and updates your picture." },
    ],
  }),
  component: CheckinPage,
});

const BLOB_COLOR = "#D4788A";

function CheckinPage() {
  const [pulse, setPulse] = useState(false);
  const [widgetReady, setWidgetReady] = useState(false);
  const widgetElRef = useRef<HTMLElement | null>(null);

  // Recursively search shadow DOMs for the first clickable button
  function findWidgetButton(root: Element | null): HTMLElement | null {
    if (!root) return null;
    const queue: (Element | ShadowRoot)[] = [root];
    while (queue.length) {
      const node = queue.shift()!;
      const btn = (node as Element).querySelector?.('button');
      if (btn) return btn as HTMLElement;
      const all = (node as Element).querySelectorAll?.('*') ?? [];
      all.forEach((el) => {
        const sr = (el as HTMLElement).shadowRoot;
        if (sr) queue.push(sr);
      });
    }
    return null;
  }

  useEffect(() => {
    // Mount the floating widget at body level (its config places it bottom-right).
    // We'll trigger it from our own blob, so visually we keep it but pinned subtly.
    const widget = document.createElement('elevenlabs-convai');
    widget.setAttribute('agent-id', 'agent_5901kth9g167f7grv0ndphzkz8ss');
    widget.setAttribute('dynamic-variables', JSON.stringify({ customer_name: 'Sarah' }));
    widget.setAttribute('override-first-message', 'How are you feeling today?');
    document.body.appendChild(widget);
    widgetElRef.current = widget;

    let script = document.getElementById('elevenlabs-convai-script') as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = 'elevenlabs-convai-script';
      script.src = 'https://unpkg.com/@elevenlabs/convai-widget-embed';
      script.async = true;
      document.body.appendChild(script);
    }

    // Poll for the widget's internal button so we can trigger it from the blob
    const start = Date.now();
    const interval = setInterval(() => {
      const btn = findWidgetButton(widget);
      if (btn) {
        setWidgetReady(true);
        clearInterval(interval);
      } else if (Date.now() - start > 15000) {
        clearInterval(interval);
      }
    }, 300);

    return () => {
      clearInterval(interval);
      if (document.body.contains(widget)) document.body.removeChild(widget);
    };
  }, []);

  // Animate blob gently on load
  useEffect(() => {
    const t = setTimeout(() => setPulse(true), 300)
    return () => clearTimeout(t)
  }, [])

  const handleBlobClick = () => {
    // IMPORTANT: must be a sync call from the user gesture for mic permission
    const btn = findWidgetButton(widgetElRef.current);
    if (btn) btn.click();
  };

  return (
    <PrevyaShell>
      <SectionHeader
        eyebrow="Daily check-in"
        title="Take a breath. I'm here."
        description="Tap the mic and just talk. Prevya listens for symptoms, patterns, and how you're really feeling."
      />

      <div className="surface relative flex flex-col items-center justify-center overflow-hidden px-6 py-16">

        {/* Live badge */}
        <div className="mb-8 flex items-center gap-2 rounded-full border border-foreground/10 bg-background px-4 py-1.5 text-xs font-medium text-foreground/60">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#D4788A] opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#D4788A]" />
          </span>
          Powered by ElevenLabs · Voice AI
        </div>

        {/* Blob — clickable, triggers the ElevenLabs widget */}
        <button
          type="button"
          onClick={handleBlobClick}
          disabled={!widgetReady}
          aria-label="Start voice check-in with Prevya"
          className="relative flex h-[280px] w-[280px] items-center justify-center cursor-pointer disabled:cursor-wait group bg-transparent border-0 p-0"
        >
          <div
            className="blob-shape absolute inset-0 transition-all duration-700 group-hover:scale-105"
            style={{
              background: `radial-gradient(circle at 35% 35%, ${BLOB_COLOR}, ${BLOB_COLOR}cc 60%, ${BLOB_COLOR}44)`,
              animation: `blobPulse 3.5s ease-in-out infinite`,
              filter: `drop-shadow(0 20px 60px ${BLOB_COLOR}55)`,
              opacity: pulse ? 1 : 0,
            }}
          />
          <div
            className="blob-shape absolute inset-8 opacity-50"
            style={{
              background: `radial-gradient(circle at 65% 65%, ${BLOB_COLOR}99, transparent 70%)`,
              animation: `blobPulse 3.5s ease-in-out infinite reverse`,
            }}
          />
          {/* Mic icon in center */}
          <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition-transform group-hover:scale-110 group-active:scale-95">
            <Mic className="h-9 w-9 text-white drop-shadow" />
          </div>
        </button>

        {/* Label */}
        <div className="mt-6 text-center">
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            {widgetReady ? 'Prevya is ready' : 'Connecting…'}
          </div>
          <div className="mt-1 font-display text-2xl font-semibold tracking-tight">How are you feeling today?</div>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          Tap the mic to start · your voice stays private
        </p>
      </div>

      {/* What Prevya listens for */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="surface p-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#D4788A]/15">
            <Activity className="h-4 w-4 text-[#D4788A]" />
          </div>
          <div className="mt-3 text-sm font-semibold">Symptom patterns</div>
          <div className="mt-1 text-xs text-muted-foreground">
            Pain, fatigue, bloating, brain fog — Prevya maps what you describe to your medical history.
          </div>
        </div>
        <div className="surface p-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#A8C5DA]/20">
            <Heart className="h-4 w-4 text-[#6B8AA8]" />
          </div>
          <div className="mt-3 text-sm font-semibold">Emotional tone</div>
          <div className="mt-1 text-xs text-muted-foreground">
            Distress, relief, exhaustion — she tracks how you're feeling over time, not just today.
          </div>
        </div>
        <div className="surface p-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#6B8A5C]/15">
            <Zap className="h-4 w-4 text-[#6B8A5C]" />
          </div>
          <div className="mt-3 text-sm font-semibold">Flare prediction</div>
          <div className="mt-1 text-xs text-muted-foreground">
            Daily check-ins let Prevya spot a flare 2–3 days before it peaks.
          </div>
        </div>
      </div>

      <style>{`
        .blob-shape {
          border-radius: 42% 58% 63% 37% / 45% 55% 45% 55%;
        }
        @keyframes blobPulse {
          0%, 100% { border-radius: 42% 58% 63% 37% / 45% 55% 45% 55%; }
          50%       { border-radius: 58% 42% 38% 62% / 55% 38% 62% 45%; }
        }
      `}</style>
    </PrevyaShell>
  );
}
