import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  CalendarClock,
  Clock,
  Play,
  ArrowRight,
  X,
  Bell,
  ChevronLeft,
  ChevronRight,
  Flame,
  CheckCircle2,
  AlertCircle,
  Timer,
  Zap,
  Sparkles
} from 'lucide-react';
import { supabaseService } from '../services/supabaseService';

export default function ScheduledTestReminderPopup({
  user,
  currentView,
  currentPortal,
  onNavigate,
  onStartScheduledTest
}) {
  const [tests, setTests] = useState([]);
  const [userAttemptsMap, setUserAttemptsMap] = useState({});
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDismissed, setIsDismissed] = useState(false);
  const [dismissUntil, setDismissUntil] = useState(() => {
    try {
      const stored = localStorage.getItem('typemaster_reminder_dismiss_until');
      return stored ? parseInt(stored, 10) : 0;
    } catch {
      return 0;
    }
  });

  // Load published tests and check user attempts
  const loadReminderTests = useCallback(async () => {
    try {
      const published = await supabaseService.fetchScheduledTests({ publishedOnly: true });
      if (!Array.isArray(published)) return;

      setTests(published);

      // Check current user's attempts to know if already completed
      if (user?.id && published.length > 0) {
        const attempts = {};
        for (const t of published) {
          const att = await supabaseService.getUserScheduledTestAttempt(t.id, user.id);
          if (att) attempts[t.id] = att;
        }
        setUserAttemptsMap(attempts);
      }
    } catch (err) {
      console.warn('Reminder tests load note:', err);
    }
  }, [user?.id]);

  // Initial load and Realtime synchronization
  useEffect(() => {
    loadReminderTests();
    const unsubscribe = supabaseService.subscribeScheduledTests(() => {
      loadReminderTests();
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [loadReminderTests]);

  // Tab focus / visibility return listener to re-sync
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setCurrentTime(Date.now());
        loadReminderTests();
      }
    };
    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);
    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [loadReminderTests]);

  // Ticking countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Filter and prioritize candidate tests for reminder
  const candidateTests = useMemo(() => {
    const now = new Date(currentTime);

    const eligible = tests.filter((t) => {
      // Must be published and not cancelled
      if (t.publication_status !== 'published') return false;

      const startsAt = new Date(t.starts_at);
      const endsAt = new Date(t.ends_at);

      // Already expired?
      if (now > endsAt) return false;

      // Check if user already attempted and retake policy prohibits
      const existingAttempt = userAttemptsMap[t.id];
      if (existingAttempt && t.retake_policy === 'single_attempt') {
        return false;
      }

      // Show if live or upcoming within next 48 hours
      const msUntilStart = startsAt.getTime() - now.getTime();
      const isLive = now >= startsAt && now <= endsAt;
      const isUpcoming = msUntilStart > 0 && msUntilStart <= 48 * 60 * 60 * 1000;

      return isLive || isUpcoming;
    });

    // Compute dynamic state and remaining time
    const enriched = eligible.map((t) => {
      const startsAt = new Date(t.starts_at);
      const endsAt = new Date(t.ends_at);
      const isLive = now >= startsAt && now <= endsAt;
      const msUntilStart = Math.max(0, startsAt.getTime() - now.getTime());
      const msUntilEnd = Math.max(0, endsAt.getTime() - now.getTime());
      const isStartingSoon = !isLive && msUntilStart <= 15 * 60 * 1000; // < 15 min

      return {
        ...t,
        isLive,
        isStartingSoon,
        msUntilStart,
        msUntilEnd,
        existingAttempt: userAttemptsMap[t.id]
      };
    });

    // Sort: Live tests first, then earliest upcoming start time
    enriched.sort((a, b) => {
      if (a.isLive && !b.isLive) return -1;
      if (!a.isLive && b.isLive) return 1;
      return a.msUntilStart - b.msUntilStart;
    });

    return enriched;
  }, [tests, userAttemptsMap, currentTime]);

  // Check dismissal status
  const isCurrentlySnoozed = useMemo(() => {
    return dismissUntil > currentTime;
  }, [dismissUntil, currentTime]);

  // Safe active test
  const activeTest = candidateTests[currentIndex] || candidateTests[0];

  // Dismiss / Remind Me Later handler (snoozes for 25 minutes)
  const handleSnooze = () => {
    const snoozeTime = Date.now() + 25 * 60 * 1000;
    setDismissUntil(snoozeTime);
    setIsDismissed(true);
    try {
      localStorage.setItem('typemaster_reminder_dismiss_until', String(snoozeTime));
    } catch {
      // ignore
    }
  };

  const handleDismissForever = () => {
    setIsDismissed(true);
    handleSnooze();
  };

  // Next / Prev test in carousel
  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % candidateTests.length);
  };
  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + candidateTests.length) % candidateTests.length);
  };

  // Countdown formatter
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

  // Format local display date/time
  const formatLocalTime = (isoStr) => {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const formatLocalDate = (isoStr) => {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return '';
    }
  };

  // Visibility guard conditions:
  // 1. Must be in User Portal (not admin portal)
  // 2. Must NOT be currently taking an active typing test
  // 3. Must have candidate tests available
  // 4. Must not be snoozed or manually dismissed
  if (
    currentPortal === 'admin' ||
    currentView === 'typing-test' ||
    candidateTests.length === 0 ||
    !activeTest ||
    isDismissed ||
    isCurrentlySnoozed
  ) {
    return null;
  }

  const durationMin = activeTest.duration_minutes || Math.round((activeTest.duration || 60) / 60);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        maxWidth: '430px',
        width: 'calc(100vw - 40px)',
        animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      <div
        style={{
          background: 'linear-gradient(145deg, #0F172A 0%, #1E1B4B 100%)',
          borderRadius: '18px',
          border: activeTest.isLive ? '1.5px solid #10B981' : '1.5px solid #6366F1',
          boxShadow: activeTest.isLive
            ? '0 20px 45px rgba(16, 185, 129, 0.25), 0 0 20px rgba(16, 185, 129, 0.15)'
            : '0 20px 45px rgba(15, 23, 42, 0.6), 0 0 25px rgba(99, 102, 241, 0.2)',
          color: '#FFFFFF',
          padding: '20px 22px',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Glow ambient background pill */}
        <div
          style={{
            position: 'absolute',
            top: '-30px',
            right: '-30px',
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: activeTest.isLive ? 'rgba(16, 185, 129, 0.25)' : 'rgba(99, 102, 241, 0.25)',
            filter: 'blur(30px)',
            pointerEvents: 'none'
          }}
        />

        {/* Top Header Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {activeTest.isLive ? (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(16, 185, 129, 0.2)',
                  color: '#34D399',
                  border: '1px solid rgba(52, 211, 153, 0.4)',
                  padding: '4px 10px',
                  borderRadius: '999px',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  letterSpacing: '0.04em'
                }}
              >
                <span
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    background: '#10B981',
                    boxShadow: '0 0 8px #10B981'
                  }}
                />
                LIVE CHALLENGE NOW OPEN
              </span>
            ) : activeTest.isStartingSoon ? (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(245, 158, 11, 0.2)',
                  color: '#FBBF24',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                  padding: '4px 10px',
                  borderRadius: '999px',
                  fontSize: '0.74rem',
                  fontWeight: 800
                }}
              >
                <Flame size={12} color="#F59E0B" />
                STARTING VERY SOON
              </span>
            ) : (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(99, 102, 241, 0.2)',
                  color: '#A5B4FC',
                  border: '1px solid rgba(165, 180, 252, 0.3)',
                  padding: '4px 10px',
                  borderRadius: '999px',
                  fontSize: '0.74rem',
                  fontWeight: 700
                }}
              >
                <Bell size={12} color="#818CF8" />
                UPCOMING SCHEDULED TEST
              </span>
            )}

            {candidateTests.length > 1 && (
              <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600 }}>
                ({currentIndex + 1} of {candidateTests.length})
              </span>
            )}
          </div>

          {/* Close / Snooze Button */}
          <button
            onClick={handleDismissForever}
            title="Dismiss reminder"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              borderRadius: '8px',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#94A3B8',
              transition: 'all 0.15s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#FFFFFF';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#94A3B8';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Challenge Title */}
        <h4
          style={{
            fontSize: '1.1rem',
            fontWeight: 800,
            margin: '0 0 6px 0',
            color: '#FFFFFF',
            lineHeight: 1.3
          }}
        >
          {activeTest.title}
        </h4>

        {activeTest.description && (
          <p
            style={{
              fontSize: '0.8rem',
              color: '#94A3B8',
              margin: '0 0 12px 0',
              lineHeight: 1.4,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            {activeTest.description}
          </p>
        )}

        {/* Timing & Countdown Card */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.7)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '12px 14px',
            marginBottom: '16px'
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.78rem', marginBottom: '10px' }}>
            <div>
              <span style={{ color: '#64748B', display: 'block', fontSize: '0.72rem' }}>
                {activeTest.isLive ? 'Started at:' : 'Starts at:'}
              </span>
              <span style={{ fontWeight: 700, color: '#E2E8F0' }}>
                {formatLocalTime(activeTest.starts_at)} ({formatLocalDate(activeTest.starts_at)})
              </span>
            </div>
            <div>
              <span style={{ color: '#64748B', display: 'block', fontSize: '0.72rem' }}>Duration:</span>
              <span style={{ fontWeight: 700, color: '#E2E8F0' }}>
                {durationMin} {durationMin === 1 ? 'minute' : 'minutes'}
              </span>
            </div>
          </div>

          {/* Dynamic Countdown */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: activeTest.isLive
                ? 'rgba(16, 185, 129, 0.12)'
                : 'rgba(99, 102, 241, 0.12)',
              borderRadius: '8px',
              padding: '8px 10px',
              border: activeTest.isLive
                ? '1px solid rgba(16, 185, 129, 0.3)'
                : '1px solid rgba(99, 102, 241, 0.3)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Timer size={14} color={activeTest.isLive ? '#34D399' : '#818CF8'} />
              <span
                style={{
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  color: activeTest.isLive ? '#34D399' : '#C7D2FE'
                }}
              >
                {activeTest.isLive ? 'Window Closes In:' : 'Opens In:'}
              </span>
            </div>
            <span
              style={{
                fontFamily: 'monospace',
                fontSize: '0.92rem',
                fontWeight: 800,
                color: '#FFFFFF',
                letterSpacing: '0.04em'
              }}
            >
              {formatCountdown(activeTest.isLive ? activeTest.msUntilEnd : activeTest.msUntilStart)}
            </span>
          </div>
        </div>

        {/* Existing attempt notice if user took it */}
        {activeTest.existingAttempt && (
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '8px',
              padding: '6px 10px',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.74rem'
            }}
          >
            <span style={{ color: '#34D399', fontWeight: 600 }}>Previous Attempt Recorded:</span>
            <span style={{ color: '#6EE7B7', fontWeight: 800 }}>
              {activeTest.existingAttempt.wpm} WPM ({activeTest.existingAttempt.accuracy}%)
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {activeTest.isLive ? (
            <button
              onClick={() => {
                if (onStartScheduledTest) {
                  onStartScheduledTest(activeTest);
                  setIsDismissed(true);
                }
              }}
              style={{
                flex: 1,
                padding: '10px 14px',
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 800,
                fontSize: '0.84rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
                transition: 'opacity 0.15s'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.92')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              <Play size={14} fill="#FFFFFF" />
              <span>{activeTest.existingAttempt ? 'Retake Live Test' : 'Attempt Test'}</span>
            </button>
          ) : (
            <button
              onClick={() => {
                if (onNavigate) {
                  onNavigate('scheduled-tests');
                  setIsDismissed(true);
                }
              }}
              style={{
                flex: 1,
                padding: '10px 14px',
                background: 'linear-gradient(135deg, #4F46E5 0%, #3B82F6 100%)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '0.84rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: '0 4px 14px rgba(79, 70, 229, 0.4)'
              }}
            >
              <span>View Scheduled Test</span>
              <ArrowRight size={14} />
            </button>
          )}

          <button
            onClick={handleSnooze}
            style={{
              padding: '10px 12px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '10px',
              color: '#94A3B8',
              fontWeight: 600,
              fontSize: '0.78rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#FFFFFF';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.14)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#94A3B8';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
            }}
          >
            Remind Later
          </button>
        </div>

        {/* Carousel pagination arrows if multiple tests exist */}
        {candidateTests.length > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '12px' }}>
            <button
              onClick={handlePrev}
              style={{
                background: 'none',
                border: 'none',
                color: '#94A3B8',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                fontSize: '0.72rem',
                padding: '2px 6px'
              }}
            >
              <ChevronLeft size={14} /> Prev Challenge
            </button>
            <span style={{ color: '#475569', fontSize: '0.72rem' }}>•</span>
            <button
              onClick={handleNext}
              style={{
                background: 'none',
                border: 'none',
                color: '#94A3B8',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                fontSize: '0.72rem',
                padding: '2px 6px'
              }}
            >
              Next Challenge <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
