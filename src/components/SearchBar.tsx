import { useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useState } from "react";

export function SearchBar({ defaultValue = "" }: { defaultValue?: string }) {
  const [q, setQ] = useState(defaultValue);
  const navigate = useNavigate();
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    const recent = JSON.parse(localStorage.getItem("recent") || "[]") as string[];
    const next = [q.trim(), ...recent.filter((r) => r !== q.trim())].slice(0, 6);
    localStorage.setItem("recent", JSON.stringify(next));
    navigate({ to: "/search", search: { q: q.trim() } });
  };
  return (
    <form onSubmit={submit} className="relative">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search 'Veg Fried Rice', 'Biryani', 'Pizza'..."
        className="h-14 w-full rounded-2xl border border-border bg-card pl-12 pr-28 text-base shadow-card outline-none transition focus:border-primary focus:shadow-glow"
      />
      <button
        type="submit"
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-gradient-warm px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition active:scale-95"
      >
        Compare
      </button>
    </form>
  );
}
