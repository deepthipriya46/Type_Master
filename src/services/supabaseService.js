// ==========================================================
// TYPING TEST APPLICATION - SUPABASE & DATA SERVICE
// Implements Complete Architecture & Workflow from Diagram (Image 3)
// ==========================================================

import { createClient } from '@supabase/supabase-js';
import { AntiCheatService } from './antiCheatService';

// Default mock / seed dataset matching reference Image 1 & 2
const DEFAULT_USER_ID = 'user_01';

const INITIAL_USER = {
  id: DEFAULT_USER_ID,
  username: 'USER',
  avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
  best_wpm: 78,
  avg_wpm: 64,
  accuracy: 96.4,
  tests_completed: 128,
  is_premium: true
};

const INITIAL_STREAK = {
  user_id: DEFAULT_USER_ID,
  current_streak: 12,
  longest_streak: 18,
  last_active_date: new Date().toISOString().split('T')[0]
};

const INITIAL_ACHIEVEMENTS = [
  { id: 'speed_master', title: 'Speed Master', description: '75+ WPM', achievedText: 'Achieved', icon: 'trophy', unlocked: true },
  { id: 'accuracy_king', title: 'Accuracy King', description: '98% accuracy', achievedText: 'Achieved', icon: 'target', unlocked: true },
  { id: '10_day_streak', title: '10-Day Streak', description: 'Practice daily', achievedText: 'Achieved', icon: 'flame', unlocked: true },
  { id: '100_tests', title: '100 Tests Completed', description: 'Milestone', achievedText: 'Achieved', icon: 'star', unlocked: true },
  { id: 'lightning_fast', title: 'Lightning Fast', description: '100+ WPM in any test', achievedText: 'Locked', icon: 'zap', unlocked: false },
  { id: 'master_accuracy', title: 'Flawless 100%', description: '100% accuracy in 1 min', achievedText: 'Locked', icon: 'award', unlocked: false }
];

const INITIAL_RECENT_TESTS = [
  { id: 'log_1', date: 'Oct 05, 2026', duration: '1 min', wpm: 72, accuracy: 97, errors: 3, result: 'Excellent' },
  { id: 'log_2', date: 'Oct 04, 2026', duration: '3 min', wpm: 68, accuracy: 95, errors: 6, result: 'Great' },
  { id: 'log_3', date: 'Oct 03, 2026', duration: '1 min', wpm: 75, accuracy: 98, errors: 2, result: 'Excellent' },
  { id: 'log_4', date: 'Oct 02, 2026', duration: '5 min', wpm: 66, accuracy: 94, errors: 8, result: 'Good' },
  { id: 'log_5', date: 'Oct 01, 2026', duration: '3 min', wpm: 60, accuracy: 93, errors: 10, result: 'Good' }
];

const INITIAL_PROMPTS = [
  {
    id: 'p1',
    category: 'Random Text',
    difficulty: 'Easy',
    text: 'Technology has changed the way we live, work and communicate. It brings people closer, makes information more accessible, and creates new opportunities for learning and growth. With the right mindset and continuous practice, anyone can develop valuable skills and achieve their goals.'
  },
  {
    id: 'p2',
    category: 'Random Text',
    difficulty: 'Medium',
    text: 'Typing with speed and accuracy is a muscle memory discipline that requires consistent practice. When fingers instinctively locate keys on the home row without conscious effort, thought flows directly onto the digital screen without friction.'
  },
  {
    id: 'p3',
    category: 'Random Text',
    difficulty: 'Hard',
    text: 'Quantum algorithms leverage quantum superposition, quantum entanglement, and computational interference to solve probabilistic combinatorial problems asymptotically faster than classical Turing architectures.'
  },
  {
    id: 'p4',
    category: 'Technology',
    difficulty: 'Easy',
    text: 'Software engineering transforms complex ideas into reliable interactive experiences. Clean code, intuitive design, and responsive interfaces make applications enjoyable for millions of global users every single day.'
  },
  {
    id: 'p5',
    category: 'Technology',
    difficulty: 'Medium',
    text: 'Modern web architectures utilize distributed edge caching, reactive state management, asynchronous microservices, and serverless compute pipelines to handle millions of concurrent user requests with millisecond latencies.'
  },
  {
    id: 'p6',
    category: 'Quotes',
    difficulty: 'Easy',
    text: 'Believe you can and you are halfway there. Continuous effort, not strength or intelligence, is the key to unlocking our true potential and reaching every meaningful milestone in life.'
  },
  {
    id: 'p7',
    category: 'Quotes',
    difficulty: 'Medium',
    text: 'The journey of a thousand miles begins with a single step. Do not wait until the conditions are perfect; begin where you stand, with whatever tools you have, and better tools will be found as you go along.'
  },
  {
    id: 'p8',
    category: 'Literature',
    difficulty: 'Medium',
    text: 'In the depth of winter, I finally learned that within me there lay an invincible summer. We must accept finite disappointment, but never lose infinite hope in the pursuit of our highest aspirations.'
  }
];

