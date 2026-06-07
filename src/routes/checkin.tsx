import { createFileRoute } from "@tanstack/react-router";
import { ConversationProvider, useConversation } from "@elevenlabs/react";
import { Component, useCallback, useEffect, useState, type ErrorInfo, type ReactNode } from "react";
import { Mic, MicOff, CheckCircle2 } from "lucide-react";
import { PrevyaShell } from "@/components/PrevyaShell";
import { SectionHeader } from "@/components/SectionHeader";
import { supabase } from "@/integrations/supabase/client";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "elevenlabs-convai": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & { "agent-id": string },
        HTMLElement
      >;
    }
  }
}

const PREVYA_AGENT_ID = "agent_5901kth9g167f7grv0ndphzkz8ss";

export const Route = createFileRoute("/checkin")({
  head: () => ({
    meta: [
      { title: "Daily check-in · Prevya" },
      { name: "description", content: "Talk to Prevya. She listens, finds patterns, and updates your picture." },
    ],
  }),
  component: CheckinPage,
});

type Emotion = "calm" | "fatigue" | "pain" | "distress" | "relief";

const emotionConfig: Record<Emotion, { color: string; glow: string; duration: string; scale: string; label: string }> = {
  calm:     { color: "#A8C5DA", glow: "#A8C5DA", duration: "3s",   scale: "1",    label: "calm" },
  fatigue:  { color: "#C4B5D4", glow: "#C4B5D4", duration: "4s",   scale: "0.92", label: "fatigued" },
  pain:     { color: "#E8A87C", glow: "#E8A87C", duration: "1.5s", scale: "0.85", label: "in pain" },
  distress: { color: "#D4788A", glow: "#D4788A", duration: "1.1s", scale: "0.78", label: "distressed" },
  relief:   { color: "#A8C5A0", glow: "#A8C5A0", duration: "3s",   scale: "1.1",  label: "relieved" },
};

const PAIN_KEYWORDS = ["pain", "hurt", "ache", "sore", "cramp", "burning", "stabbing"];
const FATIGUE_KEYWORDS = ["tired", "exhausted", "fatigue", "drained", "sleepy", "weak"];
const DISTRESS_KEYWORDS = ["scared", "anxious", "overwhelmed", "panic", "worried", "afraid", "stressed"];
const RELIEF_KEYWORDS = ["better", "relief", "easier", "calm", "okay", "good"];

function detectEmotion(text: string): Emotion {
  const t = text.toLowerCase();
  if (DISTRESS_KEYWORDS.some(w => t.includes(w))) return "distress";
  if (PAIN_KEYWORDS.some(w => t.includes(w))) return "pain";
  if (FATIGUE_KEYWORDS.some(w => t.includes(w))) return "fatigue";
  if (RELIEF_KEYWORDS.some(w => t.includes(w))) return "relief";
  return "calm";
}

function extractSymptoms(text: string): string[] {
  const symptoms = ["headache", "cramps", "bloating", "fatigue", "nausea", "joint pain", "rash", "fever", "dizziness", "insomnia", "back pain", "pelvic pain"];
  const t = text.toLowerCase();
  return symptoms.filter(s => t.includes(s));
}

function estimatePain(text: string): number {
  const match = text.match(/(\d{1,3})\s*(?:\/\s*10|out of 10)/i);
  if (match) return Math.min(100, parseInt(match[1]) * 10);
  const t = text.toLowerCase();
  if (DISTRESS_KEYWORDS.some(w => t.includes(w))) return 78;
  if (PAIN_KEYWORDS.some(w => t.includes(w))) return 62;
  if (FATIGUE_KEYWORDS.some(w => t.includes(w))) return 45;
  return 22;
}

type Summary = {
  emotion: Emotion;
  symptoms: string[];
  painScore: number;
  transcript: string;
};

class CheckinErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[Prevya checkin] render crashed", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <VoiceFallback message="Voice not available — check your connection" />;
    }

    return this.props.children;
  }
}

function VoiceFallback({ message }: { message: string }) {
  return (
    <PrevyaShell>
      <SectionHeader
        eyebrow="Daily check-in"
        title="Take a breath. I'm here."
        description="Voice check-in is temporarily unavailable."
      />
      <div className="surface px-6 py-16 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-secondary/50 text-secondary-foreground">
          <MicOff className="h-8 w-8" />
        </div>
        <p className="mt-6 font-display text-xl font-semibold text-foreground">{message}</p>
        <p className="mt-2 text-sm text-muted-foreground">Please refresh and try again in a moment.</p>
      </div>
    </PrevyaShell>
  );
}

