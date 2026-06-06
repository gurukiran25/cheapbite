import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { ArrowLeft, Wallet as WalletIcon, TrendingUp, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/wallet")({
  head: () => ({
    meta: [
      { title: "Wallet — Plately" },
      { name: "description", content: "Track your Plately wallet balance and transaction history." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: WalletPage,
});

type Txn = {
  id: string;
  amount: number;
  type: string;
  note: string | null;
  created_at: string;
};

function WalletPage() {
  const [balance, setBalance] = useState<number | null>(null);
  const [txns, setTxns] = useState<Txn[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const [{ data: p }, { data: t }] = await Promise.all([
        supabase.from("profiles").select("wallet_balance").eq("id", user.id).maybeSingle(),
        supabase.from("wallet_txns").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
      ]);
      setBalance(p?.wallet_balance ?? 0);
      setTxns((t ?? []) as Txn[]);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="grid h-[60vh] place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      </div>
    );
  }

  const earned = txns.filter(t => t.amount > 0).reduce((a, b) => a + b.amount, 0);

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <Link to="/profile" className="mb-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to profile
        </Link>

        <div className="overflow-hidden rounded-3xl bg-gradient-warm p-6 text-primary-foreground shadow-glow">
          <div className="flex items-center justify-between">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/20"><WalletIcon className="h-6 w-6" /></span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest">
              <TrendingUp className="h-3 w-3" /> Earned ₹{earned}
            </span>
          </div>
          <p className="mt-4 text-xs uppercase tracking-widest opacity-80">Available balance</p>
          <p className="font-display text-5xl font-bold">₹{balance}</p>
          <p className="mt-1 text-xs opacity-90">Use as instant discount on your next order</p>
        </div>

        <h2 className="mt-6 mb-2 font-display text-sm font-bold uppercase tracking-widest text-muted-foreground">Activity</h2>
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          {txns.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">No activity yet</p>
          ) : (
            txns.map((t, i) => (
              <div key={t.id} className={`flex items-center justify-between gap-3 p-4 ${i !== 0 ? "border-t border-border" : ""}`}>
                <div>
                  <p className="text-sm font-semibold capitalize">{t.type.replace("_", " ")}</p>
                  <p className="text-[11px] text-muted-foreground">{t.note} · {new Date(t.created_at).toLocaleString()}</p>
                </div>
                <span className={`font-display text-base font-bold ${t.amount > 0 ? "text-success" : "text-destructive"}`}>
                  {t.amount > 0 ? "+" : ""}₹{t.amount}
                </span>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
