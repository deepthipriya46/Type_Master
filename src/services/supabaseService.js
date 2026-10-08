// ==========================================================
// TYPING TEST APPLICATION - SUPABASE REAL-TIME DATA SERVICE
// Fully Dynamic - Zero Static Sample Data
// ==========================================================

import { createClient } from '@supabase/supabase-js';
import { AntiCheatService } from './antiCheatService';

const ACHIEVEMENTS_CATALOG = [
  { id: 'first_step', title: 'First Keystrokes', description: 'Complete your first typing test', icon: 'zap' },
  { id: 'speed_master', title: 'Speed Master', description: 'Achieve 75+ WPM in a verified test', icon: 'trophy' },
  { id: 'accuracy_king', title: 'Accuracy King', description: 'Achieve 98%+ accuracy in a test', icon: 'target' },
  { id: '10_day_streak', title: '10-Day Streak', description: 'Maintain daily practice for 10 days', icon: 'flame' },
  { id: '100_tests', title: '100 Tests Milestone', description: 'Complete 100 official typing sessions', icon: 'star' },
  { id: 'lightning_fast', title: 'Lightning Fast', description: 'Break through the 100+ WPM barrier', icon: 'award' }
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
    text: 'Success is not final, failure is not fatal: it is the courage to continue that counts. Keep practicing and push past your comfort zone.'
  },
  {
    id: 'p7',
    category: 'Quotes',
    difficulty: 'Medium',
    text: 'The secret of getting ahead is getting started. The secret of getting started is breaking your complex overwhelming tasks into small manageable tasks, and starting on the first one.'
  },
  {
    id: 'p8',
    category: 'Literature',
    difficulty: 'Medium',
    text: 'It was the best of times, it was the worst of times, it was the age of wisdom, it was the age of foolishness, it was the epoch of belief, it was the epoch of incredulity.'
  },
  {
    id: 'p9',
    category: 'Programming',
    difficulty: 'Medium',
    text: 'function calculateTypingSpeed(chars, seconds) { const minutes = seconds / 60; const words = chars / 5; return Math.round(words / minutes); }'
  }
];

class SupabaseService {
  constructor() {
    this.supabase = null;
    this.url = '';
    this.anonKey = '';
    this.isOnline = false;
    this.currentUser = null;
    this.initClient();
    this.loadActiveUser();
  }

