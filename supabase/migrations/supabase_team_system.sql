-- supabase_team_system.sql
-- Safe to re-run (idempotent)

-- 1. Add columns to profiles for team member linking
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS linked_owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS team_role TEXT CHECK (team_role IN ('Dispatcher', 'Accountant'));

-- 2. team_members table
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  member_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('Dispatcher', 'Accountant')),
  status TEXT NOT NULL DEFAULT 'Invited' CHECK (status IN ('Invited', 'Active', 'Disabled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (owner_id, email)
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owner_manage_team" ON public.team_members;
DROP POLICY IF EXISTS "member_read_self" ON public.team_members;

CREATE POLICY "owner_manage_team" ON public.team_members
  FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "member_read_self" ON public.team_members
  FOR SELECT USING (auth.uid() = member_user_id);

-- 3. audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owner_see_all_logs" ON public.audit_logs;
DROP POLICY IF EXISTS "member_see_own_logs" ON public.audit_logs;
DROP POLICY IF EXISTS "insert_own_log" ON public.audit_logs;

CREATE POLICY "owner_see_all_logs" ON public.audit_logs
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "member_see_own_logs" ON public.audit_logs
  FOR SELECT USING (auth.uid() = user_id AND auth.uid() != owner_id);

CREATE POLICY "insert_own_log" ON public.audit_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS audit_logs_owner_id_idx ON public.audit_logs (owner_id);
CREATE INDEX IF NOT EXISTS audit_logs_user_id_idx ON public.audit_logs (user_id);
CREATE INDEX IF NOT EXISTS team_members_owner_id_idx ON public.team_members (owner_id);
CREATE INDEX IF NOT EXISTS team_members_member_user_id_idx ON public.team_members (member_user_id);
