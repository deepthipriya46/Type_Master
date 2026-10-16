import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  CalendarClock,
  Clock,
  Play,
  Trophy,
  CheckCircle2,
  AlertCircle,
  Timer,
  Users,
  ArrowRight,
  RotateCw,
  Search,
  Filter,
  Flame,
  Award,
  Sparkles,
  Info,
  Check
} from 'lucide-react';
import { supabase, supabaseService } from '../services/supabaseService';

export default function ScheduledTestsView({
  user,
  onStartScheduledTest,
  onNavigate
}) {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'live', 'upcoming', 'completed'
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [userAttemptsMap, setUserAttemptsMap] = useState({});
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Modify active scheduled test fetching query so tests are strictly visible only to eligible users
  const fetchEligibleScheduledTests = useCallback(async (currentUserId) => {
    let rawTests = [];

    if (supabaseService.isConfigured() && supabase) {
      try {
        const { data: tests, error } = await supabase
          .from('scheduled_tests')
          .select('*')
          .eq('publication_status', 'published');

        if (!error && Array.isArray(tests)) {
          rawTests = tests;
        }
      } catch (err) {
        console.warn('Supabase fetchEligibleScheduledTests notice:', err);
      }
    }

    if (rawTests.length === 0) {
      const allLocal = await supabaseService.fetchScheduledTests({ publishedOnly: true });
      rawTests = allLocal || [];
    }

    // Filter tests visible to current user
    const visibleTests = rawTests.filter((test) => {
      if (!test.target_audience_type || test.target_audience_type === 'all') return true;
      return test.assigned_user_ids && test.assigned_user_ids.includes(currentUserId);
    });

    return supabaseService._formatScheduledTests(visibleTests);
  }, []);

  // Load eligible published tests for current user
  const loadTests = useCallback(async (manual = false) => {
    if (manual) setIsRefreshing(true);
    setLoading(true);
    try {
      const data = await fetchEligibleScheduledTests(user?.id);
      setTests(data || []);

      // Check user attempts for these tests
      if (user?.id && Array.isArray(data) && data.length > 0) {
        const attemptsMap = {};
        for (const t of data) {
          const attempt = await supabaseService.getUserScheduledTestAttempt(t.id, user.id);
          if (attempt) {
            attemptsMap[t.id] = attempt;
          }
        }
        setUserAttemptsMap(attemptsMap);
      }
    } catch (err) {
      console.warn('Error fetching scheduled tests for user:', err);
    } finally {
      setLoading(false);
      if (manual) setIsRefreshing(false);
    }
  }, [user?.id, fetchEligibleScheduledTests]);

  // Ensure real-time synchronization using Supabase Realtime subscriptions (supabase.channel('scheduled_tests'))
  useEffect(() => {
    loadTests();

    let channel = null;
    if (supabaseService.isConfigured() && supabase) {
      try {
        channel = supabase
          .channel('scheduled_tests')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'scheduled_tests' },
            () => {
              loadTests();
            }
          )
          .subscribe();
      } catch (err) {
        console.warn('Supabase realtime scheduled_tests channel notice:', err);
      }
    }

    const unsubscribe = supabaseService.subscribeScheduledTests(() => {
      loadTests();
    });

    return () => {
      if (channel && supabase) {
        supabase.removeChannel(channel);
      }
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [loadTests]);

  // Live timer tick for real-time countdown updates
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute live test states and counts
  const categorizedTests = useMemo(() => {
    const now = new Date(currentTime);
    return tests.map((t) => {
      const startsAt = new Date(t.starts_at);
      const endsAt = new Date(t.ends_at);

      let status = 'upcoming';
      if (t.publication_status === 'cancelled') {
        status = 'cancelled';
      } else if (now < startsAt) {
        status = 'upcoming';
      } else if (now >= startsAt && now <= endsAt) {
        status = 'live';
      } else {
        status = 'completed';
      }

      // Compute remaining ms
      const msUntilStart = startsAt.getTime() - now.getTime();
      const msUntilEnd = endsAt.getTime() - now.getTime();

      return {
        ...t,
        computedStatus: status,
        isLive: status === 'live',
        isUpcoming: status === 'upcoming',
        isCompleted: status === 'completed',
        msUntilStart,
        msUntilEnd
      };
    });
  }, [tests, currentTime]);

  // Metrics
  const metrics = useMemo(() => {
    const live = categorizedTests.filter((t) => t.isLive).length;
    const upcoming = categorizedTests.filter((t) => t.isUpcoming).length;
    const completed = categorizedTests.filter((t) => t.isCompleted).length;
    return { all: categorizedTests.length, live, upcoming, completed };
  }, [categorizedTests]);

  // Filtered tests
  const filteredTests = useMemo(() => {
    return categorizedTests.filter((t) => {
      // Tab filter
      if (activeTab === 'live' && !t.isLive) return false;
      if (activeTab === 'upcoming' && !t.isUpcoming) return false;
      if (activeTab === 'completed' && !t.isCompleted) return false;

      // Category filter
      if (categoryFilter !== 'All' && t.category !== categoryFilter) return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = (t.title || '').toLowerCase().includes(q);
        const matchesDesc = (t.description || '').toLowerCase().includes(q);
        const matchesCat = (t.category || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesCat) return false;
      }

      return true;
    });
  }, [categorizedTests, activeTab, categoryFilter, searchQuery]);

  // Format Countdown String
  const formatCountdown = (ms) => {
    if (ms <= 0) return '00:00:00';
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const pad = (n) => String(n).padStart(2, '0');

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h remaining`;
    }
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  };

  const formatDateTime = (isoStr) => {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoStr;
    }
  };

  const getCategoryBadgeStyle = (cat) => {
    switch (cat) {
      case 'Programming':
        return { bg: '#F3E8FF', text: '#9333EA', border: '#E9D5FF' };
      case 'Quotes':
        return { bg: '#E0F2FE', text: '#0284C7', border: '#BAE6FD' };
      case 'Science':
      case 'Science & Nature':
        return { bg: '#FEF3C7', text: '#D97706', border: '#FDE68A' };
      case 'Literature':
        return { bg: '#DCFCE7', text: '#16A34A', border: '#BBF7D0' };
      case 'Technology':
        return { bg: '#CFFAFE', text: '#0891B2', border: '#A5F3FC' };
      default:
        return { bg: '#EEF2FF', text: '#4F46E5', border: '#C7D2FE' };
    }
  };

  const getDifficultyBadgeStyle = (diff) => {
    switch (diff) {
      case 'Hard':
        return { bg: '#FEE2E2', text: '#DC2626', border: '#FECACA' };
      case 'Medium':
        return { bg: '#FEF3C7', text: '#D97706', border: '#FDE68A' };
      default:
        return { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0' };
    }
  };

  return (
    <div style={{ padding: '28px 36px', backgroundColor: '#F8FAFC', minHeight: 'calc(100vh - 70px)' }}>
      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4338CA 100%)',
          borderRadius: '20px',
          padding: '28px 32px',
          color: '#FFFFFF',
          marginBottom: '28px',
          boxShadow: '0 10px 25px rgba(49, 46, 129, 0.25)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255, 255, 255, 0.15)', padding: '4px 12px', borderRadius: '999px', fontSize: '0.76rem', fontWeight: 700, marginBottom: '12px' }}>
            <CalendarClock size={14} />
            <span>Scheduled Challenges & Competitions</span>
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: '0 0 8px 0', letterSpacing: '-0.4px' }}>
            Scheduled Tests
          </h1>
          <p style={{ fontSize: '0.92rem', color: '#E0E7FF', margin: 0, maxWidth: '620px', lineHeight: 1.5 }}>
            Participate in real-time scheduled typing tests configured by administrators. Compete during the live window, achieve top WPM rankings, and record your verified scores.
          </p>
        </div>

        {/* Ambient glow decoration */}
        <div
          style={{
            position: 'absolute',
            top: '-40px',
            right: '-40px',
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            background: 'rgba(99, 102, 241, 0.35)',
            filter: 'blur(40px)',
            pointerEvents: 'none'
          }}
        />
      </div>

      {/* Tabs and Filter Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '22px',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        {/* Section Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'All Tests', count: metrics.all },
            { id: 'live', label: 'Live Now', count: metrics.live, isLiveDot: true },
            { id: 'upcoming', label: 'Upcoming', count: metrics.upcoming },
            { id: 'completed', label: 'Completed', count: metrics.completed }
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '7px',
                  padding: '9px 16px',
                  borderRadius: '12px',
                  border: '1px solid',
                  borderColor: isActive ? '#2563EB' : '#E2E8F0',
                  background: isActive ? '#2563EB' : '#FFFFFF',
                  color: isActive ? '#FFFFFF' : '#475569',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: isActive ? '0 4px 12px rgba(37, 99, 235, 0.25)' : 'none',
                  transition: 'all 0.15s'
                }}
              >
                {tab.isLiveDot && tab.count > 0 && (
                  <span
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      background: isActive ? '#FFFFFF' : '#10B981',
                      boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.3)'
                    }}
                  />
                )}
                <span>{tab.label}</span>
                <span
                  style={{
                    padding: '2px 7px',
                    borderRadius: '999px',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    background: isActive ? 'rgba(255, 255, 255, 0.25)' : '#F1F5F9',
                    color: isActive ? '#FFFFFF' : '#64748B'
                  }}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Controls: Search, Category, Refresh */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '10px',
              padding: '7px 12px',
              width: '220px'
            }}
          >
            <Search size={15} color="#94A3B8" />
            <input
              type="text"
              placeholder="Search challenges..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '0.84rem',
                color: '#1E293B',
                width: '100%'
              }}
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '10px',
              border: '1px solid #E2E8F0',
              background: '#FFFFFF',
              fontSize: '0.82rem',
              color: '#334155',
              fontWeight: 600,
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="All">All Categories</option>
            <option value="General">General</option>
            <option value="Programming">Programming</option>
            <option value="Quotes">Quotes</option>
            <option value="Science">Science</option>
            <option value="Literature">Literature</option>
            <option value="Technology">Technology</option>
          </select>

          <button
            onClick={() => loadTests(true)}
            title="Refresh Live Tests"
            style={{
              padding: '8px',
              borderRadius: '10px',
              border: '1px solid #E2E8F0',
              background: '#FFFFFF',
              color: '#475569',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <RotateCw size={16} className={isRefreshing ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {/* Test Cards Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94A3B8' }}>
          <RotateCw size={28} className="spin" style={{ margin: '0 auto 10px' }} />
          <div>Checking live scheduled challenges...</div>
        </div>
      ) : filteredTests.length === 0 ? (
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            border: '1px solid #E2E8F0',
            padding: '50px 20px',
            textAlign: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: '#EFF6FF',
              color: '#2563EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px'
            }}
          >
            <CalendarClock size={28} />
          </div>
          <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0F172A' }}>
            {tests.length === 0 ? 'No Scheduled Tests Scheduled' : 'No tests found in this category'}
          </div>
          <div style={{ fontSize: '0.86rem', color: '#64748B', maxWidth: '420px', margin: '6px auto 16px' }}>
            {tests.length === 0
              ? 'There are currently no active or upcoming scheduled tests published by administrators. Check back soon for upcoming typing competitions!'
              : 'Try clearing your filters or selecting another tab.'}
          </div>
          {tests.length > 0 && (
            <button
              onClick={() => {
                setActiveTab('all');
                setCategoryFilter('All');
                setSearchQuery('');
              }}
              style={{
                padding: '8px 18px',
                background: '#EEF2FF',
                color: '#4F46E5',
                border: '1px solid #C7D2FE',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Show All Challenges
            </button>
          )}
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '20px'
          }}
        >
          {filteredTests.map((t) => {
            const catStyle = getCategoryBadgeStyle(t.category);
            const diffStyle = getDifficultyBadgeStyle(t.difficulty);
            const userAttempt = userAttemptsMap[t.id];

            return (
              <div
                key={t.id}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '18px',
                  border: t.isLive ? '2px solid #10B981' : '1px solid #E2E8F0',
                  boxShadow: t.isLive ? '0 4px 20px rgba(16, 185, 129, 0.15)' : '0 1px 4px rgba(0,0,0,0.03)',
                  padding: '22px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative',
                  transition: 'transform 0.15s, box-shadow 0.15s'
                }}
              >
                <div>
                  {/* Status & Badges Top Row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          background: catStyle.bg,
                          color: catStyle.text,
                          border: `1px solid ${catStyle.border}`
                        }}
                      >
                        {t.category || 'General'}
                      </span>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          background: diffStyle.bg,
                          color: diffStyle.text,
                          border: `1px solid ${diffStyle.border}`
                        }}
                      >
                        {t.difficulty || 'Easy'}
                      </span>
                    </div>

                    {/* Live / Upcoming / Completed status badge */}
                    {t.isLive ? (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: '#ECFDF5',
                          color: '#059669',
                          padding: '4px 10px',
                          borderRadius: '999px',
                          fontSize: '0.74rem',
                          fontWeight: 800,
                          border: '1px solid #A7F3D0'
                        }}
                      >
                        <span
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: '#10B981',
                            boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.3)'
                          }}
                        />
                        <span>LIVE NOW</span>
                      </span>
                    ) : t.isUpcoming ? (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          background: '#EEF2FF',
                          color: '#4F46E5',
                          padding: '4px 10px',
                          borderRadius: '999px',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          border: '1px solid #C7D2FE'
                        }}
                      >
                        <Clock size={12} />
                        <span>Upcoming</span>
                      </span>
                    ) : (
                      <span
                        style={{
                          background: '#F1F5F9',
                          color: '#64748B',
                          padding: '4px 10px',
                          borderRadius: '999px',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          border: '1px solid #E2E8F0'
                        }}
                      >
                        Challenge Ended
                      </span>
                    )}
                  </div>

                  {/* Title & Description */}
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', margin: '0 0 6px 0' }}>
                    {t.title}
                  </h3>
                  {t.description && (
                    <p style={{ fontSize: '0.84rem', color: '#64748B', margin: '0 0 14px 0', lineHeight: 1.5 }}>
                      {t.description}
                    </p>
                  )}

                  {/* Test Details Card Meta */}
                  <div
                    style={{
                      background: '#F8FAFC',
                      borderRadius: '12px',
                      padding: '12px 14px',
                      marginBottom: '16px',
                      border: '1px solid #E2E8F0',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      fontSize: '0.78rem',
                      color: '#475569'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Timer size={14} color="#6366F1" />
                        <span>Duration:</span>
                      </span>
                      <strong style={{ color: '#0F172A' }}>
                        {t.duration_minutes || Math.round((t.duration || 60) / 60)} minute{(t.duration_minutes || 1) > 1 ? 's' : ''}
                      </strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Users size={14} color="#059669" />
                        <span>Participants:</span>
                      </span>
                      <strong style={{ color: '#0F172A' }}>
                        {t.participants_count || 0} {t.max_participants ? `/ ${t.max_participants} max` : 'registered'}
                      </strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed #E2E8F0', paddingTop: '6px' }}>
                      <span>Window:</span>
                      <span style={{ fontSize: '0.75rem', color: '#334155', fontWeight: 600 }}>
                        {formatDateTime(t.starts_at)} → {formatDateTime(t.ends_at)}
                      </span>
                    </div>

                    {/* Live Countdown Timer */}
                    {t.isLive && t.msUntilEnd > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ECFDF5', padding: '6px 8px', borderRadius: '6px', color: '#059669', fontWeight: 700 }}>
                        <span>Time Remaining:</span>
                        <span style={{ fontFamily: 'monospace', fontSize: '0.84rem' }}>
                          {formatCountdown(t.msUntilEnd)}
                        </span>
                      </div>
                    )}

                    {t.isUpcoming && t.msUntilStart > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#EEF2FF', padding: '6px 8px', borderRadius: '6px', color: '#4F46E5', fontWeight: 700 }}>
                        <span>Opens in:</span>
                        <span style={{ fontFamily: 'monospace', fontSize: '0.84rem' }}>
                          {formatCountdown(t.msUntilStart)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Previous User Attempt Badge */}
                  {userAttempt && (
                    <div
                      style={{
                        background: '#F0FDF4',
                        border: '1px solid #BBF7D0',
                        borderRadius: '10px',
                        padding: '10px 12px',
                        marginBottom: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CheckCircle2 size={16} color="#10B981" />
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#166534' }}>
                          Your Verified Score:
                        </span>
                      </div>
                      <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#15803D' }}>
                        {userAttempt.wpm} WPM ({userAttempt.accuracy}%)
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Action Button */}
                <div>
                  {t.isLive ? (
                    <button
                      onClick={() => onStartScheduledTest && onStartScheduledTest(t)}
                      style={{
                        width: '100%',
                        padding: '11px',
                        borderRadius: '10px',
                        border: 'none',
                        background: '#10B981',
                        color: '#FFFFFF',
                        fontSize: '0.88rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#059669')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#10B981')}
                    >
                      <Play size={16} fill="#FFFFFF" />
                      <span>{userAttempt ? 'Retake Live Test' : 'Start Scheduled Test'}</span>
                      <ArrowRight size={16} />
                    </button>
                  ) : t.isUpcoming ? (
                    <button
                      disabled
                      style={{
                        width: '100%',
                        padding: '11px',
                        borderRadius: '10px',
                        border: '1px solid #E2E8F0',
                        background: '#F8FAFC',
                        color: '#94A3B8',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        cursor: 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <Clock size={15} />
                      <span>Starts in {formatCountdown(t.msUntilStart)}</span>
                    </button>
                  ) : (
                    <button
                      disabled
                      style={{
                        width: '100%',
                        padding: '11px',
                        borderRadius: '10px',
                        border: '1px solid #E2E8F0',
                        background: '#F1F5F9',
                        color: '#64748B',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        cursor: 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      Challenge Ended
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
