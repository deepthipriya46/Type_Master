-- ==========================================================
-- TYPEMASTER SCHEDULED TEST RESULTS & LEADERBOARD MIGRATION
-- Enhances scheduled_test_attempts and scheduled_tests tables
-- Secure RLS policies: Admin-only access to all results
-- Deterministic scoring & telemetry columns
-- ==========================================================

-- 1. ENHANCE SCHEDULED_TESTS TABLE
ALTER TABLE public.scheduled_tests 
  ADD COLUMN IF NOT EXISTS retake_policy TEXT DEFAULT 'best_attempt' CHECK (retake_policy IN ('best_attempt', 'latest_attempt', 'single_attempt')),
  ADD COLUMN IF NOT EXISTS scoring_formula TEXT DEFAULT 'standard' CHECK (scoring_formula IN ('standard', 'net_wpm', 'accuracy_weighted'));

-- 2. ENHANCE SCHEDULED_TEST_ATTEMPTS TABLE
-- Add columns safely if not already present
ALTER TABLE public.scheduled_test_attempts
  ADD COLUMN IF NOT EXISTS scheduled_test_title TEXT,
  ADD COLUMN IF NOT EXISTS raw_wpm INTEGER,
  ADD COLUMN IF NOT EXISTS duration INTEGER DEFAULT 60,
  ADD COLUMN IF NOT EXISTS errors INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS characters INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS correct_characters INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS wrong_characters INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS missed_characters INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS extra_characters INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completed',
  ADD COLUMN IF NOT EXISTS prompt_text TEXT,
  ADD COLUMN IF NOT EXISTS typed_input TEXT,
  ADD COLUMN IF NOT EXISTS mistake_details JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

-- Convert user_id column to TEXT if it was created as UUID to allow flexible user IDs
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'scheduled_test_attempts' 
      AND column_name = 'user_id' 
      AND data_type = 'uuid'
  ) THEN
    ALTER TABLE public.scheduled_test_attempts ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
  END IF;
END $$;

-- Indexes for lightning-fast leaderboard queries & user history lookups
CREATE INDEX IF NOT EXISTS idx_scheduled_attempts_test_score 
  ON public.scheduled_test_attempts (scheduled_test_id, wpm DESC, accuracy DESC, errors ASC);

CREATE INDEX IF NOT EXISTS idx_scheduled_attempts_user_id 
  ON public.scheduled_test_attempts (user_id);

CREATE INDEX IF NOT EXISTS idx_scheduled_attempts_created_at 
  ON public.scheduled_test_attempts (created_at DESC);

-- 3. SECURE ADMIN ROLE VERIFICATION FUNCTION
-- Checks if current authenticated Supabase user has admin role
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

-- 4. ROW LEVEL SECURITY (RLS) FOR SCHEDULED_TEST_ATTEMPTS
ALTER TABLE public.scheduled_test_attempts ENABLE ROW LEVEL SECURITY;

-- Drop old / overly permissive policies if they exist
DROP POLICY IF EXISTS "Public scheduled_test_attempts access" ON public.scheduled_test_attempts;
DROP POLICY IF EXISTS "Users can view test attempts" ON public.scheduled_test_attempts;
DROP POLICY IF EXISTS "Public can view attempts" ON public.scheduled_test_attempts;
DROP POLICY IF EXISTS "Users can insert test attempts" ON public.scheduled_test_attempts;
DROP POLICY IF EXISTS "Admins full access on test attempts" ON public.scheduled_test_attempts;
DROP POLICY IF EXISTS "Admins can view all attempts" ON public.scheduled_test_attempts;
DROP POLICY IF EXISTS "Users view own attempts" ON public.scheduled_test_attempts;
DROP POLICY IF EXISTS "Users insert own attempts" ON public.scheduled_test_attempts;

-- POLICY A: Authorized Administrators can view ALL scheduled test attempts & leaderboards
CREATE POLICY "Admins can view all attempts" 
  ON public.scheduled_test_attempts
  FOR SELECT 
  USING (public.is_admin());

-- POLICY B: Regular Authenticated Users can ONLY view their own attempts
CREATE POLICY "Users view own attempts" 
  ON public.scheduled_test_attempts
  FOR SELECT 
  USING (
    auth.uid() IS NOT NULL AND (
      user_id = auth.uid()::text
    )
  );

-- POLICY C: Authenticated Users can INSERT their own attempt results
CREATE POLICY "Users insert own attempts" 
  ON public.scheduled_test_attempts
  FOR INSERT 
  WITH CHECK (
    auth.uid() IS NOT NULL AND (
      user_id = auth.uid()::text
    )
  );

-- POLICY D: Admins can delete or manage attempts if required
CREATE POLICY "Admins full management on attempts" 
  ON public.scheduled_test_attempts
  FOR ALL 
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 5. REALTIME REPLICATION ENABLEMENT
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
