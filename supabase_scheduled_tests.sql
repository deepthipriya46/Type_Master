-- ==========================================================
-- TYPEMASTER SCHEDULED TESTS MIGRATION SCRIPT
-- Tables: scheduled_tests, scheduled_test_attempts
-- Enables Realtime Replication & Secure Admin RLS Policies
-- ==========================================================

-- 1. SCHEDULED TESTS TABLE
CREATE TABLE IF NOT EXISTS public.scheduled_tests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'General',
  difficulty TEXT DEFAULT 'Easy',
  duration INTEGER DEFAULT 60, -- duration in seconds
  duration_minutes INTEGER DEFAULT 1,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  publication_status TEXT DEFAULT 'published' CHECK (publication_status IN ('published', 'draft', 'cancelled')),
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'completed', 'cancelled', 'draft')),
  max_participants INTEGER DEFAULT NULL,
  participants_count INTEGER DEFAULT 0,
  retake_policy TEXT DEFAULT 'best_attempt' CHECK (retake_policy IN ('best_attempt', 'latest_attempt', 'single_attempt')),
  scoring_formula TEXT DEFAULT 'standard' CHECK (scoring_formula IN ('standard', 'net_wpm', 'accuracy_weighted')),
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- Index for efficient date-range filtering and availability lookups
CREATE INDEX IF NOT EXISTS idx_scheduled_tests_time_window 
  ON public.scheduled_tests (starts_at, ends_at, publication_status);

-- 2. SCHEDULED TEST ATTEMPTS TABLE
CREATE TABLE IF NOT EXISTS public.scheduled_test_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  scheduled_test_id UUID REFERENCES public.scheduled_tests(id) ON DELETE CASCADE,
  scheduled_test_title TEXT,
  user_id TEXT NOT NULL,
  user_name TEXT,
  user_email TEXT,
  wpm INTEGER NOT NULL,
  raw_wpm INTEGER,
  accuracy NUMERIC(5, 2) NOT NULL,
  duration INTEGER NOT NULL DEFAULT 60,
  errors INTEGER DEFAULT 0,
  characters INTEGER DEFAULT 0,
  correct_characters INTEGER DEFAULT 0,
  wrong_characters INTEGER DEFAULT 0,
  missed_characters INTEGER DEFAULT 0,
  extra_characters INTEGER DEFAULT 0,
  score INTEGER DEFAULT 0,
  status TEXT DEFAULT 'completed',
  prompt_text TEXT,
  typed_input TEXT,
  mistake_details JSONB DEFAULT '[]'::jsonb,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- Indexes for efficient lookups & leaderboard queries
CREATE INDEX IF NOT EXISTS idx_scheduled_attempts_user 
  ON public.scheduled_test_attempts (scheduled_test_id, user_id);

CREATE INDEX IF NOT EXISTS idx_scheduled_attempts_ranking 
  ON public.scheduled_test_attempts (scheduled_test_id, wpm DESC, accuracy DESC, errors ASC);

-- 3. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.scheduled_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_test_attempts ENABLE ROW LEVEL SECURITY;

-- 4. SECURE ADMIN ROLE VERIFICATION FUNCTION
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()::text AND role = 'admin'
  ) OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()::text AND role = 'admin'
  ) OR EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
      AND (raw_user_meta_data->>'role' = 'admin' OR email = 'admin@typemaster.com' OR email = 'paracademy@typemaster.com')
  );
$$;

-- 5. ROW LEVEL SECURITY POLICIES FOR SCHEDULED TESTS
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can view published tests' AND tablename = 'scheduled_tests') THEN
    CREATE POLICY "Public can view published tests" ON public.scheduled_tests
      FOR SELECT USING (publication_status = 'published');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins full access on scheduled_tests' AND tablename = 'scheduled_tests') THEN
    CREATE POLICY "Admins full access on scheduled_tests" ON public.scheduled_tests
      FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
  END IF;
END $$;

-- 6. ROW LEVEL SECURITY POLICIES FOR SCHEDULED TEST ATTEMPTS
-- Admin-only visibility for all results and leaderboards
DROP POLICY IF EXISTS "Public can view attempts" ON public.scheduled_test_attempts;
DROP POLICY IF EXISTS "Users can view test attempts" ON public.scheduled_test_attempts;
DROP POLICY IF EXISTS "Public scheduled_test_attempts access" ON public.scheduled_test_attempts;
DROP POLICY IF EXISTS "Admins can view all attempts" ON public.scheduled_test_attempts;
DROP POLICY IF EXISTS "Users view own attempts" ON public.scheduled_test_attempts;
DROP POLICY IF EXISTS "Users insert own attempts" ON public.scheduled_test_attempts;

CREATE POLICY "Admins can view all attempts" 
  ON public.scheduled_test_attempts
  FOR SELECT 
  USING (public.is_admin());

CREATE POLICY "Users view own attempts" 
  ON public.scheduled_test_attempts
  FOR SELECT 
  USING (auth.uid() IS NOT NULL AND user_id = auth.uid()::text);

CREATE POLICY "Users insert own attempts" 
  ON public.scheduled_test_attempts
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid()::text);

-- 7. ENABLE REALTIME REPLICATION FOR INSTANT MULTI-PORTAL SYNC
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.scheduled_tests;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.scheduled_test_attempts;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;
