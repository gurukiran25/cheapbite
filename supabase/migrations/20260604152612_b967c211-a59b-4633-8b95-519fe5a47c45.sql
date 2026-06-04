
-- Diet preference enum
CREATE TYPE public.diet_pref AS ENUM ('veg', 'non-veg', 'vegan', 'eggetarian', 'no-preference');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  college TEXT,
  year_of_study INT,
  phone TEXT,
  hostel TEXT,
  diet diet_pref DEFAULT 'no-preference',
  avatar_url TEXT,
  wallet_balance INT NOT NULL DEFAULT 0,
  referral_code TEXT UNIQUE NOT NULL,
  referred_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Wallet transactions
CREATE TYPE public.wallet_txn_type AS ENUM ('signup_bonus', 'referral', 'order', 'cashback', 'refund', 'adjustment');

CREATE TABLE public.wallet_txns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount INT NOT NULL,
  type wallet_txn_type NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.wallet_txns TO authenticated;
GRANT ALL ON public.wallet_txns TO service_role;

ALTER TABLE public.wallet_txns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own wallet"
  ON public.wallet_txns FOR SELECT USING (auth.uid() = user_id);

CREATE INDEX wallet_txns_user_idx ON public.wallet_txns(user_id, created_at DESC);

-- Referrals
CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reward_amount INT NOT NULL DEFAULT 50,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(referee_id)
);

GRANT SELECT ON public.referrals TO authenticated;
GRANT ALL ON public.referrals TO service_role;

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see referrals they made or got"
  ON public.referrals FOR SELECT
  USING (auth.uid() = referrer_id OR auth.uid() = referee_id);

CREATE INDEX referrals_referrer_idx ON public.referrals(referrer_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Generate unique referral code
CREATE OR REPLACE FUNCTION public.gen_referral_code()
RETURNS TEXT LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  code TEXT;
  exists_already BOOLEAN;
BEGIN
  LOOP
    code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE referral_code = code) INTO exists_already;
    EXIT WHEN NOT exists_already;
  END LOOP;
  RETURN code;
END; $$;

-- Auto-create profile on signup + signup bonus + referral processing
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  new_code TEXT;
  ref_code TEXT;
  referrer_uuid UUID;
BEGIN
  new_code := public.gen_referral_code();
  ref_code := NEW.raw_user_meta_data->>'referral_code';

  IF ref_code IS NOT NULL AND length(ref_code) > 0 THEN
    SELECT id INTO referrer_uuid FROM public.profiles WHERE referral_code = upper(ref_code) LIMIT 1;
  END IF;

  INSERT INTO public.profiles (id, full_name, phone, referral_code, referred_by, wallet_balance)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone',
    new_code,
    referrer_uuid,
    50
  );

  INSERT INTO public.wallet_txns (user_id, amount, type, note)
  VALUES (NEW.id, 50, 'signup_bonus', 'Welcome to CheapBite!');

  IF referrer_uuid IS NOT NULL THEN
    UPDATE public.profiles SET wallet_balance = wallet_balance + 50 WHERE id = referrer_uuid;
    INSERT INTO public.wallet_txns (user_id, amount, type, note)
    VALUES (referrer_uuid, 50, 'referral', 'Referral bonus: friend joined');
    INSERT INTO public.referrals (referrer_id, referee_id, reward_amount, status)
    VALUES (referrer_uuid, NEW.id, 50, 'completed');
  END IF;

  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
