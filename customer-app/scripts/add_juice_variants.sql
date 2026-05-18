-- DDL Migration: Add Juice Price Variants to products table safely without breaking existing schema
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/scdtwgquzsqnlhqovxut/sql)

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS classic_price numeric DEFAULT NULL;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS pure_price numeric DEFAULT NULL;

-- Verify columns addition
COMMENT ON COLUMN public.products.classic_price IS 'Selling price for Classic variant of Juice products';
COMMENT ON COLUMN public.products.pure_price IS 'Selling price for Pure variant of Juice products';
