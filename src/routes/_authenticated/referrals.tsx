import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { toast } from "sonner";
import { ArrowLeft, Copy, Gift, Share2, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/referrals")({
  component: ReferralsPage,
});

type Ref = {
  id: string;
  referee_id: string;
  reward_amount: number;
  status: string;
  created_at: string;
};

function ReferralsPage() {
  const [code, setCode] = useState<string>("");
  const [refs, setRefs] = useState<Ref[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const [{ data: p }, { data: r }] = await Promise.all([
        supabase.from("profiles").select("referral_code").eq("id", user.id).maybeSingle(),
        supabase.from("referrals").select("*").eq("referrer_id", user.id).order("created_at", { ascending: false }),
      ]);
      setCode(p?.referral_code ?? "");
      setRefs((r ?? []) as Ref[]);
      setLoading(false);
    })();
  }, []);

  const link = typeof window !== "undefined" ? `${window.location.origin}/auth?mode=signup&ref=${code}` : "";
  const message = `Hey! I'm using CheapBite to find the cheapest food across Swiggy, Zomato, and 13+ apps. Sign up with my code ${code} and we BOTH get ₹50: ${link}`;

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  const share = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: "CheapBite", text: message, url: link }); } catch {}
    } else {
      copy(message, "Invite message");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="grid h-[60vh] place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      </div>
    );
  }

  const totalEarned = refs.reduce((a, b) => a + b.reward_amount, 0);

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <Link to="/profile" className="mb-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to profile
        </Link>

        <div className="rounded-3xl bg-gradient-warm p-6 text-center text-primary-foreground shadow-glow">
          <Gift className="mx-auto h-10 w-10" />
          <h1 className="mt-2 font-display text-3xl font-bold">Give ₹50, Get ₹50</h1>
          <p className="mt-1 text-sm opacity-90">For every friend who joins with your code</p>
        </div>

        <div className="mt-4 rounded-3xl border border-border bg-card p-5 shadow-card">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Your code</p>
          <div className="mt-2 flex items-center gap-2">
            <code className="flex-1 rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 py-3 text-center font-display text-2xl font-bold tracking-widest text-primary">
              {code}
            </code>
            <button onClick={() => copy(code, "Code")} className="grid h-12 w-12 place-items-center rounded-xl bg-secondary hover:bg-accent">
              <Copy className="h-4 w-4" />
            </button>
          </div>

          <button onClick={share} className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-foreground font-semibold text-background">
            <Share2 className="h-4 w-4" /> Share with friends
          </button>
          <button onClick={() => copy(link, "Link")} className="mt-2 w-full truncate rounded-xl border border-border bg-secondary px-3 py-2 text-xs text-muted-foreground">
            {link}
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Stat label="Friends joined" value={refs.length} />
          <Stat label="You've earned" value={`₹${totalEarned}`} />
        </div>

        <h2 className="mt-6 mb-2 font-display text-sm font-bold uppercase tracking-widest text-muted-foreground">History</h2>
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          {refs.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">No referrals yet. Share your code above 👆</p>
          ) : (
            refs.map((r, i) => (
              <div key={r.id} className={`flex items-center justify-between p-4 ${i !== 0 ? "border-t border-border" : ""}`}>
                <div>
                  <p className="text-sm font-semibold">Friend joined</p>
                  <p className="text-[11px] text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</p>
                </div>
                <span className="font-display text-base font-bold text-success">+₹{r.reward_amount}</span>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 text-center shadow-card">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold">{value}</p>
    </div>
  );
}