function CheckinPage() {
  console.log("[Prevya checkin] rendering route shell");
  const voicePackageAvailable = typeof ConversationProvider === "function" && typeof useConversation === "function";

  if (!voicePackageAvailable) {
    console.error("[Prevya checkin] @elevenlabs/react package is not available");
    return <VoiceFallback message="Voice not available — check your connection" />;
  }

  try {
    console.log("[Prevya checkin] ElevenLabs package available; mounting provider");
    return (
      <CheckinErrorBoundary>
        <ConversationProvider agentId={PREVYA_AGENT_ID}>
          <CheckinExperience />
        </ConversationProvider>
      </CheckinErrorBoundary>
    );
  } catch (error) {
    console.error("[Prevya checkin] failed before render", error);
    return <VoiceFallback message="Voice not available — check your connection" />;
  }
}

function CheckinExperience() {
  const [emotion, setEmotion] = useState<Emotion>("calm");
  const [transcriptLog, setTranscriptLog] = useState<string[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://unpkg.com/@elevenlabs/convai-widget-embed";
    script.async = true;
    script.type = "text/javascript";
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const conversation = useConversation({
    onMessage: (msg: any) => {
      console.log("[Prevya checkin] ElevenLabs message", msg);
      const text: string | undefined = msg?.message || msg?.text || msg?.user_transcription_event?.user_transcript;
      if (!text) return;
      setTranscriptLog(prev => [...prev, text]);
      setEmotion(detectEmotion(text));
    },
    onConnect: (event: any) => console.log("[Prevya checkin] ElevenLabs connected", event),
    onDisconnect: () => console.log("[Prevya checkin] ElevenLabs disconnected"),
    onError: (e: any) => console.error("[Prevya checkin] ElevenLabs error", e),
    onStatusChange: (status: any) => console.log("[Prevya checkin] ElevenLabs status", status),
  });

  const status = conversation.status;
  const isActive = status === "connected";
  const isConnecting = status === "connecting";

  const start = useCallback(async () => {
    console.log("[Prevya checkin] mic tapped; starting session");
    setSummary(null);
    setTranscriptLog([]);
    setTokenError(null);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      await conversation.startSession({
        agentId: PREVYA_AGENT_ID,
      } as any);
      console.log("[Prevya checkin] startSession call completed");
    } catch (e: any) {
      console.error("[Prevya checkin] startSession failed", e);
      setTokenError(e?.message ?? "Could not start the voice session.");
    }
  }, [conversation]);


  const stop = useCallback(async () => {
    console.log("[Prevya checkin] ending session");
    await conversation.endSession();
    const transcript = transcriptLog.join(" ");
    console.log("[Prevya checkin] transcript collected", transcript);
    const detected = transcript ? detectEmotion(transcript) : emotion;
    const symptoms = extractSymptoms(transcript);
    const painScore = estimatePain(transcript);
    const distressScore = detected === "distress" ? 80 : detected === "pain" ? 55 : 25;
    const fatigueScore = detected === "fatigue" ? 75 : 30;

    const result: Summary = { emotion: detected, symptoms, painScore, transcript };
    setSummary(result);
    setEmotion(detected);

    try {
      console.log("[Prevya checkin] saving checkin", result);
      await supabase.from("checkins").insert({
        transcript,
        symptoms_extracted: symptoms,
        pain_score: painScore,
        distress_score: distressScore,
        fatigue_score: fatigueScore,
        dominant_emotion: detected,
        emotion_timeline: transcriptLog.map((t, i) => ({ i, emotion: detectEmotion(t) })),
      });
      await supabase.from("timeline_events").insert({
        event_type: "voice_checkin",
        source: "prevya",
        content: `Daily check-in: ${detected}. ${symptoms.length ? "Mentioned: " + symptoms.join(", ") + "." : ""}`,
        clinical_flag: detected === "distress" || painScore > 70,
      });
      console.log("[Prevya checkin] saved checkin and timeline event");
    } catch (e) {
      console.error("[Prevya checkin] save failed", e);
    }
  }, [conversation, transcriptLog, emotion]);

  const cfg = emotionConfig[emotion];
  const showPrompt = !isActive && !summary && !isConnecting;

  const statusLabel = isConnecting
    ? "Connecting to Prevya..."
    : isActive
      ? "Prevya is listening"
      : summary
        ? "Session complete"
        : "Tap to talk to Prevya";

  return (
    <PrevyaShell>
      <SectionHeader
        eyebrow="Daily check-in"
        title="Take a breath. I'm here."
        description="Tap the mic and just talk. I'll listen for symptoms, patterns, and how you're feeling."
      />


      <div className="surface relative flex flex-col items-center justify-center overflow-hidden px-6 py-16">
        {/* Blob */}
        <div className="relative flex h-[360px] w-[360px] items-center justify-center">
          <div
            className="blob-shape absolute inset-0 transition-all duration-[800ms] ease-in-out"
            style={{
              background: `radial-gradient(circle at 35% 35%, ${cfg.color}, ${cfg.color}cc 60%, ${cfg.color}55)`,
              transform: `scale(${cfg.scale})`,
              animation: `blobPulse ${cfg.duration} ease-in-out infinite`,
              filter: `drop-shadow(0 20px 60px ${cfg.glow}66)`,
            }}
          />
          <div
            className="blob-shape absolute inset-6 opacity-60 transition-all duration-[800ms] ease-in-out"
            style={{
              background: `radial-gradient(circle at 65% 65%, ${cfg.color}aa, transparent 70%)`,
              animation: `blobPulse ${cfg.duration} ease-in-out infinite reverse`,
            }}
          />
        </div>

        {/* Emotion label */}
        <div className="mt-6 text-center transition-opacity duration-500">
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            {statusLabel}
          </div>
          <div className="mt-1 font-display text-2xl font-semibold tracking-tight text-foreground">
            {cfg.label}
          </div>
          {showPrompt && (
            <div className="mt-3 text-sm text-muted-foreground animate-fade-in">
              How are you feeling today?
            </div>
          )}
        </div>

        {/* Mic button */}
        <button
          onClick={isActive ? stop : start}
          className={[
            "mt-10 flex h-20 w-20 items-center justify-center rounded-full shadow-lg transition-all",
            isActive
              ? "bg-accent text-accent-foreground scale-110"
              : "bg-primary text-primary-foreground hover:scale-105",
          ].join(" ")}
          aria-label={isActive ? "End session" : "Start session"}
        >
          {isActive ? <MicOff className="h-7 w-7" /> : <Mic className="h-7 w-7" />}
        </button>

        {isActive && (
          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground animate-fade-in">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
            </span>
            Prevya is listening · tap to end
          </div>
        )}

        {tokenError && !isActive && (
          <div className="mt-4 max-w-sm rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-center text-xs text-destructive animate-fade-in">
            {tokenError}
          </div>
        )}
      </div>

      {/* Official ElevenLabs widget */}
      <div className="mt-6 flex justify-center">
        <elevenlabs-convai agent-id={PREVYA_AGENT_ID} />
      </div>



      {/* Summary card */}
      {summary && (
        <div className="surface mt-6 animate-fade-in p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Thank you — I've updated your picture
              </div>
              <div className="mt-1 font-display text-xl font-semibold tracking-tight">
                You sounded mostly {emotionConfig[summary.emotion].label} today.
              </div>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-success/30 px-3 py-1 text-xs font-medium text-success-foreground">
              <CheckCircle2 className="h-3.5 w-3.5" /> Added to your timeline
            </div>
          </div>

          {summary.symptoms.length > 0 && (
            <div className="mt-5">
              <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Symptoms mentioned
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {summary.symptoms.map(s => (
                  <span key={s} className="rounded-full bg-secondary/40 px-3 py-1 text-xs font-medium text-foreground">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-5">
            <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Pain score
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-display text-3xl font-semibold">{summary.painScore}</span>
              <span className="text-sm text-muted-foreground">/ 100</span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-accent to-warning transition-all duration-700"
                style={{ width: `${summary.painScore}%` }}
              />
            </div>
          </div>
        </div>
      )}

      <style>{`
        .blob-shape {
          border-radius: 42% 58% 63% 37% / 45% 55% 45% 55%;
        }
        @keyframes blobPulse {
          0%, 100% {
            border-radius: 42% 58% 63% 37% / 45% 55% 45% 55%;
          }
          50% {
            border-radius: 58% 42% 38% 62% / 55% 38% 62% 45%;
          }
        }
      `}</style>
    </PrevyaShell>
  );
}
