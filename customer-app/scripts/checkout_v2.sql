-- ==========================================
-- JUICY APP: PRODUCTION CHECKOUT SYNC (V2)
-- Atomic Order Placement + Stock Management
-- ==========================================

-- 1. CREATE THE FINAL PRODUCTION RPC (V2)
-- We use v2 to avoid naming conflicts with previous partial installations
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
  -- We loop through all items and lock the rows to prevent race conditions
  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(
    product_id UUID, 
    quantity INTEGER
  ) LOOP
    SELECT stock INTO v_current_stock 
    FROM public.products 
    WHERE id = v_item.product_id 
    FOR UPDATE; -- Row-level lock

    IF v_current_stock IS NULL THEN
      RETURN jsonb_build_object('success', false, 'message', 'Product not found: ' || v_item.product_id);
    END IF;

    IF v_current_stock < v_item.quantity THEN
      RETURN jsonb_build_object('success', false, 'message', 'Insufficient stock for one or more items');
    END IF;
  END LOOP;

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
    -- Insert into order_items
    INSERT INTO public.order_items (
      order_id, product_id, variant_id, quantity, price_at_time, subtotal
    ) VALUES (
      v_order_id, v_item.product_id, v_item.variant_id, v_item.quantity, 
      v_item.price_at_time, COALESCE(v_item.subtotal, v_item.quantity * v_item.price_at_time)
    );

    -- Decrement stock
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
    'message', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. GRANT PERMISSIONS
GRANT EXECUTE ON FUNCTION public.place_order_v2 TO anon;
GRANT EXECUTE ON FUNCTION public.place_order_v2 TO authenticated;
GRANT EXECUTE ON FUNCTION public.place_order_v2 TO service_role;
