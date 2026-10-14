import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Trophy,
  Medal,
  Crown,
  Search,
  RotateCw,
  Eye,
  Filter,
  CheckCircle2,
  Users,
  Flame,
  Sparkles,
  Award,
  ChevronDown
} from 'lucide-react';
import { supabaseService } from '../../services/supabaseService';
import AttemptDetailInspectionModal from './AttemptDetailInspectionModal';

export default function ScheduledTestLeaderboard({
  tests = [],
  selectedTestId,
  onSelectTest
}) {
  const [activeTestId, setActiveTestId] = useState(selectedTestId || tests[0]?.id || null);
  const [retakePolicy, setRetakePolicy] = useState('best_attempt'); // 'best_attempt' | 'latest_attempt'
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [inspectingAttempt, setInspectingAttempt] = useState(null);

  // Sync prop changes
  useEffect(() => {
    if (selectedTestId) {
      setActiveTestId(selectedTestId);
    } else if (!activeTestId && tests.length > 0) {
      setActiveTestId(tests[0].id);
    }
  }, [selectedTestId, tests]);

  const currentTest = useMemo(() => {
    return tests.find((t) => t.id === activeTestId) || tests[0] || null;
  }, [tests, activeTestId]);

  // Load leaderboard from service
  const loadLeaderboard = useCallback(async (manual = false) => {
    if (!activeTestId) {
      setLeaderboard([]);
      return;
    }

    if (manual) setIsRefreshing(true);
    setLoading(true);

    try {
      const data = await supabaseService.fetchScheduledTestLeaderboard(activeTestId, retakePolicy);
      setLeaderboard(data || []);
    } catch (err) {
      console.warn('Leaderboard loading note:', err);
      setLeaderboard([]);
    } finally {
      setLoading(false);
      if (manual) setIsRefreshing(false);
    }
  }, [activeTestId, retakePolicy]);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  // Realtime subscription
  useEffect(() => {
    const unsubscribe = supabaseService.subscribeScheduledTests(() => {
      loadLeaderboard();
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [loadLeaderboard]);

  // Filtered leaderboard by search
  const filteredLeaderboard = useMemo(() => {
    if (!searchQuery.trim()) return leaderboard;
    const q = searchQuery.toLowerCase();
    return leaderboard.filter(
      (e) =>
        (e.user_name || '').toLowerCase().includes(q) ||
        (e.user_email || '').toLowerCase().includes(q)
    );
  }, [leaderboard, searchQuery]);

  // Top 3 Podium
  const top1 = leaderboard[0] || null;
  const top2 = leaderboard[1] || null;
  const top3 = leaderboard[2] || null;

  const formatDateTime = (isoStr) => {
    if (!isoStr) return 'N/A';
    try {
      const d = new Date(isoStr);
      return d.toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div>
      {/* Top Header Card */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          padding: '22px 26px',
          marginBottom: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '18px'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Scheduled Test Leaderboard
              </h2>
              <span
                style={{
                  background: '#EFF6FF',
                  color: '#2563EB',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '999px',
                  border: '1px solid #BFDBFE'
                }}
              >
                ADMIN-ONLY LEADERBOARD
              </span>
            </div>
            <p style={{ fontSize: '0.84rem', color: '#64748B', margin: '4px 0 0 0' }}>
              Deterministic ranking prioritizing performance score and WPM with accuracy and error tie-breaking.
            </p>
          </div>

          <button
            onClick={() => loadLeaderboard(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 16px',
              borderRadius: '10px',
              border: '1px solid #E2E8F0',
              background: '#FFFFFF',
              color: '#475569',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <RotateCw size={14} className={isRefreshing ? 'spin' : ''} />
            <span>Refresh Rankings</span>
          </button>
        </div>

        {/* Challenge Selection & Retake Policy Bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {/* Test Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#64748B', marginBottom: '6px' }}>
              SELECT SCHEDULED CHALLENGE:
            </label>
            <select
              value={activeTestId || ''}
              onChange={(e) => {
                setActiveTestId(e.target.value);
                if (onSelectTest) onSelectTest(e.target.value);
              }}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid #CBD5E1',
                background: '#F8FAFC',
                fontSize: '0.88rem',
                fontWeight: 700,
                color: '#0F172A',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {tests.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} • ({t.computedStatus || t.status}) • {t.participants_count || 0} participants
                </option>
              ))}
            </select>
          </div>

          {/* Retake Policy Toggle */}
          <div>
            <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#64748B', marginBottom: '6px' }}>
              RETAKE RANKING POLICY:
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setRetakePolicy('best_attempt')}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: '1px solid',
                  borderColor: retakePolicy === 'best_attempt' ? '#2563EB' : '#E2E8F0',
                  background: retakePolicy === 'best_attempt' ? '#EFF6FF' : '#FFFFFF',
                  color: retakePolicy === 'best_attempt' ? '#1D4ED8' : '#64748B',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                Best Attempt (Recommended)
              </button>

              <button
                onClick={() => setRetakePolicy('latest_attempt')}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: '1px solid',
                  borderColor: retakePolicy === 'latest_attempt' ? '#2563EB' : '#E2E8F0',
                  background: retakePolicy === 'latest_attempt' ? '#EFF6FF' : '#FFFFFF',
                  color: retakePolicy === 'latest_attempt' ? '#1D4ED8' : '#64748B',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                Latest Attempt
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Top 3 Podium Cards */}
      {leaderboard.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          {/* 1st Place Gold Podium */}
          {top1 && (
            <div
              style={{
                background: 'linear-gradient(145deg, #FFFBEB 0%, #FEF3C7 100%)',
                borderRadius: '18px',
                border: '2px solid #F59E0B',
                padding: '22px',
                boxShadow: '0 8px 24px rgba(245, 158, 11, 0.15)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div style={{ position: 'absolute', top: '14px', right: '14px' }}>
                <Crown size={28} color="#D97706" fill="#F59E0B" />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <span
                  style={{
                    background: '#F59E0B',
                    color: '#FFFFFF',
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.84rem'
                  }}
                >
                  1
                </span>
                <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#92400E', letterSpacing: '0.04em' }}>
                  CHAMPION • 1ST PLACE
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                <img
                  src={top1.avatar_url}
                  alt={top1.user_name}
                  style={{ width: '48px', height: '48px', borderRadius: '50%', border: '2px solid #F59E0B' }}
                />
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#78350F' }}>
                    {top1.user_name}
                  </h4>
                  {top1.user_email && (
                    <div style={{ fontSize: '0.74rem', color: '#B45309' }}>{top1.user_email}</div>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: 'rgba(255,255,255,0.7)', padding: '10px', borderRadius: '10px' }}>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#92400E', fontWeight: 700 }}>SPEED</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#B45309' }}>
                    {top1.wpm} WPM
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#92400E', fontWeight: 700 }}>ACCURACY</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#B45309' }}>
                    {top1.accuracy}%
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2nd Place Silver Podium */}
          {top2 && (
            <div
              style={{
                background: 'linear-gradient(145deg, #F8FAFC 0%, #E2E8F0 100%)',
                borderRadius: '18px',
                border: '2px solid #94A3B8',
                padding: '22px',
                boxShadow: '0 8px 24px rgba(100, 116, 139, 0.1)',
                position: 'relative'
              }}
            >
              <div style={{ position: 'absolute', top: '14px', right: '14px' }}>
                <Medal size={26} color="#64748B" />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <span
                  style={{
                    background: '#64748B',
                    color: '#FFFFFF',
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.84rem'
                  }}
                >
                  2
                </span>
                <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#334155' }}>
                  RUNNER UP • 2ND PLACE
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                <img
                  src={top2.avatar_url}
                  alt={top2.user_name}
                  style={{ width: '48px', height: '48px', borderRadius: '50%', border: '2px solid #94A3B8' }}
                />
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#1E293B' }}>
                    {top2.user_name}
                  </h4>
                  {top2.user_email && (
                    <div style={{ fontSize: '0.74rem', color: '#64748B' }}>{top2.user_email}</div>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: 'rgba(255,255,255,0.7)', padding: '10px', borderRadius: '10px' }}>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#475569', fontWeight: 700 }}>SPEED</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#334155' }}>
                    {top2.wpm} WPM
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#475569', fontWeight: 700 }}>ACCURACY</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#334155' }}>
                    {top2.accuracy}%
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3rd Place Bronze Podium */}
          {top3 && (
            <div
              style={{
                background: 'linear-gradient(145deg, #FFF7ED 0%, #FFEDD5 100%)',
                borderRadius: '18px',
                border: '2px solid #F97316',
                padding: '22px',
                boxShadow: '0 8px 24px rgba(249, 115, 22, 0.1)',
                position: 'relative'
              }}
            >
              <div style={{ position: 'absolute', top: '14px', right: '14px' }}>
                <Award size={26} color="#EA580C" />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <span
                  style={{
                    background: '#EA580C',
                    color: '#FFFFFF',
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.84rem'
                  }}
                >
                  3
                </span>
                <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#9A3412' }}>
                  BRONZE • 3RD PLACE
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                <img
                  src={top3.avatar_url}
                  alt={top3.user_name}
                  style={{ width: '48px', height: '48px', borderRadius: '50%', border: '2px solid #F97316' }}
                />
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#7C2D12' }}>
                    {top3.user_name}
                  </h4>
                  {top3.user_email && (
                    <div style={{ fontSize: '0.74rem', color: '#C2410C' }}>{top3.user_email}</div>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: 'rgba(255,255,255,0.7)', padding: '10px', borderRadius: '10px' }}>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#9A3412', fontWeight: 700 }}>SPEED</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#C2410C' }}>
                    {top3.wpm} WPM
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#9A3412', fontWeight: 700 }}>ACCURACY</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#C2410C' }}>
                    {top3.accuracy}%
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Complete Leaderboard Table Card */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          overflow: 'hidden'
        }}
      >
        {/* Search header */}
        <div
          style={{
            padding: '16px 22px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
            <Search
              size={16}
              color="#94A3B8"
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              placeholder="Search ranked typists..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                borderRadius: '10px',
                border: '1px solid #E2E8F0',
                fontSize: '0.82rem',
                outline: 'none',
                background: '#F8FAFC'
              }}
            />
          </div>

          <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>
            {filteredLeaderboard.length} ranked typists in challenge
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94A3B8' }}>
            <RotateCw size={28} className="spin" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontWeight: 700, color: '#334155' }}>Calculating challenge rankings...</div>
          </div>
        ) : filteredLeaderboard.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748B' }}>
            <Trophy size={44} color="#CBD5E1" style={{ margin: '0 auto 12px' }} />
            <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1E293B', margin: '0 0 6px 0' }}>
              No Ranked Participants Yet
            </h4>
            <p style={{ fontSize: '0.84rem', color: '#64748B', margin: 0 }}>
              Users who complete this scheduled challenge will be evaluated and ranked here.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B' }}>
                  <th style={{ padding: '12px 18px', fontWeight: 700, width: '70px' }}>Rank</th>
                  <th style={{ padding: '12px 18px', fontWeight: 700 }}>Typist</th>
                  <th style={{ padding: '12px 18px', fontWeight: 700 }}>Typing Speed</th>
                  <th style={{ padding: '12px 18px', fontWeight: 700 }}>Accuracy</th>
                  <th style={{ padding: '12px 18px', fontWeight: 700 }}>Errors</th>
                  <th style={{ padding: '12px 18px', fontWeight: 700 }}>Final Score</th>
                  <th style={{ padding: '12px 18px', fontWeight: 700 }}>Attempt Date</th>
                  <th style={{ padding: '12px 18px', fontWeight: 700, textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeaderboard.map((item) => {
                  const finalScore = item.score ?? Math.round((item.wpm || 0) * ((item.accuracy || 100) / 100));

                  return (
                    <tr
                      key={item.id || item.user_id}
                      style={{
                        borderBottom: '1px solid #F1F5F9',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      {/* Rank */}
                      <td style={{ padding: '14px 18px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '30px',
                            height: '30px',
                            borderRadius: '50%',
                            fontWeight: 800,
                            fontSize: '0.84rem',
                            background:
                              item.rank === 1
                                ? '#FEF3C7'
                                : item.rank === 2
                                ? '#F1F5F9'
                                : item.rank === 3
                                ? '#FFEDD5'
                                : '#F8FAFC',
                            color:
                              item.rank === 1
                                ? '#B45309'
                                : item.rank === 2
                                ? '#475569'
                                : item.rank === 3
                                ? '#C2410C'
                                : '#64748B',
                            border: item.rank <= 3 ? '1px solid rgba(0,0,0,0.1)' : '1px solid #E2E8F0'
                          }}
                        >
                          {item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : item.rank === 3 ? '🥉' : item.rank}
                        </span>
                      </td>

                      {/* Typist Profile */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <img
                            src={item.avatar_url}
                            alt={item.user_name}
                            style={{ width: '36px', height: '36px', borderRadius: '50%' }}
                          />
                          <div>
                            <div style={{ fontWeight: 800, color: '#0F172A' }}>
                              {item.user_name || 'Typist'}
                            </div>
                            {item.user_email && (
                              <div style={{ fontSize: '0.74rem', color: '#2563EB' }}>
                                {item.user_email}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Speed */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontWeight: 800, color: '#2563EB', fontSize: '1rem' }}>
                          {item.wpm} <span style={{ fontSize: '0.74rem', fontWeight: 600 }}>WPM</span>
                        </div>
                      </td>

                      {/* Accuracy */}
                      <td style={{ padding: '14px 18px' }}>
                        <span
                          style={{
                            fontWeight: 800,
                            color: item.accuracy >= 98 ? '#059669' : item.accuracy >= 92 ? '#2563EB' : '#D97706'
                          }}
                        >
                          {item.accuracy}%
                        </span>
                      </td>

                      {/* Errors */}
                      <td style={{ padding: '14px 18px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            background: item.errors > 0 ? '#FEE2E2' : '#F0FDF4',
                            color: item.errors > 0 ? '#DC2626' : '#16A34A',
                            fontWeight: 700,
                            fontSize: '0.78rem'
                          }}
                        >
                          {item.errors || 0}
                        </span>
                      </td>

                      {/* Final Score */}
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{ fontWeight: 800, color: '#7C3AED', fontSize: '1rem' }}>
                          {finalScore}
                        </span>
                      </td>

                      {/* Attempt Date */}
                      <td style={{ padding: '14px 18px', color: '#64748B', fontSize: '0.78rem' }}>
                        {formatDateTime(item.created_at)}
                      </td>

                      {/* Action */}
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <button
                          onClick={() => setInspectingAttempt(item)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            border: '1px solid #CBD5E1',
                            background: '#FFFFFF',
                            color: '#0F172A',
                            fontWeight: 700,
                            fontSize: '0.76rem',
                            cursor: 'pointer'
                          }}
                        >
                          <Eye size={12} />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Attempt Inspection Modal */}
      {inspectingAttempt && (
        <AttemptDetailInspectionModal
          attempt={inspectingAttempt}
          scheduledTest={currentTest}
          onClose={() => setInspectingAttempt(null)}
        />
      )}
    </div>
  );
}
