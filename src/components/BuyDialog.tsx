import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ExternalLink, Loader2, MapPin, ShieldCheck, Wallet } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
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
  { id: "upi", label: "UPI (GPay / PhonePe / Paytm)", needsOtp: true },
  { id: "card", label: "Credit / Debit Card", needsOtp: true },
  { id: "netbanking", label: "Net Banking", needsOtp: true },
  { id: "cod", label: "Cash on Delivery", needsOtp: false },
  { id: "wallet", label: "Plately Wallet", needsOtp: true },
] as const;

const empty: Address = { name: "", phone: "", hostel: "", line1: "", city: "", pincode: "" };

type Step = "form" | "otp" | "success";

function openExternal(url: string) {
  // Anchor click is the most reliable cross-browser way (mobile, in-app WebViews).
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
  // Fallback: navigate the top frame after a short delay (handles popup-blocker
  // and Lovable preview iframe sandbox).
  setTimeout(() => {
    try {
      const top = window.top ?? window;
      top.location.href = url;
    } catch {
      window.location.href = url;
    }
  }, 400);
}

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
  const orderUrl = useMemo(() => platformOrderUrl(offer.platformId, offer.itemName), [offer]);

  const [step, setStep] = useState<Step>("form");
  const [addr, setAddr] = useState<Address>(empty);
  const [pay, setPay] = useState<string>("upi");
  const [otp, setOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [orderId, setOrderId] = useState("");

  useEffect(() => {
    if (!open) return;
    setStep("form");
    setOtp("");
    setGeneratedOtp("");
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

  const payMeta = PAY_OPTIONS.find((p) => p.id === pay)!;

  function generateOtp() {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  async function handleProceed() {
    if (!valid) {
      toast.error("Please fill name, 10-digit phone, address and 6-digit pincode.");
      return;
    }
    localStorage.setItem("plately:checkout", JSON.stringify({ addr, pay }));

    // COD doesn't need OTP — place order directly.
    if (!payMeta.needsOtp) {
      placeOrder();
      return;
    }

    setSending(true);
    const code = generateOtp();
    setGeneratedOtp(code);
    // Simulate SMS gateway delay
    await new Promise((r) => setTimeout(r, 700));
    setSending(false);
    setStep("otp");
    setOtp("");
    toast.success(`OTP sent to +91 ${addr.phone}`, {
      description: `Demo OTP: ${code} (auto-shown — real SMS in production)`,
      duration: 8000,
    });
  }

  async function handleResend() {
    setSending(true);
    const code = generateOtp();
    setGeneratedOtp(code);
    await new Promise((r) => setTimeout(r, 500));
    setSending(false);
    setOtp("");
    toast.success(`New OTP sent`, { description: `Demo OTP: ${code}`, duration: 8000 });
  }

  async function handleVerify() {
    if (otp.length !== 6) {
      toast.error("Enter the 6-digit OTP.");
      return;
    }
    setVerifying(true);
    await new Promise((r) => setTimeout(r, 600));
    setVerifying(false);
    if (otp !== generatedOtp) {
      toast.error("Incorrect OTP. Try again or resend.");
      return;
    }
    toast.success("OTP verified ✓");
    placeOrder();
  }

  function placeOrder() {
    const id = "PLT-" + Math.random().toString(36).slice(2, 8).toUpperCase();
    setOrderId(id);
    setStep("success");
    toast.success(`Order ${id} placed on ${platform.name}!`);
  }

  function handleContinueOnPlatform() {
    openExternal(orderUrl);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {step === "success" ? "Order placed 🎉" : `Buy ${offer.itemName} · ₹${final}`}
          </DialogTitle>
          {step !== "success" && (
            <div className="text-sm text-muted-foreground">
              {step === "form"
                ? <>Confirm address & payment, then verify OTP to place the order on <span className="font-semibold" style={{ color: platform.color }}>{platform.name}</span>.</>
                : <>Enter the 6-digit OTP sent to <span className="font-semibold">+91 {addr.phone}</span>.</>}
            </div>
          )}
        </DialogHeader>

        {step === "form" && (
          <div className="space-y-4">
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
                    <span className="font-medium flex-1">{p.label}</span>
                    {p.needsOtp && (
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">OTP</span>
                    )}
                  </label>
                ))}
              </RadioGroup>
            </section>

            <p className="rounded-xl bg-muted/60 p-2.5 text-[11px] leading-relaxed text-muted-foreground">
              Plately verifies your phone with an OTP, then opens{" "}
              <span className="font-semibold" style={{ color: platform.color }}>{platform.name}</span>{" "}
              to complete delivery & payment.
            </p>
          </div>
        )}

        {step === "otp" && (
          <div className="space-y-4 py-2">
            <div className="rounded-2xl border border-border bg-card p-4 text-center">
              <ShieldCheck className="mx-auto h-8 w-8 text-primary" />
              <p className="mt-2 text-sm text-muted-foreground">
                Enter the 6-digit code we sent to verify your number.
              </p>
              <div className="mt-4 flex justify-center">
                <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} className="h-11 w-11 text-lg" />
                    <InputOTPSlot index={1} className="h-11 w-11 text-lg" />
                    <InputOTPSlot index={2} className="h-11 w-11 text-lg" />
                    <InputOTPSlot index={3} className="h-11 w-11 text-lg" />
                    <InputOTPSlot index={4} className="h-11 w-11 text-lg" />
                    <InputOTPSlot index={5} className="h-11 w-11 text-lg" />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <button
                onClick={handleResend}
                disabled={sending}
                className="mt-3 text-xs font-semibold text-primary hover:underline disabled:opacity-50"
              >
                {sending ? "Sending…" : "Resend OTP"}
              </button>
            </div>
          </div>
        )}

        {step === "success" && (
          <div className="space-y-3 py-2 text-center">
            <CheckCircle2 className="mx-auto h-14 w-14 text-green-500" />
            <p className="text-sm text-muted-foreground">
              Payment confirmed via <span className="font-semibold">{payMeta.label}</span>.
            </p>
            <div className="rounded-2xl border border-border bg-card p-3 text-left text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Order ID</span><span className="font-mono font-semibold">{orderId}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Item</span><span className="font-semibold">{offer.itemName}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span className="font-semibold">₹{final}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Platform</span><span className="font-semibold" style={{ color: platform.color }}>{platform.name}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Deliver to</span><span className="font-semibold truncate ml-2">{addr.hostel || addr.line1}</span></div>
            </div>
            <p className="rounded-xl bg-muted/60 p-2.5 text-[11px] leading-relaxed text-muted-foreground">
              Tap below to track & complete the order on {platform.name}.
            </p>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          {step === "form" && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={handleProceed} disabled={sending} className="gap-1.5">
                {sending && <Loader2 className="h-4 w-4 animate-spin" />}
                {payMeta.needsOtp ? "Send OTP" : "Place order"}
              </Button>
            </>
          )}
          {step === "otp" && (
            <>
              <Button variant="outline" onClick={() => setStep("form")}>Back</Button>
              <Button onClick={handleVerify} disabled={verifying || otp.length !== 6} className="gap-1.5">
                {verifying && <Loader2 className="h-4 w-4 animate-spin" />}
                Verify & Pay ₹{final}
              </Button>
            </>
          )}
          {step === "success" && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Done</Button>
              <Button onClick={handleContinueOnPlatform} className="gap-1.5">
                Open {platform.name} <ExternalLink className="h-4 w-4" />
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
