import { Clock, Star, Tag, Truck } from "lucide-react";
import type { Offer } from "@/data/mockData";
import { computeFinal, PLATFORMS } from "@/data/mockData";

export function OfferRow({ offer, isBest, savingsVsWorst }: { offer: Offer; isBest: boolean; savingsVsWorst: number }) {
  const platform = PLATFORMS.find((p) => p.id === offer.platformId)!;
  const { discounted, final } = computeFinal(offer);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border bg-card p-4 shadow-card transition ${
        isBest ? "border-primary/60 ring-2 ring-primary/30 shadow-glow" : "border-border"
      }`}
    >
      {isBest && (
        <span className="absolute -right-10 top-3 rotate-45 bg-gradient-warm px-12 py-1 text-[10px] font-bold uppercase tracking-widest text-primary-foreground">
          Best Deal
        </span>
      )}
      <div className="flex items-center gap-3">
        <span
          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-sm font-bold text-white shadow"
          style={{ backgroundColor: platform.color }}
        >
          {platform.name.slice(0, 2)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-sm font-semibold">{offer.restaurant}</p>
          <p className="truncate text-xs text-muted-foreground">via {platform.name}</p>
        </div>
        <div className="text-right">
          <p className="font-display text-xl font-bold text-foreground">₹{final}</p>
          {offer.discountPct > 0 && (
            <p className="text-[11px] text-muted-foreground line-through">₹{offer.basePrice + offer.deliveryFee}</p>
          )}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground sm:grid-cols-4">
        <span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5 text-primary" />{offer.rating.toFixed(1)}</span>
        <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-primary" />{offer.etaMins} min</span>
        <span className="inline-flex items-center gap-1"><Truck className="h-3.5 w-3.5 text-primary" />₹{offer.deliveryFee}</span>
        {offer.couponCode && (
          <span className="inline-flex items-center gap-1 truncate"><Tag className="h-3.5 w-3.5 text-primary" />{offer.couponCode}</span>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
        <div className="text-[11px] text-muted-foreground">
          Item ₹{discounted} {offer.discountPct > 0 && <span className="ml-1 text-success">−{offer.discountPct}%</span>}
        </div>
        {savingsVsWorst > 0 && (
          <div className="rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-semibold text-success">
            Save ₹{savingsVsWorst}
          </div>
        )}
      </div>
    </div>
  );
}
