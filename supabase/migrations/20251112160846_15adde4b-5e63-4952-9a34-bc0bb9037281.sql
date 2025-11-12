-- Drop the old constraint that only allows 'boy' or 'girl'
ALTER TABLE public.stories 
DROP CONSTRAINT stories_hero_gender_check;

-- Add new constraint allowing 'boy', 'girl', OR 'both'
ALTER TABLE public.stories 
ADD CONSTRAINT stories_hero_gender_check 
CHECK (hero_gender = ANY (ARRAY['boy'::text, 'girl'::text, 'both'::text]));