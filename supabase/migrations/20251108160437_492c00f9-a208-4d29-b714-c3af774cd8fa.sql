-- Create carousel_images table
CREATE TABLE public.carousel_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL,
  alt_text text NOT NULL DEFAULT 'Storybook illustration',
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.carousel_images ENABLE ROW LEVEL SECURITY;

-- Public can view active images
CREATE POLICY "Anyone can view active carousel images"
ON public.carousel_images
FOR SELECT
USING (is_active = true);

-- Admins can manage all carousel images
CREATE POLICY "Admins can insert carousel images"
ON public.carousel_images
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update carousel images"
ON public.carousel_images
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete carousel images"
ON public.carousel_images
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Add update trigger
CREATE TRIGGER update_carousel_images_updated_at
  BEFORE UPDATE ON public.carousel_images
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();