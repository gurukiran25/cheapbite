import { useNavigate } from "@tanstack/react-router";
import { Search, TrendingUp, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { suggest } from "@/lib/search";

export function SearchBar({ defaultValue = "" }: { defaultValue?: string }) {
  const [q, setQ] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const suggestions = useMemo(() => (q.trim() ? suggest(q, 6) : []), [q]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const go = (term: string) => {
    const t = term.trim();
    if (!t) return;
    const recent = JSON.parse(localStorage.getItem("recent") || "[]") as string[];
    const next = [t, ...recent.filter((r) => r !== t)].slice(0, 6);
    localStorage.setItem("recent", JSON.stringify(next));
    setOpen(false);
    navigate({ to: "/search", search: { q: t } });
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => (a + 1) % suggestions.length); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setActive((a) => (a - 1 + suggestions.length) % suggestions.length); }
    if (e.key === "Enter" && active >= 0 && suggestions[active]) {
      e.preventDefault();
      go(suggestions[active].name);
    }
    if (e.key === "Escape") setOpen(false);
  };

  return (
    <div ref={wrapRef} className="relative">
      <form
        onSubmit={(e) => { e.preventDefault(); go(q); }}
        className="relative"
      >
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setActive(0); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Try 'veg fride rice' or 'paneer biriyani'..."
          className="h-14 w-full rounded-2xl border border-border bg-card pl-12 pr-28 text-base shadow-card outline-none transition focus:border-primary focus:shadow-glow"
        />
        {q && (
          <button
            type="button"
            onClick={() => { setQ(""); setOpen(false); }}
            className="absolute right-24 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:bg-secondary"
            aria-label="Clear"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-gradient-warm px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition active:scale-95"
        >
          Compare
        </button>
      </form>

      {open && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-border bg-popover shadow-glow">
          <p className="px-4 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Suggestions
          </p>
          {suggestions.map((s, i) => (
            <button
              key={s.slug}
              type="button"
              onMouseEnter={() => setActive(i)}
              onClick={() => go(s.name)}
              className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition ${
                i === active ? "bg-accent text-accent-foreground" : "hover:bg-accent/60"
              }`}
            >
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-secondary text-lg">{s.emoji}</span>
              <span className="flex-1 truncate text-sm font-medium">{s.name}</span>
              {s.trending && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  <TrendingUp className="h-3 w-3" /> Hot
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
