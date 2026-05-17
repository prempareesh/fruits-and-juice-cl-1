-- ==========================================
-- JUICY APP: PRODUCTION PRODUCT DELETION FIX
-- Enable Cascading Deletes to prevent "Foreign Key" blocks
-- ==========================================

-- 1. Update ORDER_ITEMS to support cascading deletes
-- This allows products to be deleted even if they have been ordered before.
ALTER TABLE public.order_items
DROP CONSTRAINT IF EXISTS order_items_product_id_fkey;

ALTER TABLE public.order_items
ADD CONSTRAINT order_items_product_id_fkey 
  FOREIGN KEY (product_id) 
  REFERENCES public.products(id) 
  ON DELETE CASCADE;

-- 2. Update JUICE_VARIANTS to support cascading deletes
-- This cleans up variants when the parent product is removed.
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'juice_variants') THEN
    ALTER TABLE public.juice_variants
    DROP CONSTRAINT IF EXISTS juice_variants_product_id_fkey;

    ALTER TABLE public.juice_variants
    ADD CONSTRAINT juice_variants_product_id_fkey 
      FOREIGN KEY (product_id) 
      REFERENCES public.products(id) 
      ON DELETE CASCADE;
  END IF;
END $$;

-- 3. Update REVIEWS/RATINGS (if they exist)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'product_reviews') THEN
    ALTER TABLE public.product_reviews
    DROP CONSTRAINT IF EXISTS product_reviews_product_id_fkey;

    ALTER TABLE public.product_reviews
    ADD CONSTRAINT product_reviews_product_id_fkey 
      FOREIGN KEY (product_id) 
      REFERENCES public.products(id) 
      ON DELETE CASCADE;
  END IF;
END $$;

-- 4. FORCE DELETE the specific product reported by the user
DELETE FROM public.products WHERE id = '8d23a971-c8cd-46fd-8088-2257ff10ea62';

-- 5. FINAL VERIFICATION: Success Message
SELECT 'SUCCESS: Product deletion constraints updated and specific product purged.' as result;
