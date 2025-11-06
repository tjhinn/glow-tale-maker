-- Task 0.1: Create User Roles System
-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS Policies for user_roles
CREATE POLICY "Admins can view all user roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Seed admin user (tjhinn@gmail.com will need to sign up first, then this will grant admin)
-- Note: This is a placeholder - actual seeding happens after user signs up

-- Task 0.2: Create Stories Table
CREATE TABLE public.stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  moral TEXT NOT NULL,
  hero_gender TEXT NOT NULL CHECK (hero_gender IN ('boy', 'girl')),
  illustration_style TEXT DEFAULT 'whimsical_storybook' NOT NULL,
  pages JSONB NOT NULL DEFAULT '[]', -- Array of 24 page texts
  image_prompts JSONB NOT NULL DEFAULT '[]', -- Array of 12 spread prompts
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for stories
CREATE POLICY "Anyone can view active stories"
  ON public.stories
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can insert stories"
  ON public.stories
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update stories"
  ON public.stories
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete stories"
  ON public.stories
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to stories table
CREATE TRIGGER update_stories_updated_at
  BEFORE UPDATE ON public.stories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Task 0.3: Create Orders Table
-- Create order_status enum
CREATE TYPE public.order_status AS ENUM (
  'payment_received',
  'generating_images',
  'pending_admin_review',
  'approved',
  'email_sent',
  'cancelled'
);

-- Create orders table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID REFERENCES public.stories(id) ON DELETE RESTRICT NOT NULL,
  user_email TEXT NOT NULL,
  personalization_data JSONB NOT NULL, -- {name, gender, petType, petName, favoriteColor, favoriteFood, city, photoUrl}
  status public.order_status DEFAULT 'payment_received' NOT NULL,
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  amount_paid INTEGER, -- Amount in cents
  currency TEXT DEFAULT 'usd',
  discount_applied BOOLEAN DEFAULT false,
  discount_code TEXT,
  pdf_url TEXT,
  pdf_generated_at TIMESTAMP WITH TIME ZONE,
  admin_approved_at TIMESTAMP WITH TIME ZONE,
  email_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for orders (admin-only access)
CREATE POLICY "Admins can view all orders"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert orders"
  ON public.orders
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update orders"
  ON public.orders
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete orders"
  ON public.orders
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Attach updated_at trigger to orders
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX idx_orders_user_email ON public.orders(user_email);