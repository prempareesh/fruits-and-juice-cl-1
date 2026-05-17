-- MIGRATION: REPAIR SETTINGS TABLE
-- This script ensures the settings table matches the requested schema exactly.

-- 1. Rename columns if they exist under old names
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'store_open') THEN
    ALTER TABLE public.settings RENAME COLUMN store_open TO store_live;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'delivery_radius') THEN
    ALTER TABLE public.settings RENAME COLUMN delivery_radius TO service_radius_km;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'base_delivery_fee') THEN
    ALTER TABLE public.settings RENAME COLUMN base_delivery_fee TO delivery_fee;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'min_order_amount') THEN
    ALTER TABLE public.settings RENAME COLUMN min_order_amount TO minimum_order;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'estimated_delivery_time') THEN
    ALTER TABLE public.settings RENAME COLUMN estimated_delivery_time TO delivery_time;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'store_address') THEN
    ALTER TABLE public.settings RENAME COLUMN store_address TO warehouse_address;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'store_lat') THEN
    ALTER TABLE public.settings RENAME COLUMN store_lat TO latitude;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'store_lng') THEN
    ALTER TABLE public.settings RENAME COLUMN store_lng TO longitude;
  END IF;
END $$;

-- 2. Ensure all required columns exist with correct types
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS store_live BOOLEAN DEFAULT true;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS service_radius_km NUMERIC DEFAULT 10;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS delivery_fee NUMERIC DEFAULT 20;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS minimum_order NUMERIC DEFAULT 100;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS delivery_time TEXT DEFAULT '30-45 mins';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS warehouse_address TEXT;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS latitude NUMERIC;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS longitude NUMERIC;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- 3. Ensure a default row exists
INSERT INTO public.settings (id, store_live, service_radius_km, delivery_fee, minimum_order, delivery_time)
VALUES ('store_settings', true, 10, 20, 100, '30-45 mins')
ON CONFLICT (id) DO NOTHING;
