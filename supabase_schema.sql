-- ==========================================================
-- TYPEMASTER SUPABASE POSTGRESQL SCHEMA
-- Tables: profiles, test_sessions, feedback, system_settings
-- Realtime Replication Enabled
-- ==========================================================

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  display_name TEXT,
  email TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user',
  status TEXT DEFAULT 'Active',
  is_premium BOOLEAN DEFAULT false,
  best_wpm INTEGER DEFAULT 0,
  avg_wpm INTEGER DEFAULT 0,
  accuracy NUMERIC(5, 2) DEFAULT 0,
  tests_completed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 2. TEST SESSIONS TABLE
CREATE TABLE IF NOT EXISTS public.test_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  wpm INTEGER NOT NULL,
  raw_wpm INTEGER,
  accuracy NUMERIC(5, 2) NOT NULL,
  duration INTEGER NOT NULL,
  errors INTEGER DEFAULT 0,
  characters INTEGER DEFAULT 0,
  category TEXT DEFAULT 'Random Text',
  difficulty TEXT DEFAULT 'Easy',
  result_badge TEXT,
  is_valid BOOLEAN DEFAULT true,
  mistake_details JSONB DEFAULT '[]'::jsonb,
  prompt_text TEXT,
  typed_input TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 3. FEEDBACK TABLE (User Portal & Admin Telemetry)
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

-- Ensure all enhanced columns exist if table was already created
ALTER TABLE public.feedback ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'General Feedback';
ALTER TABLE public.feedback ADD COLUMN IF NOT EXISTS subject TEXT;
ALTER TABLE public.feedback ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE public.feedback ADD COLUMN IF NOT EXISTS comment TEXT;
ALTER TABLE public.feedback ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Pending';
ALTER TABLE public.feedback ADD COLUMN IF NOT EXISTS admin_response TEXT;
ALTER TABLE public.feedback ADD COLUMN IF NOT EXISTS attachment_url TEXT;

-- 4. SYSTEM SETTINGS & SYSTEM CONFIG TABLES (Global App Settings & AI Credentials)
CREATE TABLE IF NOT EXISTS public.system_settings (
  key TEXT PRIMARY KEY,
  value JSONB,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.system_config (
  key TEXT PRIMARY KEY,
  value TEXT,
  config_json JSONB,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 5. ENABLE ROW LEVEL SECURITY & OPEN ACCESS FOR DEMO
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Permissive public policies for client access
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public profiles access' AND tablename = 'profiles') THEN
    CREATE POLICY "Public profiles access" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public test_sessions access' AND tablename = 'test_sessions') THEN
    CREATE POLICY "Public test_sessions access" ON public.test_sessions FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public feedback access' AND tablename = 'feedback') THEN
    CREATE POLICY "Public feedback access" ON public.feedback FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public system_settings access' AND tablename = 'system_settings') THEN
    CREATE POLICY "Public system_settings access" ON public.system_settings FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 6. ENABLE REALTIME REPLICATION FOR TABLES
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.test_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.feedback;
ALTER PUBLICATION supabase_realtime ADD TABLE public.system_settings;

-- 8. SCHEDULED TESTS & ATTEMPTS
CREATE TABLE IF NOT EXISTS public.scheduled_tests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'General',
  difficulty TEXT DEFAULT 'Easy',
  duration INTEGER DEFAULT 60,
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

ALTER TABLE public.scheduled_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_test_attempts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public scheduled_tests access' AND tablename = 'scheduled_tests') THEN
    CREATE POLICY "Public scheduled_tests access" ON public.scheduled_tests FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public scheduled_test_attempts access' AND tablename = 'scheduled_test_attempts') THEN
    CREATE POLICY "Public scheduled_test_attempts access" ON public.scheduled_test_attempts FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 9. CANONICAL TEST LOGS TABLE & TELEMETRY MIGRATIONS
CREATE TABLE IF NOT EXISTS public.test_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  wpm INTEGER NOT NULL,
  raw_wpm INTEGER,
  accuracy NUMERIC(5, 2) NOT NULL,
  duration TEXT,
  errors INTEGER DEFAULT 0,
  characters INTEGER DEFAULT 0,
  category TEXT DEFAULT 'General',
  difficulty TEXT DEFAULT 'Easy',
  result_badge TEXT DEFAULT 'Good',
  is_valid BOOLEAN DEFAULT true,
  prompt_text TEXT,
  typed_input TEXT,
  mistake_details JSONB DEFAULT '[]'::jsonb,
  mistake_stats JSONB DEFAULT '{}'::jsonb,
  correct_characters INTEGER DEFAULT 0,
  wrong_characters INTEGER DEFAULT 0,
  missed_characters INTEGER DEFAULT 0,
  extra_characters INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- Ensure non-destructive addition of rich telemetry columns to test_logs and test_sessions
ALTER TABLE public.test_logs ADD COLUMN IF NOT EXISTS prompt_text TEXT;
ALTER TABLE public.test_logs ADD COLUMN IF NOT EXISTS typed_input TEXT;
ALTER TABLE public.test_logs ADD COLUMN IF NOT EXISTS mistake_details JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.test_logs ADD COLUMN IF NOT EXISTS mistake_stats JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.test_logs ADD COLUMN IF NOT EXISTS correct_characters INTEGER DEFAULT 0;
ALTER TABLE public.test_logs ADD COLUMN IF NOT EXISTS wrong_characters INTEGER DEFAULT 0;
ALTER TABLE public.test_logs ADD COLUMN IF NOT EXISTS missed_characters INTEGER DEFAULT 0;
ALTER TABLE public.test_logs ADD COLUMN IF NOT EXISTS extra_characters INTEGER DEFAULT 0;

ALTER TABLE public.test_sessions ADD COLUMN IF NOT EXISTS mistake_stats JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.test_sessions ADD COLUMN IF NOT EXISTS correct_characters INTEGER DEFAULT 0;
ALTER TABLE public.test_sessions ADD COLUMN IF NOT EXISTS wrong_characters INTEGER DEFAULT 0;
ALTER TABLE public.test_sessions ADD COLUMN IF NOT EXISTS missed_characters INTEGER DEFAULT 0;
ALTER TABLE public.test_sessions ADD COLUMN IF NOT EXISTS extra_characters INTEGER DEFAULT 0;

ALTER TABLE public.test_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public test_logs access' AND tablename = 'test_logs') THEN
    CREATE POLICY "Public test_logs access" ON public.test_logs FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.test_logs;

