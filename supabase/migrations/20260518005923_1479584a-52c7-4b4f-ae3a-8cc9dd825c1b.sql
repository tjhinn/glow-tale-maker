
-- Make bucket private
UPDATE storage.buckets SET public = false WHERE id = 'hero-photos';

-- Drop old permissive policies on hero-photos
DROP POLICY IF EXISTS "Anyone can read from hero-photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view hero photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete hero photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update their hero photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload hero photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload to hero-photos" ON storage.objects;

-- Allow anonymous + authenticated uploads (uploads still happen client-side
-- for derivative images like flattened covers; primary child-photo upload
-- now goes through the upload-hero-photo edge function which uses the
-- service role anyway).
CREATE POLICY "Anyone can upload hero photos"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'hero-photos');

-- Only admins can read / modify / delete hero photos directly.
-- Service role bypasses RLS and is used by edge functions for signed URLs.
CREATE POLICY "Admins can read hero photos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'hero-photos' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update hero photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'hero-photos' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete hero photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'hero-photos' AND has_role(auth.uid(), 'admin'::app_role));
