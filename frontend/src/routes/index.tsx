import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  Heart,
  Leaf,
  Lock,
  Mic,
  Sparkles,
  Watch,
} from "lucide-react";
import botanical from "@/assets/landing-botanical.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Prevya — Women's health, finally listened to" },
      {
        name: "description",
        content:
          "Prevya is your companion for endo, PCOS, ovarian cysts and pelvic pain. Aria, your voice concierge, coaches you through every doctor's visit.",
      },
      { property: "og:title", content: "Prevya — Women's health, finally listened to" },
      {
        property: "og:description",
        content:
          "A voice concierge and symptom companion for endo, PCOS, ovarian cysts and pelvic pain.",
      },
    ],
  }),
  component: Landing,
});

const serif = { fontFamily: '"Playfair Display", "Cormorant Garamond", Georgia, serif' };

const PALETTE = {
  bg: "#FAF8F5",
  ink: "#2A1F1A",
  inkSoft: "#5C4A3F",
  terracotta: "#C4614A",
  terracottaDark: "#A84E39",
  rose: "#E8C5BD",
  cream: "#F3EBE3",
  sage: "#A8B89A",
};

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium"
      style={{ borderColor: "#E5DACE", background: "#FFFFFFAA", color: PALETTE.inkSoft }}
    >
      <span
        className="inline-block h-2 w-2 rounded-full"
        style={{ background: PALETTE.terracotta }}
      />
      {children}
    </span>
  );
}

function PrimaryBtn({
  to,
  children,
  wide,
}: {
  to: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <Link
      to={to}
      className={[
        "inline-flex items-center justify-center rounded-full font-medium transition-all hover:opacity-95 hover:shadow-md",
        wide ? "px-9 py-4 text-base" : "px-6 py-3 text-sm",
      ].join(" ")}
      style={{
        background: PALETTE.terracotta,
        color: "#FFF8F3",
        boxShadow: "0 6px 18px -8px rgba(196,97,74,0.6)",
      }}
    >
      {children}
    </Link>
  );
}

function OutlineBtn({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-medium transition-all hover:bg-white"
      style={{ border: `1.5px solid ${PALETTE.terracotta}`, color: PALETTE.terracotta }}
    >
      {children}
    </Link>
  );
}

function FeatureCard({
  Icon,
  title,
  text,
}: {
  Icon: typeof Mic;
  title: string;
  text: string;
}) {
  return (
    <div
      className="flex flex-col gap-4 rounded-2xl p-7 transition-all hover:-translate-y-1 hover:shadow-lg"
      style={{ background: "#FFFFFF", border: "1px solid #EDE3D7" }}
    >
      <div
        className="flex h-12 w-12 items-center justify-center rounded-full"
        style={{ background: `${PALETTE.terracotta}1A`, color: PALETTE.terracotta }}
      >
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-lg font-semibold leading-snug" style={{ ...serif, color: PALETTE.ink }}>
        {title}
      </h3>
      <p className="text-sm leading-relaxed" style={{ color: PALETTE.inkSoft }}>
        {text}
      </p>
    </div>
  );
}

