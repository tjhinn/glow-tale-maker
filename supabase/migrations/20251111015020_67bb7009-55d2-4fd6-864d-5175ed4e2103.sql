-- ============================================
-- HERO-PHOTOS BUCKET POLICIES (Public Bucket)
-- ============================================

-- Allow anyone to upload hero photos (for personalization form)
CREATE POLICY "Anyone can upload to hero-photos"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'hero-photos');

-- Allow anyone to view hero photos (public bucket)
CREATE POLICY "Anyone can read from hero-photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'hero-photos');

-- ============================================
-- GENERATED-PDFS BUCKET POLICIES (Private Bucket)
-- ============================================

-- Service role (edge functions) can upload PDFs - bypasses RLS
-- Admins can view all generated PDFs
CREATE POLICY "Admins can read generated-pdfs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'generated-pdfs' AND
  public.has_role(auth.uid(), 'admin')
);