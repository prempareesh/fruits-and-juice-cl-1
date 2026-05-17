-- ========================================================
-- JUICY APP: PRODUCTION-GRADE SYSTEM RESTORE (FINAL)
-- Fixes: Missing Columns, RPC Errors, and Data Integrity
-- ========================================================

-- 1. REPAIR PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  role TEXT DEFAULT 'customer',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add missing columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address TEXT;

-- 2. REPAIR ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id),
  total_amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'PENDING',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add missing columns to orders (Logistics & Payment)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_type TEXT; -- 'cod' or 'online'
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_phone TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_lat NUMERIC DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_lng NUMERIC DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_distance_km NUMERIC DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_fee NUMERIC DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_steps JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- 3. REPAIR ORDER_ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  variant_id UUID, -- Optional for juices
  quantity INTEGER NOT NULL,
  price_at_time NUMERIC NOT NULL,
  subtotal NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. CREATE ROBUST PLACE_ORDER_V2 RPC
-- This function handles stock, profile sync, and order creation atomically.
CREATE OR REPLACE FUNCTION public.place_order_v2(
  p_user_id UUID,
  p_address TEXT,
  p_total_amount NUMERIC,
  p_payment_type TEXT,
  p_items JSONB,
  p_initial_status TEXT DEFAULT 'PENDING',
  p_latitude NUMERIC DEFAULT 0,
  p_longitude NUMERIC DEFAULT 0,
  p_distance_km NUMERIC DEFAULT 0,
  p_delivery_fee NUMERIC DEFAULT 0,
  p_customer_name TEXT DEFAULT NULL,
  p_customer_phone TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_order_id UUID;
  v_item RECORD;
  v_current_stock INTEGER;
BEGIN
  -- 1. ATOMIC STOCK VALIDATION
  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(
    product_id UUID, 
    quantity INTEGER
  ) LOOP
    SELECT stock INTO v_current_stock FROM public.products WHERE id = v_item.product_id FOR UPDATE; 
    IF v_current_stock IS NULL THEN
      RETURN jsonb_build_object('success', false, 'message', 'Product not found: ' || v_item.product_id);
    END IF;
    IF v_current_stock < v_item.quantity THEN
      RETURN jsonb_build_object('success', false, 'message', 'Insufficient stock for one or more items');
    END IF;
  END LOOP;

  -- 2. ENSURE PROFILE EXISTS (Critical Fix)
  INSERT INTO public.profiles (id, full_name, phone, updated_at)
  VALUES (p_user_id, COALESCE(p_customer_name, 'Valued Customer'), COALESCE(p_customer_phone, ''), now())
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    phone = CASE WHEN EXCLUDED.phone <> '' THEN EXCLUDED.phone ELSE public.profiles.phone END,
    updated_at = now();

  -- 3. CREATE THE ORDER
  INSERT INTO public.orders (
    user_id, address, total_amount, payment_type, status, payment_status,
    delivery_lat, delivery_lng, delivery_distance_km, delivery_fee,
    customer_name, customer_phone, tracking_steps, created_at, updated_at
  ) VALUES (
    p_user_id, p_address, p_total_amount, p_payment_type, p_initial_status,
    CASE 
      WHEN lower(p_payment_type) = 'cod' THEN 'pending' 
      WHEN lower(p_payment_type) = 'online' AND p_initial_status = 'PENDING' THEN 'paid'
      ELSE 'pending_payment' 
    END,
    p_latitude, p_longitude, p_distance_km, p_delivery_fee, p_customer_name, p_customer_phone,
    jsonb_build_array(jsonb_build_object(
      'status', p_initial_status,
      'timestamp', now(),
      'description', 'Order placed successfully.',
      'label', 'Order Placed'
    )),
    now(), now()
  ) RETURNING id INTO v_order_id;

  -- 4. INSERT ITEMS & DECREMENT STOCK
  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(
    product_id UUID, variant_id UUID, quantity INTEGER, price_at_time NUMERIC, subtotal NUMERIC
  ) LOOP
    INSERT INTO public.order_items (
      order_id, product_id, variant_id, quantity, price_at_time, subtotal
    ) VALUES (
      v_order_id, v_item.product_id, v_item.variant_id, v_item.quantity, 
      v_item.price_at_time, COALESCE(v_item.subtotal, v_item.quantity * v_item.price_at_time)
    );
    UPDATE public.products SET stock = stock - v_item.quantity WHERE id = v_item.product_id;
  END LOOP;

  RETURN jsonb_build_object('success', true, 'message', 'Order placed', 'order_id', v_order_id);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'message', SQLERRM, 'detail', SQLSTATE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. PERMISSIONS
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.place_order_v2 TO anon, authenticated, service_role;

-- 6. RLS FIX (Ensure orders are visible to owners and admins)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
CREATE POLICY "Admins can view all orders" ON public.orders FOR ALL TO authenticated USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);
