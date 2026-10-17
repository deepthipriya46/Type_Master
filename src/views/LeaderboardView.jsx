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
      const list = await supabaseService.fetchGlobalLeaderboard(filter);
      setLeaderboardList(list || []);
    } catch (err) {
      console.warn('Leaderboard fetch notice:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGlobalLeaderboard();

    // 1. In-window custom event listeners for instant multi-section synchronization
    const handleSync = () => {
      fetchGlobalLeaderboard();
    };
    window.addEventListener('typemaster-test-logged', handleSync);
    window.addEventListener('typemaster-admin-feed', handleSync);
    window.addEventListener('typemaster-profile-sync', handleSync);

    // 2. Cross-tab BroadcastChannels
    let historyBc, adminBc;
    try {
      historyBc = new BroadcastChannel('typemaster_history_sync');
      historyBc.onmessage = () => fetchGlobalLeaderboard();
      adminBc = new BroadcastChannel('typemaster_admin_feed');
      adminBc.onmessage = () => fetchGlobalLeaderboard();
    } catch {
      // fallback
    }

    // 3. Supabase Realtime channel for live multi-user telemetry updates
    let realtimeChannel = null;
    if (supabaseService.isConfigured() && supabaseService.supabase?.channel) {
      try {
        realtimeChannel = supabaseService.supabase
          .channel('leaderboard-live-channel')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
            fetchGlobalLeaderboard();
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'test_logs' }, () => {
            fetchGlobalLeaderboard();
          })
          .subscribe();
      } catch (err) {
        console.warn('Realtime leaderboard subscription notice:', err);
      }
    }

    return () => {
      window.removeEventListener('typemaster-test-logged', handleSync);
      window.removeEventListener('typemaster-admin-feed', handleSync);
      window.removeEventListener('typemaster-profile-sync', handleSync);
      if (historyBc) historyBc.close();
      if (adminBc) adminBc.close();
      if (realtimeChannel && supabaseService.supabase) {
        supabaseService.supabase.removeChannel(realtimeChannel);
      }
    };
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