  initClient() {
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
        this.isOnline = true;
        return { success: true, message: 'Connected to Supabase successfully!' };
      } catch (err) {
        this.isOnline = false;
        return { success: false, message: err.message || 'Failed to connect to Supabase.' };
      }
    } else {
      this.supabase = null;
      this.isOnline = false;
      return { success: true, message: 'Supabase credentials cleared. Using local realtime engine.' };
    }
  }

  // --- LOCAL STORE REPOSITORY ---
  _getLocal(key, fallback) {
    try {
      const data = localStorage.getItem(`typemaster_rt_${key}`);
      return data !== null ? JSON.parse(data) : fallback;
    } catch {
      return fallback;
    }
  }

  _setLocal(key, val) {
    try {
      localStorage.setItem(`typemaster_rt_${key}`, JSON.stringify(val));
    } catch (e) {
      console.warn('Storage set error', e);
    }
  }

  // ==========================================================
  // AUTHENTICATION & SESSION MANAGEMENT
  // ==========================================================
  loadActiveUser() {
    const saved = this._getLocal('active_session_user', null);
    if (saved) {
      this.currentUser = saved;
    } else {
      // Default initial guest typist with zero stats
      this.currentUser = {
        id: 'guest_' + Date.now().toString(36),
        email: 'guest@typemaster.app',
        username: 'Guest Typist',
        avatar_url: '',
        best_wpm: 0,
        avg_wpm: 0,
        accuracy: 0,
        tests_completed: 0,
        is_premium: false
      };
      this._setLocal('active_session_user', this.currentUser);
    }
    return this.currentUser;
  }

  getActiveUser() {
    if (!this.currentUser) {
      return this.loadActiveUser();
    }
    return this.currentUser;
  }

  async signUp(email, password, username) {
    const cleanUsername = username.trim() || email.split('@')[0];

    if (this.isConfigured()) {
      try {
        const { data, error } = await this.supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username: cleanUsername }
          }
        });

        if (error) {
          return { success: false, message: error.message };
        }

        const userId = data.user?.id || 'user_' + Date.now().toString(36);
        const newUser = {
          id: userId,
          email,
          username: cleanUsername,
          avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanUsername)}`,
          best_wpm: 0,
          avg_wpm: 0,
          accuracy: 0,
          tests_completed: 0,
          is_premium: false
        };

        // Insert into public.users table in Supabase
        await this.supabase.from('users').upsert(newUser);

        // Initialize empty streak in Supabase
        await this.supabase.from('streaks').upsert({
          user_id: userId,
          current_streak: 0,
          longest_streak: 0,
          last_active_date: null
        });

        this.currentUser = newUser;
        this._setLocal('active_session_user', newUser);
        return { success: true, user: newUser };
      } catch (err) {
        return { success: false, message: err.message };
      }
    }

    // Local / Offline Sign Up
    const userId = 'user_' + Date.now().toString(36);
    const newUser = {
      id: userId,
      email,
      username: cleanUsername,
      avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanUsername)}`,
      best_wpm: 0,
      avg_wpm: 0,
      accuracy: 0,
      tests_completed: 0,
      is_premium: false
    };

    const usersList = this._getLocal('registered_users', []);
    usersList.push({ ...newUser, password });
    this._setLocal('registered_users', usersList);

    this.currentUser = newUser;
    this._setLocal('active_session_user', newUser);
    return { success: true, user: newUser };
  }

  async signIn(email, password) {
    if (this.isConfigured()) {
      try {
        const { data, error } = await this.supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) {
          return { success: false, message: error.message };
        }

        const userId = data.user.id;
        // Fetch profile from users table
        const { data: userProfile } = await this.supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        const userObj = userProfile || {
          id: userId,
          email,
          username: data.user.user_metadata?.username || email.split('@')[0],
          avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(email)}`,
          best_wpm: 0,
          avg_wpm: 0,
          accuracy: 0,
          tests_completed: 0,
          is_premium: false
        };

        this.currentUser = userObj;
        this._setLocal('active_session_user', userObj);
        return { success: true, user: userObj };
      } catch (err) {
        return { success: false, message: err.message };
      }
    }

    // Local / Offline Sign In
    const usersList = this._getLocal('registered_users', []);
    const found = usersList.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (found) {
      if (found.password && found.password !== password) {
        return { success: false, message: 'Invalid password. Please try again.' };
      }
      this.currentUser = found;
      this._setLocal('active_session_user', found);
      return { success: true, user: found };
    }

    // If new user in local mode, automatically register them smoothly
    return this.signUp(email, password, email.split('@')[0]);
  }

  async signInGuest(username = 'Guest Typist') {
    const cleanName = username.trim() || 'Guest Typist';
    const guestUser = {
      id: 'guest_' + Date.now().toString(36),
      email: 'guest@typemaster.app',
      username: cleanName,
      avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanName)}`,
      best_wpm: 0,
      avg_wpm: 0,
      accuracy: 0,
      tests_completed: 0,
      is_premium: false
    };

    if (this.isConfigured()) {
      try {
        await this.supabase.from('users').upsert(guestUser);
        await this.supabase.from('streaks').upsert({
          user_id: guestUser.id,
          current_streak: 0,
          longest_streak: 0
        });
      } catch (e) {
        console.warn('Guest upsert note:', e);
      }
    }

    this.currentUser = guestUser;
    this._setLocal('active_session_user', guestUser);
    return { success: true, user: guestUser };
  }

  async signOut() {
    if (this.isConfigured()) {
      try {
        await this.supabase.auth.signOut();
      } catch (err) {
        console.warn('Signout warning:', err);
      }
    }

    this.currentUser = null;
    localStorage.removeItem('typemaster_rt_active_session_user');
    return { success: true };
  }

  // ==========================================================
  // STEP 2: FETCH PROMPTS (Real Database)
  // ==========================================================
  async fetchPrompt(category = 'Random Text', difficulty = 'Easy') {
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
        console.warn('Supabase fetch prompt note:', err);
      }
    }

    // Local prompts pool
    const allPrompts = this._getLocal('prompts_pool', INITIAL_PROMPTS);
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
  // STEP 4 & 5: POST-TEST SUBMISSION & REAL-TIME RECALCULATION
  // ==========================================================
  async submitTest(payload) {
    const validation = AntiCheatService.validateSubmission(payload);
    if (!validation.isValid) {
      return {
        success: false,
        valid: false,
        reason: validation.reason,
        badge: validation.badge
      };
    }

    const user = this.getActiveUser();
    const userId = user.id;

    const {
      wpm,
      rawWpm,
      accuracy,
      duration,
      errors,
      characters,
      category = 'Random Text',
      difficulty = 'Easy'
    } = payload;

    const resultBadge = validation.badge;
    const now = new Date();
    const dateFormatted = now.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    const timeFormatted = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const newLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      user_id: userId,
      date: `${dateFormatted} ${timeFormatted}`,
      duration: `${Math.max(Math.round(duration / 60), 1)} min`,
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

    // 1. Fetch user's existing logs
    const userLogsKey = `logs_${userId}`;
    const userLogs = this._getLocal(userLogsKey, []);
    const updatedLogs = [newLog, ...userLogs];
    this._setLocal(userLogsKey, updatedLogs);

    // 2. Recalculate User Stats in Real-Time from Actual Logs
    const allWpms = updatedLogs.map(l => l.wpm);
    const bestWpm = Math.max(...allWpms);
    const avgWpm = Math.round(allWpms.reduce((a, b) => a + b, 0) / allWpms.length);
    const avgAccuracy = parseFloat((updatedLogs.reduce((a, b) => a + b.accuracy, 0) / updatedLogs.length).toFixed(1));
    const testsCompleted = updatedLogs.length;

    const updatedUser = {
      ...user,
      best_wpm: bestWpm,
      avg_wpm: avgWpm,
      accuracy: avgAccuracy,
      tests_completed: testsCompleted,
      updated_at: now.toISOString()
    };
    this.currentUser = updatedUser;
    this._setLocal('active_session_user', updatedUser);

    // 3. Process Streaks in Real-Time
    const streakKey = `streak_${userId}`;
    const streakData = this._getLocal(streakKey, {
      user_id: userId,
      current_streak: 0,
      longest_streak: 0,
      last_active_date: null
    });

    const todayStr = now.toISOString().split('T')[0];
    let newStreak = streakData.current_streak;

    if (!streakData.last_active_date) {
      newStreak = 1;
    } else if (streakData.last_active_date !== todayStr) {
      const lastDate = new Date(streakData.last_active_date);
      const diffDays = Math.round((now - lastDate) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        newStreak += 1;
      } else if (diffDays > 1) {
        newStreak = 1;
      }
    }

    const updatedStreak = {
      user_id: userId,
      current_streak: newStreak,
      longest_streak: Math.max(streakData.longest_streak || 0, newStreak),
      last_active_date: todayStr
    };
    this._setLocal(streakKey, updatedStreak);

    // 4. Evaluate Achievements in Real-Time
    const achKey = `achievements_${userId}`;
    const userAchs = this._getLocal(achKey, ACHIEVEMENTS_CATALOG.map(a => ({ ...a, unlocked: false, user_id: userId })));
    let newlyUnlocked = [];

    const updatedAchievements = userAchs.map(ach => {
      let isUnlocked = ach.unlocked;
      if (!isUnlocked) {
        if (ach.id === 'first_step' && testsCompleted >= 1) isUnlocked = true;
        if (ach.id === 'speed_master' && wpm >= 75) isUnlocked = true;
        if (ach.id === 'accuracy_king' && accuracy >= 98) isUnlocked = true;
        if (ach.id === '10_day_streak' && newStreak >= 10) isUnlocked = true;
        if (ach.id === '100_tests' && testsCompleted >= 100) isUnlocked = true;
        if (ach.id === 'lightning_fast' && wpm >= 100) isUnlocked = true;

        if (isUnlocked) {
          newlyUnlocked.push(ach.title);
        }
      }
      return {
        ...ach,
        unlocked: isUnlocked,
        achievedText: isUnlocked ? 'Achieved' : 'Locked'
      };
    });
    this._setLocal(achKey, updatedAchievements);

    // 5. Asynchronous Write to Live Supabase
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
  // STEP 6: REAL-TIME DASHBOARD AGGREGATION
  // ==========================================================
  async fetchDashboardData() {
    const user = this.getActiveUser();
    const userId = user.id;

    let recentLogs = [];
    let streak = { current_streak: 0, longest_streak: 0, last_active_date: null };
    let achievements = ACHIEVEMENTS_CATALOG.map(a => ({ ...a, unlocked: false, achievedText: 'Locked' }));

    if (this.isConfigured()) {
      try {
        const { data: dbUser } = await this.supabase.from('users').select('*').eq('id', userId).maybeSingle();
        if (dbUser) {
          this.currentUser = { ...user, ...dbUser };
        }

        const { data: dbLogs } = await this.supabase
          .from('test_logs')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(10);

        if (dbLogs && dbLogs.length > 0) {
          recentLogs = dbLogs.map(l => ({
            id: l.id,
            date: new Date(l.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit' }),
            duration: `${Math.round(l.duration / 60)} min`,
            wpm: l.wpm,
            accuracy: Math.round(l.accuracy),
            errors: l.errors,
            result: l.result_badge
          }));
        }

        const { data: dbStreak } = await this.supabase.from('streaks').select('*').eq('user_id', userId).maybeSingle();
        if (dbStreak) {
          streak = dbStreak;
        }
      } catch (e) {
        console.warn('Supabase aggregation note:', e);
      }
    }

    // Local fallback/sync
    if (recentLogs.length === 0) {
      const localLogs = this._getLocal(`logs_${userId}`, []);
      recentLogs = localLogs;
    }
    const localStreak = this._getLocal(`streak_${userId}`, streak);
    streak = localStreak || streak;

    const localAchs = this._getLocal(`achievements_${userId}`, achievements);
    achievements = localAchs || achievements;

    // Build real-time graph points from the user's actual chronological tests
    // Take the last 7 tests in chronological order (oldest to newest)
    const chronologicalLogs = [...recentLogs].slice(0, 7).reverse();

    let performanceGraph = [];
    let accuracyTrend = [];

    if (chronologicalLogs.length > 0) {
      performanceGraph = chronologicalLogs.map((item, idx) => ({
        date: item.date ? item.date.split(' ')[0] : `#${idx + 1}`,
        wpm: item.wpm
      }));

      accuracyTrend = chronologicalLogs.map((item, idx) => ({
        date: item.date ? item.date.split(' ')[0] : `#${idx + 1}`,
        accuracy: item.accuracy
      }));
    } else {
      // Empty baseline when brand new user hasn't typed yet
      performanceGraph = [
        { date: 'Initial', wpm: 0 }
      ];
      accuracyTrend = [
        { date: 'Initial', accuracy: 0 }
      ];
    }

    return {
      user: this.currentUser,
      streak,
      recentTests: recentLogs,
      achievements,
      performanceGraph,
      accuracyTrend
    };
  }

  // ==========================================================
  // STEP 7: PREMIUM GATEKEEPER
  // ==========================================================
  async checkUserTier() {
    const user = this.getActiveUser();
    return {
      isPremium: Boolean(user?.is_premium),
      tier: user?.is_premium ? 'Premium' : 'Standard'
    };
  }

  async setUserTier(isPremium) {
    const user = this.getActiveUser();
    const updated = { ...user, is_premium: isPremium };
    this.currentUser = updated;
    this._setLocal('active_session_user', updated);

    if (this.isConfigured()) {
      try {
        await this.supabase.from('users').update({ is_premium: isPremium }).eq('id', user.id);
      } catch (e) {
        console.warn('Supabase tier note:', e);
      }
    }
    return updated;
  }
}

export const supabaseService = new SupabaseService();
