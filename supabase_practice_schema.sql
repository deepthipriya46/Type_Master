-- ==========================================================
-- TYPEMASTER PRACTICE CONTENT & PROMPTS SCHEMA UPDATE
-- Ensures public.prompts supports all practice attributes & RLS
-- ==========================================================

-- 1. Ensure all practice columns exist on public.prompts
ALTER TABLE public.prompts ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.prompts ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE public.prompts ADD COLUMN IF NOT EXISTS focus_keys TEXT[] DEFAULT '{}'::text[];
ALTER TABLE public.prompts ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}'::text[];
ALTER TABLE public.prompts ADD COLUMN IF NOT EXISTS publication_status TEXT DEFAULT 'published';
ALTER TABLE public.prompts ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 2. Update existing rows so content and text are synchronized
UPDATE public.prompts 
SET content = text 
WHERE content IS NULL AND text IS NOT NULL;

UPDATE public.prompts 
SET title = COALESCE(title, category || ' Practice Drill') 
WHERE title IS NULL;

UPDATE public.prompts 
SET publication_status = 'published', is_active = true 
WHERE publication_status IS NULL;

-- 3. Row Level Security (RLS) Policies for Practice Management
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active, published prompts
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can view published prompts' AND tablename = 'prompts') THEN
    CREATE POLICY "Public can view published prompts" 
      ON public.prompts FOR SELECT 
      USING (is_active = true AND publication_status = 'published');
  END IF;
END $$;

-- Allow insert/update/delete for admin practice management
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow practice content insertion' AND tablename = 'prompts') THEN
    CREATE POLICY "Allow practice content insertion" 
      ON public.prompts FOR INSERT 
      WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow practice content updates' AND tablename = 'prompts') THEN
    CREATE POLICY "Allow practice content updates" 
      ON public.prompts FOR UPDATE 
      USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow practice content deletion' AND tablename = 'prompts') THEN
    CREATE POLICY "Allow practice content deletion" 
      ON public.prompts FOR DELETE 
      USING (true);
  END IF;
END $$;

-- 4. Enable Realtime Replication for prompts
ALTER PUBLICATION supabase_realtime ADD TABLE public.prompts;
