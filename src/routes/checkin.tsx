import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
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

const BLOB_COLOR = "#A8C5DA";

function CheckinPage() {
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://unpkg.com/@elevenlabs/convai-widget-embed'
    script.async = true
    document.body.appendChild(script)
    return () => document.body.removeChild(script)
  }, [])

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
            className="blob-shape absolute inset-0"
            style={{
              background: `radial-gradient(circle at 35% 35%, ${BLOB_COLOR}, ${BLOB_COLOR}cc 60%, ${BLOB_COLOR}55)`,
              animation: `blobPulse 3s ease-in-out infinite`,
              filter: `drop-shadow(0 20px 60px ${BLOB_COLOR}66)`,
            }}
          />
          <div
            className="blob-shape absolute inset-6 opacity-60"
            style={{
              background: `radial-gradient(circle at 65% 65%, ${BLOB_COLOR}aa, transparent 70%)`,
              animation: `blobPulse 3s ease-in-out infinite reverse`,
            }}
          />
        </div>

        {/* ElevenLabs widget */}
        <div
          className="mt-8"
          dangerouslySetInnerHTML={{
            __html: '<elevenlabs-convai agent-id="agent_5901kth9g167f7grv0ndphzkz8ss"></elevenlabs-convai>'
          }}
        />

        <p className="mt-6 text-sm text-muted-foreground">
          Tap the widget above to start talking to Prevya
        </p>
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
