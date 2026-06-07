import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PrevyaShell } from "@/components/PrevyaShell";
import { SectionHeader } from "@/components/SectionHeader";
import { AlertTriangle, Check, Edit2, Leaf, Pill, Sparkles, X } from "lucide-react";

export const Route = createFileRoute("/nutrition")({
  head: () => ({
    meta: [
      { title: "Nutrition · Prevya" },
      { name: "description", content: "Personalised weekly meal plan based on your cycle, conditions, and labs." },
    ],
  }),
  component: Nutrition,
});

// ─── Types ────────────────────────────────────────────────────────────────────

type Profile = {
  age: string;
  height: string;
  weight: string;
  lastPeriodDate: string;
  conditions: string[];
  medications: string;
  dietaryRestrictions: string[];
  symptoms: string[];
  ferritin: string;
  vitaminD: string;
  b12: string;
  tsh: string;
};

const STORAGE_KEY = "prevya_nutrition_profile";

const EMPTY_PROFILE: Profile = {
  age: "", height: "", weight: "", lastPeriodDate: "",
  conditions: [], medications: "", dietaryRestrictions: [],
  symptoms: [], ferritin: "", vitaminD: "", b12: "", tsh: "",
};

// ─── Options ──────────────────────────────────────────────────────────────────

const CONDITION_OPTIONS = [
  "Endometriosis", "PCOS", "Hashimoto's", "Lupus",
  "Rheumatoid arthritis", "APS", "Adenomyosis",
  "MCAS", "Sjögren's", "IBD / Crohn's",
];

const DIETARY_OPTIONS = [
  "Gluten-free", "Dairy-free", "Vegan", "Vegetarian",
  "Low-histamine", "Low-FODMAP", "Nut-free", "Soy-free",
];

const SYMPTOM_OPTIONS = [
  "Fatigue", "Brain fog", "Bloating", "Joint pain",
  "Headaches", "Nausea", "Insomnia", "Cramps", "Anxiety", "Low mood",
];

// ─── Cycle logic ──────────────────────────────────────────────────────────────

function getCyclePhase(lastPeriodDate: string) {
  if (!lastPeriodDate) return { phase: "unknown", label: "cycle phase unknown", emoji: "🌙", day: 0 };
  const days = Math.floor((Date.now() - new Date(lastPeriodDate).getTime()) / 86_400_000);
  const day = (days % 28) + 1;
  if (day <= 5)  return { phase: "menstrual",   label: "menstrual phase",   emoji: "🔴", day };
  if (day <= 13) return { phase: "follicular",  label: "follicular phase",  emoji: "🌱", day };
  if (day <= 16) return { phase: "ovulation",   label: "ovulation",         emoji: "✨", day };
  return           { phase: "luteal",       label: "luteal phase",      emoji: "🌕", day };
}

// ─── Meal plan engine ─────────────────────────────────────────────────────────

