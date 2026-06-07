import { createFileRoute } from "@tanstack/react-router";
import { PrevyaShell } from "@/components/PrevyaShell";
import { SectionHeader } from "@/components/SectionHeader";
import { AlertTriangle, Check, Leaf, Pill, X } from "lucide-react";

export const Route = createFileRoute("/nutrition")({
  head: () => ({
    meta: [
      { title: "Nutrition · Prevya" },
      { name: "description", content: "Weekly meal plan, foods to prioritise or avoid, nutrient alerts, and medication interactions." },
    ],
  }),
  component: Nutrition,
});

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const meals = ["Breakfast", "Lunch", "Dinner"];
const plan: Record<string, string[]> = {
  Mon: ["Steel oats + berries + flaxseed", "Salmon poke bowl, brown rice", "Roast chicken + quinoa + greens"],
  Tue: ["Greek yogurt + chia + walnuts", "Lentil dahl + kale", "Cod + sweet potato + broccolini"],
  Wed: ["Eggs + avocado on rye", "Turkey & avocado wrap", "Bison chili + cilantro lime rice"],
  Thu: ["Smoothie: spinach, banana, hemp", "Chickpea salad + tahini", "Salmon + asparagus + farro"],
  Fri: ["Steel oats + berries + flaxseed", "Tuna nicoise", "Slow-cooked lamb + root veg"],
  Sat: ["Pancakes + blueberries", "Soba noodle bowl", "Pizza night (low-histamine base)"],
  Sun: ["Frittata + greens", "Roast veg grain bowl", "Whole roast chicken + potatoes"],
};

const prioritise = ["Iron-rich (red meat, lentils)", "Omega-3 fats (salmon, walnuts)", "Cruciferous veg", "Magnesium-rich foods"];
const avoid = ["High-histamine aged cheese", "Excess caffeine in luteal phase", "Ultra-processed seed oils"];

function Nutrition() {
  return (
    <PrevyaShell>
      <SectionHeader
        eyebrow="Nutrition"
        title="What to eat this week, made for your body."
        description="Tuned for your cycle phase, your low ferritin, and your current symptoms."
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="surface lg:col-span-2 overflow-hidden">
          <div className="flex items-center justify-between p-5">
            <h2 className="font-display text-lg font-semibold tracking-tight">Weekly meal plan</h2>
            <span className="text-xs text-muted-foreground">Cycle aware · luteal phase</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                  <th className="px-5 py-3">Day</th>
                  {meals.map((m) => (
                    <th key={m} className="px-3 py-3">{m}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {days.map((d) => (
                  <tr key={d} className="border-t">
                    <td className="px-5 py-4 align-top font-medium text-foreground/80">{d}</td>
                    {plan[d].map((meal, i) => (
                      <td key={i} className="px-3 py-4 align-top text-foreground/85">{meal}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-5">
          <div className="surface p-5">
            <div className="flex items-center gap-2">
              <Leaf className="h-4 w-4 text-success-foreground" />
              <h3 className="font-display text-base font-semibold tracking-tight">Prioritise</h3>
            </div>
            <ul className="mt-3 space-y-2">
              {prioritise.map((p) => (
                <li key={p} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-success-foreground" />
                  <span>{p}</span>
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
              {avoid.map((p) => (
                <li key={p} className="flex items-start gap-2 text-sm">
                  <X className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="surface border-warning/40 p-5">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning-foreground" />
              <h3 className="font-display text-base font-semibold tracking-tight">Nutrient alerts</h3>
            </div>
            <p className="mt-2 text-sm text-foreground/85">
              Ferritin still below optimal — keep iron-rich foods at every meal this week.
            </p>
          </div>

          <div className="surface p-5">
            <div className="flex items-center gap-2">
              <Pill className="h-4 w-4 text-accent" />
              <h3 className="font-display text-base font-semibold tracking-tight">Medication interactions</h3>
            </div>
            <p className="mt-2 text-sm text-foreground/85">
              Take iron 2h apart from your levothyroxine. Avoid grapefruit with current trial protocol.
            </p>
          </div>
        </div>
      </div>
    </PrevyaShell>
  );
}
