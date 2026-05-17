-- ==========================================
-- STOCK MANAGEMENT FUNCTIONS
-- Run this in your Supabase SQL Editor
-- ==========================================

-- Function to safely decrement stock
CREATE OR REPLACE FUNCTION decrement_product_stock(product_id UUID, quantity_to_remove INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE public.products
  SET 
    stock = GREATEST(0, stock - quantity_to_remove),
    is_available = CASE WHEN (stock - quantity_to_remove) > 0 THEN true ELSE false END
  WHERE id = product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
