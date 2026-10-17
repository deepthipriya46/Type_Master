-- ==========================================================
-- TYPEMASTER SUPABASE CONSOLE ERROR FIX & SCHEMA SYNC
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard)
-- ==========================================================

-- 1. Ensure 'users' table has status, full_name and is_premium columns
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Active';
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false;

-- 2. Create 'streaks' table with UNIQUE constraint on user_id to prevent 409 Conflict
CREATE TABLE IF NOT EXISTS public.streaks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_active_date DATE,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- Ensure user_id has unique constraint if table already existed without it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'streaks_user_id_key'
  ) THEN
    BEGIN
      ALTER TABLE public.streaks ADD CONSTRAINT streaks_user_id_key UNIQUE (user_id);
    EXCEPTION WHEN OTHERS THEN
      -- In case duplicates exist or already constrained
      NULL;
    END;
  END IF;
END $$;

ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Public streaks access' AND tablename = 'streaks'
  ) THEN
    CREATE POLICY "Public streaks access" ON public.streaks FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 3. Create 'feedback' table for user feedbacks & telemetry
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

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Public feedback access' AND tablename = 'feedback'
  ) THEN
    CREATE POLICY "Public feedback access" ON public.feedback FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 4. Create and enhance 'scheduled_tests' table
CREATE TABLE IF NOT EXISTS public.scheduled_tests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'General',
  difficulty TEXT DEFAULT 'Easy',
  duration INTEGER NOT NULL DEFAULT 60,
  duration_minutes INTEGER DEFAULT 1,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  ends_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now() + INTERVAL '1 day'),
  publication_status TEXT DEFAULT 'published',
  status TEXT DEFAULT 'scheduled',
  max_participants INTEGER,
  participants_count INTEGER DEFAULT 0,
  target_audience_type TEXT DEFAULT 'all',
  assigned_user_ids JSONB DEFAULT '[]'::jsonb,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.scheduled_tests ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Public scheduled_tests access' AND tablename = 'scheduled_tests'
  ) THEN
    CREATE POLICY "Public scheduled_tests access" ON public.scheduled_tests FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 5. Create and enhance 'scheduled_test_attempts' table
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

-- Ensure all columns exist if scheduled_test_attempts was already created
ALTER TABLE public.scheduled_test_attempts ADD COLUMN IF NOT EXISTS scheduled_test_title TEXT;
ALTER TABLE public.scheduled_test_attempts ADD COLUMN IF NOT EXISTS raw_wpm INTEGER;
ALTER TABLE public.scheduled_test_attempts ADD COLUMN IF NOT EXISTS duration INTEGER DEFAULT 60;
ALTER TABLE public.scheduled_test_attempts ADD COLUMN IF NOT EXISTS errors INTEGER DEFAULT 0;
ALTER TABLE public.scheduled_test_attempts ADD COLUMN IF NOT EXISTS characters INTEGER DEFAULT 0;
ALTER TABLE public.scheduled_test_attempts ADD COLUMN IF NOT EXISTS correct_characters INTEGER DEFAULT 0;
ALTER TABLE public.scheduled_test_attempts ADD COLUMN IF NOT EXISTS wrong_characters INTEGER DEFAULT 0;
ALTER TABLE public.scheduled_test_attempts ADD COLUMN IF NOT EXISTS missed_characters INTEGER DEFAULT 0;
ALTER TABLE public.scheduled_test_attempts ADD COLUMN IF NOT EXISTS extra_characters INTEGER DEFAULT 0;
ALTER TABLE public.scheduled_test_attempts ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0;
ALTER TABLE public.scheduled_test_attempts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completed';
ALTER TABLE public.scheduled_test_attempts ADD COLUMN IF NOT EXISTS prompt_text TEXT;
ALTER TABLE public.scheduled_test_attempts ADD COLUMN IF NOT EXISTS typed_input TEXT;
ALTER TABLE public.scheduled_test_attempts ADD COLUMN IF NOT EXISTS mistake_details JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.scheduled_test_attempts ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;
ALTER TABLE public.scheduled_test_attempts ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

ALTER TABLE public.scheduled_test_attempts ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Public scheduled_test_attempts access' AND tablename = 'scheduled_test_attempts'
  ) THEN
    CREATE POLICY "Public scheduled_test_attempts access" ON public.scheduled_test_attempts FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 6. Create compatibility views (profiles -> users, test_sessions -> test_logs)
CREATE OR REPLACE VIEW public.profiles AS SELECT * FROM public.users;
CREATE OR REPLACE VIEW public.test_sessions AS SELECT * FROM public.test_logs;

-- 7. Enable Realtime Replication for tables
DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.users; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.test_logs; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.feedback; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.streaks; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.scheduled_tests; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.scheduled_test_attempts; EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;
