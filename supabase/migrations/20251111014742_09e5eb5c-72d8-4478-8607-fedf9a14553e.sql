-- Add RLS policies for admin management of user_roles table
CREATE POLICY "Admins can insert user roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update user roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete user roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Seed the first admin user (tjhinn@gmail.com with ID from auth logs)
INSERT INTO public.user_roles (user_id, role)
VALUES ('54d2d627-2f23-469b-9e74-d18c155b800f', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;