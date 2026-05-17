-- ==========================================
-- PRODUCTION PROFILE ENHANCEMENT
-- Run this in your Supabase SQL Editor
-- ==========================================

-- 1. Add Address & Profile Fields
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS saved_addresses JSONB DEFAULT '[]'::jsonB;

-- 2. Update RLS to allow users to update their own address
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 3. Add column to settings if not exists (Audit Fix)
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- 4. Notify about success
COMMENT ON TABLE public.profiles IS 'User profiles with persisted delivery settings';
