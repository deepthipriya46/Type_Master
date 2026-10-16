import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Award,
  Zap,
  Target,
  Flame,
  Star,
  Plus,
  Edit,
  CheckCircle2,
  X,
  Filter,
  Medal,
  Users,
  FileSpreadsheet,
  RefreshCw
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { supabase, supabaseService } from '../../services/supabaseService';

export default function AdminAchievementsView() {
  const [activeTab, setActiveTab] = useState('leaderboard'); // 'leaderboard', 'badges'
  const [timeframe, setTimeframe] = useState('All-Time');
  const [badges, setBadges] = useState(() => adminService.getBadges());
  const [leaderboardList, setLeaderboardList] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchGlobalLeaderboard = async () => {
    setLoading(true);
    try {
      // Fetch aggregate performance metrics for all registered users using valid schema columns
      let { data: leaderboardData, error } = await supabase
        .from('users')
        .select(`
          id,
          username,
          email,
          avatar_url,
          best_wpm,
          avg_wpm,
          accuracy,
          tests_completed,
          test_logs (
            wpm,
            accuracy,
            created_at
          )
        `);

      if (error) {
        // Fallback without joined test_logs if relationship fails
        const fallbackRes = await supabase
          .from('users')
          .select('id, username, email, avatar_url, best_wpm, avg_wpm, accuracy, tests_completed');
        if (!fallbackRes.error && fallbackRes.data) {
          leaderboardData = fallbackRes.data;
          error = null;
        }
      }

      if (error) {
        console.warn('Supabase direct leaderboard fetch notice in admin achievements, using service layer:', error.message || error);
        const fallbackList = adminService.getLeaderboardRankings(timeframe);
        setLeaderboardList(fallbackList || []);
        return;
      }

      // Filter logs by timeframe if specified
      const now = Date.now();
      const filterLogs = (logs) => {
        if (!timeframe || timeframe.toLowerCase() === 'all-time' || timeframe.toLowerCase() === 'all') return logs;
        const days = timeframe.toLowerCase() === 'today' ? 1 : timeframe.toLowerCase() === 'weekly' ? 7 : 30;
        const cutoff = now - days * 24 * 60 * 60 * 1000;
        return logs.filter(l => {
          const t = l.created_at ? new Date(l.created_at).getTime() : 0;
          return t >= cutoff;
        });
      };

      // Only registered typists (exclude anonymous temporary guests)
      const registeredUsers = (leaderboardData || []).filter(u => u && !String(u.id).startsWith('guest_'));

      // Calculate user performance metrics dynamically
      const computedLeaderboard = registeredUsers.map((user) => {
        const logs = filterLogs(user.test_logs || []);
        const testsCompleted = logs.length;

        if (testsCompleted === 0) {
          return {
            id: user.id,
            user: user.full_name || user.displayName || user.username || 'Typist',
            name: user.full_name || user.displayName || user.username || 'Typist',
            email: user.email,
            wpm: 0,
            accuracy: 0, // Set accuracy to 0% (not default 98%) when no tests taken
            testsCompleted: 0,
            tier: 'Unranked',
            status: user.status || 'Active'
          };
        }

        // Compute peak speed and average accuracy for active typists
        const maxWpm = Math.max(...logs.map((l) => Number(l.wpm) || 0));
        const avgAccuracy = (
          logs.reduce((acc, l) => acc + (Number(l.accuracy) || 0), 0) / testsCompleted
        ).toFixed(1);

        let tier = 'Bronze';
        if (maxWpm >= 80) tier = 'Master';
        else if (maxWpm >= 50) tier = 'Gold';
        else if (maxWpm >= 30) tier = 'Silver';

        return {
          id: user.id,
          user: user.full_name || user.displayName || user.username || 'Typist',
          name: user.full_name || user.displayName || user.username || 'Typist',
          email: user.email,
          wpm: maxWpm,
          accuracy: parseFloat(avgAccuracy),
          testsCompleted,
          tier,
          status: user.status || 'Active'
        };
      });

      // Sort: Active users first, then by WPM (desc), then Accuracy (desc), then Tests (desc)
      const sortedLeaderboard = computedLeaderboard.sort((a, b) => {
        if (a.testsCompleted === 0 && b.testsCompleted > 0) return 1;
        if (a.testsCompleted > 0 && b.testsCompleted === 0) return -1;
        if (b.wpm !== a.wpm) return b.wpm - a.wpm;
        if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
        return b.testsCompleted - a.testsCompleted;
      });

      // Assign sequential dynamic ranks (#1, #2, #3, ...)
      const rankedUsers = sortedLeaderboard.map((user, index) => ({
        ...user,
        rank: index + 1
      }));

      setLeaderboardList(rankedUsers);
    } catch (err) {
      console.error('Error in fetchGlobalLeaderboard:', err);
      const fallbackList = adminService.getLeaderboardRankings(timeframe);
      setLeaderboardList(fallbackList || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGlobalLeaderboard();
  }, [timeframe]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBadge, setEditingBadge] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Speed',
    icon: 'trophy',
    threshold: '>= 80 WPM'
  });

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const handleOpenAddModal = () => {
    setEditingBadge(null);
    setForm({
      title: '',
      description: '',
      category: 'Speed',
      icon: 'trophy',
      threshold: '>= 80 WPM'
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (b) => {
    setEditingBadge(b);
    setForm({
      title: b.title,
      description: b.description,
      category: b.category,
      icon: b.icon,
      threshold: b.threshold
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title || !form.threshold) {
      alert('Please fill in title and threshold');
      return;
    }

    if (editingBadge) {
      adminService.updateBadge(editingBadge.id, form);
      showToast('Badge criteria updated!');
    } else {
      adminService.createBadge(form);
      showToast('New achievement badge created!');
    }
    setBadges(adminService.getBadges());
    setIsModalOpen(false);
  };

  const handleExportAchievements = () => {
    adminService.exportAchievementsToExcel(badges, leaderboardList);
    showToast('Leaderboard & Achievements exported to Excel (.xlsx)!');
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

      {/* Header */}
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
            Leaderboards & Achievements
          </h1>
          <p style={{ fontSize: '0.86rem', color: '#64748B', marginTop: '4px', marginBottom: 0 }}>
            Monitor global typist rankings and configure milestone criteria
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handleExportAchievements}
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
            <span>Export Achievements (.xlsx)</span>
          </button>

          {activeTab === 'badges' && (
            <button
              onClick={handleOpenAddModal}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#4F46E5',
                color: '#FFFFFF',
                border: 'none',
                padding: '9px 18px',
                borderRadius: '10px',
                fontSize: '0.84rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(79, 70, 229, 0.3)'
              }}
            >
              <Plus size={16} />
              <span>Create Badge</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #E2E8F0',
          marginBottom: '20px'
        }}
      >
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setActiveTab('leaderboard')}
            style={{
              padding: '10px 18px',
              border: 'none',
              background: 'transparent',
              fontSize: '0.86rem',
              fontWeight: activeTab === 'leaderboard' ? 700 : 500,
              color: activeTab === 'leaderboard' ? '#4F46E5' : '#64748B',
              borderBottom: activeTab === 'leaderboard' ? '2px solid #4F46E5' : '2px solid transparent',
              cursor: 'pointer'
            }}
          >
            Global Rankings
          </button>
          <button
            onClick={() => setActiveTab('badges')}
            style={{
              padding: '10px 18px',
              border: 'none',
              background: 'transparent',
              fontSize: '0.86rem',
              fontWeight: activeTab === 'badges' ? 700 : 500,
              color: activeTab === 'badges' ? '#4F46E5' : '#64748B',
              borderBottom: activeTab === 'badges' ? '2px solid #4F46E5' : '2px solid transparent',
              cursor: 'pointer'
            }}
          >
            Milestone Badges ({badges.length})
          </button>
        </div>

        {activeTab === 'leaderboard' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>Period:</span>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              style={{
                padding: '5px 10px',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                background: '#FFFFFF',
                fontSize: '0.78rem',
                fontWeight: 600,
                color: '#334155',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="All-Time">All-Time</option>
              <option value="Monthly">Monthly</option>
              <option value="Weekly">Weekly</option>
            </select>
            <button
              onClick={fetchGlobalLeaderboard}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '5px 8px',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                background: '#FFFFFF',
                fontSize: '0.78rem',
                color: '#475569',
                cursor: 'pointer'
              }}
              title="Refresh Leaderboard"
            >
              <RefreshCw size={13} className={loading ? 'spin' : ''} />
            </button>
          </div>
        )}
      </div>

      {/* Tab 1: Leaderboard Table */}
      {activeTab === 'leaderboard' && (
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
            overflow: 'hidden'
          }}
        >
          {loading && leaderboardList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: '#64748B' }}>
              <RefreshCw size={24} className="spin" style={{ margin: '0 auto 10px auto', display: 'block' }} />
              <p style={{ margin: 0, fontSize: '0.86rem' }}>Calculating dynamic global rankings...</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B' }}>
                  <th style={{ padding: '14px 18px', width: '80px' }}>Rank</th>
                  <th style={{ padding: '14px 18px' }}>User</th>
                  <th style={{ padding: '14px 18px' }}>Email</th>
                  <th style={{ padding: '14px 18px', textAlign: 'center' }}>Speed</th>
                  <th style={{ padding: '14px 18px', textAlign: 'center' }}>Accuracy</th>
                  <th style={{ padding: '14px 18px', textAlign: 'center' }}>Tests Completed</th>
                  <th style={{ padding: '14px 18px' }}>Tier</th>
                  <th style={{ padding: '14px 18px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {leaderboardList.map((r) => (
                  <tr
                    key={r.id || r.rank}
                    style={{
                      borderBottom: '1px solid #F1F5F9',
                      background: r.rank === 1 ? '#FFFDF5' : '#FFFFFF'
                    }}
                  >
                    <td style={{ padding: '14px 18px', fontWeight: 800 }}>
                      {r.rank === 1 ? '🥇 #1' : r.rank === 2 ? '🥈 #2' : r.rank === 3 ? '🥉 #3' : `#${r.rank}`}
                    </td>
                    <td style={{ padding: '14px 18px', fontWeight: 700, color: '#0F172A' }}>
                      {r.name || r.user}
                    </td>
                    <td style={{ padding: '14px 18px', color: '#64748B' }}>{r.email || 'N/A'}</td>
                    <td style={{ padding: '14px 18px', textAlign: 'center', fontWeight: 800, color: r.wpm > 0 ? '#4F46E5' : '#94A3B8' }}>
                      {r.wpm} WPM
                    </td>
                    <td style={{ padding: '14px 18px', textAlign: 'center', fontWeight: 700, color: r.accuracy > 0 ? '#10B981' : '#94A3B8' }}>
                      {r.accuracy}%
                    </td>
                    <td style={{ padding: '14px 18px', textAlign: 'center', color: '#334155', fontWeight: 600 }}>
                      {r.testsCompleted}
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          background: r.tier === 'Master' ? '#F5F3FF' :
                                      r.tier === 'Gold' ? '#FEF3C7' :
                                      r.tier === 'Silver' ? '#F1F5F9' :
                                      r.tier === 'Bronze' ? '#FFF7ED' : '#F8FAFC',
                          color: r.tier === 'Master' ? '#7C3AED' :
                                 r.tier === 'Gold' ? '#D97706' :
                                 r.tier === 'Silver' ? '#475569' :
                                 r.tier === 'Bronze' ? '#C2410C' : '#94A3B8',
                          border: `1px solid ${
                            r.tier === 'Master' ? '#DDD6FE' :
                            r.tier === 'Gold' ? '#FDE68A' :
                            r.tier === 'Silver' ? '#CBD5E1' :
                            r.tier === 'Bronze' ? '#FFEDD5' : '#E2E8F0'
                          }`
                        }}
                      >
                        {r.tier}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: '999px',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          background: r.status === 'Active' ? '#ECFDF5' : '#FEF2F2',
                          color: r.status === 'Active' ? '#059669' : '#DC2626'
                        }}
                      >
                        {r.status || 'Active'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab 2: Badges Grid */}
      {activeTab === 'badges' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '16px'
          }}
        >
          {badges.map((b) => (
            <div
              key={b.id}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '14px',
                border: '1px solid #E2E8F0',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '12px',
                      background: '#EEF2FF',
                      color: '#4F46E5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.3rem'
                    }}
                  >
                    🏆
                  </div>
                  <button
                    onClick={() => handleOpenEditModal(b)}
                    style={{
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      fontSize: '0.74rem',
                      color: '#475569',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Edit size={12} /> Edit Criteria
                  </button>
                </div>

                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', marginBottom: '4px' }}>
                  {b.title}
                </div>
                <div style={{ fontSize: '0.82rem', color: '#64748B', lineHeight: '1.4', marginBottom: '14px' }}>
                  {b.description}
                </div>
              </div>

              <div
                style={{
                  background: '#F8FAFC',
                  border: '1px solid #F1F5F9',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.68rem', color: '#94A3B8', fontWeight: 600 }}>UNLOCK CRITERIA</div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#4F46E5' }}>{b.threshold}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.68rem', color: '#94A3B8', fontWeight: 600 }}>EARNED BY</div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#10B981' }}>{b.unlockedCount} Users</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Badge Modal */}
      {isModalOpen && (
        <div style={modalOverlayStyle}>
          <div style={modalCardStyle}>
            <div style={modalHeaderStyle}>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>
                {editingBadge ? 'Edit Achievement Criteria' : 'Create Custom Badge'}
              </div>
              <button onClick={() => setIsModalOpen(false)} style={closeBtnStyle}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '20px 24px' }}>
              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Badge Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master Velocity"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maintain 90+ WPM with 98% accuracy"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                <div>
                  <label style={labelStyle}>Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    style={inputStyle}
                  >
                    <option value="Speed">Speed Threshold</option>
                    <option value="Accuracy">Accuracy Benchmark</option>
                    <option value="Streak">Consistency / Streak</option>
                    <option value="Milestone">Volume / Milestone</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Criteria Threshold Rule</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. >= 90 WPM"
                    value={form.threshold}
                    onChange={(e) => setForm({ ...form, threshold: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    background: '#FFFFFF',
                    color: '#64748B',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 18px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#4F46E5',
                    color: '#FFFFFF',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Save Badge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const modalOverlayStyle = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(15, 23, 42, 0.6)',
  backdropFilter: 'blur(3px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 100,
  padding: '20px'
};

const modalCardStyle = {
  width: '100%',
  maxWidth: '520px',
  backgroundColor: '#FFFFFF',
  borderRadius: '16px',
  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
  overflow: 'hidden'
};

const modalHeaderStyle = {
  padding: '16px 24px',
  borderBottom: '1px solid #E2E8F0',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  background: '#F8FAFC'
};

const closeBtnStyle = {
  background: 'transparent',
  border: 'none',
  color: '#94A3B8',
  cursor: 'pointer'
};

const labelStyle = {
  display: 'block',
  fontSize: '0.78rem',
  fontWeight: 700,
  color: '#334155',
  marginBottom: '6px'
};

const inputStyle = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: '8px',
  border: '1px solid #E2E8F0',
  fontSize: '0.84rem',
  outline: 'none',
  boxSizing: 'border-box'
};
