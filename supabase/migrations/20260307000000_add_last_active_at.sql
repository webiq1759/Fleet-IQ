-- Migration: Add last_active_at to profiles
-- Tracks the last time a user was seen online

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ;

-- Index for efficient queries (e.g. "show users active in last 30 days")
CREATE INDEX IF NOT EXISTS profiles_last_active_at_idx ON public.profiles (last_active_at DESC);

-- Comment for clarity in Supabase Studio
COMMENT ON COLUMN public.profiles.last_active_at IS 'Timestamp of the last time this user had an active session (sign in or token refresh).';
