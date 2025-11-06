-- Create storage bucket for hero photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('hero-photos', 'hero-photos', false);

-- RLS policies for hero-photos bucket
CREATE POLICY "Anyone can upload hero photos"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'hero-photos');

CREATE POLICY "Anyone can view hero photos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'hero-photos');

CREATE POLICY "Anyone can update their hero photos"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'hero-photos');

CREATE POLICY "Anyone can delete hero photos"
ON storage.objects
FOR DELETE
USING (bucket_id = 'hero-photos');