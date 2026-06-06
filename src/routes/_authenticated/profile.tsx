import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { toast } from "sonner";
import { Camera, Loader2, LogOut, Wallet, Gift } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Your profile — Plately" },
      { name: "description", content: "Manage your Plately profile, hostel, diet and personal details." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProfilePage,
});

type Profile = {
  id: string;
  full_name: string | null;
  college: string | null;
  year_of_study: number | null;
  phone: string | null;
  hostel: string | null;
  diet: "veg" | "non-veg" | "vegan" | "eggetarian" | "no-preference" | null;
  avatar_url: string | null;
  wallet_balance: number;
  referral_code: string;
};

function ProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (data) setProfile(data as Profile);
    })();
  }, []);

  const save = async () => {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: profile.full_name,
        college: profile.college,
        year_of_study: profile.year_of_study,
        phone: profile.phone,
        hostel: profile.hostel,
        diet: profile.diet,
      })
      .eq("id", profile.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Profile saved");
  };

  const uploadAvatar = async (file: File) => {
    if (!profile) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${profile.id}/avatar.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
      const cacheBust = `${publicUrl}?t=${Date.now()}`;
      const { error: dbErr } = await supabase.from("profiles").update({ avatar_url: cacheBust }).eq("id", profile.id);
      if (dbErr) throw dbErr;
      setProfile({ ...profile, avatar_url: cacheBust });
      toast.success("Avatar updated");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="grid h-[60vh] place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <main className="mx-auto max-w-2xl space-y-4 px-4 py-6">
        {/* Hero card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-warm p-6 text-primary-foreground shadow-glow">
          <div className="flex items-center gap-4">
            <label className="relative grid h-20 w-20 cursor-pointer place-items-center overflow-hidden rounded-2xl bg-white/20 text-3xl ring-4 ring-white/30">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <span>{profile.full_name?.[0]?.toUpperCase() ?? "🙂"}</span>
              )}
              <span className="absolute bottom-1 right-1 grid h-6 w-6 place-items-center rounded-full bg-foreground text-background">
                {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}
              </span>
              <input type="file" accept="image/*" className="hidden"
                onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])} />
            </label>
            <div className="flex-1">
              <p className="text-xs uppercase tracking-widest opacity-80">CheapBite member</p>
              <h1 className="font-display text-2xl font-bold leading-tight">{profile.full_name || "Welcome"}</h1>
              <p className="mt-0.5 text-xs opacity-90">Ref code · <span className="font-semibold">{profile.referral_code}</span></p>
            </div>
          </div>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-3">
          <Link to="/wallet" className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-card transition hover:-translate-y-0.5">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-success/15 text-success"><Wallet className="h-5 w-5" /></span>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Wallet</p>
              <p className="font-display text-lg font-bold">₹{profile.wallet_balance}</p>
            </div>
          </Link>
          <Link to="/referrals" className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-card transition hover:-translate-y-0.5">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary"><Gift className="h-5 w-5" /></span>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Invite</p>
              <p className="font-display text-lg font-bold">Earn ₹50</p>
            </div>
          </Link>
        </div>

        {/* Form */}
        <div className="space-y-3 rounded-3xl border border-border bg-card p-5 shadow-card">
          <h2 className="font-display text-base font-bold">Your details</h2>
          <Row label="Full name">
            <Input value={profile.full_name ?? ""} onChange={(v) => setProfile({ ...profile, full_name: v })} />
          </Row>
          <Row label="College">
            <Input placeholder="e.g. IIT Bombay" value={profile.college ?? ""} onChange={(v) => setProfile({ ...profile, college: v })} />
          </Row>
          <div className="grid grid-cols-2 gap-3">
            <Row label="Year">
              <select value={profile.year_of_study ?? ""} onChange={(e) => setProfile({ ...profile, year_of_study: e.target.value ? +e.target.value : null })}
                className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary">
                <option value="">—</option>
                {[1,2,3,4,5].map(n => <option key={n} value={n}>Year {n}</option>)}
              </select>
            </Row>
            <Row label="Phone">
              <Input type="tel" placeholder="+91..." value={profile.phone ?? ""} onChange={(v) => setProfile({ ...profile, phone: v })} />
            </Row>
          </div>
          <Row label="Hostel / Address">
            <Input placeholder="e.g. H-12, Block C" value={profile.hostel ?? ""} onChange={(v) => setProfile({ ...profile, hostel: v })} />
          </Row>
          <Row label="Diet preference">
            <div className="flex flex-wrap gap-2">
              {(["veg","non-veg","vegan","eggetarian","no-preference"] as const).map(d => (
                <button key={d} type="button" onClick={() => setProfile({ ...profile, diet: d })}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition ${
                    profile.diet === d
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-secondary text-secondary-foreground"
                  }`}>{d.replace("-", " ")}</button>
              ))}
            </div>
          </Row>

          <button onClick={save} disabled={saving}
            className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-warm font-semibold text-primary-foreground shadow-glow disabled:opacity-60">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}Save changes
          </button>
        </div>

        <button onClick={signOut} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card py-3 text-sm font-medium text-destructive hover:bg-destructive/5">
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </main>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

function Input(props: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <input
      type={props.type ?? "text"}
      placeholder={props.placeholder}
      value={props.value}
      onChange={(e) => props.onChange(e.target.value)}
      className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none transition focus:border-primary focus:shadow-glow"
    />
  );
}
