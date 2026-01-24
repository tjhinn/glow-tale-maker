-- Add title_font column to stories table for per-story cover title fonts
ALTER TABLE public.stories 
ADD COLUMN title_font text NOT NULL DEFAULT 'Bubblegum Sans';