function Landing() {
  return (
    <div style={{ background: PALETTE.bg, color: PALETTE.ink }} className="min-h-screen">
      {/* NAVBAR */}
      <header className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-6">
        <Link to="/" className="flex items-center gap-2">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full"
            style={{ background: `${PALETTE.terracotta}1A` }}
          >
            <Leaf className="h-4 w-4" style={{ color: PALETTE.terracotta }} />
          </div>
          <span className="text-xl tracking-tight" style={{ ...serif, color: PALETTE.ink }}>
            Prevya
          </span>
        </Link>
        <nav className="flex items-center gap-5">
          <Link
            to="/auth"
            className="text-sm font-medium transition-opacity hover:opacity-70"
            style={{ color: PALETTE.ink }}
          >
            Sign in
          </Link>
          <PrimaryBtn to="/checkin">Get started</PrimaryBtn>
        </nav>
      </header>

      {/* HERO */}
      <section className="mx-auto grid max-w-[1200px] gap-12 px-6 pb-20 pt-10 lg:grid-cols-2 lg:gap-16 lg:pt-16">
        <div className="flex flex-col justify-center">
          <Pill>Women's health, finally listened to</Pill>
          <h1
            className="mt-7 text-[clamp(2.4rem,5vw,3.75rem)] font-medium leading-[1.05] tracking-tight"
            style={{ ...serif, color: PALETTE.ink }}
          >
            Your body doesn't
            <br />
            work in silos,
            <br />
            <em style={{ color: PALETTE.terracotta, fontStyle: "italic" }}>
              your care should not either.
            </em>
          </h1>
          <p
            className="mt-6 max-w-xl text-base leading-relaxed lg:text-lg"
            style={{ color: PALETTE.inkSoft }}
          >
            Prevya is your companion for endo, ovarian cysts, PCOS, and pelvic pain — with{" "}
            <span style={{ color: PALETTE.ink, fontWeight: 500 }}>Aria</span>, a voice concierge
            that coaches you through every doctor's visit so you walk out with answers, not shrugs.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <PrimaryBtn to="/checkin">Talk to Aria</PrimaryBtn>
            <OutlineBtn to="/upload">Track your symptoms</OutlineBtn>
          </div>
          <div
            className="mt-6 flex items-center gap-2 text-xs"
            style={{ color: PALETTE.inkSoft }}
          >
            <Lock className="h-3.5 w-3.5" />
            Your data stays yours. Encrypted and private.
          </div>
        </div>

        {/* Right image with floating chat */}
        <div className="relative">
          <div
            className="relative overflow-hidden rounded-[2rem]"
            style={{ background: PALETTE.cream, boxShadow: "0 30px 80px -40px rgba(42,31,26,0.3)" }}
          >
            <img
              src={botanical}
              alt="Soft botanical illustration in terracotta, sage and cream"
              width={1024}
              height={1024}
              className="h-full w-full object-cover"
            />
          </div>
          {/* floating chat bubble */}
          <div
            className="absolute -bottom-6 -left-4 max-w-[320px] rounded-2xl p-5 lg:-left-10"
            style={{
              background: "#FFFFFF",
              border: "1px solid #EDE3D7",
              boxShadow: "0 20px 50px -20px rgba(42,31,26,0.25)",
            }}
          >
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-2 w-2 animate-pulse rounded-full"
                style={{ background: PALETTE.terracotta }}
              />
              <span
                className="text-[11px] font-medium uppercase tracking-[0.14em]"
                style={{ color: PALETTE.terracotta }}
              >
                Aria · listening
              </span>
            </div>
            <p className="mt-3 text-sm italic leading-relaxed" style={{ color: PALETTE.ink }}>
              "My doctor said it's just stress. I've had pelvic pain for 3 years."
            </p>
            <div
              className="mt-3 rounded-xl p-3 text-xs leading-relaxed"
              style={{ background: PALETTE.cream, color: PALETTE.inkSoft }}
            >
              <span style={{ color: PALETTE.terracotta, fontWeight: 600 }}>→</span> Aria drafts{" "}
              <strong style={{ color: PALETTE.ink }}>8 questions</strong> including{" "}
              <em>"What's your differential? Why aren't we imaging?"</em>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="mx-auto max-w-[1200px] px-6 py-20">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <FeatureCard
            Icon={Mic}
            title="Aria voice concierge"
            text="Speak naturally. Aria listens, validates, and gives you scripts for when you feel dismissed."
          />
          <FeatureCard
            Icon={Activity}
            title="Symptom tracker"
            text="Log pain, mood, cycle in seconds. See patterns across months — not just one visit."
          />
          <FeatureCard
            Icon={Heart}
            title="Doctor visit prep"
            text="Aria turns your symptoms into hard-to-dismiss questions tailored to the specialist you're seeing."
          />
          <FeatureCard
            Icon={Leaf}
            title="Nutrition for your condition"
            text="Endo-friendly, PCOS-aware, UTI-preventive plans. Evidence-informed, no fad diets."
          />
        </div>
      </section>

      {/* APPLE WATCH BANNER */}
      <section className="mx-auto max-w-[1200px] px-6 py-12">
        <div
          className="overflow-hidden rounded-[2rem] p-10 lg:p-14"
          style={{
            background: `linear-gradient(120deg, ${PALETTE.cream} 0%, ${PALETTE.rose} 100%)`,
          }}
        >
          <div className="max-w-3xl">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-full"
              style={{ background: "#FFFFFFCC", color: PALETTE.terracotta }}
            >
              <Watch className="h-5 w-5" />
            </div>
            <h2
              className="mt-6 text-[clamp(1.9rem,4vw,2.75rem)] font-medium leading-[1.1] tracking-tight"
              style={{ ...serif, color: PALETTE.ink }}
            >
              Your Apple Watch already knows.
              <br />
              <em style={{ color: PALETTE.terracotta, fontStyle: "italic" }}>
                Aria connects the dots.
              </em>
            </h2>
            <p
              className="mt-5 max-w-2xl text-base leading-relaxed lg:text-lg"
              style={{ color: PALETTE.inkSoft }}
            >
              HRV dips, resting heart rate spikes, fragmented sleep — Aria correlates wearable
              signals with your cycle and symptoms so flares stop feeling random.
            </p>
          </div>
        </div>
      </section>

      {/* QUOTE */}
      <section className="mx-auto max-w-[900px] px-6 py-24 text-center">
        <Sparkles
          className="mx-auto h-6 w-6"
          style={{ color: PALETTE.terracotta }}
          strokeWidth={1.5}
        />
        <blockquote
          className="mt-6 text-[clamp(1.6rem,3.2vw,2.4rem)] font-normal leading-[1.25] tracking-tight"
          style={{ ...serif, color: PALETTE.ink }}
        >
          Endometriosis takes{" "}
          <span style={{ color: PALETTE.terracotta }}>[7–10 years]</span> to diagnose. Ovarian cysts
          get missed. Pelvic pain gets called back pain. And{" "}
          <span style={{ color: PALETTE.terracotta }}>20% of women</span> with endometriosis also
          have autoimmune disorders — making the right diagnosis even more urgent. Prevya exists so
          the next woman doesn't wait a decade for an answer.
        </blockquote>
        <div className="mt-12">
          <PrimaryBtn to="/checkin" wide>
            Start your first conversation
          </PrimaryBtn>
        </div>
      </section>

      {/* FOOTER */}
      <footer
        className="border-t py-8 text-center text-xs"
        style={{ borderColor: "#EDE3D7", color: PALETTE.inkSoft }}
      >
        © 2026 Prevya · Private medical care
      </footer>
    </div>
  );
}
