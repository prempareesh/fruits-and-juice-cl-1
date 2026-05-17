-- ========================================================
-- JUICY APP: FINAL CHECKOUT & PROFILE SYNC (V7)
-- Fixes: FK Violation 23503 (orders_user_id_profiles_fkey)
-- ========================================================

-- 1. Ensure Profiles Table has consistent schema
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  full_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  role TEXT DEFAULT 'customer',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. CREATE THE FINAL PRODUCTION RPC (V2 UPDATED)
-- This version includes an automatic profile check/creation step
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
  -- 1. ATOMIC STOCK VALIDATION & LOCKING
  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(
    product_id UUID, 
    quantity INTEGER
  ) LOOP
    SELECT stock INTO v_current_stock 
    FROM public.products 
    WHERE id = v_item.product_id 
    FOR UPDATE; 

    IF v_current_stock IS NULL THEN
      RETURN jsonb_build_object('success', false, 'message', 'Product not found: ' || v_item.product_id);
    END IF;

    IF v_current_stock < v_item.quantity THEN
      RETURN jsonb_build_object('success', false, 'message', 'Insufficient stock for one or more items');
    END IF;
  END LOOP;

  -- 1.5 ENSURE PROFILE EXISTS (Fixes FK violation 23503)
  -- This ensures the user_id exists in public.profiles before referencing it in orders
  INSERT INTO public.profiles (id, full_name, phone, updated_at)
  VALUES (
    p_user_id, 
    COALESCE(p_customer_name, 'Valued Customer'), 
    COALESCE(p_customer_phone, ''),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    phone = CASE WHEN EXCLUDED.phone <> '' THEN EXCLUDED.phone ELSE public.profiles.phone END,
    updated_at = now();

  -- 2. CREATE THE ORDER
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
    customer_name,
    customer_phone,
    tracking_steps
  ) VALUES (
    p_user_id,
    p_address,
    p_total_amount,
    p_payment_type,
    p_initial_status,
    CASE WHEN lower(p_payment_type) = 'cod' THEN 'pending' ELSE 'pending_payment' END,
    p_latitude,
    p_longitude,
    p_distance_km,
    p_delivery_fee,
    p_customer_name,
    p_customer_phone,
    jsonb_build_array(jsonb_build_object(
      'status', p_initial_status,
      'timestamp', now(),
      'description', 'We have received your order.',
      'label', 'Order Placed'
    ))
  ) RETURNING id INTO v_order_id;

  -- 3. INSERT ITEMS & DECREMENT STOCK
  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(
    product_id UUID, 
    variant_id UUID,
    quantity INTEGER, 
    price_at_time NUMERIC,
    subtotal NUMERIC
  ) LOOP
    INSERT INTO public.order_items (
      order_id, product_id, variant_id, quantity, price_at_time, subtotal
    ) VALUES (
      v_order_id, v_item.product_id, v_item.variant_id, v_item.quantity, 
      v_item.price_at_time, COALESCE(v_item.subtotal, v_item.quantity * v_item.price_at_time)
    );

    UPDATE public.products 
    SET stock = stock - v_item.quantity 
    WHERE id = v_item.product_id;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Order placed successfully',
    'order_id', v_order_id
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'message', SQLERRM,
    'detail', SQLSTATE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. GRANT PERMISSIONS
GRANT EXECUTE ON FUNCTION public.place_order_v2 TO anon;
GRANT EXECUTE ON FUNCTION public.place_order_v2 TO authenticated;
GRANT EXECUTE ON FUNCTION public.place_order_v2 TO service_role;
