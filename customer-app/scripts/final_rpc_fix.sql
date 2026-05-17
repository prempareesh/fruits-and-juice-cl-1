-- ==========================================
-- JUICY APP: COMPLETE COD ORDER RPC FIX (V3)
-- Run this in your Supabase SQL Editor
-- ==========================================

-- 1. FIX TABLE SCHEMA (Standardize columns)
DO $$ 
BEGIN 
  -- Fix Orders Table
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='payment_type') THEN
    ALTER TABLE public.orders ADD COLUMN payment_type TEXT;
  END IF;

  -- Sync payment_method to payment_type if it exists
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='payment_method') THEN
    UPDATE public.orders SET payment_type = payment_method WHERE payment_type IS NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='payment_status') THEN
    ALTER TABLE public.orders ADD COLUMN payment_status TEXT DEFAULT 'pending';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='delivery_lat') THEN
    ALTER TABLE public.orders ADD COLUMN delivery_lat NUMERIC;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='delivery_lng') THEN
    ALTER TABLE public.orders ADD COLUMN delivery_lng NUMERIC;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='delivery_distance_km') THEN
    ALTER TABLE public.orders ADD COLUMN delivery_distance_km NUMERIC DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='delivery_fee') THEN
    ALTER TABLE public.orders ADD COLUMN delivery_fee NUMERIC DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='tracking_steps') THEN
    ALTER TABLE public.orders ADD COLUMN tracking_steps JSONB DEFAULT '[]'::jsonb;
  END IF;

  -- Fix Order Items Table
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='order_items' AND column_name='variant_id') THEN
    ALTER TABLE public.order_items ADD COLUMN variant_id UUID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='order_items' AND column_name='price_at_time') THEN
    ALTER TABLE public.order_items ADD COLUMN price_at_time NUMERIC;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='order_items' AND column_name='subtotal') THEN
    ALTER TABLE public.order_items ADD COLUMN subtotal NUMERIC;
  END IF;
END $$;

-- 2. CREATE THE ATOMIC PLACE ORDER RPC
-- This is designed to exactly match the frontend payload
CREATE OR REPLACE FUNCTION public.place_order_v1(
  p_user_id UUID,
  p_address TEXT,
  p_total_amount NUMERIC,
  p_payment_type TEXT,
  p_items JSONB,
  p_initial_status TEXT DEFAULT 'PENDING',
  p_latitude NUMERIC DEFAULT 0,
  p_longitude NUMERIC DEFAULT 0,
  p_distance_km NUMERIC DEFAULT 0,
  p_delivery_fee NUMERIC DEFAULT 0
)
RETURNS JSONB AS $$
DECLARE
  v_order_id UUID;
  v_item RECORD;
BEGIN
  -- Deep Logging (visible in Supabase Dashboard -> Database -> Logs)
  RAISE NOTICE '[PLACE_ORDER] User: %, Amount: %, Type: %, Items: %', p_user_id, p_total_amount, p_payment_type, p_items;

  -- 1. Insert into orders
  INSERT INTO public.orders (
    user_id,
    address,
    total_amount,
    payment_type,
    status,
    payment_status,
    delivery_lat,
    delivery_lng,
    delivery_distance_km,
    delivery_fee,
    created_at,
    updated_at,
    tracking_steps
  ) VALUES (
    p_user_id,
    p_address,
    p_total_amount,
    p_payment_type,
    p_initial_status,
    CASE 
      WHEN lower(p_payment_type) = 'cod' THEN 'pending' 
      ELSE 'pending_payment' 
    END,
    p_latitude,
    p_longitude,
    p_distance_km,
    p_delivery_fee,
    now(),
    now(),
    jsonb_build_array(
      jsonb_build_object(
        'status', p_initial_status,
        'timestamp', now(),
        'description', 'We have received your order and it is being processed.',
        'label', 'Order Placed'
      )
    )
  ) RETURNING id INTO v_order_id;

  RAISE NOTICE '[PLACE_ORDER] Successfully created order %', v_order_id;

  -- 2. Insert order items with graceful handling of variant_id
  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(
    product_id UUID, 
    variant_id UUID,
    quantity INTEGER, 
    price_at_time NUMERIC,
    subtotal NUMERIC
  ) LOOP
    INSERT INTO public.order_items (
      order_id,
      product_id,
      variant_id,
      quantity,
      price_at_time,
      subtotal
    ) VALUES (
      v_order_id,
      v_item.product_id,
      v_item.variant_id, -- Gracefully handles NULL if not provided
      v_item.quantity,
      v_item.price_at_time,
      COALESCE(v_item.subtotal, v_item.quantity * v_item.price_at_time)
    );
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Order placed successfully',
    'order_id', v_order_id
  );

EXCEPTION WHEN OTHERS THEN
  -- Catch-all for database errors (FK violations, type mismatches, etc.)
  RAISE NOTICE '[PLACE_ORDER_ERROR] % %', SQLERRM, SQLSTATE;
  RETURN jsonb_build_object(
    'success', false,
    'message', SQLERRM,
    'detail', SQLSTATE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. EXPOSE FUNCTION TO REST API (Crucial for 404 fix)
-- PostgREST only exposes functions that are granted to anon/authenticated
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION public.place_order_v1 TO anon;
GRANT EXECUTE ON FUNCTION public.place_order_v1 TO authenticated;
GRANT EXECUTE ON FUNCTION public.place_order_v1 TO service_role;

-- 4. FORCE SCHEMA RELOAD
-- This tells PostgREST to refresh its cache of available functions
NOTIFY pgrst, 'reload schema';
