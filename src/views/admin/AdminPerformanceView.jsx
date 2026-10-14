import React, { useState, useEffect } from 'react';
import {
  LineChart,
  TrendingUp,
  Award,
  Clock,
  Target,
  FileSpreadsheet,
  Calendar,
  CheckCircle2,
  ChevronDown,
  User,
  History,
  Activity,
  Flame
} from 'lucide-react';
import { adminService, isDateInPeriod } from '../../services/adminService';
import { supabaseService } from '../../services/supabaseService';

export default function AdminPerformanceView({ initialUser, dateRange = 'All Time', onDateRangeChange }) {
  const [usersList, setUsersList] = useState(() => {
    const local = adminService.getUsers() || [];
    if (initialUser && initialUser.id && !local.some(u => u && String(u.id) === String(initialUser.id))) {
      return [initialUser, ...local];
    }
    return local;
  });

  const [selectedUserId, setSelectedUserId] = useState(() => {
    return initialUser?.id || (usersList[0] ? usersList[0].id : '');
  });

  useEffect(() => {
    adminService.fetchAllUsersLive().then(live => {
      if (live && live.length > 0) {
        setUsersList(prev => {
          const map = new Map();
          if (initialUser) map.set(String(initialUser.id), initialUser);
          live.forEach(u => map.set(String(u.id), u));
          prev.forEach(u => { if (!map.has(String(u.id))) map.set(String(u.id), u); });
          return Array.from(map.values());
        });
      }
    });
  }, [initialUser]);

  useEffect(() => {
    if (initialUser?.id) {
      setSelectedUserId(initialUser.id);
    }
  }, [initialUser?.id]);

  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'history', 'practice', 'achievements'
  const [timeRange, setTimeRange] = useState(dateRange || 'All Time');
  const [toastMsg, setToastMsg] = useState('');
  const [userLogs, setUserLogs] = useState([]);

  useEffect(() => {
    if (dateRange) {
      setTimeRange(dateRange);
    }
  }, [dateRange]);

  const currentUser = usersList.find((u) => String(u.id) === String(selectedUserId)) || usersList[0] || {
    id: 'empty',
    name: 'No Users Registered',
    email: '',
    avgWpm: 0,
    highestWpm: 0,
    accuracy: 0,
    testsTaken: 0,
    totalPracticeTimeHours: 0,
    status: 'Inactive',
    joinedOn: 'N/A'
  };

  useEffect(() => {
    if (currentUser?.id && currentUser.id !== 'empty') {
      supabaseService.fetchUserTestLogs(currentUser.id).then(logs => {
        setUserLogs(logs || []);
      });
    } else {
      setUserLogs([]);
    }
  }, [currentUser?.id]);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const handleExport = () => {
    if (currentUser && currentUser.id !== 'empty') {
      adminService.exportUserDetailToExcel(currentUser);
      showToast(`Exported ${currentUser.name}'s performance history to Excel (.xlsx)!`);
    }
  };

  const handleExportAll = () => {
    adminService.exportPerformanceReport(timeRange, 'xlsx');
    showToast('Platform performance report exported to Excel (.xlsx)!');
  };

  const filteredUserLogs = timeRange && timeRange !== 'All Time'
    ? userLogs.filter(l => isDateInPeriod(l.created_at || l.date, timeRange))
    : userLogs;

  // Dynamic progress history curve strictly from real test logs
  const chronological = [...filteredUserLogs].reverse().slice(-7);
  const speedHistory = chronological.length > 0
    ? chronological.map(l => ({
        date: l.created_at ? new Date(l.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : (l.date || 'Recent'),
        wpm: Number(l.wpm) || 0
      }))
    : [];

  const accuracyHistory = chronological.length > 0
    ? chronological.map(l => ({
        date: l.created_at ? new Date(l.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : (l.date || 'Recent'),
        accuracy: Number(l.accuracy) || 0
      }))
    : [];

  const testLogs = filteredUserLogs.map((l, idx) => ({
    id: idx + 1,
    title: l.category ? `${l.category} Session` : `Test Session #${idx + 1}`,
    type: l.category || 'General',
    difficulty: l.difficulty || 'Easy',
    wpm: l.wpm || 0,
    accuracy: `${l.accuracy || 0}%`,
    errors: l.errors || 0,
    duration: typeof l.duration === 'number' ? `${Math.round(l.duration / 60) || 1} min` : (l.duration || '1 min'),
    date: l.created_at ? new Date(l.created_at).toLocaleString() : (l.date || 'Recent')
  }));

  // SVG Helper
  const chartW = 480;
  const chartH = 140;

  const getPointsStr = (dataArr, key, minVal, maxVal) => {
    if (!dataArr || dataArr.length === 0) return '';
    if (dataArr.length === 1) {
      const y = chartH - ((dataArr[0][key] - minVal) / Math.max(1, (maxVal - minVal))) * (chartH - 30) - 15;
      return `25,${y} ${chartW - 15},${y}`;
    }
    return dataArr.map((item, idx) => {
      const x = (idx / (dataArr.length - 1)) * (chartW - 40) + 25;
      const y = chartH - ((item[key] - minVal) / Math.max(1, (maxVal - minVal))) * (chartH - 30) - 15;
      return `${x},${y}`;
    }).join(' ');
  };

  const getAreaStr = (dataArr, key, minVal, maxVal) => {
    if (!dataArr || dataArr.length === 0) return '';
    const pts = dataArr.map((item, idx) => {
      const divisor = Math.max(1, dataArr.length - 1);
      const x = (idx / divisor) * (chartW - 40) + 25;
      const y = chartH - ((item[key] - minVal) / Math.max(1, (maxVal - minVal))) * (chartH - 30) - 15;
      return `${x},${y}`;
    });
    const lastX = chartW - 15;
    const firstX = 25;
    return `${pts.join(' ')} ${lastX},${chartH} ${firstX},${chartH}`;
  };

  return (
    <div style={{ padding: '24px 32px', backgroundColor: '#F8FAFC', minHeight: 'calc(100vh - 70px)' }}>
      {/* Toast */}
      {toastMsg && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: '#0F172A',
            color: '#FFFFFF',
            padding: '12px 20px',
            borderRadius: '10px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            zIndex: 100,
            fontSize: '0.86rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <CheckCircle2 size={17} color="#10B981" />
          {toastMsg}
        </div>
      )}

      {/* Header with User Selector */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.3px', margin: 0 }}>
            User Performance Details
          </h1>
          <p style={{ fontSize: '0.86rem', color: '#64748B', marginTop: '4px', marginBottom: 0 }}>
            View detailed telemetry and progression of a user
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Select User Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748B' }}>User:</span>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              style={{
                padding: '8px 14px',
                borderRadius: '10px',
                border: '1px solid #E2E8F0',
                background: '#FFFFFF',
                color: '#1E293B',
                fontSize: '0.84rem',
                fontWeight: 700,
                cursor: 'pointer',
                outline: 'none',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
              }}
            >
              {usersList.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.avgWpm} WPM)
                </option>
              ))}
            </select>
          </div>

          {/* Export Selected User to Excel */}
          <button
            onClick={handleExport}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#10B981',
              color: '#FFFFFF',
              border: 'none',
              padding: '9px 16px',
              borderRadius: '10px',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)',
              transition: 'background 0.15s'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#059669')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#10B981')}
          >
            <FileSpreadsheet size={16} />
            <span>Export User (.xlsx)</span>
          </button>

          {/* Export All Users to Excel */}
          <button
            onClick={handleExportAll}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#4F46E5',
              color: '#FFFFFF',
              border: 'none',
              padding: '9px 16px',
              borderRadius: '10px',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(79, 70, 229, 0.25)',
              transition: 'background 0.15s'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#4338CA')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#4F46E5')}
          >
            <FileSpreadsheet size={16} />
            <span>Export All Users (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* User Hero Card (Matching Screenshot 2) */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          padding: '24px 28px',
          marginBottom: '24px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '20px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #4F46E5, #6366F1)',
              color: '#FFFFFF',
              fontSize: '1.5rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
            }}
          >
            {(currentUser?.name || 'User').split(' ').filter(Boolean).map((n) => n[0]).join('').substring(0, 2).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0F172A' }}>
              {currentUser.name}
            </div>
            <div style={{ fontSize: '0.82rem', color: '#64748B', marginTop: '2px' }}>
              {currentUser.email}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '4px' }}>
              Joined on {currentUser.joinedOn} • Status: <span style={{ color: currentUser.status === 'Active' ? '#059669' : '#DC2626', fontWeight: 700 }}>{currentUser.status}</span>
            </div>
          </div>
        </div>

        {/* 4 Key Metrics */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#4F46E5', lineHeight: 1.1 }}>
              {currentUser.avgWpm}
            </div>
            <div style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>Average WPM</div>
          </div>
          <div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#059669', lineHeight: 1.1 }}>
              {currentUser.accuracy}%
            </div>
            <div style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>Average Accuracy</div>
          </div>
          <div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>
              {currentUser.testsTaken}
            </div>
            <div style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>Tests Taken</div>
          </div>
          <div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>
              {currentUser.totalPracticeTimeHours} hrs
            </div>
            <div style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>Total Practice Time</div>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid #E2E8F0',
          marginBottom: '20px'
        }}
      >
        {[
          { id: 'overview', label: 'Performance Overview' },
          { id: 'history', label: 'Test History' },
          { id: 'practice', label: 'Practice Activity' },
          { id: 'achievements', label: 'Achievements' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 18px',
              border: 'none',
              background: 'transparent',
              fontSize: '0.86rem',
              fontWeight: activeTab === tab.id ? 700 : 500,
              color: activeTab === tab.id ? '#4F46E5' : '#64748B',
              borderBottom: activeTab === tab.id ? '2px solid #4F46E5' : '2px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Overview (Charts) */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Chart 1: Typing Speed Progress */}
          <div style={chartBoxStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ fontSize: '0.96rem', fontWeight: 700, color: '#0F172A' }}>
                Typing Speed Progress
              </div>
              <div style={{ fontSize: '0.74rem', color: '#6366F1', fontWeight: 700 }}>
                Peak: {currentUser.highestWpm} WPM
              </div>
            </div>

            <div style={{ width: '100%', height: '170px' }}>
              <svg viewBox={`0 0 ${chartW} ${chartH}`} style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                <defs>
                  <linearGradient id="speedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366F1" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#6366F1" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid */}
                {[0, 50, 100, 150].map((v) => {
                  const y = chartH - (v / 150) * (chartH - 30) - 15;
                  return (
                    <g key={v}>
                      <line x1="20" y1={y} x2={chartW - 10} y2={y} stroke="#F1F5F9" strokeWidth="1" />
                      <text x="14" y={y + 3} textAnchor="end" fontSize="9" fill="#94A3B8">
                        {v}
                      </text>
                    </g>
                  );
                })}

                {/* Area */}
                <polygon
                  fill="url(#speedGrad)"
                  points={getAreaStr(speedHistory, 'wpm', 0, 150)}
                />

                {/* Line */}
                <polyline
                  fill="none"
                  stroke="#4F46E5"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={getPointsStr(speedHistory, 'wpm', 0, 150)}
                />

                {/* Dots */}
                {speedHistory.map((item, idx) => {
                  const divisor = Math.max(1, speedHistory.length - 1);
                  const x = (idx / divisor) * (chartW - 40) + 25;
                  const y = chartH - (item.wpm / 150) * (chartH - 30) - 15;
                  return (
                    <circle key={idx} cx={x} cy={y} r="3.5" fill="#4F46E5" stroke="#FFFFFF" strokeWidth="1.5" />
                  );
                })}
              </svg>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 8px', marginTop: '6px' }}>
              {speedHistory.map((d) => (
                <span key={d.date} style={{ fontSize: '0.72rem', color: '#94A3B8' }}>{d.date}</span>
              ))}
            </div>
          </div>

          {/* Chart 2: Accuracy Trend */}
          <div style={chartBoxStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ fontSize: '0.96rem', fontWeight: 700, color: '#0F172A' }}>
                Accuracy Trend
              </div>
              <div style={{ fontSize: '0.74rem', color: '#059669', fontWeight: 700 }}>
                Avg: {currentUser.accuracy}%
              </div>
            </div>

            <div style={{ width: '100%', height: '170px' }}>
              <svg viewBox={`0 0 ${chartW} ${chartH}`} style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                <defs>
                  <linearGradient id="accGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid */}
                {[0, 25, 50, 75, 100].map((v) => {
                  const y = chartH - (v / 100) * (chartH - 30) - 15;
                  return (
                    <g key={v}>
                      <line x1="20" y1={y} x2={chartW - 10} y2={y} stroke="#F1F5F9" strokeWidth="1" />
                      <text x="14" y={y + 3} textAnchor="end" fontSize="9" fill="#94A3B8">
                        {v}%
                      </text>
                    </g>
                  );
                })}

                {/* Area */}
                <polygon
                  fill="url(#accGrad)"
                  points={getAreaStr(accuracyHistory, 'accuracy', 0, 100)}
                />

                {/* Line */}
                <polyline
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={getPointsStr(accuracyHistory, 'accuracy', 0, 100)}
                />

                {/* Dots */}
                {accuracyHistory.map((item, idx) => {
                  const divisor = Math.max(1, accuracyHistory.length - 1);
                  const x = (idx / divisor) * (chartW - 40) + 25;
                  const y = chartH - (item.accuracy / 100) * (chartH - 30) - 15;
                  return (
                    <circle key={idx} cx={x} cy={y} r="3.5" fill="#10B981" stroke="#FFFFFF" strokeWidth="1.5" />
                  );
                })}
              </svg>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 8px', marginTop: '6px' }}>
              {accuracyHistory.map((d) => (
                <span key={d.date} style={{ fontSize: '0.72rem', color: '#94A3B8' }}>{d.date}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Test History Table */}
      {activeTab === 'history' && (
        <div style={cardContainerStyle}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '0.94rem', fontWeight: 700, color: '#0F172A' }}>
              Comprehensive Test Attempt Logs
            </div>
            <button onClick={handleExport} style={smallExportBtnStyle}>
              Download Logs (.xlsx)
            </button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B' }}>
                  <th style={{ padding: '10px 14px' }}>Session</th>
                  <th style={{ padding: '10px 14px' }}>Test Passage</th>
                  <th style={{ padding: '10px 14px' }}>Category</th>
                  <th style={{ padding: '10px 14px' }}>Difficulty</th>
                  <th style={{ padding: '10px 14px' }}>WPM</th>
                  <th style={{ padding: '10px 14px' }}>Accuracy</th>
                  <th style={{ padding: '10px 14px' }}>Errors</th>
                  <th style={{ padding: '10px 14px' }}>Duration</th>
                  <th style={{ padding: '10px 14px' }}>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {testLogs.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '32px', color: '#94A3B8' }}>
                      No test attempts recorded yet for this typist.
                    </td>
                  </tr>
                ) : (
                  testLogs.map((log) => (
                    <tr key={log.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '12px 14px', color: '#94A3B8' }}>#{log.id}</td>
                      <td style={{ padding: '12px 14px', fontWeight: 600, color: '#1E293B' }}>{log.title}</td>
                      <td style={{ padding: '12px 14px', color: '#475569' }}>{log.type}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '999px', background: log.difficulty === 'Easy' ? '#ECFDF5' : '#FFFBEB', color: log.difficulty === 'Easy' ? '#059669' : '#D97706', fontWeight: 700 }}>
                          {log.difficulty}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: '#4F46E5' }}>{log.wpm}</td>
                      <td style={{ padding: '12px 14px', color: '#059669', fontWeight: 600 }}>{log.accuracy}</td>
                      <td style={{ padding: '12px 14px', color: '#EF4444' }}>{log.errors}</td>
                      <td style={{ padding: '12px 14px', color: '#64748B' }}>{log.duration}</td>
                      <td style={{ padding: '12px 14px', color: '#94A3B8', fontSize: '0.75rem' }}>{log.date}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Practice Activity */}
      {activeTab === 'practice' && (
        <div style={cardContainerStyle}>
          <div style={{ padding: '20px' }}>
            <div style={{ fontSize: '0.94rem', fontWeight: 700, color: '#0F172A', marginBottom: '16px' }}>
              Practice Breakdown by Category
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div style={categoryBoxStyle}>
                <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>Paragraph Passages</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#4F46E5', margin: '4px 0' }}>14 Completed</div>
                <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Total: 1.8 Hours</div>
              </div>
              <div style={categoryBoxStyle}>
                <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>Code Passages</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#059669', margin: '4px 0' }}>8 Completed</div>
                <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Total: 1.2 Hours</div>
              </div>
              <div style={categoryBoxStyle}>
                <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>Quotes & Literature</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#D97706', margin: '4px 0' }}>12 Completed</div>
                <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Total: 1.0 Hours</div>
              </div>
              <div style={categoryBoxStyle}>
                <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>High Frequency Words</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#8B5CF6', margin: '4px 0' }}>10 Completed</div>
                <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Total: 0.5 Hours</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Achievements */}
      {activeTab === 'achievements' && (
        <div style={cardContainerStyle}>
          <div style={{ padding: '20px' }}>
            <div style={{ fontSize: '0.94rem', fontWeight: 700, color: '#0F172A', marginBottom: '16px' }}>
              Badges & Milestones Unlocked
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
              <div style={badgeCardStyle(true)}>
                <div style={{ fontSize: '1.4rem' }}>⚡</div>
                <div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0F172A' }}>First Keystroke</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Completed initial test</div>
                </div>
              </div>
              <div style={badgeCardStyle(true)}>
                <div style={{ fontSize: '1.4rem' }}>🏆</div>
                <div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0F172A' }}>Speed Master (75+ WPM)</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Passed 75 WPM barrier</div>
                </div>
              </div>
              <div style={badgeCardStyle(true)}>
                <div style={{ fontSize: '1.4rem' }}>🎯</div>
                <div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0F172A' }}>Accuracy King</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Achieved 96%+ accuracy</div>
                </div>
              </div>
              <div style={badgeCardStyle(false)}>
                <div style={{ fontSize: '1.4rem', opacity: 0.4 }}>🔒</div>
                <div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#94A3B8' }}>Lightning Fast (100+ WPM)</div>
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Requires 100 WPM</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const chartBoxStyle = {
  backgroundColor: '#FFFFFF',
  borderRadius: '16px',
  border: '1px solid #E2E8F0',
  padding: '20px 24px',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)'
};

const cardContainerStyle = {
  backgroundColor: '#FFFFFF',
  borderRadius: '16px',
  border: '1px solid #E2E8F0',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
  overflow: 'hidden'
};

const smallExportBtnStyle = {
  padding: '6px 12px',
  borderRadius: '8px',
  border: '1px solid #10B981',
  background: '#ECFDF5',
  color: '#059669',
  fontSize: '0.78rem',
  fontWeight: 700,
  cursor: 'pointer'
};

const categoryBoxStyle = {
  background: '#F8FAFC',
  border: '1px solid #E2E8F0',
  borderRadius: '12px',
  padding: '16px'
};

const badgeCardStyle = (unlocked) => ({
  background: unlocked ? '#FFFFFF' : '#F8FAFC',
  border: `1px solid ${unlocked ? '#E2E8F0' : '#F1F5F9'}`,
  borderRadius: '12px',
  padding: '14px',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  opacity: unlocked ? 1 : 0.6
});
