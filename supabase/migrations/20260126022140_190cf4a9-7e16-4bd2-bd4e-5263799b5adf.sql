-- Add page_font column to stories table for per-story page typography
ALTER TABLE public.stories 
ADD COLUMN page_font TEXT NOT NULL DEFAULT 'Inter';

-- Add a comment for documentation
COMMENT ON COLUMN public.stories.page_font IS 'Google Font name to use for story page text (e.g., Inter, Nunito, Quicksand)';