-- Add Solana wallet fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS solana_wallet_address text,
ADD COLUMN IF NOT EXISTS accepts_solana boolean DEFAULT false;