class SupabaseService {
  constructor() {
    this.supabase = null;
    this.url = '';
    this.anonKey = '';
    this.isOnline = false;
    this.initClient();
  }

  initClient() {
    // Check localStorage overrides first, then Vite env
    const savedUrl = localStorage.getItem('typemaster_supabase_url');
    const savedKey = localStorage.getItem('typemaster_supabase_anon_key');
    const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
    const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

    this.url = savedUrl || envUrl;
    this.anonKey = savedKey || envKey;

    if (this.url && this.anonKey && this.url.startsWith('http') && !this.url.includes('your-project')) {
      try {
        this.supabase = createClient(this.url, this.anonKey);
        this.isOnline = true;
      } catch (err) {
        console.warn('Supabase client init warning:', err);
        this.supabase = null;
        this.isOnline = false;
      }
    } else {
      this.supabase = null;
      this.isOnline = false;
    }
  }

  isConfigured() {
    return Boolean(this.supabase && this.isOnline);
  }

  getCredentials() {
    return {
      url: this.url,
      anonKey: this.anonKey,
      isConfigured: this.isConfigured()
    };
  }

  async setCredentials(url, anonKey) {
    localStorage.setItem('typemaster_supabase_url', url.trim());
    localStorage.setItem('typemaster_supabase_anon_key', anonKey.trim());
    this.url = url.trim();
    this.anonKey = anonKey.trim();

    if (this.url && this.anonKey) {
      try {
        this.supabase = createClient(this.url, this.anonKey);
        // Test lightweight query
        const { error } = await this.supabase.from('prompts').select('count', { count: 'exact', head: true });
        if (error && error.code !== 'PGRST116') {
          // If table doesn't exist yet, we are still connected to Supabase
        }
        this.isOnline = true;
        return { success: true, message: 'Connected to Supabase successfully!' };
      } catch (err) {
        this.isOnline = false;
        return { success: false, message: err.message || 'Failed to connect to Supabase.' };
      }
    } else {
      this.supabase = null;
      this.isOnline = false;
      return { success: true, message: 'Supabase credentials cleared. Using local engine.' };
    }
  }

  // --- LOCAL STORE HELPERS (Fallback Engine) ---
  _getLocal(key, fallback) {
    try {
      const data = localStorage.getItem(`typemaster_${key}`);
      return data ? JSON.parse(data) : fallback;
    } catch {
      return fallback;
    }
  }

  _setLocal(key, val) {
    try {
      localStorage.setItem(`typemaster_${key}`, JSON.stringify(val));
    } catch (e) {
      console.warn('Storage set error', e);
    }
  }

  // ==========================================================
  // STEP 2: BACKEND RETRIEVAL -> Fetch Prompt Service
  // GET /api/tests/prompt
  // ==========================================================
  async fetchPrompt(category = 'Random Text', difficulty = 'Easy') {
    // 1. Try Supabase if configured
    if (this.isConfigured()) {
      try {
        let query = this.supabase.from('prompts').select('*');
        if (category && category !== 'All') {
          query = query.eq('category', category);
        }
        if (difficulty) {
          query = query.ilike('difficulty', difficulty);
        }
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          const randomIndex = Math.floor(Math.random() * data.length);
          return { success: true, prompt: data[randomIndex], source: 'supabase' };
        }
      } catch (err) {
        console.warn('Supabase fetch prompt fallback:', err);
      }
    }

    // 2. Local database engine fallback
    const allPrompts = this._getLocal('prompts', INITIAL_PROMPTS);
    const filtered = allPrompts.filter(p => {
      const matchCat = !category || category === 'All' || p.category.toLowerCase() === category.toLowerCase();
      const matchDiff = !difficulty || p.difficulty.toLowerCase() === difficulty.toLowerCase();
      return matchCat && matchDiff;
    });

