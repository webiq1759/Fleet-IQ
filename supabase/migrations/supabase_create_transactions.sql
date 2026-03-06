-- ===================================================
-- FleetIQ: Transactions Table (Manual Finance Entries)
-- Run this in the Supabase SQL Editor
-- ===================================================

CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('Income', 'Expense')),
    amount DECIMAL(12,2) NOT NULL,
    date DATE NOT NULL,
    category TEXT,
    description TEXT NOT NULL,
    asset_id UUID REFERENCES public.assets(id) ON DELETE SET NULL,
    reference TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable Row Level Security
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Owners can only see their own transactions
CREATE POLICY "owners_select_transactions"
ON public.transactions FOR SELECT
USING (auth.uid() = owner_id);

-- Owners can only insert their own transactions
CREATE POLICY "owners_insert_transactions"
ON public.transactions FOR INSERT
WITH CHECK (auth.uid() = owner_id);

-- Owners can update their own transactions
CREATE POLICY "owners_update_transactions"
ON public.transactions FOR UPDATE
USING (auth.uid() = owner_id);

-- Owners can delete their own transactions
CREATE POLICY "owners_delete_transactions"
ON public.transactions FOR DELETE
USING (auth.uid() = owner_id);
