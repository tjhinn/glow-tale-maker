-- Phase 1: Database Restructuring for Story Templates and Story Book Orders

-- Step 1: Add personalized_story column to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS personalized_story JSONB;

COMMENT ON COLUMN public.orders.personalized_story IS 'Stores personalized story content with title and pages array containing text and composited images';

-- Step 2: Restructure stories table (Fresh start approach)
-- Drop page_images since we're unifying into pages
ALTER TABLE public.stories 
DROP COLUMN IF EXISTS page_images;

-- Update comment to reflect new unified structure
COMMENT ON COLUMN public.stories.pages IS 'Unified page structure: [{"page": 1, "text": "...", "template_image_url": "...", "image_prompt": "..."}]';

-- Note: Existing stories will need to be re-uploaded by admin with new structure