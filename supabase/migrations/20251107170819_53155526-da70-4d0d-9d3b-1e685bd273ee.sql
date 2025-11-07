-- Create storage bucket for generated PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('generated-pdfs', 'generated-pdfs', false)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for generated-pdfs bucket
-- Only admins can upload PDFs
CREATE POLICY "Admins can upload PDFs"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'generated-pdfs' 
  AND auth.uid() IN (
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  )
);

-- Only admins can view PDFs
CREATE POLICY "Admins can view PDFs"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'generated-pdfs'
  AND auth.uid() IN (
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  )
);

-- Only admins can update PDFs
CREATE POLICY "Admins can update PDFs"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'generated-pdfs'
  AND auth.uid() IN (
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  )
);

-- Only admins can delete PDFs
CREATE POLICY "Admins can delete PDFs"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'generated-pdfs'
  AND auth.uid() IN (
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  )
);