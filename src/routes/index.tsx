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
          <h1 className="font-display text-balance text-3xl font-black leading-[1.02] sm:text-5xl">
            Stop overpaying<br />
            <span className="bg-gradient-warm bg-clip-text text-transparent">for food.</span>
          </h1>
          <p className="mt-3 max-w-lg text-sm text-muted-foreground sm:text-base">
            Compare Swiggy, Zomato, EatSure, Domino's & 11 more — instantly. See item price,
            delivery & platform fees side-by-side. Save ₹30–₹80 every order.
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
        {/* Trust strip */}
        <section className="-mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { icon: IndianRupee, label: "₹2,43,712", sub: "saved this month" },
            { icon: ShieldCheck, label: "15 apps", sub: "compared live" },
            { icon: Timer, label: "< 2 min", sub: "prices refreshed" },
            { icon: TrendingUp, label: "12,800+", sub: "students saving" },
          ].map((t, i) => (
            <div key={i} className="flex items-center gap-2 rounded-2xl border border-border bg-card p-3 shadow-card">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
                <t.icon className="h-4 w-4" />
              </span>
              <div className="leading-tight">
                <p className="font-display text-sm font-bold">{t.label}</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t.sub}</p>
              </div>
            </div>
          ))}
        </section>

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

        {/* Today's best deals */}
        <section>
          <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold">
            <Zap className="h-4 w-4 text-primary" /> Today's best deals
          </h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {FOOD_ITEMS.slice(0, 6)
              .map((f) => {
                const best = f.offers
                  .map((o) => ({ o, ...computeFinal(o) }))
                  .sort((a, b) => a.final - b.final)[0];
                const worst = f.offers
                  .map((o) => computeFinal(o).final)
                  .sort((a, b) => b - a)[0];
                return { f, best, save: worst - best.final };
              })
              .sort((a, b) => b.save - a.save)
              .slice(0, 6)
              .map(({ f, best, save }) => {
                const p = PLATFORMS.find((x) => x.id === best.o.platformId)!;
                return (
                  <Link
                    key={f.slug}
                    to="/food/$slug"
                    params={{ slug: f.slug }}
                    className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-card transition hover:-translate-y-0.5 hover:shadow-glow"
                  >
                    <span className="grid h-12 w-12 place-items-center rounded-xl bg-accent text-2xl">{f.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{f.name}</p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        cheapest on <span className="font-semibold" style={{ color: p.color }}>{p.name}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-base font-black">₹{best.final}</p>
                      {save > 0 && <p className="text-[10px] font-bold text-success">Save ₹{save}</p>}
                    </div>
                  </Link>
                );
              })}
          </div>
        </section>

        <section>
          <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold">
            <Flame className="h-4 w-4 text-primary" /> Trending in your hostel
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {trending.map((f) => <FoodCard key={f.slug} food={f} />)}
          </div>
        </section>

        {/* How it works */}
        <section>
          <h2 className="mb-3 font-display text-lg font-bold">How it works</h2>
          <div className="grid gap-3 sm:grid-cols-4">
            {[
              { icon: Search, title: "Search a dish", body: "Type any food — biryani, momos, dosa." },
              { icon: ShieldCheck, title: "We compare 15 apps", body: "Item, delivery and platform fees." },
              { icon: Zap, title: "See the cheapest", body: "Best deal & best value, side by side." },
              { icon: IndianRupee, title: "Save ₹30–₹80/order", body: "Order on the app you already use." },
            ].map((s, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-4 shadow-card">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-warm text-primary-foreground">
                  <s.icon className="h-4 w-4" />
                </span>
                <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-primary">Step {i + 1}</p>
                <p className="font-display text-sm font-bold">{s.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{s.body}</p>
              </div>
            ))}
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
