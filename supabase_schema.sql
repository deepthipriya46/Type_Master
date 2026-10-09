-- ==========================================================
-- TYPING TEST APPLICATION - SUPABASE DATABASE SCHEMA
-- REAL-TIME ARCHITECTURE (Zero Sample User Data)
-- ==========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROMPTS TABLE
CREATE TABLE IF NOT EXISTS public.prompts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category TEXT NOT NULL DEFAULT 'Random Text',
    difficulty TEXT NOT NULL DEFAULT 'Easy',
    text TEXT NOT NULL,
    word_count INTEGER NOT NULL,
    target_duration TEXT NOT NULL DEFAULT '1m', -- '1m', '3m', '5m', 'custom'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    email TEXT DEFAULT '',
    username TEXT NOT NULL DEFAULT 'Typist',
    avatar_url TEXT DEFAULT '',
    best_wpm INTEGER NOT NULL DEFAULT 0,
    avg_wpm NUMERIC(5,2) NOT NULL DEFAULT 0.0,
    accuracy NUMERIC(5,2) NOT NULL DEFAULT 0.0,
    tests_completed INTEGER NOT NULL DEFAULT 0,
    is_premium BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TEST LOGS TABLE (Stores actual real-time test runs)
CREATE TABLE IF NOT EXISTS public.test_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    wpm INTEGER NOT NULL,
    raw_wpm INTEGER NOT NULL,
    accuracy NUMERIC(5,2) NOT NULL,
    duration INTEGER NOT NULL, -- in seconds
    errors INTEGER NOT NULL DEFAULT 0,
    characters INTEGER NOT NULL DEFAULT 0,
    category TEXT NOT NULL DEFAULT 'Random Text',
    difficulty TEXT NOT NULL DEFAULT 'Easy',
    result_badge TEXT NOT NULL DEFAULT 'Good',
    is_valid BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. STREAKS TABLE (Tracks genuine daily streaks)
CREATE TABLE IF NOT EXISTS public.streaks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    current_streak INTEGER NOT NULL DEFAULT 0,
    longest_streak INTEGER NOT NULL DEFAULT 0,
    last_active_date DATE DEFAULT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. ACHIEVEMENTS TABLE (Dynamically unlocked based on actual performance)
CREATE TABLE IF NOT EXISTS public.achievements (
    id TEXT NOT NULL,
    user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    unlocked BOOLEAN NOT NULL DEFAULT false,
    unlocked_at TIMESTAMP WITH TIME ZONE,
    PRIMARY KEY (id, user_id)
);

-- Enable Row Level Security (RLS) & Policies
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

-- Allow read/write for application operations
CREATE POLICY "Allow public read prompts" ON public.prompts FOR SELECT USING (true);
CREATE POLICY "Allow public read users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow public insert users" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update users" ON public.users FOR UPDATE USING (true);
CREATE POLICY "Allow public read test_logs" ON public.test_logs FOR SELECT USING (true);
CREATE POLICY "Allow public insert test_logs" ON public.test_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read streaks" ON public.streaks FOR SELECT USING (true);
CREATE POLICY "Allow public insert streaks" ON public.streaks FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update streaks" ON public.streaks FOR UPDATE USING (true);
CREATE POLICY "Allow public read achievements" ON public.achievements FOR SELECT USING (true);
CREATE POLICY "Allow public insert achievements" ON public.achievements FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update achievements" ON public.achievements FOR UPDATE USING (true);

-- ==========================================================
-- PROMPTS SEED (Only real typing prompts for test taking)
-- ==========================================================
INSERT INTO public.prompts (category, difficulty, text, word_count)
VALUES
    ('Technology', 'Easy', 'Technology has changed the way we live, work and communicate. It brings people closer, makes information more accessible, and creates new opportunities for learning and growth. With the right mindset and continuous practice, anyone can develop valuable skills and achieve their goals.', 42),
    ('Technology', 'Medium', 'Cloud computing, distributed systems, and real-time data streaming empower modern engineering teams to scale digital architectures globally with remarkable resilience, automated recovery, and high availability across distributed nodes.', 30),
    ('Technology', 'Hard', 'Asynchronous reactive programming architectures optimize high-throughput computational throughput through event loops, micro-task queues, non-blocking I/O multiplexing, and transactional isolation protocols.', 24),
    ('Random Text', 'Easy', 'The quick brown fox jumps over the lazy dog while gentle morning breezes rustle the golden leaves in the peaceful autumn garden.', 22),
    ('Random Text', 'Medium', 'Consistency is the primary bridge between ambition and accomplishment. When you dedicate time every single day to refining your craft, continuous small improvements compound into extraordinary masteries.', 27),
    ('Random Text', 'Hard', 'Perseverance in cognitive motor synchronization demands relentless repetition and physiological relaxation across keyboard zones.', 14),
    ('Quotes', 'Easy', 'Success is not final, failure is not fatal: it is the courage to continue that counts. Keep practicing and push past your comfort zone.', 24),
    ('Quotes', 'Medium', 'The secret of getting ahead is getting started. The secret of getting started is breaking your complex overwhelming tasks into small manageable tasks, and starting on the first one.', 29),
    ('Quotes', 'Hard', 'It is not the critic who counts; not the man who points out how the strong man stumbles, or where the doer of deeds could have done them better. The credit belongs to the man who is actually in the arena.', 41),
    ('Literature', 'Easy', 'All that is gold does not glitter, not all those who wander are lost; the old that is strong does not wither, deep roots are not reached by the frost.', 30),
    ('Literature', 'Medium', 'It was the best of times, it was the worst of times, it was the age of wisdom, it was the age of foolishness, it was the epoch of belief, it was the epoch of incredulity.', 34),
    ('Programming', 'Easy', 'const greet = (name) => `Hello, ${name}! Welcome to the typing test.`;', 11),
    ('Programming', 'Medium', 'function calculateTypingSpeed(chars, seconds) { const minutes = seconds / 60; const words = chars / 5; return Math.round(words / minutes); }', 19),
    ('Programming', 'Hard', 'export async function streamData(req: Request, res: Response): Promise<void> { const reader = req.body?.getReader(); while (reader) { const { done, value } = await reader.read(); if (done) break; } }', 29)
ON CONFLICT DO NOTHING;
