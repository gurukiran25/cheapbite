
-- 1) Restrict SELECT to owner only
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- 2) Prevent users from mutating sensitive columns via UPDATE
CREATE OR REPLACE FUNCTION public.prevent_protected_profile_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.wallet_balance IS DISTINCT FROM OLD.wallet_balance THEN
    RAISE EXCEPTION 'wallet_balance cannot be modified directly';
  END IF;
  IF NEW.referral_code IS DISTINCT FROM OLD.referral_code THEN
    RAISE EXCEPTION 'referral_code cannot be modified';
  END IF;
  IF NEW.referred_by IS DISTINCT FROM OLD.referred_by THEN
    RAISE EXCEPTION 'referred_by cannot be modified';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_columns ON public.profiles;
CREATE TRIGGER protect_profile_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  WHEN (current_setting('role', true) <> 'service_role')
  EXECUTE FUNCTION public.prevent_protected_profile_changes();
