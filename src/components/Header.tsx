import { Link } from "@tanstack/react-router";
import { MapPin, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function Header() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem("theme") === "dark";
    setDark(saved);
    document.documentElement.classList.toggle("dark", saved);
  }, []);
  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-warm text-primary-foreground shadow-glow">
            <span className="text-lg">🍔</span>
          </span>
          <div className="leading-tight">
            <p className="font-display text-lg font-bold">Plately</p>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">cheapest bite, every time</p>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <button className="hidden items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground sm:flex">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            Hostel Block C
          </button>
          <button
            onClick={toggle}
            aria-label="Toggle theme"
            className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-secondary-foreground transition hover:bg-accent"
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </header>
  );
}
