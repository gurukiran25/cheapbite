export type SortKey = "price" | "eta" | "rating";
export type DietKey = "all" | "veg" | "nonveg";

export function FilterBar({
  sort, setSort, diet, setDiet,
}: {
  sort: SortKey; setSort: (s: SortKey) => void;
  diet: DietKey; setDiet: (d: DietKey) => void;
}) {
  const Chip = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button
      onClick={onClick}
      className={`whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
        active
          ? "border-primary bg-primary text-primary-foreground shadow-glow"
          : "border-border bg-card text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
  return (
    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
      <Chip active={sort === "price"} onClick={() => setSort("price")}>💸 Cheapest</Chip>
      <Chip active={sort === "eta"} onClick={() => setSort("eta")}>⚡ Fastest</Chip>
      <Chip active={sort === "rating"} onClick={() => setSort("rating")}>⭐ Top rated</Chip>
      <span className="mx-1 w-px shrink-0 bg-border" />
      <Chip active={diet === "all"} onClick={() => setDiet("all")}>All</Chip>
      <Chip active={diet === "veg"} onClick={() => setDiet("veg")}>🟢 Veg</Chip>
      <Chip active={diet === "nonveg"} onClick={() => setDiet("nonveg")}>🔴 Non-veg</Chip>
    </div>
  );
}