const PHASE_PLANS: Record<string, Record<string, string[]>> = {
  menstrual: {
    Mon: ["Steel oats + berries + flaxseed", "Lentil soup + dark bread", "Bison chili + rice + greens"],
    Tue: ["Eggs + spinach on sourdough", "Chickpea salad + tahini", "Slow-cooked lamb + root veg"],
    Wed: ["Smoothie: spinach, banana, hemp", "Lentil dahl + kale", "Salmon + sweet potato + broccolini"],
    Thu: ["Greek yogurt + chia + molasses", "Turkey mince bowl + greens", "Cod + lentils + asparagus"],
    Fri: ["Steel oats + berries + flaxseed", "Tuna nicoise + boiled eggs", "Roast chicken + quinoa + greens"],
    Sat: ["Frittata + greens + seed mix", "Soba noodle bowl + edamame", "Steak + roast veg"],
    Sun: ["Eggs + avocado + pumpkin seeds", "Roast veg grain bowl", "Whole roast chicken + potatoes"],
  },
  follicular: {
    Mon: ["Greek yogurt + chia + walnuts", "Salmon poke bowl, brown rice", "Roast chicken + quinoa + greens"],
    Tue: ["Eggs + avocado on rye", "Turkey & avocado wrap", "Bison chili + cilantro lime rice"],
    Wed: ["Steel oats + berries + flaxseed", "Chickpea salad + tahini", "Cod + sweet potato + broccolini"],
    Thu: ["Smoothie: spinach, banana, hemp, protein", "Lentil dahl + kale", "Salmon + asparagus + farro"],
    Fri: ["Poached eggs + greens + rye toast", "Tuna nicoise", "Slow-cooked lamb + root veg"],
    Sat: ["Pancakes + blueberries + hemp seed", "Soba noodle bowl", "Grilled fish tacos + slaw"],
    Sun: ["Frittata + greens", "Roast veg grain bowl", "Whole roast chicken + potatoes"],
  },
  ovulation: {
    Mon: ["Smoothie bowl + granola", "Big salad + grilled salmon", "Stir-fry tofu or chicken + veggies"],
    Tue: ["Greek yogurt + berries + flaxseed", "Chickpea + roast veg wrap", "Salmon + quinoa + greens"],
    Wed: ["Eggs + avocado on sourdough", "Lentil soup + seeded bread", "Baked cod + roast veg"],
    Thu: ["Oats + banana + nut butter", "Tuna salad + leafy greens", "Chicken + sweet potato + broccoli"],
    Fri: ["Smoothie: spinach, mango, hemp", "Salmon poke bowl", "Roast chicken + brown rice + greens"],
    Sat: ["Brunch: eggs + greens + smoked salmon", "Soba noodle bowl + edamame", "Light fish + salad"],
    Sun: ["Frittata + greens", "Big grain bowl + tahini", "Whole roast chicken + roast veg"],
  },
  luteal: {
    Mon: ["Steel oats + berries + flaxseed", "Salmon poke bowl, brown rice", "Roast chicken + quinoa + greens"],
    Tue: ["Greek yogurt + chia + walnuts", "Lentil dahl + kale", "Cod + sweet potato + broccolini"],
    Wed: ["Eggs + avocado on rye", "Turkey & avocado wrap", "Bison chili + cilantro lime rice"],
    Thu: ["Smoothie: spinach, banana, hemp", "Chickpea salad + tahini", "Salmon + asparagus + farro"],
    Fri: ["Steel oats + berries + flaxseed", "Tuna nicoise", "Slow-cooked lamb + root veg"],
    Sat: ["Pancakes + blueberries", "Soba noodle bowl", "Pizza night (low-histamine base)"],
    Sun: ["Frittata + greens", "Roast veg grain bowl", "Whole roast chicken + potatoes"],
  },
};

const VEGAN_SWAPS: [string, string][] = [
  ["Salmon", "Tempeh"], ["salmon", "tempeh"], ["Roast chicken", "Roast tofu"],
  ["roast chicken", "roast tofu"], ["Whole roast chicken", "Roast cauliflower"],
  ["Chicken", "Chickpea"], ["chicken", "tofu"], ["Turkey", "Lentil"],
  ["turkey", "lentil"], ["Tuna", "Smoked tofu"], ["tuna", "smoked tofu"],
  ["Cod", "White bean"], ["cod", "white bean"], ["Bison", "Black bean"],
  ["Eggs", "Scrambled tofu"], ["eggs", "tofu"], ["Greek yogurt", "Coconut yogurt"],
  ["Steak", "Portobello"], ["lamb", "jackfruit"], ["Lamb", "Jackfruit"],
  ["smoked salmon", "smoked carrot"], ["Smoked salmon", "Smoked carrot"],
];

const GF_SWAPS: [string, string][] = [
  ["on rye", "on GF bread"], ["on sourdough", "on GF sourdough"],
  ["dark bread", "GF bread"], ["seeded bread", "GF seed crackers"],
  ["Soba noodle", "Rice noodle"], ["wrap", "GF wrap"],
  ["Pancakes", "GF pancakes"], ["farro", "quinoa"],
];

function applySwaps(meal: string, swaps: [string, string][]): string {
  let m = meal;
  for (const [from, to] of swaps) m = m.replaceAll(from, to);
  return m;
}

