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
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 3. FEEDBACK TABLE
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 4. SYSTEM SETTINGS TABLE (Global App Settings)
CREATE TABLE IF NOT EXISTS public.system_settings (
  key TEXT PRIMARY KEY,
  value JSONB,
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
