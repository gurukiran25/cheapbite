import { Link } from "@tanstack/react-router";
import type { FoodItem } from "@/data/mockData";
import { computeFinal } from "@/data/mockData";

export function FoodCard({ food }: { food: FoodItem }) {
  const priced = food.offers
    .map((o) => ({ o, ...computeFinal(o) }))
    .sort((a, b) => a.final - b.final);
  const cheapest = priced[0];
  const costliest = priced[priced.length - 1];
  const spread = cheapest && costliest ? costliest.final - cheapest.final : 0;

  return (
    <Link
      to="/food/$slug"
      params={{ slug: food.slug }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-glow"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="grid h-14 w-14 place-items-center rounded-xl bg-accent text-3xl">{food.emoji}</div>
        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
          food.category === "Non-Veg"
            ? "border-nonveg/40 text-nonveg"
            : "border-veg/40 text-veg"
        }`}>
          <span className={`h-1.5 w-1.5 rounded-full ${food.category === "Non-Veg" ? "bg-nonveg" : "bg-veg"}`} />
          {food.category}
        </span>
      </div>
      <h3 className="mt-3 font-display text-base font-semibold leading-tight">{food.name}</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        {food.offers.length} platforms · from {cheapest && (
          <span className="font-semibold text-foreground">₹{cheapest.final}</span>
        )}
      </p>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
          Best: <span className="font-semibold text-primary">{cheapest?.o.restaurant}</span>
        </span>
        {spread > 0 && <span className="text-xs font-semibold text-success">Save ₹{spread}</span>}
      </div>
    </Link>
  );
}