function personalizePlan(profile: Profile): Record<string, string[]> {
  const { phase } = getCyclePhase(profile.lastPeriodDate);
  const base = PHASE_PLANS[phase] ?? PHASE_PLANS.luteal;
  const isVegan = profile.dietaryRestrictions.includes("Vegan");
  const isVegetarian = profile.dietaryRestrictions.includes("Vegetarian");
  const isGF = profile.dietaryRestrictions.includes("Gluten-free");

  const result: Record<string, string[]> = {};
  for (const [day, meals] of Object.entries(base)) {
    result[day] = meals.map((meal) => {
      let m = meal;
      if (isVegan) m = applySwaps(m, VEGAN_SWAPS);
      else if (isVegetarian) m = applySwaps(m, VEGAN_SWAPS.filter(([f]) => !["Salmon","salmon","Tuna","tuna","Cod","cod","smoked salmon"].includes(f)));
      if (isGF) m = applySwaps(m, GF_SWAPS);
      return m;
    });
  }
  return result;
}

// ─── Personalization signals ──────────────────────────────────────────────────

function getPrioritise(profile: Profile): string[] {
  const items: string[] = [];
  const ferritin = parseFloat(profile.ferritin);
  if (!isNaN(ferritin) && ferritin < 50) items.push("Iron-rich foods at every meal (red meat, lentils, spinach)");
  else items.push("Iron-rich foods (red meat, lentils)");

  const { phase } = getCyclePhase(profile.lastPeriodDate);
  if (phase === "luteal") items.push("Magnesium-rich foods (dark chocolate, pumpkin seeds, leafy greens)");
  if (phase === "menstrual") items.push("Anti-inflammatory fats (salmon, olive oil, walnuts)");
  if (phase === "follicular") items.push("Phytoestrogen foods (flaxseed, soy, fermented foods)");

  items.push("Omega-3 fats (salmon, walnuts, chia)");
  items.push("Cruciferous vegetables (broccoli, kale, Brussels sprouts)");

  const vitD = parseFloat(profile.vitaminD);
  if (!isNaN(vitD) && vitD < 50) items.push("Vitamin D: eggs, fortified foods, oily fish");

  return items.slice(0, 5);
}

function getAvoid(profile: Profile): string[] {
  const items: string[] = [];
  const { phase } = getCyclePhase(profile.lastPeriodDate);
  if (phase === "luteal") items.push("Excess caffeine — worsens luteal phase anxiety and bloating");
  if (profile.conditions.includes("Endometriosis") || profile.conditions.includes("PCOS"))
    items.push("Ultra-processed foods and refined sugars");
  if (profile.dietaryRestrictions.includes("Low-histamine"))
    items.push("High-histamine foods: aged cheese, cured meats, fermented foods, wine");
  if (profile.conditions.includes("MCAS"))
    items.push("Histamine triggers: leftovers, alcohol, vinegar, processed meats");
  items.push("Ultra-processed seed oils");
  if (profile.conditions.includes("Hashimoto's") || profile.tsh)
    items.push("Raw cruciferous veg in excess — lightly steam instead");
  return items.slice(0, 4);
}

function getMedInteractions(profile: Profile): string[] {
  const meds = profile.medications.toLowerCase();
  const items: string[] = [];
  if (meds.includes("levothyroxine") || meds.includes("thyroxine"))
    items.push("Take iron 2–4h apart from levothyroxine — they compete for absorption");
  if (meds.includes("metformin"))
    items.push("Metformin depletes B12 — prioritise eggs, fish, dairy or supplement");
  if (meds.includes("warfarin"))
    items.push("Keep vitamin K consistent (leafy greens) — don't suddenly increase or decrease");
  if (meds.includes("grapefruit") || meds.includes("statins"))
    items.push("Avoid grapefruit — interacts with several medications");
  if (meds.includes("iron") || meds.includes("ferrous"))
    items.push("Take iron on an empty stomach or with vitamin C — avoid dairy/coffee within 1h");
  if (items.length === 0 && profile.medications.trim())
    items.push("No major food interactions detected — always double-check with your pharmacist");
  if (items.length === 0)
    items.push("Add your medications above to see interaction alerts");
  return items;
}

