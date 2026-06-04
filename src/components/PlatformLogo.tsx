import { PLATFORMS } from "@/data/mockData";

/** Stylized platform badge — branded color chip with monogram. Avoids using copyrighted logos. */
export function PlatformLogo({ platformId, size = 32 }: { platformId: string; size?: number }) {
  const p = PLATFORMS.find((x) => x.id === platformId);
  if (!p) return null;
  const initials = p.name
    .replace(/[^A-Za-z]/g, "")
    .slice(0, 2)
    .toUpperCase();
  return (
    <span
      className="inline-grid place-items-center rounded-xl font-display font-bold text-white shadow-card"
      style={{
        backgroundColor: p.color,
        width: size,
        height: size,
        fontSize: size * 0.4,
        letterSpacing: "-0.04em",
      }}
      title={p.name}
      aria-label={p.name}
    >
      {initials}
    </span>
  );
}
