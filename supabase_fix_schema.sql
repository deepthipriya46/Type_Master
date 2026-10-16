-- ==========================================================
-- TYPEMASTER SUPABASE CONSOLE ERROR FIX & SCHEMA SYNC
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard)
-- ==========================================================

-- 1. Ensure 'users' table has status and full_name columns
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Active';
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS full_name TEXT;

-- 2. Create 'feedback' table for user feedbacks & telemetry
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  category TEXT DEFAULT 'General Feedback',
  subject TEXT,
  message TEXT,
  comment TEXT,
  rating INTEGER CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
  status TEXT DEFAULT 'Pending',
  admin_response TEXT,
  attachment_url TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- Enable RLS and permissive public policy on feedback
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Public feedback access' AND tablename = 'feedback'
  ) THEN
    CREATE POLICY "Public feedback access" ON public.feedback FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 3. Create compatibility views (profiles -> users, test_sessions -> test_logs)
CREATE OR REPLACE VIEW public.profiles AS SELECT * FROM public.users;
CREATE OR REPLACE VIEW public.test_sessions AS SELECT * FROM public.test_logs;

-- 4. Enable Realtime Replication for tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
ALTER PUBLICATION supabase_realtime ADD TABLE public.test_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.feedback;