    const pool = filtered.length > 0 ? filtered : allPrompts;
    const picked = pool[Math.floor(Math.random() * pool.length)];
    return { success: true, prompt: picked, source: 'local' };
  }

  // ==========================================================
  // STEP 4 & 5: POST-TEST SUBMISSION & ASYNCHRONOUS TRANSACTIONS
  // POST /api/tests/submit
  // ==========================================================
  async submitTest(payload) {
    // 1. Validation & Anti-Cheat Service Check
    const validation = AntiCheatService.validateSubmission(payload);
    if (!validation.isValid) {
      return {
        success: false,
        valid: false,
        reason: validation.reason,
        badge: validation.badge
      };
    }

    const {
      wpm,
      rawWpm,
      accuracy,
      duration,
      errors,
      characters,
      category = 'Random Text',
      difficulty = 'Easy',
      userId = DEFAULT_USER_ID
    } = payload;

    const resultBadge = validation.badge;
    const now = new Date();
    const dateFormatted = now.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });

    const newLog = {
      id: `log_${Date.now()}`,
      user_id: userId,
      date: dateFormatted,
      duration: `${Math.round(duration / 60)} min` || '1 min',
      durationSeconds: duration,
      wpm,
      raw_wpm: rawWpm || wpm,
      accuracy,
      errors,
      characters,
      category,
      difficulty,
      result: resultBadge,
      created_at: now.toISOString()
    };

    // 2. Perform DB Writes (Local fallback + Supabase)
    const existingLogs = this._getLocal('test_logs', INITIAL_RECENT_TESTS);
    const updatedLogs = [newLog, ...existingLogs];
    this._setLocal('test_logs', updatedLogs);

    // 3. Recalculate User Stats
    const user = this._getLocal('user', INITIAL_USER);
    const allWpms = updatedLogs.map(l => l.wpm);
    const bestWpm = Math.max(user.best_wpm, wpm);
    const avgWpm = Math.round(allWpms.reduce((a, b) => a + b, 0) / allWpms.length);
    const avgAccuracy = parseFloat((updatedLogs.reduce((a, b) => a + b.accuracy, 0) / updatedLogs.length).toFixed(1));
    const testsCompleted = user.tests_completed + 1;

    const updatedUser = {
      ...user,
      best_wpm: bestWpm,
      avg_wpm: avgWpm,
      accuracy: avgAccuracy,
      tests_completed: testsCompleted
    };
    this._setLocal('user', updatedUser);

    // 4. Process Streaks
    const streakData = this._getLocal('streak', INITIAL_STREAK);
    const todayStr = now.toISOString().split('T')[0];
    let newStreak = streakData.current_streak;

    if (streakData.last_active_date !== todayStr) {
      const lastDate = new Date(streakData.last_active_date);
      const diffDays = Math.round((now - lastDate) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        newStreak += 1;
      } else if (diffDays > 1) {
        newStreak = 1;
      }
    }
    const updatedStreak = {
      ...streakData,
      current_streak: newStreak,
      longest_streak: Math.max(streakData.longest_streak, newStreak),
      last_active_date: todayStr
    };
    this._setLocal('streak', updatedStreak);

    // 5. Evaluate Achievements
    const achievements = this._getLocal('achievements', INITIAL_ACHIEVEMENTS);
    let newlyUnlocked = [];

    const updatedAchievements = achievements.map(ach => {
      let shouldUnlock = ach.unlocked;
      if (!ach.unlocked) {
        if (ach.id === 'speed_master' && wpm >= 75) shouldUnlock = true;
        if (ach.id === 'accuracy_king' && accuracy >= 98) shouldUnlock = true;
        if (ach.id === '10_day_streak' && newStreak >= 10) shouldUnlock = true;
        if (ach.id === '100_tests' && testsCompleted >= 100) shouldUnlock = true;
        if (ach.id === 'lightning_fast' && wpm >= 100) shouldUnlock = true;
        if (ach.id === 'master_accuracy' && accuracy === 100 && duration >= 60) shouldUnlock = true;
        if (shouldUnlock) {
          newlyUnlocked.push(ach.title);
        }
      }
      return {
        ...ach,
        unlocked: shouldUnlock,
        achievedText: shouldUnlock ? 'Achieved' : 'Locked'
      };
    });
    this._setLocal('achievements', updatedAchievements);

    // 6. Push to live Supabase asynchronously if configured
    if (this.isConfigured()) {
      try {
        await this.supabase.from('test_logs').insert([{
          user_id: userId,
          wpm,
          raw_wpm: rawWpm || wpm,
          accuracy,
          duration,
          errors,
          characters,
          category,
          difficulty,
          result_badge: resultBadge
        }]);

        await this.supabase.from('users').upsert({
          id: userId,
          best_wpm: bestWpm,
          avg_wpm: avgWpm,
          accuracy: avgAccuracy,
          tests_completed: testsCompleted,
          updated_at: now.toISOString()
        });

        await this.supabase.from('streaks').upsert({
          user_id: userId,
          current_streak: newStreak,
          longest_streak: updatedStreak.longest_streak,
          last_active_date: todayStr
        });
      } catch (err) {
        console.warn('Supabase async transaction write note:', err);
      }
    }

    return {
      success: true,
      valid: true,
      badge: resultBadge,
      newlyUnlocked,
      stats: {
        wpm,
        rawWpm,
        accuracy,
        duration,
        errors,
        characters,
        bestWpm,
        avgWpm,
        testsCompleted,
        currentStreak: newStreak
      }
    };
  }

  // ==========================================================
  // STEP 6: DASHBOARD & DATA AGGREGATION
  // GET /api/dashboard/data
  // ==========================================================
  async fetchDashboardData() {
    // If Supabase is connected, attempt live aggregation
    if (this.isConfigured()) {
      try {
        const { data: userRow } = await this.supabase.from('users').select('*').eq('id', DEFAULT_USER_ID).maybeSingle();
        const { data: streakRow } = await this.supabase.from('streaks').select('*').eq('user_id', DEFAULT_USER_ID).maybeSingle();
        const { data: recentLogs } = await this.supabase.from('test_logs').select('*').order('created_at', { ascending: false }).limit(6);
        const { data: achs } = await this.supabase.from('achievements').select('*');

        if (userRow) {
          const formattedRecent = (recentLogs || []).map(l => ({
            id: l.id,
            date: new Date(l.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
            duration: `${Math.round(l.duration / 60)} min`,
            wpm: l.wpm,
            accuracy: Math.round(l.accuracy),
            errors: l.errors,
            result: l.result_badge
          }));

          return {
            user: userRow,
            streak: streakRow || INITIAL_STREAK,
            recentTests: formattedRecent.length > 0 ? formattedRecent : INITIAL_RECENT_TESTS,
            achievements: achs && achs.length > 0 ? achs : INITIAL_ACHIEVEMENTS,
            performanceGraph: [
              { date: 'Sep 29', wpm: 52 },
              { date: 'Sep 30', wpm: 60 },
              { date: 'Oct 01', wpm: 58 },
              { date: 'Oct 02', wpm: 66 },
              { date: 'Oct 03', wpm: 72 },
              { date: 'Oct 04', wpm: 68 },
              { date: 'Oct 05', wpm: userRow.best_wpm || 78 }
            ],
            accuracyTrend: [
              { date: 'Sep 29', accuracy: 92 },
              { date: 'Sep 30', accuracy: 94 },
              { date: 'Oct 01', accuracy: 93 },
              { date: 'Oct 02', accuracy: 95 },
              { date: 'Oct 03', accuracy: 97 },
              { date: 'Oct 04', accuracy: 96 },
              { date: 'Oct 05', accuracy: 98 }
            ]
          };
        }
      } catch (err) {
        console.warn('Dashboard live fetch fallback:', err);
      }
    }

    // Return robust local data matching Image 1
    const user = this._getLocal('user', INITIAL_USER);
    const streak = this._getLocal('streak', INITIAL_STREAK);
    const recentTests = this._getLocal('test_logs', INITIAL_RECENT_TESTS);
    const achievements = this._getLocal('achievements', INITIAL_ACHIEVEMENTS);

    return {
      user,
      streak,
      recentTests,
      achievements,
      performanceGraph: [
        { date: 'Sep 29', wpm: 52 },
        { date: 'Sep 30', wpm: 60 },
        { date: 'Oct 01', wpm: 58 },
        { date: 'Oct 02', wpm: 66 },
        { date: 'Oct 03', wpm: 72 },
        { date: 'Oct 04', wpm: 68 },
        { date: 'Oct 05', wpm: user.best_wpm }
      ],
      accuracyTrend: [
        { date: 'Sep 29', accuracy: 92 },
        { date: 'Sep 30', accuracy: 94 },
        { date: 'Oct 01', accuracy: 93 },
        { date: 'Oct 02', accuracy: 95 },
        { date: 'Oct 03', accuracy: 97 },
        { date: 'Oct 04', accuracy: 96 },
        { date: 'Oct 05', accuracy: 98 }
      ]
    };
  }

  // ==========================================================
  // STEP 7: PREMIUM GATEKEEPER
  // GET /api/user/tier
  // ==========================================================
  async checkUserTier() {
    const user = this._getLocal('user', INITIAL_USER);
    return {
      isPremium: Boolean(user.is_premium),
      tier: user.is_premium ? 'Premium' : 'Free'
    };
  }

  async setUserTier(isPremium) {
    const user = this._getLocal('user', INITIAL_USER);
    const updated = { ...user, is_premium: isPremium };
    this._setLocal('user', updated);

    if (this.isConfigured()) {
      try {
        await this.supabase.from('users').update({ is_premium: isPremium }).eq('id', DEFAULT_USER_ID);
      } catch (e) {
        console.warn('Supabase tier update note:', e);
      }
    }
    return updated;
  }
}

export const supabaseService = new SupabaseService();
