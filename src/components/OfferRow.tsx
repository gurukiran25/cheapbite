import { Clock, Scale, Star, Tag, Truck, Zap } from "lucide-react";
import type { Offer } from "@/data/mockData";
import { computeFinal, PLATFORMS, valueScore } from "@/data/mockData";

export function OfferRow({
  offer,
  isBest,
  isBestValue,
  savingsVsWorst,
}: {
  offer: Offer;
  isBest: boolean;
  isBestValue?: boolean;
  savingsVsWorst: number;
}) {
  const platform = PLATFORMS.find((p) => p.id === offer.platformId)!;
  const { discounted, discountAmt, final, sticker } = computeFinal(offer);
  const value = valueScore(offer);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border bg-card shadow-card transition ${
        isBest ? "border-primary/60 ring-2 ring-primary/30 shadow-glow" : "border-border"
      }`}
    >
      {isBest && (
        <div className="flex items-center gap-1.5 bg-gradient-warm px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-primary-foreground">
          <Zap className="h-3.5 w-3.5 fill-current" /> Best Deal · Save ₹{savingsVsWorst}
        </div>
      )}

      <div className="p-4">
        {/* Header: platform + restaurant + total */}
        <div className="flex items-center gap-3">
          <span
            className="grid h-12 w-12 shrink-0 place-items-center rounded-xl text-[11px] font-black uppercase text-white shadow-md"
            style={{ backgroundColor: platform.color }}
            title={platform.name}
          >
            {platform.name.slice(0, 2)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="truncate font-display text-sm font-bold">{offer.restaurant}</p>
              {isBestValue && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-success/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-success">
                  <Scale className="h-2.5 w-2.5" /> Best value
                </span>
              )}
            </div>
            <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-0.5">
                <Star className="h-3 w-3 fill-primary text-primary" />
                {offer.rating.toFixed(1)}
              </span>
              <span>({offer.reviewCount.toLocaleString("en-IN")})</span>
              <span>·</span>
              <span>on {platform.name}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="font-display text-2xl font-black leading-none text-foreground">₹{final}</p>
            {sticker > final && (
              <p className="mt-0.5 text-[11px] text-muted-foreground line-through">₹{sticker}</p>
            )}
          </div>
        </div>

        {/* Transparent price breakdown */}
        <div className="mt-3 grid grid-cols-4 gap-1 rounded-xl bg-muted/60 p-2 text-center text-[11px]">
          <Cell label="Item" value={`₹${discounted}`} sub={discountAmt > 0 ? `−₹${discountAmt}` : undefined} subTone="success" />
          <Cell label="Delivery" value={`₹${offer.deliveryFee}`} icon={<Truck className="h-2.5 w-2.5" />} />
          <Cell label="Platform" value={`₹${offer.platformFee}`} />
          <Cell label="Total" value={`₹${final}`} bold />
        </div>

        {/* Meta row */}
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3 text-primary" />{offer.etaMins} min · {offer.distanceKm.toFixed(1)} km
          </span>
          <span className="inline-flex items-center gap-1">
            <Scale className="h-3 w-3 text-primary" />{offer.weightG} g · ₹{value}/100g
          </span>
          {offer.couponCode && (
            <span className="inline-flex items-center gap-1 rounded-full border border-dashed border-primary/50 bg-primary/5 px-2 py-0.5 font-mono text-[10px] font-bold text-primary">
              <Tag className="h-3 w-3" /> {offer.couponCode}
            </span>
          )}
          <span className="ml-auto inline-flex items-center gap-1">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
            Updated {offer.updatedAgoMins}m ago
          </span>
        </div>
      </div>
    </div>
  );
}

function Cell({
  label,
  value,
  sub,
  subTone,
  icon,
  bold,
}: {
  label: string;
  value: string;
  sub?: string;
  subTone?: "success";
  icon?: React.ReactNode;
  bold?: boolean;
}) {
  return (
    <div className={`rounded-lg px-1.5 py-1.5 ${bold ? "bg-primary text-primary-foreground" : ""}`}>
      <p className="flex items-center justify-center gap-0.5 text-[9px] font-semibold uppercase tracking-wider opacity-70">
        {icon} {label}
      </p>
      <p className={`mt-0.5 font-bold ${bold ? "text-sm" : "text-foreground"}`}>{value}</p>
      {sub && (
        <p className={`text-[9px] font-bold ${subTone === "success" ? "text-success" : "text-muted-foreground"}`}>
          {sub}
        </p>
      )}
    </div>
  );
}
