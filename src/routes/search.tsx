import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { SearchBar } from "@/components/SearchBar";
import { FoodCard } from "@/components/FoodCard";
import { smartSearch } from "@/lib/search";
import { z } from "zod";

const searchSchema = z.object({ q: z.string().optional().default("") });

export const Route = createFileRoute("/search")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Search — Plately" },
      { name: "description", content: "Compare prices across delivery apps." },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const { q } = Route.useSearch();
  const results = searchFoods(q);
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <SearchBar defaultValue={q} />
        <div className="mt-6 mb-4 flex items-baseline justify-between">
          <h1 className="font-display text-xl font-bold">
            {q ? <>Results for "<span className="text-primary">{q}</span>"</> : "All items"}
          </h1>
          <span className="text-xs text-muted-foreground">{results.length} matches</span>
        </div>
        {results.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
            <p className="text-3xl">🥲</p>
            <p className="mt-2 font-semibold">No matches yet</p>
            <p className="text-sm text-muted-foreground">Try "biryani", "pizza" or "thali".</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {results.map((f) => <FoodCard key={f.slug} food={f} />)}
          </div>
        )}
      </main>
    </div>
  );
}