function getNutrientAlerts(profile: Profile): string[] {
  const alerts: string[] = [];
  const ferritin = parseFloat(profile.ferritin);
  if (!isNaN(ferritin) && ferritin < 50) alerts.push(`Ferritin ${ferritin} ng/mL — below optimal (50–150). Iron-rich foods prioritised this week.`);
  const vitD = parseFloat(profile.vitaminD);
  if (!isNaN(vitD) && vitD < 50) alerts.push(`Vitamin D ${vitD} nmol/L — low. Consider oily fish, eggs, and a D3 supplement.`);
  const b12 = parseFloat(profile.b12);
  if (!isNaN(b12) && b12 < 300) alerts.push(`B12 ${b12} pg/mL — on the low side. Prioritise eggs, fish, meat or fortified foods.`);
  const tsh = parseFloat(profile.tsh);
  if (!isNaN(tsh) && tsh > 2.5) alerts.push(`TSH ${tsh} — elevated. Reduce raw goitrogenic veg; cook cruciferous instead.`);
  if (alerts.length === 0 && (profile.ferritin || profile.vitaminD || profile.b12 || profile.tsh))
    alerts.push("All entered labs look within range — keep it up!");
  if (alerts.length === 0)
    alerts.push("Add your lab values above to see personalised nutrient alerts.");
  return alerts;
}

function getPersonalisedSummary(profile: Profile): string {
  const parts: string[] = [];
  const { label } = getCyclePhase(profile.lastPeriodDate);
  if (profile.lastPeriodDate) parts.push(label);
  const ferritin = parseFloat(profile.ferritin);
  if (!isNaN(ferritin) && ferritin < 50) parts.push(`low ferritin (${ferritin} ng/mL)`);
  if (profile.symptoms.length) parts.push(profile.symptoms.slice(0, 2).join(" & ").toLowerCase());
  if (profile.conditions.length) parts.push(profile.conditions[0]);
  if (profile.dietaryRestrictions.length) parts.push(profile.dietaryRestrictions[0].toLowerCase());
  if (parts.length === 0) return "your health profile";
  return parts.join(", ");
}

// ─── Multi-select chip ────────────────────────────────────────────────────────

