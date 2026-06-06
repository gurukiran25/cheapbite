
-- 1) Attach the existing protection trigger so users cannot UPDATE wallet_balance / referral_code / referred_by directly
DROP TRIGGER IF EXISTS profiles_prevent_protected_changes ON public.profiles;
CREATE TRIGGER profiles_prevent_protected_changes
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_protected_profile_changes();

-- Also attach updated_at trigger if missing
DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
CREATE TRIGGER profiles_set_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 2) Restrict avatars bucket uploads to safe image MIME types
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Avatar upload own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Avatar update own folder" ON storage.objects;

CREATE POLICY "Avatar upload own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND (lower(coalesce(metadata->>'mimetype','')) IN ('image/jpeg','image/png','image/webp','image/gif'))
);

CREATE POLICY "Avatar update own folder"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND (lower(coalesce(metadata->>'mimetype','')) IN ('image/jpeg','image/png','image/webp','image/gif'))
);
