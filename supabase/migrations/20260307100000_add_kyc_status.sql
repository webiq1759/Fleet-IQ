-- Migration: Add KYC fields to profiles table
-- Run this in Supabase SQL Editor

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS kyc_status TEXT DEFAULT 'pending'
    CHECK (kyc_status IN ('pending', 'verified', 'rejected')),
  ADD COLUMN IF NOT EXISTS kyc_submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS kyc_doc_url TEXT,
  ADD COLUMN IF NOT EXISTS kyc_rejection_note TEXT;

-- Index for efficient admin queries (list all pending KYC)
CREATE INDEX IF NOT EXISTS profiles_kyc_status_idx ON public.profiles (kyc_status);

-- Existing verified (auto-approved) fleet owners remain as-is
-- New submissions will start with kyc_status = 'pending'

COMMENT ON COLUMN public.profiles.kyc_status IS 'KYC verification state: pending (submitted), verified (admin approved), rejected (admin rejected)';
COMMENT ON COLUMN public.profiles.kyc_doc_url IS 'Public URL to the uploaded identity/CAC document in kyc-documents storage bucket';
COMMENT ON COLUMN public.profiles.kyc_rejection_note IS 'Admin-populated reason for kyc_status = rejected';
COMMENT ON COLUMN public.profiles.kyc_submitted_at IS 'Timestamp when the owner submitted their KYC documents';
