-- ==========================================
-- PLACE ORDER RPC (STORED PROCEDURE)
-- Run this in your Supabase SQL Editor
-- ==========================================

CREATE OR REPLACE FUNCTION place_order_v1(
  p_user_id UUID,
  p_address TEXT,
  p_total_amount NUMERIC,
  p_payment_type TEXT,
  p_items JSONB,
  p_initial_status TEXT DEFAULT 'received',
  p_latitude NUMERIC DEFAULT 0,
  p_longitude NUMERIC DEFAULT 0,
  p_formatted_address TEXT DEFAULT '',
  p_city TEXT DEFAULT '',
  p_postal_code TEXT DEFAULT '',
  p_landmark TEXT DEFAULT '',
  p_delivery_fee NUMERIC DEFAULT 0
)
RETURNS JSONB AS $$
DECLARE
  v_order_id UUID;
  v_item RECORD;
BEGIN
  -- 1. Create the Order
  INSERT INTO public.orders (
    user_id,
    address,
    total_amount,
    payment_method,
    status,
    delivery_lat,
    delivery_lng,
    delivery_address_formatted,
    delivery_fee
  ) VALUES (
    p_user_id,
    p_address,
    p_total_amount,
    p_payment_type,
    p_initial_status,
    p_latitude,
    p_longitude,
    p_formatted_address,
    p_delivery_fee
  ) RETURNING id INTO v_order_id;

  -- 2. Insert Order Items
  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(
    product_id UUID, 
    quantity INTEGER, 
    price_at_time NUMERIC
  ) LOOP
    INSERT INTO public.order_items (
      order_id,
      product_id,
      quantity,
      price_at_time
    ) VALUES (
      v_order_id,
      v_item.product_id,
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
