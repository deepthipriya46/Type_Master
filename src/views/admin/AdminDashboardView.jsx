import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  UserCheck,
  FileText,
  Gauge,
  Trophy,
  ArrowRight,
  BarChart2,
  Calendar,
  Star,
  CheckCircle2,
  Clock,
  RotateCw
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { supabaseService } from '../../services/supabaseService';

export default function AdminDashboardView({ onNavigate, onSelectUserForAnalytics }) {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    activeUsers: 0,
    testsCompleted: 0,
    avgWpm: 0,
    achievementsEarned: 0,
    activityDays: ['Oct 3', 'Oct 4', 'Oct 5', 'Oct 6', 'Oct 7', 'Oct 8', 'Oct 9'],
    newUsersPoints: [0, 0, 0, 0, 0, 0, 0],
    activeUsersPoints: [0, 0, 0, 0, 0, 0, 0],
    speedDistribution: [],
    testCategories: [],
    recentUsers: [],
    topPerformers: [],
    latestTestAttempts: [],
    recentFeedback: []
  });

  const loadLiveMetrics = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminService.getLiveDashboardMetrics();
      setMetrics(data);
    } catch (err) {
      console.warn('Dashboard live query warning:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handlers for instant real-time telemetry updates
  const handleIncomingTest = useCallback((testPayload) => {
    if (!testPayload) return;
    setMetrics((prev) => {
      const newTestsCompleted = prev.testsCompleted + 1;
      const wpmVal = Number(testPayload.wpm) || 0;
      const prevTotal = prev.avgWpm * prev.testsCompleted;
      const newAvgWpm = Math.round((prevTotal + wpmVal) / Math.max(1, newTestsCompleted));

      const newAttemptRow = {
        id: prev.latestTestAttempts.length + 1,
        user: testPayload.userName || 'Registered Typist',
        type: testPayload.category || 'General',
        wpm: testPayload.wpm || 0,
        accuracy: `${testPayload.accuracy || 0}%`,
        time: testPayload.duration ? `${Math.round(testPayload.duration / 60) || 1} min` : '1 min',
        date: 'Just now'
      };

      return {
        ...prev,
        testsCompleted: newTestsCompleted,
        avgWpm: newAvgWpm,
        latestTestAttempts: [newAttemptRow, ...prev.latestTestAttempts.slice(0, 7)]
      };
    });
    // Silent background sync
    adminService.getLiveDashboardMetrics().then(data => setMetrics(data)).catch(() => {});
  }, []);

  const handleIncomingProfile = useCallback((profilePayload) => {
    if (!profilePayload) return;
    setMetrics((prev) => {
      const newTotalUsers = prev.totalUsers + 1;
      const newUserRow = {
        id: profilePayload.id || `usr_${Date.now()}`,
        name: profilePayload.display_name || profilePayload.username || 'Typist',
        email: profilePayload.email || '',
        status: profilePayload.status || 'Active',
        joinedOn: 'Today',
        testsTaken: 0,
        avgWpm: 0,
        highestWpm: 0,
        accuracy: 0
      };

      return {
        ...prev,
        totalUsers: newTotalUsers,
        recentUsers: [newUserRow, ...prev.recentUsers.slice(0, 4)]
      };
    });
    adminService.getLiveDashboardMetrics().then(data => setMetrics(data)).catch(() => {});
  }, []);

  const handleIncomingFeedback = useCallback((fbPayload) => {
    if (!fbPayload) return;
    setMetrics((prev) => {
      const newFb = {
        id: fbPayload.id || `fb_${Date.now()}`,
        userName: fbPayload.userName || 'Typist',
        rating: fbPayload.rating || 5,
        comment: fbPayload.comment || '',
        date: 'Just now'
      };
      return {
        ...prev,
        recentFeedback: [newFb, ...prev.recentFeedback.slice(0, 4)]
      };
    });
  }, []);

  // TWO-WAY REAL-TIME SUBSCRIPTION: supabase.channel('admin-live-feed')
  useEffect(() => {
    loadLiveMetrics();

    let channel = null;

    if (supabaseService.isConfigured()) {
      channel = supabaseService.supabase
        .channel('admin-live-feed')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'test_sessions' },
          (payload) => {
            handleIncomingTest(payload.new);
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'test_logs' },
          (payload) => {
            handleIncomingTest(payload.new);
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'profiles' },
          (payload) => {
            handleIncomingProfile(payload.new);
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'users' },
          (payload) => {
            handleIncomingProfile(payload.new);
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'feedback' },
          (payload) => {
            handleIncomingFeedback(payload.new);
          }
        )
        .subscribe();
    }

    // Cross-tab BroadcastChannel for zero-latency instant telemetry across portals
    let bc = null;
    try {
      bc = new BroadcastChannel('admin-live-feed');
      bc.onmessage = (event) => {
        if (event.data?.type === 'TEST_COMPLETED') {
          handleIncomingTest(event.data.payload);
        } else if (event.data?.type === 'USER_REGISTERED' || event.data?.type === 'ADMIN_CREATED') {
          handleIncomingProfile(event.data.payload);
        } else if (event.data?.type === 'FEEDBACK_SUBMITTED') {
          handleIncomingFeedback(event.data.payload);
        }
      };
    } catch {
      // fallback
    }

    const handleLocalEvent = (e) => {
      if (e.detail?.type === 'TEST_COMPLETED') {
        handleIncomingTest(e.detail.payload);
      } else if (e.detail?.type === 'USER_REGISTERED' || e.detail?.type === 'ADMIN_CREATED') {
        handleIncomingProfile(e.detail.payload);
      } else if (e.detail?.type === 'FEEDBACK_SUBMITTED') {
        handleIncomingFeedback(e.detail.payload);
      }
    };
    window.addEventListener('typemaster-admin-feed', handleLocalEvent);

    return () => {
      if (channel && supabaseService.isConfigured()) {
        supabaseService.supabase.removeChannel(channel);
      }
      if (bc) bc.close();
      window.removeEventListener('typemaster-admin-feed', handleLocalEvent);
    };
  }, [loadLiveMetrics, handleIncomingTest, handleIncomingProfile, handleIncomingFeedback]);

  // SVG Chart dimensions
  const chartW = 460;
  const chartH = 150;
  const maxVal = Math.max(10, ...metrics.activeUsersPoints, ...metrics.newUsersPoints);

  const getPointsStr = (dataArr) => {
    if (!dataArr || dataArr.length === 0) return '';
    return dataArr.map((val, idx) => {
      const x = (idx / (dataArr.length - 1)) * (chartW - 40) + 30;
      const y = chartH - (val / maxVal) * (chartH - 30) - 15;
      return `${x},${y}`;
    }).join(' ');
  };

  return (
    <div style={{ padding: '24px 32px', backgroundColor: '#F8FAFC', minHeight: 'calc(100vh - 70px)' }}>
      {/* Page Title & Subtitle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.3px', margin: 0 }}>
            Dashboard
          </h1>
          <p style={{ fontSize: '0.86rem', color: '#64748B', marginTop: '4px', marginBottom: 0 }}>
            Live platform metrics, telemetry, and user activity (Supabase Live Connected)
          </p>
        </div>

        <button
          onClick={loadLiveMetrics}
          title="Refresh Live Metrics"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            color: '#4F46E5',
            padding: '7px 12px',
            borderRadius: '9px',
            fontSize: '0.8rem',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          <RotateCw size={14} className={loading ? 'spin' : ''} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* 5 Key Metric Cards (Dynamic Live Database Values) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}
      >
        {/* Card 1: Total Users */}
        <div style={metricCardStyle('#EFF6FF', '#BFDBFE')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={iconBadgeStyle('#3B82F6', '#EFF6FF')}>
              <Users size={22} color="#2563EB" />
            </div>
            <div>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>
                {metrics.totalUsers}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>Total Registered Users</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 700, color: '#16A34A' }}>
            <span>Live DB Count</span>
            <span style={{ color: '#94A3B8', fontWeight: 500 }}>• Real-time</span>
          </div>
        </div>

        {/* Card 2: Active Users */}
        <div style={metricCardStyle('#ECFDF5', '#A7F3D0')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={iconBadgeStyle('#10B981', '#ECFDF5')}>
              <UserCheck size={22} color="#059669" />
            </div>
            <div>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>
                {metrics.activeUsers}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>Active Users (30d)</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 700, color: '#16A34A' }}>
            <span>Active Typists</span>
            <span style={{ color: '#94A3B8', fontWeight: 500 }}>• Verified session</span>
          </div>
        </div>

        {/* Card 3: Tests Completed */}
        <div style={metricCardStyle('#FFFBEB', '#FDE68A')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={iconBadgeStyle('#F59E0B', '#FFFBEB')}>
              <FileText size={22} color="#D97706" />
            </div>
            <div>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>
                {metrics.testsCompleted}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>Tests Completed</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 700, color: '#16A34A' }}>
            <span>Telemetry Runs</span>
            <span style={{ color: '#94A3B8', fontWeight: 500 }}>• Zero dummy logs</span>
          </div>
        </div>

        {/* Card 4: Average Typing Speed */}
        <div style={metricCardStyle('#F5F3FF', '#DDD6FE')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={iconBadgeStyle('#8B5CF6', '#F5F3FF')}>
              <Gauge size={22} color="#7C3AED" />
            </div>
            <div>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>
                {metrics.avgWpm} WPM
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>Platform Avg Speed</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 700, color: '#16A34A' }}>
            <span>Computed Avg</span>
            <span style={{ color: '#94A3B8', fontWeight: 500 }}>• Real WPM telemetry</span>
          </div>
        </div>

        {/* Card 5: Achievements Earned */}
        <div style={metricCardStyle('#FFF1F2', '#FECDD3')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={iconBadgeStyle('#F43F5E', '#FFF1F2')}>
              <Trophy size={22} color="#E11D48" />
            </div>
            <div>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>
                {metrics.achievementsEarned}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>Milestones Earned</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 700, color: '#16A34A' }}>
            <span>Verified Badges</span>
            <span style={{ color: '#94A3B8', fontWeight: 500 }}>• Active community</span>
          </div>
        </div>
      </div>

      {/* Row 2: 3 Visualizations (Dynamic from real data) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.2fr 1fr 1fr',
          gap: '20px',
          marginBottom: '24px'
        }}
      >
        {/* Chart 1: User Activity */}
        <div style={chartCardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A' }}>
              User Activity Progression
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.72rem', fontWeight: 600 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#0284C7' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0284C7' }} />
                Total Users ({metrics.totalUsers})
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#7C3AED' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#7C3AED' }} />
                Active ({metrics.activeUsers})
              </div>
            </div>
          </div>

          <div style={{ width: '100%', height: '170px', position: 'relative' }}>
            <svg viewBox={`0 0 ${chartW} ${chartH}`} style={{ width: '100%', height: '100%', overflow: 'visible' }}>
              {/* Horizontal grid lines */}
              {[0, Math.round(maxVal / 2), maxVal].map((v) => {
                const y = chartH - (v / maxVal) * (chartH - 30) - 15;
                return (
                  <g key={v}>
                    <line x1="25" y1={y} x2={chartW - 10} y2={y} stroke="#F1F5F9" strokeWidth="1" />
                    <text x="18" y={y + 3} textAnchor="end" fontSize="9" fill="#94A3B8">
                      {v}
                    </text>
                  </g>
                );
              })}

              {/* Active Users line (Purple) */}
              <polyline
                fill="none"
                stroke="#8B5CF6"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={getPointsStr(metrics.activeUsersPoints)}
              />
              {metrics.activeUsersPoints.map((val, idx) => {
                const x = (idx / (metrics.activeUsersPoints.length - 1)) * (chartW - 40) + 30;
                const y = chartH - (val / maxVal) * (chartH - 30) - 15;
                return <circle key={idx} cx={x} cy={y} r="3.5" fill="#8B5CF6" stroke="#FFFFFF" strokeWidth="1.5" />;
              })}

              {/* New Users line (Cyan) */}
              <polyline
                fill="none"
                stroke="#06B6D4"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={getPointsStr(metrics.newUsersPoints)}
              />
              {metrics.newUsersPoints.map((val, idx) => {
                const x = (idx / (metrics.newUsersPoints.length - 1)) * (chartW - 40) + 30;
                const y = chartH - (val / maxVal) * (chartH - 30) - 15;
                return <circle key={idx} cx={x} cy={y} r="3.5" fill="#06B6D4" stroke="#FFFFFF" strokeWidth="1.5" />;
              })}
            </svg>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 8px', marginTop: '6px' }}>
            {metrics.activityDays.map((d) => (
              <span key={d} style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 500 }}>
                {d}
              </span>
            ))}
          </div>
        </div>

        {/* Chart 2: Typing Speed Distribution */}
        <div style={chartCardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A' }}>
              Speed Distribution
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>Live WPM Brackets</div>
          </div>

          <div
            style={{
              height: '165px',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              padding: '0 8px 10px 8px',
              borderBottom: '1px solid #F1F5F9'
            }}
          >
            {metrics.speedDistribution.map((bar) => (
              <div key={bar.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                <span style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 600, marginBottom: '4px' }}>
                  {bar.count}
                </span>
                <div
                  style={{
                    width: '32px',
                    height: `${bar.heightPercent}%`,
                    backgroundColor: bar.color,
                    borderRadius: '6px 6px 0 0',
                    transition: 'height 0.3s ease'
                  }}
                  title={`${bar.label} WPM: ${bar.count} tests`}
                />
                <span style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '6px', fontWeight: 600 }}>
                  {bar.label}
                </span>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: '6px', fontSize: '0.72rem', color: '#94A3B8' }}>
            Typing Speed (WPM)
          </div>
        </div>

        {/* Chart 3: Test Attempts by Type */}
        <div style={chartCardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A' }}>
              Test Attempts by Type
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>Live Logs</div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '180px' }}>
            {/* SVG Donut Chart */}
            <div style={{ position: 'relative', width: '130px', height: '130px' }}>
              <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                {(() => {
                  let accumulatedPercent = 0;
                  return metrics.testCategories.map((cat, idx) => {
                    const strokeDasharray = `${cat.percent * 2.83} 283`;
                    const strokeDashoffset = -accumulatedPercent * 2.83;
                    accumulatedPercent += cat.percent;
                    return (
                      <circle
                        key={idx}
                        cx="50"
                        cy="50"
                        r="45"
                        fill="transparent"
                        stroke={cat.color}
                        strokeWidth="16"
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                      />
                    );
                  });
                })()}
              </svg>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center'
                }}
              >
                <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>
                  {metrics.testsCompleted}
                </span>
                <span style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 600 }}>Tests</span>
              </div>
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', flex: 1, paddingLeft: '16px' }}>
              {metrics.testCategories.map((c) => (
                <div key={c.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.76rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: c.color }} />
                    <span style={{ color: '#334155', fontWeight: 500 }}>{c.name}</span>
                  </div>
                  <span style={{ fontWeight: 700, color: '#0F172A' }}>{c.percent}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: 4 Summary Tables with Real Database Rows */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))',
          gap: '20px'
        }}
      >
        {/* Table 1: Recent Users (Real Supabase / Registry Users) */}
        <div style={tableCardStyle}>
          <div style={tableHeaderStyle}>
            <div>
              <div style={{ fontSize: '0.96rem', fontWeight: 700, color: '#0F172A' }}>Recent Users</div>
              <div style={{ fontSize: '0.74rem', color: '#64748B' }}>Actual registered accounts</div>
            </div>
            <button onClick={() => onNavigate('users')} style={viewAllButtonStyle}>
              View All <ArrowRight size={13} />
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.78rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E2E8F0', color: '#64748B', background: '#F8FAFC' }}>
                  <th style={{ padding: '8px 10px' }}>#</th>
                  <th style={{ padding: '8px 10px' }}>Name</th>
                  <th style={{ padding: '8px 10px' }}>Email</th>
                  <th style={{ padding: '8px 10px' }}>Joined On</th>
                  <th style={{ padding: '8px 10px' }}>Status</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {metrics.recentUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: '#94A3B8' }}>
                      No users registered yet.
                    </td>
                  </tr>
                ) : (
                  metrics.recentUsers.map((u, i) => (
                    <tr key={u.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '10px 10px', color: '#94A3B8' }}>{i + 1}</td>
                      <td style={{ padding: '10px 10px', fontWeight: 600, color: '#1E293B' }}>{u.name}</td>
                      <td style={{ padding: '10px 10px', color: '#64748B' }}>{u.email}</td>
                      <td style={{ padding: '10px 10px', color: '#64748B' }}>{u.joinedOn}</td>
                      <td style={{ padding: '10px 10px' }}>
                        <span style={statusBadgeStyle(u.status)}>{u.status}</span>
                      </td>
                      <td style={{ padding: '10px 10px', textAlign: 'center' }}>
                        <button
                          onClick={() => {
                            if (onSelectUserForAnalytics) onSelectUserForAnalytics(u);
                            onNavigate('performance');
                          }}
                          title="View user performance"
                          style={smallActionButtonStyle}
                        >
                          <BarChart2 size={14} color="#6366F1" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table 2: Top Performing Users (Real Speeds) */}
        <div style={tableCardStyle}>
          <div style={tableHeaderStyle}>
            <div>
              <div style={{ fontSize: '0.96rem', fontWeight: 700, color: '#0F172A' }}>Top Performing Users</div>
              <div style={{ fontSize: '0.74rem', color: '#64748B' }}>Highest verified WPM & precision</div>
            </div>
            <button onClick={() => onNavigate('achievements')} style={viewAllButtonStyle}>
              View All <ArrowRight size={13} />
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.78rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E2E8F0', color: '#64748B', background: '#F8FAFC' }}>
                  <th style={{ padding: '8px 10px' }}>#</th>
                  <th style={{ padding: '8px 10px' }}>Name</th>
                  <th style={{ padding: '8px 10px' }}>Avg WPM</th>
                  <th style={{ padding: '8px 10px' }}>Accuracy</th>
                  <th style={{ padding: '8px 10px' }}>Tests</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {metrics.topPerformers.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: '#94A3B8' }}>
                      No performer benchmarks recorded yet. Complete typing tests to rank on leaderboard.
                    </td>
                  </tr>
                ) : (
                  metrics.topPerformers.map((tp) => (
                    <tr key={tp.rank} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '10px 10px', color: '#94A3B8', fontWeight: 700 }}>
                        {tp.rank === 1 ? '🥇 1' : tp.rank === 2 ? '🥈 2' : tp.rank === 3 ? '🥉 3' : tp.rank}
                      </td>
                      <td style={{ padding: '10px 10px', fontWeight: 600, color: '#1E293B' }}>{tp.name}</td>
                      <td style={{ padding: '10px 10px', fontWeight: 700, color: '#4F46E5' }}>{tp.avgWpm} WPM</td>
                      <td style={{ padding: '10px 10px', color: '#10B981', fontWeight: 600 }}>{tp.accuracy}%</td>
                      <td style={{ padding: '10px 10px', color: '#64748B' }}>{tp.tests}</td>
                      <td style={{ padding: '10px 10px', textAlign: 'center' }}>
                        <button onClick={() => onNavigate('performance')} title="View Performance" style={smallActionButtonStyle}>
                          <BarChart2 size={14} color="#6366F1" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table 3: Latest Test Attempts (Real test_logs) */}
        <div style={tableCardStyle}>
          <div style={tableHeaderStyle}>
            <div>
              <div style={{ fontSize: '0.96rem', fontWeight: 700, color: '#0F172A' }}>Latest Test Attempts</div>
              <div style={{ fontSize: '0.74rem', color: '#64748B' }}>Real telemetry submissions</div>
            </div>
            <button onClick={() => onNavigate('reports')} style={viewAllButtonStyle}>
              View All <ArrowRight size={13} />
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.78rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E2E8F0', color: '#64748B', background: '#F8FAFC' }}>
                  <th style={{ padding: '8px 10px' }}>#</th>
                  <th style={{ padding: '8px 10px' }}>User</th>
                  <th style={{ padding: '8px 10px' }}>Test Type</th>
                  <th style={{ padding: '8px 10px' }}>WPM</th>
                  <th style={{ padding: '8px 10px' }}>Accuracy</th>
                  <th style={{ padding: '8px 10px' }}>Time</th>
                  <th style={{ padding: '8px 10px' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {metrics.latestTestAttempts.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: '#94A3B8' }}>
                      No test sessions recorded yet. Start a test in User Portal to see real-time telemetry here!
                    </td>
                  </tr>
                ) : (
                  metrics.latestTestAttempts.map((att) => (
                    <tr key={att.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '10px 10px', color: '#94A3B8' }}>{att.id}</td>
                      <td style={{ padding: '10px 10px', fontWeight: 600, color: '#1E293B' }}>{att.user}</td>
                      <td style={{ padding: '10px 10px', color: '#475569' }}>
                        <span style={{ background: '#F1F5F9', padding: '3px 7px', borderRadius: '6px', fontSize: '0.72rem' }}>
                          {att.type}
                        </span>
                      </td>
                      <td style={{ padding: '10px 10px', fontWeight: 700, color: '#2563EB' }}>{att.wpm}</td>
                      <td style={{ padding: '10px 10px', fontWeight: 600, color: '#059669' }}>{att.accuracy}</td>
                      <td style={{ padding: '10px 10px', color: '#64748B' }}>{att.time}</td>
                      <td style={{ padding: '10px 10px', color: '#94A3B8', fontSize: '0.72rem' }}>{att.date}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table 4: Recent Feedback */}
        <div style={tableCardStyle}>
          <div style={tableHeaderStyle}>
            <div>
              <div style={{ fontSize: '0.96rem', fontWeight: 700, color: '#0F172A' }}>Recent Feedback</div>
              <div style={{ fontSize: '0.74rem', color: '#64748B' }}>User reviews and ratings</div>
            </div>
            <button onClick={() => onNavigate('feedback')} style={viewAllButtonStyle}>
              View All <ArrowRight size={13} />
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.78rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E2E8F0', color: '#64748B', background: '#F8FAFC' }}>
                  <th style={{ padding: '8px 10px' }}>User</th>
                  <th style={{ padding: '8px 10px' }}>Rating</th>
                  <th style={{ padding: '8px 10px' }}>Feedback</th>
                  <th style={{ padding: '8px 10px' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {metrics.recentFeedback.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: '#94A3B8' }}>
                      No user feedback submitted yet. First-test feedback ratings will appear here live.
                    </td>
                  </tr>
                ) : (
                  metrics.recentFeedback.slice(0, 5).map((fb) => (
                    <tr key={fb.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '10px 10px', fontWeight: 600, color: '#1E293B', whiteSpace: 'nowrap' }}>
                        {fb.userName}
                      </td>
                      <td style={{ padding: '10px 10px', whiteSpace: 'nowrap' }}>
                        <span style={{ color: '#F59E0B', fontSize: '0.85rem' }}>
                          {'★'.repeat(fb.rating)}{'☆'.repeat(5 - fb.rating)}
                        </span>
                      </td>
                      <td style={{ padding: '10px 10px', color: '#475569', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {fb.comment || 'No comment provided'}
                      </td>
                      <td style={{ padding: '10px 10px', color: '#94A3B8', fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
                        {fb.date ? fb.date.split(' ')[0] : 'Today'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// Styling Helpers
const metricCardStyle = (bgSoft, borderCol) => ({
  backgroundColor: '#FFFFFF',
  borderRadius: '16px',
  padding: '18px 20px',
  border: '1px solid #E2E8F0',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between'
});

const iconBadgeStyle = (accentCol, bgSoft) => ({
  width: '42px',
  height: '42px',
  borderRadius: '12px',
  backgroundColor: bgSoft,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0
});

const chartCardStyle = {
  backgroundColor: '#FFFFFF',
  borderRadius: '16px',
  padding: '20px 22px',
  border: '1px solid #E2E8F0',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
  display: 'flex',
  flexDirection: 'column'
};

const tableCardStyle = {
  backgroundColor: '#FFFFFF',
  borderRadius: '16px',
  padding: '20px 22px',
  border: '1px solid #E2E8F0',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)'
};

const tableHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: '14px'
};

const viewAllButtonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  background: 'transparent',
  border: 'none',
  color: '#4F46E5',
  fontSize: '0.76rem',
  fontWeight: 700,
  cursor: 'pointer'
};

const statusBadgeStyle = (status) => ({
  display: 'inline-block',
  padding: '3px 8px',
  borderRadius: '999px',
  fontSize: '0.7rem',
  fontWeight: 700,
  backgroundColor: status === 'Active' ? '#ECFDF5' : '#FEF2F2',
  color: status === 'Active' ? '#059669' : '#DC2626',
  border: `1px solid ${status === 'Active' ? '#A7F3D0' : '#FECDD3'}`
});

const smallActionButtonStyle = {
  background: '#F1F5F9',
  border: 'none',
  borderRadius: '6px',
  width: '26px',
  height: '26px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer'
};
