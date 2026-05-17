-- ========================================================
-- PRODUCTION-GRADE PAYMENT & TRANSACTION ARCHITECTURE
-- Run this in your Supabase SQL Editor
-- ========================================================

-- 1. Create Payment Status Enum
DO $$ BEGIN
    CREATE TYPE public.payment_status_type AS ENUM ('pending', 'processing', 'paid', 'failed', 'refunded', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create Payments Table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'INR',
  payment_method TEXT NOT NULL, -- 'online', 'cod'
  status public.payment_status_type DEFAULT 'pending',
  
  -- Razorpay Specific Fields
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  
  -- Tracking
  failure_reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Create Transactions Table (For detailed accounting/audit trail)
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID REFERENCES public.payments(id),
  order_id UUID REFERENCES public.orders(id),
  user_id UUID REFERENCES auth.users(id),
  transaction_type TEXT NOT NULL, -- 'debit', 'credit', 'refund'
  amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'success',
  provider TEXT DEFAULT 'razorpay',
  raw_response JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Create Payment Logs Table (For debugging)
CREATE TABLE IF NOT EXISTS public.payment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID,
  payment_id UUID,
  event_type TEXT NOT NULL, -- 'creation', 'verification', 'webhook', 'failure'
  log_level TEXT DEFAULT 'info',
  message TEXT,
  payload JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_logs ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies

-- Payments: Users can view their own payments
CREATE POLICY "Users can view own payments" 
ON public.payments FOR SELECT TO authenticated 
USING (auth.uid() = user_id);

-- Transactions: Users can view their own transactions
CREATE POLICY "Users can view own transactions" 
ON public.transactions FOR SELECT TO authenticated 
USING (auth.uid() = user_id);

-- Admins: Can view all
CREATE POLICY "Admins can view all payments" 
ON public.payments FOR SELECT TO authenticated 
USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Admins can view all transactions" 
ON public.transactions FOR SELECT TO authenticated 
USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- 7. Trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_payments_updated_at
BEFORE UPDATE ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 8. Failed Transactions Table (Explicitly requested in Task 3)
CREATE TABLE IF NOT EXISTS public.failed_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  order_id UUID REFERENCES public.orders(id),
  amount NUMERIC,
  error_code TEXT,
  error_description TEXT,
  raw_error JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.failed_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own failures" ON public.failed_transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