function Chips({ options, selected, onChange }: {
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = selected.includes(o);
        return (
          <button
            key={o}
            type="button"
            onClick={() => onChange(on ? selected.filter((x) => x !== o) : [...selected, o])}
            className="rounded-full border px-3 py-1.5 text-xs font-medium transition"
            style={{
              borderColor: on ? "#D4788A" : "#2D2A2620",
              backgroundColor: on ? "#D4788A" : "transparent",
              color: on ? "#fff" : "#2D2A26",
            }}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

// ─── Intake form steps ────────────────────────────────────────────────────────

function IntakeForm({ initial, onComplete }: { initial: Profile; onComplete: (p: Profile) => void }) {
  const [step, setStep] = useState(1);
  const [p, setP] = useState<Profile>(initial);
  const set = (key: keyof Profile, value: any) => setP((prev) => ({ ...prev, [key]: value }));

  const inputCls = "mt-1.5 w-full rounded-lg border border-foreground/15 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#D4788A]";
  const labelCls = "block text-sm font-medium text-foreground/80";

  const steps = [
    { n: 1, title: "Tell me about you" },
    { n: 2, title: "Your health picture" },
    { n: 3, title: "How you eat" },
    { n: 4, title: "Your recent labs" },
  ];

  return (
    <div className="mx-auto max-w-2xl">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          {steps.map((s) => (
            <div key={s.n} className="flex-1">
              <div
                className="h-1.5 rounded-full transition-all"
                style={{ backgroundColor: step >= s.n ? "#D4788A" : "#E5DACE" }}
              />
            </div>
          ))}
        </div>
        <div className="mt-3 text-xs text-muted-foreground">Step {step} of 4 · {steps[step - 1].title}</div>
      </div>

      <div className="rounded-2xl border border-foreground/10 bg-white/60 p-6 shadow-sm">
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <p className="text-base font-medium text-foreground/70 mb-5">
                The more you share, the more personalised your plan becomes. This is all stored locally on your device — just for you.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className={labelCls}>Age</label>
                <input className={inputCls} placeholder="32" value={p.age} onChange={(e) => set("age", e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Height (cm)</label>
                <input className={inputCls} placeholder="165" value={p.height} onChange={(e) => set("height", e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Weight (kg)</label>
                <input className={inputCls} placeholder="62" value={p.weight} onChange={(e) => set("weight", e.target.value)} />
              </div>
            </div>
            <div>
              <label className={labelCls}>First day of last period</label>
              <p className="mt-0.5 text-xs text-muted-foreground mb-1">Used to calculate your cycle phase and tune your meals — skip if you don't track.</p>
              <input type="date" className={inputCls} value={p.lastPeriodDate} onChange={(e) => set("lastPeriodDate", e.target.value)} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <label className={labelCls}>Conditions you live with</label>
              <p className="mt-0.5 mb-3 text-xs text-muted-foreground">Select all that apply — this shapes which foods Prevya prioritises.</p>
              <Chips options={CONDITION_OPTIONS} selected={p.conditions} onChange={(v) => set("conditions", v)} />
            </div>
            <div>
              <label className={labelCls}>Medications & supplements</label>
              <p className="mt-0.5 mb-1 text-xs text-muted-foreground">Used to flag food/drug interactions. e.g. "levothyroxine 50mcg, ferrous sulfate, vitamin D"</p>
              <textarea
                className={inputCls + " min-h-[80px] resize-none"}
                placeholder="List your medications and supplements here..."
                value={p.medications}
                onChange={(e) => set("medications", e.target.value)}
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div>
              <label className={labelCls}>Dietary restrictions or preferences</label>
              <p className="mt-0.5 mb-3 text-xs text-muted-foreground">Your meal plan will respect these — every single suggestion.</p>
              <Chips options={DIETARY_OPTIONS} selected={p.dietaryRestrictions} onChange={(v) => set("dietaryRestrictions", v)} />
            </div>
            <div>
              <label className={labelCls}>Symptoms you've had this week</label>
              <p className="mt-0.5 mb-3 text-xs text-muted-foreground">Helps Prevya prioritise anti-inflammatory and energy-supporting foods right now.</p>
              <Chips options={SYMPTOM_OPTIONS} selected={p.symptoms} onChange={(v) => set("symptoms", v)} />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-5">
            <div>
              <p className="text-sm text-foreground/70 mb-5">
                If you have recent blood work, enter the key values below. Prevya will flag deficiencies and adjust your plan. <strong>Totally optional</strong> — skip anything you don't have.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Ferritin (ng/mL)</label>
                <input className={inputCls} placeholder="e.g. 38" value={p.ferritin} onChange={(e) => set("ferritin", e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Vitamin D (nmol/L)</label>
                <input className={inputCls} placeholder="e.g. 42" value={p.vitaminD} onChange={(e) => set("vitaminD", e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>B12 (pg/mL)</label>
                <input className={inputCls} placeholder="e.g. 280" value={p.b12} onChange={(e) => set("b12", e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>TSH (mIU/L)</label>
                <input className={inputCls} placeholder="e.g. 3.2" value={p.tsh} onChange={(e) => set("tsh", e.target.value)} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="mt-6 flex items-center justify-between">
        {step > 1 ? (
          <button
            onClick={() => setStep(step - 1)}
            className="rounded-full border px-5 py-2.5 text-sm font-medium transition hover:bg-foreground/5"
          >
            ← Back
          </button>
        ) : <div />}
        {step < 4 ? (
          <button
            onClick={() => setStep(step + 1)}
            className="rounded-full px-6 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
            style={{ backgroundColor: "#D4788A" }}
          >
            Continue →
          </button>
        ) : (
          <button
            onClick={() => onComplete(p)}
            className="rounded-full px-6 py-2.5 text-sm font-medium text-white transition hover:opacity-90 flex items-center gap-2"
            style={{ backgroundColor: "#D4788A" }}
          >
            <Sparkles className="h-4 w-4" /> Build my plan
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Nutrition plan ───────────────────────────────────────────────────────────

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const mealLabels = ["Breakfast", "Lunch", "Dinner"];

function NutritionPlan({ profile, onEdit }: { profile: Profile; onEdit: () => void }) {
  const plan = personalizePlan(profile);
  const prioritise = getPrioritise(profile);
  const avoid = getAvoid(profile);
  const interactions = getMedInteractions(profile);
  const alerts = getNutrientAlerts(profile);
  const summary = getPersonalisedSummary(profile);
  const { label: phaseLabel, emoji: phaseEmoji } = getCyclePhase(profile.lastPeriodDate);

  return (
    <>
      <SectionHeader
        eyebrow="Nutrition"
        title="What to eat this week, made for your body."
        description={`Tuned for your ${summary}.`}
        action={
          <button
            onClick={onEdit}
            className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition hover:bg-foreground/5"
          >
            <Edit2 className="h-3.5 w-3.5" /> Edit profile
          </button>
        }
      />

      {/* Personalised banner */}
      <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-foreground/10 bg-card p-4">
        <span className="text-2xl">{phaseEmoji}</span>
        <div>
          <div className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">Personalised for you</div>
          <div className="mt-0.5 text-sm font-medium text-foreground capitalize">
            {[
              profile.lastPeriodDate && phaseLabel,
              profile.conditions[0],
              profile.symptoms[0] && `${profile.symptoms[0].toLowerCase()} this week`,
              profile.dietaryRestrictions[0],
            ].filter(Boolean).join(" · ")}
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Meal plan table */}
        <div className="surface lg:col-span-2 overflow-hidden">
          <div className="flex items-center justify-between p-5">
            <h2 className="font-display text-lg font-semibold tracking-tight">Weekly meal plan</h2>
            <span className="text-xs text-muted-foreground capitalize">
              {profile.lastPeriodDate ? `${phaseEmoji} ${phaseLabel}` : "Cycle aware"}
              {profile.dietaryRestrictions.length > 0 && ` · ${profile.dietaryRestrictions[0]}`}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                  <th className="px-5 py-3">Day</th>
                  {mealLabels.map((m) => <th key={m} className="px-3 py-3">{m}</th>)}
                </tr>
              </thead>
              <tbody>
                {days.map((d) => (
                  <tr key={d} className="border-t">
                    <td className="px-5 py-4 align-top font-medium text-foreground/80">{d}</td>
                    {(plan[d] ?? []).map((meal, i) => (
                      <td key={i} className="px-3 py-4 align-top text-foreground/85">{meal}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Side panels */}
        <div className="space-y-5">
          <div className="surface p-5">
            <div className="flex items-center gap-2">
              <Leaf className="h-4 w-4 text-success-foreground" />
              <h3 className="font-display text-base font-semibold tracking-tight">Prioritise</h3>
            </div>
            <ul className="mt-3 space-y-2">
              {prioritise.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-success-foreground" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="surface p-5">
            <div className="flex items-center gap-2">
              <X className="h-4 w-4 text-accent" />
              <h3 className="font-display text-base font-semibold tracking-tight">Avoid this week</h3>
            </div>
            <ul className="mt-3 space-y-2">
              {avoid.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm">
                  <X className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="surface border-warning/40 p-5">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning-foreground" />
              <h3 className="font-display text-base font-semibold tracking-tight">Nutrient alerts</h3>
            </div>
            <ul className="mt-2 space-y-1.5">
              {alerts.map((a) => (
                <li key={a} className="text-sm text-foreground/85">{a}</li>
              ))}
            </ul>
          </div>

          <div className="surface p-5">
            <div className="flex items-center gap-2">
              <Pill className="h-4 w-4 text-accent" />
              <h3 className="font-display text-base font-semibold tracking-tight">Medication interactions</h3>
            </div>
            <ul className="mt-2 space-y-1.5">
              {interactions.map((item) => (
                <li key={item} className="text-sm text-foreground/85">{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Top-level route component ────────────────────────────────────────────────

function Nutrition() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setProfile(JSON.parse(stored));
    } catch {}
  }, []);

  function save(p: Profile) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
    setProfile(p);
    setEditing(false);
  }

  const showForm = !profile || editing;

  return (
    <PrevyaShell>
      {showForm ? (
        <>
          <SectionHeader
            eyebrow="Nutrition"
            title={editing ? "Update your profile" : "Let's personalise your plan."}
            description="A few quick questions so Prevya can build a meal plan that actually fits your body."
          />
          <IntakeForm initial={editing && profile ? profile : EMPTY_PROFILE} onComplete={save} />
        </>
      ) : (
        <NutritionPlan profile={profile!} onEdit={() => setEditing(true)} />
      )}
    </PrevyaShell>
  );
}
