-- ==========================================================
-- TYPEMASTER TARGETED SCHEDULED TESTS MIGRATION
-- Adds target audience filtering and assigned users to scheduled_tests
-- Real-Time Synchronization Enabled
-- ==========================================================

-- 1. ADD TARGET AUDIENCE COLUMNS TO SCHEDULED_TESTS TABLE
ALTER TABLE public.scheduled_tests 
  ADD COLUMN IF NOT EXISTS target_audience_type TEXT DEFAULT 'all',
  ADD COLUMN IF NOT EXISTS assigned_user_ids JSONB DEFAULT '[]'::jsonb;

-- 2. VALIDATION CHECK CONSTRAINT
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_scheduled_tests_target_audience'
  ) THEN
    ALTER TABLE public.scheduled_tests
      ADD CONSTRAINT chk_scheduled_tests_target_audience
      CHECK (target_audience_type IN ('all', 'range_60_75', 'range_76_91', 'range_92_100'));
  END IF;
END $$;

-- 3. INDEX FOR EFFICIENT AUDIENCE QUERYING
CREATE INDEX IF NOT EXISTS idx_scheduled_tests_target_audience 
  ON public.scheduled_tests (target_audience_type, publication_status);

-- 4. ENSURE REALTIME REPLICATION FOR SCHEDULED_TESTS TABLE
ALTER TABLE IF EXISTS public.scheduled_tests REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'scheduled_tests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.scheduled_tests;
  END IF;
END $$;

-- 5. ENSURE USERS AND TEST_LOGS RELATION FOR ACCURACY RANGE QUERIES
-- This allows PostgREST to query: .from('users').select('id, full_name, email, test_logs(accuracy)')
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_test_logs_user'
  ) THEN
    BEGIN
      ALTER TABLE public.test_logs 
        ADD CONSTRAINT fk_test_logs_user 
        FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
    EXCEPTION WHEN OTHERS THEN
      -- If user_id types differ or orphaned rows exist, gracefully ignore
      RAISE NOTICE 'Foreign key fk_test_logs_user could not be created automatically: %', SQLERRM;
    END;
  END IF;
END $$;
