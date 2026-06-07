'use client';
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronLeft, Send } from "lucide-react";

export const Route = createFileRoute("/coach")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Aria · Prevya" },
      { name: "description", content: "Your personal appointment concierge — powered by Groq and ElevenLabs." },
    ],
  }),
  component: CoachPage,
});

// ─── Groq (dynamic import — never runs during SSR) ────────────────────────────

const ARIA_SYSTEM_PROMPT = `You are Aria, a warm personal medical concierge for women with autoimmune and reproductive health conditions.

You know this patient:
- Joint pain (both hands, worse in morning)
- Fatigue and brain fog
- 2 unexplained pregnancy losses
- ANA positive in 2022 — never followed up
- TSH trending upward across 3 tests
- Suspects APS or lupus

You help with:
- Pre-appointment prep: what to say, what to ask, what to bring, how to not get dismissed
- Post-appointment debrief: what happened, what it means, what to do next
- Emotional support: validating her experience

Rules:
- Always warm, specific to HER history
- Never generic
- Never diagnose — always "patterns consistent with"
- Always advocate
- Keep responses under 150 words
- Ask one follow-up question at the end`;

type Message = { role: "user" | "assistant"; content: string };

async function sendToAria(userMessage: string, history: Message[]): Promise<string> {
  const { default: Groq } = await import("groq-sdk");
  const groq = new Groq({
    apiKey: import.meta.env.VITE_GROQ_API_KEY,
    dangerouslyAllowBrowser: true,
  });
  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: ARIA_SYSTEM_PROMPT },
      ...history,
      { role: "user", content: userMessage },
    ],
    max_tokens: 300,
  });
  return completion.choices[0].message.content ?? "";
}

// ─── Dismissal cards data ─────────────────────────────────────────────────────

const DISMISSALS = [
  {
    doctorSays: "Your blood tests look normal",
    youSay: `I understand the values are within standard range — but my TSH has changed by 40% across three tests and my ANA came back positive in 2022. I'd like to understand what's driving that change.`,
  },
  {
    doctorSays: "These symptoms could just be stress",
    youSay: `I've tracked these symptoms daily for 3 months and they follow a consistent pattern tied to my cycle. I'd like to rule out an autoimmune cause.`,
  },
  {
    doctorSays: "Let's wait and see",
    youSay: `I've been waiting for years. Can we run an ANA panel, anti-dsDNA, and antiphospholipid antibodies today?`,
  },
  {
    doctorSays: "I don't think a referral is necessary yet",
    youSay: `I have a clinical summary showing patterns across 6 years of records no single doctor has seen together. I'd really appreciate a rheumatology opinion.`,
  },
  {
    doctorSays: "A lot of women feel this way",
    youSay: `I understand — and I want to make sure we're not missing something. I've brought documentation of my symptoms over time. Can we go through it together?`,
  },
];

// ─── Dismissal accordion item ─────────────────────────────────────────────────

function DismissalCard({ doctorSays, youSay }: { doctorSays: string; youSay: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="rounded-xl border-l-4 border-[#D4788A] bg-white/70 cursor-pointer select-none overflow-hidden transition-all"
      onClick={() => setOpen((o) => !o)}
    >
      <div className="flex items-center justify-between px-4 py-3.5 gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.14em] text-[#888] mb-0.5">Doctor says</div>
          <div className="text-sm font-medium text-foreground">"{doctorSays}"</div>
        </div>
        <ChevronDown
          className="h-4 w-4 shrink-0 text-muted-foreground transition-transform"
          style={{ transform: open ? "rotate(180deg)" : "none" }}
        />
      </div>
      {open && (
        <div className="px-4 pb-4">
          <div className="text-[10px] uppercase tracking-[0.14em] text-[#D4788A] mb-1.5">You say</div>
          <div className="text-sm leading-relaxed text-foreground/85">"{youSay}"</div>
        </div>
      )}
    </div>
  );
}

// ─── Left panel ───────────────────────────────────────────────────────────────

