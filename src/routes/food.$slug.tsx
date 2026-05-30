import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/Header";
import { OfferRow } from "@/components/OfferRow";
import { FilterBar, type DietKey, type SortKey } from "@/components/FilterBar";
import { computeFinal, findFood } from "@/data/mockData";

export const Route = createFileRoute("/food/$slug")({
  loader: ({ params }) => {
    const food = findFood(params.slug);
    if (!food) throw notFound();
    return food;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.name ?? "Food"} — Compare prices | Plately` },
      { name: "description", content: `Compare ${loaderData?.name ?? "this dish"} across Swiggy, Zomato, EatSure, Domino's and McDonald's.` },
      { property: "og:title", content: `${loaderData?.name ?? ""} — cheapest across delivery apps` },
    ],
  }),
  notFoundComponent: () => (
    <div className="grid min-h-screen place-items-center bg-background p-6 text-center">
      <div>
        <p className="text-5xl">🍽️</p>
        <p className="mt-3 font-display text-xl font-bold">Dish not on the menu yet</p>
        <Link to="/" className="mt-4 inline-block rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Back home</Link>
      </div>
    </div>
  ),
  errorComponent: ({ reset }) => (
    <div className="grid min-h-screen place-items-center bg-background p-6 text-center">
      <button onClick={reset} className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Try again</button>
    </div>
  ),
  component: FoodPage,
});

function FoodPage() {
  const food = Route.useLoaderData();
  const [sort, setSort] = useState<SortKey>("price");
  const [diet, setDiet] = useState<DietKey>("all");

  const enriched = useMemo(() => {
    const list = food.offers
      .filter((o) => diet === "all" || (diet === "veg" ? o.isVeg : !o.isVeg))
      .map((o) => ({ o, ...computeFinal(o) }));
    list.sort((a, b) => {
      if (sort === "price") return a.final - b.final;
      if (sort === "eta") return a.o.etaMins - b.o.etaMins;
      return b.o.rating - a.o.rating;
    });
    return list;
  }, [food, sort, diet]);

  const byPrice = [...enriched].sort((a, b) => a.final - b.final);
  const bestId = byPrice[0]?.o.id;
  const worstFinal = byPrice[byPrice.length - 1]?.final ?? 0;
  const maxSavings = worstFinal - (byPrice[0]?.final ?? 0);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-5">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>

        <div className="mt-3 overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-start gap-4">
            <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-accent text-5xl">{food.emoji}</div>
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-2xl font-bold leading-tight">{food.name}</h1>
              <p className="mt-1 text-sm text-muted-foreground">Comparing {food.offers.length} platforms near Hostel Block C</p>
              {maxSavings > 0 && (
                <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-success/10 px-3 py-1 text-xs font-bold text-success">
                  💰 Save up to ₹{maxSavings} by picking the right app
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-5">
          <FilterBar sort={sort} setSort={setSort} diet={diet} setDiet={setDiet} />
        </div>

        <div className="mt-4 space-y-3">
          {enriched.length === 0 && (
            <p className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
              No offers match your filters.
            </p>
          )}
          {enriched.map(({ o, final }) => (
            <OfferRow
              key={o.id}
              offer={o}
              isBest={o.id === bestId}
              savingsVsWorst={worstFinal - final}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
