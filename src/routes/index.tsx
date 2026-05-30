import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { SearchBar } from "@/components/SearchBar";
import { FoodCard } from "@/components/FoodCard";
import { FOOD_ITEMS, PLATFORMS, computeFinal } from "@/data/mockData";
import { Flame, IndianRupee, Search, ShieldCheck, Sparkles, Timer, TrendingUp, Zap } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Plately — Compare food prices across Swiggy, Zomato & more" },
      { name: "description", content: "Built for hostel students. Compare prices, delivery fees, and coupons across delivery apps in seconds." },
      { property: "og:title", content: "Plately — Cheapest bite, every time" },
      { property: "og:description", content: "Compare food prices across Swiggy, Zomato, EatSure, Domino's and McDonald's." },
    ],
  }),
  component: Home,
});

function Home() {
  const trending = FOOD_ITEMS.filter((f) => f.trending);
  const [recent, setRecent] = useState<string[]>([]);
  useEffect(() => {
    setRecent(JSON.parse(localStorage.getItem("recent") || "[]"));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-hero-glow" />
        <div className="relative mx-auto max-w-6xl px-4 pb-8 pt-10 sm:pt-16">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Made for hostel students
          </div>
          <h1 className="font-display text-balance text-3xl font-bold leading-[1.05] sm:text-5xl">
            One search.<br />
            <span className="bg-gradient-warm bg-clip-text text-transparent">Cheapest food across apps.</span>
          </h1>
          <p className="mt-3 max-w-lg text-sm text-muted-foreground sm:text-base">
            Plately compares prices, delivery fees and coupons across Swiggy, Zomato,
            EatSure, Domino's and McDonald's — so you never overpay for a biryani again.
          </p>
          <div className="mt-6">
            <SearchBar />
          </div>

          {/* Platform strip */}
          <div className="no-scrollbar mt-5 flex gap-2 overflow-x-auto">
            {PLATFORMS.map((p) => (
              <div key={p.id} className="flex shrink-0 items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
                {p.name}
              </div>
            ))}
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl space-y-10 px-4 pb-20">
        {recent.length > 0 && (
          <section>
            <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold">
              <TrendingUp className="h-4 w-4 text-primary" /> Recent searches
            </h2>
            <div className="no-scrollbar flex gap-2 overflow-x-auto">
              {recent.map((r) => (
                <Link
                  key={r}
                  to="/search"
                  search={{ q: r }}
                  className="shrink-0 rounded-full border border-border bg-card px-4 py-2 text-sm hover:border-primary hover:text-primary"
                >
                  {r}
                </Link>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold">
            <Flame className="h-4 w-4 text-primary" /> Trending in your hostel
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {trending.map((f) => <FoodCard key={f.slug} food={f} />)}
          </div>
        </section>

        <section>
          <h2 className="mb-3 font-display text-lg font-bold">Browse all</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {FOOD_ITEMS.map((f) => <FoodCard key={f.slug} food={f} />)}
          </div>
        </section>

        <footer className="border-t border-border pt-6 text-center text-xs text-muted-foreground">
          Prices shown are simulated for demo. Plug in partner APIs to go live.
        </footer>
      </main>
    </div>
  );
}