function LeftPanel() {
  return (
    <div className="space-y-5">
      <div className="text-sm font-medium text-[#1B2A4A] mb-1">Based on your symptoms and history</div>

      {/* Context pill */}
      <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 border border-amber-200 px-3 py-1.5 text-xs font-medium text-amber-800">
        Joint pain · Fatigue · 2 pregnancy losses · ANA positive 2022
      </div>

      {/* Card 1 — Recommended specialist */}
      <div className="rounded-2xl border border-foreground/10 bg-white/60 p-5 shadow-sm">
        <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-3">Who to see first</div>
        <div className="font-semibold text-base mb-3">Recommended specialist</div>
        <div className="flex items-start gap-3 rounded-xl bg-red-50 border border-red-100 p-4">
          <span className="text-lg mt-0.5">🔴</span>
          <div>
            <div className="text-sm font-semibold text-red-700 mb-1">Rheumatologist — urgent</div>
            <div className="text-sm text-foreground/75 leading-relaxed">
              Based on your ANA positive result, joint pain pattern, and 2 unexplained pregnancy losses, a rheumatologist should be your first appointment. APS and lupus both require rheumatology evaluation.
            </div>
          </div>
        </div>
      </div>

      {/* Card 2 — Questions to ask */}
      <div className="rounded-2xl border border-foreground/10 bg-white/60 p-5 shadow-sm">
        <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-3">What to ask</div>
        <div className="font-semibold text-base mb-3">Ask these exact questions</div>
        <ol className="space-y-3">
          {[
            { q: `"My ANA came back positive in 2022 — why was this never followed up?"`, badge: false },
            { q: `"I've had 2 unexplained pregnancy losses — have I been tested for antiphospholipid syndrome?"`, badge: false },
            { q: `"My joint pain is worse in the morning — can we discuss whether this fits an inflammatory pattern?"`, badge: false },
            { q: `"I'd like a full autoimmune panel today — can we arrange that?"`, badge: false },
            { q: `"If you're not concerned, can you explain what would need to change for a referral?"`, badge: false },
            { q: `"What are the recent advances in screening for endometriosis? Are any of these options available to me?"`, badge: true, note: "Based on latest research Prevya found for you" },
            { q: `"I've read that a UTI vaccine is available in some countries — am I eligible for it, and can we discuss whether it's appropriate for my history?"`, badge: true, note: "Based on latest research Prevya found for you" },
          ].map((item, i) => (
            <li key={i}>
              <div className={`rounded-xl px-4 py-3 text-sm leading-relaxed ${item.badge ? "bg-[#EEE8FF] border border-[#D5C8F5]" : "bg-foreground/4"}`}>
                <div className="flex items-start gap-2">
                  <span className="text-muted-foreground font-medium shrink-0 mt-0.5">{i + 1}.</span>
                  <span>{item.q}</span>
                </div>
                {item.badge && (
                  <div className="mt-2 ml-5">
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#D5C8F5] px-2 py-0.5 text-[10px] font-medium text-[#5B3FA6]">
                      🔬 Research-backed
                    </span>
                    <div className="mt-1 text-[11px] text-[#7B6BA8]">{item.note}</div>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* Card 3 — Dismissal scripts */}
      <div className="rounded-2xl border border-foreground/10 bg-white/60 p-5 shadow-sm">
        <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-1">If they push back</div>
        <div className="font-semibold text-base mb-1">If your doctor dismisses you</div>
        <div className="text-xs text-muted-foreground mb-4">
          The average woman waits 7 years for an autoimmune diagnosis. Prevya is here to close that gap.
        </div>
        <div className="space-y-2.5">
          {DISMISSALS.map((d) => (
            <DismissalCard key={d.doctorSays} {...d} />
          ))}
        </div>
      </div>

      {/* Remember card */}
      <div className="rounded-2xl bg-[#1B2A4A] p-6 text-white">
        <div className="text-lg font-semibold leading-snug mb-2">
          You are not a difficult patient.<br />You are an informed one.
        </div>
        <div className="text-sm text-white/70 leading-relaxed">
          You have every right to ask for the tests that could change your life.
        </div>
      </div>
    </div>
  );
}

// ─── Right panel — Aria chat ──────────────────────────────────────────────────

const INITIAL_MESSAGE: Message = {
  role: "assistant",
  content: "Hi, I'm Aria — your personal appointment concierge. I know your history and I'm here to help. Are you getting ready for an upcoming appointment, or did you just come back from one?",
};

function AriaChat() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  async function send() {
    const text = input.trim();
    if (!text || thinking) return;
    setInput("");
    const userMsg: Message = { role: "user", content: text };
    setMessages((m) => [...m, userMsg]);
    setThinking(true);
    try {
      const reply = await sendToAria(text, [...messages, userMsg]);
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "I'm having trouble connecting right now — please try again in a moment." }]);
    } finally {
      setThinking(false);
    }
  }

  return (
    <div
      className="flex flex-col rounded-2xl border border-foreground/10 bg-white/60 shadow-sm overflow-hidden"
      style={{ height: "calc(100vh - 220px)", minHeight: 520 }}
    >
      {/* Chat header */}
      <div className="flex items-center gap-3 border-b border-foreground/8 px-5 py-4 shrink-0">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#C4614A] text-white text-sm font-bold">A</div>
        <div>
          <div className="font-semibold text-sm">Aria</div>
          <div className="text-xs text-muted-foreground">Personal concierge · knows your history</div>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
          </span>
          <span className="text-[11px] text-muted-foreground">Online</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex items-end gap-2.5 ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
            {m.role === "assistant" && (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#C4614A] text-white text-xs font-bold">A</div>
            )}
            <div
              className="max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed"
              style={
                m.role === "assistant"
                  ? { backgroundColor: "#FDF6F0", color: "#2D2A26" }
                  : { backgroundColor: "#1B2A4A", color: "#fff" }
              }
            >
              {m.content}
            </div>
          </div>
        ))}
        {thinking && (
          <div className="flex items-end gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#C4614A] text-white text-xs font-bold">A</div>
            <div className="rounded-2xl bg-[#FDF6F0] px-4 py-3 text-sm text-muted-foreground flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#C4614A] animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#C4614A] animate-bounce" style={{ animationDelay: "120ms" }} />
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#C4614A] animate-bounce" style={{ animationDelay: "240ms" }} />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-foreground/8 px-4 py-3 flex items-center gap-3">
        <input
          className="flex-1 rounded-full border border-foreground/15 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#C4614A] transition"
          placeholder="Ask Aria anything about your appointment..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          disabled={thinking}
        />
        <button
          onClick={send}
          disabled={thinking || !input.trim()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#C4614A] text-white transition hover:opacity-90 disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ─── ElevenLabs voice widget ──────────────────────────────────────────────────

function VoiceWidget() {
  const widgetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const widget = document.createElement("elevenlabs-convai");
    widget.setAttribute("agent-id", "agent_5901kth9g167f7grv0ndphzkz8ss");
    widgetRef.current?.appendChild(widget);

    if (!document.getElementById("el-coach-script")) {
      const script = document.createElement("script");
      script.id = "el-coach-script";
      script.src = "https://unpkg.com/@elevenlabs/convai-widget-embed";
      script.async = true;
      script.type = "text/javascript";
      document.body.appendChild(script);
    }
    return () => {
      if (widgetRef.current) widgetRef.current.innerHTML = "";
    };
  }, []);

  return (
    <div className="mt-8 rounded-2xl bg-[#1B2A4A] px-6 py-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
      <div className="flex-1">
        <div className="text-lg font-semibold text-white mb-1">🎙 Prefer to talk?</div>
        <div className="text-sm text-white/65 leading-relaxed">
          Speak to Aria directly — she'll listen and respond in real time.
        </div>
      </div>
      <div ref={widgetRef} className="shrink-0" />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function CoachPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <div style={{ minHeight: "100vh", background: "#FAF8F5", padding: "40px 24px", fontFamily: "Inter, sans-serif" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Header */}
        <div className="mb-8">
          <Link to="/home" className="inline-flex items-center gap-1.5 text-sm text-[#888] hover:text-[#1B2A4A] transition mb-4">
            <ChevronLeft className="h-4 w-4" /> Back to main menu
          </Link>
          <div className="text-[11px] uppercase tracking-[0.18em] text-[#888] mb-2">Appointment concierge</div>
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <h1 className="font-display text-4xl font-semibold text-[#1B2A4A] leading-tight">Aria</h1>
              <p className="mt-1 text-base text-[#666]">Your personal appointment concierge</p>
            </div>
            <div className="mb-0.5 flex items-center gap-2 rounded-full border border-foreground/15 bg-white/60 px-3 py-1.5 text-[11px] text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-green-400 inline-block" />
              Powered by Groq · Voice by ElevenLabs
            </div>
          </div>
          <p className="mt-3 text-sm text-muted-foreground max-w-xl">
            Based on your symptoms and history, here's how to walk into your next appointment and not leave without answers.
          </p>
        </div>

        {/* Two-column layout */}
        <div className="grid gap-8 lg:grid-cols-2">
          <LeftPanel />
          <AriaChat />
        </div>

        {/* Voice widget full-width */}
        <VoiceWidget />
      </div>
    </div>
  );
}
