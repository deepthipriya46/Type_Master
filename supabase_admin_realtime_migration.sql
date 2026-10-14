-- ==========================================================
-- TYPEMASTER ADMIN REAL-TIME SUPABASE MIGRATION
-- Project: TypeMaster – Pro Typing Speed
-- Target Tables: public.users, public.test_logs, public.feedback
-- Purpose: Enable Supabase Realtime Replication, Replica Identity,
--          and optimized indices for the Admin Dashboard telemetry
-- ==========================================================

-- 1. Ensure REPLICA IDENTITY FULL for complete payloads on updates/deletes
-- This ensures that WebSocket real-time payloads carry all column values
ALTER TABLE IF EXISTS public.users REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS public.test_logs REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS public.feedback REPLICA IDENTITY FULL;

-- 2. Add Tables to Supabase Realtime Publication
-- Enables postgres_changes broadcasts for client dashboard subscribers
DO $$
BEGIN
  -- Enable Realtime for users table
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'users'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
  END IF;

  -- Enable Realtime for test_logs table
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'test_logs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.test_logs;
  END IF;

  -- Enable Realtime for feedback table
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'feedback'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.feedback;
  END IF;
END $$;

-- 3. High-Performance Indices for Admin Queries
-- Speeds up real-time sorting and metric aggregations
CREATE INDEX IF NOT EXISTS idx_test_logs_created_at_desc ON public.test_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_test_logs_user_valid_wpm ON public.test_logs(user_id, is_valid, wpm);
CREATE INDEX IF NOT EXISTS idx_users_created_at_desc ON public.users(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_role_status ON public.users(role, status);

-- 4. Row Level Security (RLS) Guidance & Security Analysis:
-- - The admin dashboard queries 'users' and 'test_logs' to aggregate telemetry.
-- - Public / Authenticated typists can write their own test sessions (INSERT).
-- - Sensitive fields: Passwords and auth tokens are stored securely in auth.users
--   and are NEVER exposed through public tables or Realtime payloads.
-- - The current application uses client-side Supabase anonymous access with
--   built-in application-level admin authorization verification.
-- - If strict RLS is enforced in production:
--     CREATE POLICY "Admin view all test logs" ON public.test_logs
--       FOR SELECT TO authenticated
--       USING ((auth.jwt() ->> 'email') IN (SELECT email FROM public.users WHERE role = 'admin'));
