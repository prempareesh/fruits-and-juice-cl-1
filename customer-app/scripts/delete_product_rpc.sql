-- ==========================================
-- JUICY APP: PRODUCTION SAFE DELETE RPC
-- Allows admins to delete products spontaneously 
-- by handling all dependencies (variants, orders) atomically
-- and avoiding relation parse errors using dynamic SQL.
-- ==========================================

CREATE OR REPLACE FUNCTION public.delete_product_v1(p_product_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_is_admin BOOLEAN;
  v_product_exists BOOLEAN;
BEGIN
  -- 1. AUTHENTICATION: Ensure the requester is an admin
  -- We use SECURITY DEFINER to bypass RLS for this specific administrative action
  SELECT (role = 'admin') INTO v_is_admin 
  FROM public.profiles 
  WHERE id = auth.uid();
  
  IF v_is_admin IS NOT TRUE THEN
    RETURN jsonb_build_object(
      'success', false, 
      'message', 'Unauthorized: Only administrators can delete products.'
    );
  END IF;

  -- 2. VALIDATION: Ensure product exists
  SELECT EXISTS(SELECT 1 FROM public.products WHERE id = p_product_id) INTO v_product_exists;
  IF NOT v_product_exists THEN
    RETURN jsonb_build_object(
      'success', false, 
      'message', 'Product not found.'
    );
  END IF;

  -- A. Delete associated Juice Variants (if table exists)
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'juice_variants'
  ) THEN
    EXECUTE 'DELETE FROM public.juice_variants WHERE product_id = $1' USING p_product_id;
  END IF;

  -- B. Delete associated Order Items
  DELETE FROM public.order_items WHERE product_id = p_product_id;

  -- C. Delete associated reviews/ratings (if table exists)
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'product_reviews'
  ) THEN
    EXECUTE 'DELETE FROM public.product_reviews WHERE product_id = $1' USING p_product_id;
  END IF;

  -- 4. FINAL PURGE: Delete the product itself
  DELETE FROM public.products WHERE id = p_product_id;

  RETURN jsonb_build_object(
    'success', true, 
    'message', 'Product and all associated records deleted successfully.'
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false, 
    'message', 'Database Error: ' || SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- GRANT PERMISSIONS
GRANT EXECUTE ON FUNCTION public.delete_product_v1 TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_product_v1 TO service_role;
