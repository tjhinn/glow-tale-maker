-- Create reviews table for homepage customer reviews
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_name TEXT NOT NULL,
  review_text TEXT NOT NULL,
  rating INTEGER NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies (same pattern as carousel_images)
CREATE POLICY "Anyone can view active reviews" 
ON reviews 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can insert reviews" 
ON reviews 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update reviews" 
ON reviews 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete reviews" 
ON reviews 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_reviews_updated_at 
BEFORE UPDATE ON reviews 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- Seed initial reviews from the current hardcoded data
INSERT INTO reviews (reviewer_name, review_text, rating, display_order) VALUES
  ('Sarah M.', 'My daughter was absolutely thrilled to see herself as the hero! The quality is stunning.', 5, 0),
  ('Michael T.', 'Best gift I''ve ever given. The personalization makes it so special and unique.', 5, 1),
  ('Emily R.', 'The illustrations are beautiful and the story had my son captivated from start to finish!', 5, 2),
  ('David K.', 'Worth every penny. My kids ask to read their fairy tale every single night.', 5, 3);