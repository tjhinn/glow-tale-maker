-- Rename illustrated_hero_url to personalized_cover_url in orders table
ALTER TABLE orders 
RENAME COLUMN illustrated_hero_url TO personalized_cover_url;

-- Add comment to document the column purpose
COMMENT ON COLUMN orders.personalized_cover_url IS 'URL of the AI-generated personalized book cover that incorporates the child''s likeness, pet, favorite color theme, and personalized title typography';
