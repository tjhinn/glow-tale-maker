-- Update stories table: remove image_prompts, add pre-generated image fields
ALTER TABLE stories 
  DROP COLUMN IF EXISTS image_prompts,
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
  ADD COLUMN IF NOT EXISTS page_images JSONB DEFAULT '[]'::jsonb;

-- Update orders table: add hero photo tracking
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS hero_photo_url TEXT,
  ADD COLUMN IF NOT EXISTS illustrated_hero_url TEXT;

-- Create story-images storage bucket for pre-generated story images
INSERT INTO storage.buckets (id, name, public)
VALUES ('story-images', 'story-images', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policy: Admins can upload story images
CREATE POLICY "Admins can upload story images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'story-images' 
    AND has_role(auth.uid(), 'admin'::app_role)
  );

-- RLS Policy: Anyone can view story images
CREATE POLICY "Anyone can view story images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'story-images');

-- RLS Policy: Admins can update story images
CREATE POLICY "Admins can update story images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'story-images' 
    AND has_role(auth.uid(), 'admin'::app_role)
  );

-- RLS Policy: Admins can delete story images
CREATE POLICY "Admins can delete story images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'story-images' 
    AND has_role(auth.uid(), 'admin'::app_role)
  );