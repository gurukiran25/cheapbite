import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { z } from "zod";
import { Header } from "@/components/Header";
import { SearchBar } from "@/components/SearchBar";
import { FoodCard } from "@/components/FoodCard";
import { didYouMean, highlight, searchRestaurants, smartSearch } from "@/lib/search";
import { PLATFORMS, computeFinal } from "@/data/mockData";
import { Sparkles, Store } from "lucide-react";

const searchSchema = z.object({ q: z.string().optional().default("") });

export const Route = createFileRoute("/search")({
  validateSearch: searchSchema,
  head: ({ match }) => {
    const q = (match.search as { q?: string })?.q ?? "";
    const title = q ? `"${q}" — Plately price compare` : "Search dishes — Plately";
    const desc = q
      ? `Compare ${q} prices across Swiggy, Zomato, Domino's, EatSure and more.`
      : "Search any dish and instantly compare prices across 15 food delivery apps.";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
      ],
    };
  },
  component: SearchPage,
});

type Cat = "All" | "Veg" | "Non-Veg" | "Dessert" | "Beverage";

function SearchPage() {
  const { q } = Route.useSearch();
  const navigate = useNavigate();
  const [liveQ, setLiveQ] = useState(q);
  const effectiveQ = liveQ;
  const [cat, setCat] = useState<Cat>("All");
  const [budget, setBudget] = useState<number | null>(null);

  const ranked = useMemo(() => smartSearch(effectiveQ), [effectiveQ]);
  const restos = useMemo(() => searchRestaurants(effectiveQ), [effectiveQ]);
  const suggestion = useMemo(() => didYouMean(effectiveQ), [effectiveQ]);


  const cheapestOf = (food: typeof ranked[number]["food"]) =>
    Math.min(...food.offers.map((o) => computeFinal(o).final));

  const filtered = useMemo(
    () =>
      ranked
        .filter((r) => cat === "All" || r.food.category === cat)
        .filter((r) => budget == null || cheapestOf(r.food) <= budget),
    [ranked, cat, budget],
  );

  const cats: Cat[] = ["All", "Veg", "Non-Veg", "Dessert", "Beverage"];
  const budgets: { label: string; v: number | null }[] = [
    { label: "Any ₹", v: null },
    { label: "Under ₹100", v: 100 },
    { label: "Under ₹150", v: 150 },
    { label: "Under ₹200", v: 200 },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <SearchBar defaultValue={q} />

        <div className="mt-6 flex items-baseline justify-between">
          <h1 className="font-display text-xl font-bold">
            {q ? <>Results for "<span className="text-primary">{q}</span>"</> : "All items"}
          </h1>
          <span className="text-xs text-muted-foreground">{filtered.length} matches</span>
        </div>

        {suggestion && (
          <Link
            to="/search"
            search={{ q: suggestion }}
            className="mt-3 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-sm text-primary"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Did you mean <span className="font-semibold underline">{suggestion}</span>?
          </Link>
        )}

        {q && (
          <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
            {cats.map((c) => {
              const count = c === "All" ? ranked.length : ranked.filter((r) => r.food.category === c).length;
              if (c !== "All" && count === 0) return null;
              return (
                <button
                  key={c}
                  onClick={() => setCat(c)}
                  className={`whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                    cat === c
                      ? "border-primary bg-primary text-primary-foreground shadow-glow"
                      : "border-border bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {c} <span className="ml-1 opacity-70">{count}</span>
                </button>
              );
            })}
          </div>
        )}

        <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto pb-1">
          {budgets.map((b) => (
            <button
              key={b.label}
              onClick={() => setBudget(b.v)}
              className={`whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                budget === b.v
                  ? "border-success bg-success text-success-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>


        {restos.length > 0 && q && (
          <section className="mt-5">
            <h2 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              <Store className="h-3.5 w-3.5" /> Restaurants
            </h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {restos.map((r) => (
                <div key={r.restaurant} className="flex items-center justify-between rounded-2xl border border-border bg-card p-3 shadow-card">
                  <div className="min-w-0">
                    <p className="truncate font-display text-sm font-semibold">
                      {highlight(r.restaurant, q).map((p, i) => (
                        <span key={i} className={p.match ? "bg-primary/20 text-primary" : ""}>{p.text}</span>
                      ))}
                    </p>
                    <p className="text-xs text-muted-foreground">on {r.platforms} platform{r.platforms > 1 ? "s" : ""}</p>
                  </div>
                  <div className="flex -space-x-1.5">
                    {[...new Set(r.offers.map((o) => o.platformId))].slice(0, 4).map((pid) => {
                      const p = PLATFORMS.find((x) => x.id === pid)!;
                      return (
                        <span
                          key={pid}
                          className="grid h-7 w-7 place-items-center rounded-full border-2 border-card text-[10px] font-bold text-white"
                          style={{ backgroundColor: p.color }}
                          title={p.name}
                        >
                          {p.name.slice(0, 1)}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="mt-5">
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
              <p className="text-3xl">🥲</p>
              <p className="mt-2 font-semibold">No matches yet</p>
              <p className="text-sm text-muted-foreground">Try "biryani", "pizza" or "thali".</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {filtered.map((r) => <FoodCard key={r.food.slug} food={r.food} />)}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
