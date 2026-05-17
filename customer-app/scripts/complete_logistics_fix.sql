-- ==========================================
-- COMPLETE LOGISTICS & CHECKOUT MIGRATION (V2)
-- Run this in your Supabase SQL Editor
-- ==========================================

-- 1. FIX ORDERS TABLE COLUMNS
DO $$ 
BEGIN 
  -- Address
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='address') THEN
    ALTER TABLE public.orders ADD COLUMN address TEXT;
  END IF;

  -- Payment Method
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='payment_method') THEN
    ALTER TABLE public.orders ADD COLUMN payment_method TEXT;
  END IF;

  -- Payment Status
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='payment_status') THEN
    ALTER TABLE public.orders ADD COLUMN payment_status TEXT DEFAULT 'pending';
  END IF;

  -- Delivery Coordinates
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='delivery_lat') THEN
    ALTER TABLE public.orders ADD COLUMN delivery_lat NUMERIC;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='delivery_lng') THEN
    ALTER TABLE public.orders ADD COLUMN delivery_lng NUMERIC;
  END IF;

  -- Delivery Distance
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='delivery_distance_km') THEN
    ALTER TABLE public.orders ADD COLUMN delivery_distance_km NUMERIC;
  END IF;

  -- Delivery Fee
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='delivery_fee') THEN
    ALTER TABLE public.orders ADD COLUMN delivery_fee NUMERIC DEFAULT 0;
  END IF;

  -- Total Amount
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='total_amount') THEN
    ALTER TABLE public.orders ADD COLUMN total_amount NUMERIC DEFAULT 0;
  END IF;
  
  -- Tracking Steps (JSONB)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='tracking_steps') THEN
    ALTER TABLE public.orders ADD COLUMN tracking_steps JSONB DEFAULT '[]'::jsonb;
  END IF;

  -- Timestamps (Safety Check)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='created_at') THEN
    ALTER TABLE public.orders ADD COLUMN created_at TIMESTAMPTZ DEFAULT now();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='updated_at') THEN
    ALTER TABLE public.orders ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
  END IF;
END $$;

-- 2. CREATE THE ATOMIC PLACE ORDER RPC
CREATE OR REPLACE FUNCTION place_order_v1(
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
  -- Insert into orders with all required metadata
  INSERT INTO public.orders (
    user_id,
    address,
    total_amount,
    payment_method,
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
    CASE WHEN p_payment_type = 'cod' THEN 'pending' ELSE 'pending_payment' END,
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
        'description', 'We have received your order.',
        'label', 'Order Placed'
      )
    )
  ) RETURNING id INTO v_order_id;

  -- Insert order items
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
      price_at_time
    ) VALUES (
      v_order_id,
      v_item.product_id,
      v_item.variant_id,
      v_item.quantity,
      v_item.price_at_time
    );
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Order placed successfully',
    'order_id', v_order_id
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'message', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
