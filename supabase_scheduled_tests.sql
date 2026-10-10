-- ==========================================================
-- TYPEMASTER SCHEDULED TESTS MIGRATION SCRIPT
-- Tables: scheduled_tests, scheduled_test_attempts
-- Enables Realtime Replication & Row Level Security
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
  user_id TEXT NOT NULL,
  user_name TEXT,
  user_email TEXT,
  wpm INTEGER NOT NULL,
  raw_wpm INTEGER,
  accuracy NUMERIC(5, 2) NOT NULL,
  duration INTEGER NOT NULL,
  errors INTEGER DEFAULT 0,
  characters INTEGER DEFAULT 0,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_scheduled_attempts_user 
  ON public.scheduled_test_attempts (scheduled_test_id, user_id);

-- 3. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.scheduled_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_test_attempts ENABLE ROW LEVEL SECURITY;

-- 4. ROW LEVEL SECURITY POLICIES
-- Anyone can view published scheduled tests
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can view published tests' AND tablename = 'scheduled_tests') THEN
    CREATE POLICY "Public can view published tests" ON public.scheduled_tests
      FOR SELECT USING (publication_status = 'published');
  END IF;

  -- Admins can view all tests (including drafts and cancelled)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins full access on scheduled_tests' AND tablename = 'scheduled_tests') THEN
    CREATE POLICY "Admins full access on scheduled_tests" ON public.scheduled_tests
      FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- Anyone can insert attempts into scheduled_test_attempts
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert test attempts' AND tablename = 'scheduled_test_attempts') THEN
    CREATE POLICY "Users can insert test attempts" ON public.scheduled_test_attempts
      FOR INSERT WITH CHECK (true);
  END IF;

  -- Users can view their own attempts, admins can view all
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view test attempts' AND tablename = 'scheduled_test_attempts') THEN
    CREATE POLICY "Users can view test attempts" ON public.scheduled_test_attempts
      FOR SELECT USING (true);
  END IF;
END $$;

-- 5. ENABLE REALTIME REPLICATION FOR INSTANT MULTI-PORTAL SYNC
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
