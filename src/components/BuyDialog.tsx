import { useEffect, useState } from "react";
import { ExternalLink, MapPin, Wallet } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PLATFORMS, platformOrderUrl, type Offer, computeFinal } from "@/data/mockData";

type Address = {
  name: string;
  phone: string;
  hostel: string;
  line1: string;
  city: string;
  pincode: string;
};

const PAY_OPTIONS = [
  { id: "upi", label: "UPI (GPay / PhonePe / Paytm)" },
  { id: "card", label: "Credit / Debit Card" },
  { id: "netbanking", label: "Net Banking" },
  { id: "cod", label: "Cash on Delivery" },
  { id: "wallet", label: "Plately Wallet" },
] as const;

const empty: Address = { name: "", phone: "", hostel: "", line1: "", city: "", pincode: "" };

export function BuyDialog({
  open,
  onOpenChange,
  offer,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  offer: Offer;
}) {
  const platform = PLATFORMS.find((p) => p.id === offer.platformId)!;
  const { final } = computeFinal(offer);
  const [addr, setAddr] = useState<Address>(empty);
  const [pay, setPay] = useState<string>("upi");

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("plately:checkout") || "null");
      if (saved?.addr) setAddr({ ...empty, ...saved.addr });
      if (saved?.pay) setPay(saved.pay);
    } catch {
      /* ignore */
    }
  }, [open]);

  const update = (k: keyof Address, v: string) => setAddr((a) => ({ ...a, [k]: v }));

  const valid =
    addr.name.trim().length > 1 &&
    /^\d{10}$/.test(addr.phone.trim()) &&
    addr.line1.trim().length > 3 &&
    /^\d{6}$/.test(addr.pincode.trim());

  function openExternal(url: string) {
    // Use a synchronous anchor click — most reliable across mobile browsers,
    // in-app WebViews and iframe previews where window.open() is blocked.
    try {
      const a = document.createElement("a");
      a.href = url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch {
      /* ignore */
    }
    // Fallback: navigate the top frame (handles iframe + popup-blocker case).
    setTimeout(() => {
      try {
        const top = window.top ?? window;
        top.location.href = url;
      } catch {
        window.location.href = url;
      }
    }, 350);
  }

  function handleBuy() {
    if (!valid) {
      toast.error("Please fill name, 10-digit phone, address and 6-digit pincode.");
      return;
    }
    localStorage.setItem("plately:checkout", JSON.stringify({ addr, pay }));
    const url = platformOrderUrl(offer.platformId, offer.itemName);
    toast.success(`Opening ${platform.name} to complete your order…`);
    openExternal(url);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            Buy {offer.itemName} · ₹{final}
          </DialogTitle>
          <DialogDescription>
            Confirm your address & payment. We'll redirect you to{" "}
            <span className="font-semibold" style={{ color: platform.color }}>
              {platform.name}
            </span>{" "}
            to place the actual order.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Address */}
          <section className="rounded-2xl border border-border bg-card p-3">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 text-primary" /> Delivery address
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="col-span-2">
                <Label htmlFor="bd-name" className="text-xs">Full name</Label>
                <Input id="bd-name" value={addr.name} onChange={(e) => update("name", e.target.value)} placeholder="Rahul Sharma" />
              </div>
              <div>
                <Label htmlFor="bd-phone" className="text-xs">Phone</Label>
                <Input id="bd-phone" inputMode="numeric" maxLength={10} value={addr.phone} onChange={(e) => update("phone", e.target.value.replace(/\D/g, ""))} placeholder="98xxxxxxxx" />
              </div>
              <div>
                <Label htmlFor="bd-hostel" className="text-xs">Hostel / Block</Label>
                <Input id="bd-hostel" value={addr.hostel} onChange={(e) => update("hostel", e.target.value)} placeholder="Block C, Room 214" />
              </div>
              <div className="col-span-2">
                <Label htmlFor="bd-line1" className="text-xs">Address line</Label>
                <Input id="bd-line1" value={addr.line1} onChange={(e) => update("line1", e.target.value)} placeholder="IIT Campus, Powai" />
              </div>
              <div>
                <Label htmlFor="bd-city" className="text-xs">City</Label>
                <Input id="bd-city" value={addr.city} onChange={(e) => update("city", e.target.value)} placeholder="Mumbai" />
              </div>
              <div>
                <Label htmlFor="bd-pin" className="text-xs">Pincode</Label>
                <Input id="bd-pin" inputMode="numeric" maxLength={6} value={addr.pincode} onChange={(e) => update("pincode", e.target.value.replace(/\D/g, ""))} placeholder="400076" />
              </div>
            </div>
          </section>

          {/* Payment */}
          <section className="rounded-2xl border border-border bg-card p-3">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <Wallet className="h-3.5 w-3.5 text-primary" /> Payment method
            </p>
            <RadioGroup value={pay} onValueChange={setPay} className="space-y-1.5">
              {PAY_OPTIONS.map((p) => (
                <label
                  key={p.id}
                  htmlFor={`pay-${p.id}`}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm transition ${
                    pay === p.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                  }`}
                >
                  <RadioGroupItem id={`pay-${p.id}`} value={p.id} />
                  <span className="font-medium">{p.label}</span>
                </label>
              ))}
            </RadioGroup>
          </section>

          <p className="rounded-xl bg-muted/60 p-2.5 text-[11px] leading-relaxed text-muted-foreground">
            Plately compares prices. The order is placed on{" "}
            <span className="font-semibold" style={{ color: platform.color }}>{platform.name}</span>{" "}
            — they handle delivery, payment processing and support.
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleBuy} className="gap-1.5">
            Buy on {platform.name} <ExternalLink className="h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
