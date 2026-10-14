import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Crown, Flame, Sparkles, RefreshCw, ArrowUpRight } from 'lucide-react';
import { supabase, supabaseService } from '../services/supabaseService';

export default function LeaderboardView({ user, streak, onNavigate }) {
  const [filter, setFilter] = useState('all-time');
  const [leaderboardList, setLeaderboardList] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchGlobalLeaderboard = async () => {
    setLoading(true);
    try {
      // Fetch aggregate performance metrics for all registered users
      let { data: leaderboardData, error } = await supabase
        .from('users')
        .select(`
          id,
          full_name,
          email,
          status,
          test_logs (
            wpm,
            accuracy,
            created_at
          )
        `);

      if (error) {
        // Fallback if schema has username instead of full_name or status column is omitted
        const fallbackRes = await supabase
          .from('users')
          .select(`
            id,
            username,
            email,
            status,
            avatar_url,
            test_logs (
              wpm,
              accuracy,
              created_at
            )
          `);
        if (!fallbackRes.error && fallbackRes.data) {
          leaderboardData = fallbackRes.data;
          error = null;
        }
      }

      if (error) {
        console.error('Error fetching leaderboard:', error);
        // Fallback to service layer
        const fallbackList = await supabaseService.fetchGlobalLeaderboard(filter);
        setLeaderboardList(fallbackList || []);
        return;
      }

      // Filter logs by timeframe if specified
      const now = Date.now();
      const filterLogs = (logs) => {
        if (!filter || filter.toLowerCase() === 'all-time' || filter.toLowerCase() === 'all') return logs;
        const days = filter.toLowerCase() === 'today' ? 1 : filter.toLowerCase() === 'weekly' ? 7 : 30;
        const cutoff = now - days * 24 * 60 * 60 * 1000;
        return logs.filter(l => {
          const t = l.created_at ? new Date(l.created_at).getTime() : 0;
          return t >= cutoff;
        });
      };

      // Only registered typists (exclude anonymous temporary guests)
      const registeredUsers = (leaderboardData || []).filter(u => u && !String(u.id).startsWith('guest_'));

      // Calculate user performance metrics dynamically
      const computedLeaderboard = registeredUsers.map((u) => {
        const logs = filterLogs(u.test_logs || []);
        const testsCompleted = logs.length;

        if (testsCompleted === 0) {
          return {
            id: u.id,
            name: u.full_name || u.displayName || u.username || 'Typist',
            email: u.email,
            wpm: 0,
            accuracy: 0, // Set accuracy to 0% (not default 98%) when no tests taken
            testsCompleted: 0,
            streak: 0,
            tier: 'Unranked',
            status: u.status || 'Active',
            avatar: u.avatar_url
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
          id: u.id,
          name: u.full_name || u.displayName || u.username || 'Typist',
          email: u.email,
          wpm: maxWpm,
          accuracy: parseFloat(avgAccuracy),
          testsCompleted,
          streak: 0,
          tier,
          status: u.status || 'Active',
          avatar: u.avatar_url
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
      const rankedUsers = sortedLeaderboard.map((item, index) => ({
        ...item,
        rank: index + 1
      }));

      setLeaderboardList(rankedUsers);
    } catch (err) {
      console.error('Error calculating leaderboard:', err);
      const fallbackList = await supabaseService.fetchGlobalLeaderboard(filter);
      setLeaderboardList(fallbackList || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGlobalLeaderboard();
  }, [filter]);

  const defaultAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.username || 'Typist')}`;

  return (
    <div className="page-container">
      <div className="greeting-header">
        <div className="greeting-text">
          <h1>Global Typist Leaderboard</h1>
          <p>Real-time rankings dynamically updated from verified anti-cheat submissions.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {['today', 'weekly', 'all-time'].map((t) => (
            <button
              key={t}
              className={`pill-btn ${filter === t ? 'active' : ''}`}
              onClick={() => setFilter(t)}
              style={filter === t ? { background: '#2563eb', color: '#fff' } : {}}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
          <button
            onClick={fetchGlobalLeaderboard}
            className="pill-btn"
            title="Refresh Leaderboard"
            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <RefreshCw size={13} className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      <div className="dashboard-card">
        {loading && leaderboardList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
            <RefreshCw size={24} className="spin" style={{ margin: '0 auto 12px auto', display: 'block' }} />
            <p>Loading real-time rankings...</p>
          </div>
        ) : leaderboardList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: '#eff6ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              color: '#2563eb'
            }}>
              <Trophy size={28} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
              No Registered Typists Found
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.88rem', maxWidth: '420px', margin: '0 auto 20px auto' }}>
              Be the first typist to register and take a verified typing test to claim the #1 spot!
            </p>
            {onNavigate && (
              <button
                className="hero-cta-btn"
                onClick={() => onNavigate('typing-test')}
                style={{ width: 'auto', padding: '10px 24px', fontSize: '0.9rem', margin: '0 auto' }}
              >
                Take a Test Now
              </button>
            )}
          </div>
        ) : (
          <table className="recent-tests-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Typist</th>
                <th>Speed (WPM)</th>
                <th>Accuracy</th>
                <th>Tests Completed</th>
                <th>Tier</th>
              </tr>
            </thead>
            <tbody>
              {leaderboardList.map((item) => {
                const rank = item.rank;
                const isCurrent = user?.id && (item.id === user.id || item.email === user.email);

                return (
                  <tr
                    key={item.id || item.rank}
                    style={isCurrent ? { background: '#eff6ff', fontWeight: 700 } : {}}
                  >
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800 }}>
                        {rank === 1 && <Crown size={18} color="#eab308" />}
                        {rank === 2 && <Medal size={18} color="#94a3b8" />}
                        {rank === 3 && <Medal size={18} color="#b45309" />}
                        #{rank}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img
                          src={item.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(item.name || 'Typist')}`}
                          alt={item.name}
                          style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                        <span>
                          {item.name} {isCurrent && <span style={{ color: '#2563eb', fontWeight: 800 }}>(You)</span>}
                        </span>
                      </div>
                    </td>
                    <td style={{ fontSize: '1rem', fontWeight: 800, color: item.wpm > 0 ? '#2563eb' : '#94a3b8' }}>
                      {item.wpm} WPM
                    </td>
                    <td style={{ fontWeight: 600, color: item.accuracy > 0 ? '#10b981' : '#94a3b8' }}>
                      {item.accuracy}%
                    </td>
                    <td style={{ fontWeight: 600, color: '#334155' }}>
                      {item.testsCompleted}
                    </td>
                    <td>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontWeight: 700,
                          fontSize: '0.74rem',
                          background: item.tier === 'Master' ? '#F5F3FF' :
                                      item.tier === 'Gold' ? '#FEF3C7' :
                                      item.tier === 'Silver' ? '#F1F5F9' :
                                      item.tier === 'Bronze' ? '#FFF7ED' : '#F8FAFC',
                          color: item.tier === 'Master' ? '#7C3AED' :
                                 item.tier === 'Gold' ? '#D97706' :
                                 item.tier === 'Silver' ? '#475569' :
                                 item.tier === 'Bronze' ? '#C2410C' : '#94A3B8',
                          border: `1px solid ${
                            item.tier === 'Master' ? '#DDD6FE' :
                            item.tier === 'Gold' ? '#FDE68A' :
                            item.tier === 'Silver' ? '#CBD5E1' :
                            item.tier === 'Bronze' ? '#FFEDD5' : '#E2E8F0'
                          }`
                        }}
                      >
                        {item.tier}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
