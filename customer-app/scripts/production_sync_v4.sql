-- ==========================================
-- JUICY APP: PRODUCTION ORDER & INVENTORY SYNC (V4)
-- Run this in your Supabase SQL Editor
-- ==========================================

-- 1. ENHANCE TABLE SCHEMA
DO $$ 
BEGIN 
  -- Add Customer Details to Orders Table (Snapshotting)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='customer_name') THEN
    ALTER TABLE public.orders ADD COLUMN customer_name TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='customer_phone') THEN
    ALTER TABLE public.orders ADD COLUMN customer_phone TEXT;
  END IF;

  -- Ensure inventory columns exist
  -- Ensure inventory columns exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='stock') THEN
    ALTER TABLE public.products ADD COLUMN stock INTEGER DEFAULT 100;
  END IF;

  -- Ensure settings table has updated_by
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='settings' AND column_name='updated_by') THEN
    ALTER TABLE public.settings ADD COLUMN updated_by UUID;
  END IF;
END $$;

-- 2. CREATE THE PRODUCTION ATOMIC PLACE ORDER RPC (V4)
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
  -- 1. VALIDATION: Check stock before placing order
  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(
    product_id UUID, 
    quantity INTEGER
  ) LOOP
    SELECT stock INTO v_current_stock FROM public.products WHERE id = v_item.product_id;
    IF v_current_stock < v_item.quantity THEN
      RETURN jsonb_build_object(
        'success', false,
        'message', 'Insufficient stock for one or more items'
      );
    END IF;
  END LOOP;

  -- 2. INSERT INTO ORDERS
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
    p_customer_name,
    p_customer_phone,
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

  -- 3. INSERT ORDER ITEMS & DECREMENT STOCK
  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(
    product_id UUID, 
    variant_id UUID,
    quantity INTEGER, 
    price_at_time NUMERIC,
    subtotal NUMERIC
  ) LOOP
    -- Insert Item
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
      v_item.variant_id,
      v_item.quantity,
      v_item.price_at_time,
      COALESCE(v_item.subtotal, v_item.quantity * v_item.price_at_time)
    );

    -- ATOMIC STOCK DECREMENT
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

-- 4. PERMISSIONS
GRANT EXECUTE ON FUNCTION public.place_order_v1 TO anon;
GRANT EXECUTE ON FUNCTION public.place_order_v1 TO authenticated;
GRANT EXECUTE ON FUNCTION public.place_order_v1 TO service_role;

NOTIFY pgrst, 'reload schema';
