-- ==========================================
-- SETTINGS TABLE FOR DELIVERY & LOGISTICS
-- Run this in your Supabase SQL Editor
-- ==========================================

CREATE TABLE IF NOT EXISTS public.settings (
  id TEXT PRIMARY KEY DEFAULT 'store_settings',
  store_open BOOLEAN DEFAULT true,
  delivery_radius NUMERIC DEFAULT 10,
  min_order_amount NUMERIC DEFAULT 100,
  base_delivery_fee NUMERIC DEFAULT 20,
  store_address TEXT,
  store_lat NUMERIC,
  store_lng NUMERIC,
  delivery_slots JSONB DEFAULT '["08:00 - 10:00", "10:00 - 12:00", "12:00 - 14:00", "14:00 - 16:00", "16:00 - 18:00", "18:00 - 20:00", "20:00 - 22:00"]'::jsonb,
  support_phone TEXT DEFAULT '+91 63049 82511',
  estimated_delivery_time TEXT DEFAULT '30-45 mins',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Allow Public to read settings
CREATE POLICY "Public can read settings" 
ON public.settings FOR SELECT TO public USING (true);

-- Allow Admins to manage settings
CREATE POLICY "Admins can manage settings" 
ON public.settings FOR ALL TO authenticated 
USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Seed initial data
INSERT INTO public.settings (id, store_address, store_lat, store_lng)
VALUES ('store_settings', 'Main Distribution Hub, Sector 5, Mumbai', 19.0760, 72.8777)
ON CONFLICT (id) DO NOTHING;
