-- ==========================================
-- PRODUCTION RLS FIX FOR FRESHFLOW
-- Run this in your Supabase SQL Editor
-- ==========================================

-- 1. Enable RLS on Products (if not already enabled)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing conflicting policies
DROP POLICY IF EXISTS "Public can read products" ON public.products;
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;

-- 3. Create Public Read Access
-- Everyone (including customers) can view products
CREATE POLICY "Public read products" 
ON public.products 
FOR SELECT 
TO public 
USING (true);

-- 4. Create Admin Full Access
-- Only users with role = 'admin' in profiles table can manage products
CREATE POLICY "Admins manage products" 
ON public.products 
FOR ALL 
TO authenticated 
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- 5. Fix Profiles RLS (Crucial for the lookup above to work)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read own profile" ON public.profiles;

CREATE POLICY "Users can read all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (true);

-- 6. Ensure admin@freshflow.com exists with 'admin' role
-- (Optional: Run this if the user is missing from profiles)
-- INSERT INTO public.profiles (id, email, role, full_name)
-- VALUES ('<YOUR_USER_ID>', 'admin@freshflow.com', 'admin', 'System Admin')
-- ON CONFLICT (id) DO UPDATE SET role = 'admin';
