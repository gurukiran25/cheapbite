import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { toast } from "sonner";
import { Mail, Lock, User as UserIcon, Phone, Gift, Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => ({
    ref: typeof s.ref === "string" ? s.ref : undefined,
    mode: s.mode === "signup" ? "signup" : "login",
  }),
  head: () => ({
    meta: [
      { title: "Sign in or sign up — Plately" },
      { name: "description", content: "Create your Plately account to save searches, earn referrals, and compare food prices faster." },
      { property: "og:title", content: "Join Plately — save on every food order" },
      { property: "og:description", content: "Sign up free and start saving ₹30–₹80 per order across Swiggy, Zomato and more." },
    ],
  }),
  component: AuthPage,
});

const signupSchema = z.object({
  fullName: z.string().trim().min(2, "Name too short").max(80),
  email: z.string().trim().email("Invalid email").max(255),
  phone: z.string().trim().regex(/^\+?\d{10,15}$/, "Use 10-15 digits"),
  password: z.string().min(8, "Min 8 characters").max(72),
  referral: z.string().trim().max(20).optional(),
});

const loginSchema = z.object({
  email: z.string().trim().email("Invalid email"),
  password: z.string().min(1, "Required"),
});

function AuthPage() {
  const { ref, mode: initial } = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">(initial);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    referral: ref ?? "",
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate({ to: "/profile" });
    });
  }, [navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const parsed = signupSchema.safeParse(form);
        if (!parsed.success) {
          toast.error(parsed.error.errors[0].message);
          return;
        }
        const { data, error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            emailRedirectTo: `${window.location.origin}/profile`,
            data: {
              full_name: parsed.data.fullName,
              phone: parsed.data.phone,
              referral_code: parsed.data.referral?.toUpperCase() || null,
            },
          },
        });
        if (error) {
          const code = (error as { code?: string }).code;
          const msg = error.message?.toLowerCase() ?? "";
          if (code === "weak_password" || msg.includes("weak") || msg.includes("pwned")) {
            toast.error("That password is too common. Try mixing words, numbers, and symbols (e.g. Chai$Latte#2026).");
          } else if (msg.includes("already") || msg.includes("registered")) {
            toast.error("Email already registered — try logging in.");
            setMode("login");
          } else {
            toast.error(error.message);
          }
          return;
        }
        if (!data.session) {
          toast.success("Check your email to confirm your account ✉️");
          setMode("login");
          return;
        }
        toast.success("Welcome! ₹50 added to your wallet 🎉");
        navigate({ to: "/profile" });
      } else {
        const parsed = loginSchema.safeParse(form);
        if (!parsed.success) {
          toast.error(parsed.error.errors[0].message);
          return;
        }
        const { error } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });
        if (error) {
          const msg = error.message?.toLowerCase() ?? "";
          if (msg.includes("invalid login") || msg.includes("invalid credentials")) {
            toast.error("Wrong email or password.");
          } else if (msg.includes("not confirmed") || msg.includes("confirm")) {
            toast.error("Please confirm your email first — check your inbox.");
          } else {
            toast.error(error.message);
          }
          return;
        }
        toast.success("Welcome back!");
        navigate({ to: "/" });
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-md px-4 py-8">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
          <div className="mb-6 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-warm text-2xl shadow-glow">
              🍱
            </div>
            <h1 className="mt-3 font-display text-2xl font-bold">
              {mode === "signup" ? "Join CheapBite" : "Welcome back"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {mode === "signup"
                ? "Get ₹50 instantly. Save on every order."
                : "Pick up where you left off"}
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-3">
            {mode === "signup" && (
              <Field icon={<UserIcon className="h-4 w-4" />}
                placeholder="Full name"
                value={form.fullName}
                onChange={(v) => setForm({ ...form, fullName: v })} />
            )}
            <Field icon={<Mail className="h-4 w-4" />}
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(v) => setForm({ ...form, email: v })} />
            {mode === "signup" && (
              <Field icon={<Phone className="h-4 w-4" />}
                type="tel"
                placeholder="Phone (+91...)"
                value={form.phone}
                onChange={(v) => setForm({ ...form, phone: v })} />
            )}
            <Field icon={<Lock className="h-4 w-4" />}
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={(v) => setForm({ ...form, password: v })} />
            {mode === "signup" && (
              <Field icon={<Gift className="h-4 w-4 text-primary" />}
                placeholder="Referral code (optional) — both get ₹50"
                value={form.referral}
                onChange={(v) => setForm({ ...form, referral: v.toUpperCase() })} />
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-warm font-semibold text-primary-foreground shadow-glow transition active:scale-[0.98] disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "signup" ? "Create account & claim ₹50" : "Log in"}
            </button>
          </form>

          <div className="mt-5 text-center text-sm">
            {mode === "signup" ? (
              <>Already have an account?{" "}
                <button onClick={() => setMode("login")} className="font-semibold text-primary">Log in</button></>
            ) : (
              <>New here?{" "}
                <button onClick={() => setMode("signup")} className="font-semibold text-primary">Sign up</button></>
            )}
          </div>
        </div>

        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          Phone OTP sign-in coming soon. <Link to="/" className="underline">Back to home</Link>
        </p>
      </main>
    </div>
  );
}

function Field({ icon, type = "text", placeholder, value, onChange }: {
  icon: React.ReactNode;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 w-full rounded-xl border border-border bg-background pl-11 pr-4 text-sm outline-none transition focus:border-primary focus:shadow-glow"
      />
    </div>
  );
}
