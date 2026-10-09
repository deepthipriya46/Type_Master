import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Crown, Flame, Sparkles, RefreshCw, Trash2, ArrowUpRight } from 'lucide-react';
import { supabaseService } from '../services/supabaseService';

export default function LeaderboardView({ user, streak, onNavigate }) {
  const [filter, setFilter] = useState('weekly');
  const [leaderboardList, setLeaderboardList] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const data = await supabaseService.fetchLeaderboard(filter);
      setLeaderboardList(data || []);
    } catch (err) {
      console.warn('Leaderboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboard();
  }, [filter]);

  const defaultAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.username || 'Typist')}`;

  // Current user's live profile entry
  const currentTypist = {
    userId: user?.id,
    name: `${user?.username || 'You'} (You)`,
    wpm: user?.best_wpm || 0,
    accuracy: user?.accuracy || 0,
    streak: streak?.current_streak || 0,
    tier: (user?.best_wpm || 0) >= 100 ? 'Master' :
          (user?.best_wpm || 0) >= 75 ? 'Diamond' :
          (user?.best_wpm || 0) >= 50 ? 'Gold' : 'Apprentice',
    isCurrent: true,
    avatar: user?.avatar_url || defaultAvatar
  };

  // Merge current user with list if not already present
  const merged = [...leaderboardList];
  const currentIndex = merged.findIndex(l => l.userId === user?.id || l.name === user?.username);
  if (currentIndex >= 0) {
    merged[currentIndex] = { ...merged[currentIndex], ...currentTypist, isCurrent: true };
  } else if (user?.tests_completed > 0 || user?.best_wpm > 0) {
    merged.push(currentTypist);
  } else {
    // Also include user even with 0 tests so they see their standing
    merged.push(currentTypist);
  }

  // Sort descending by Best WPM, then accuracy
  const sortedLeaders = merged.sort((a, b) => {
    if (b.wpm !== a.wpm) return b.wpm - a.wpm;
    return b.accuracy - a.accuracy;
  });

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
            onClick={loadLeaderboard}
            className="pill-btn"
            title="Refresh Leaderboard"
            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <RefreshCw size={13} className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      <div className="dashboard-card">
        {sortedLeaders.length === 0 || (sortedLeaders.length === 1 && sortedLeaders[0].wpm === 0) ? (
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
              No Verified Leaderboard Scores Yet
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.88rem', maxWidth: '420px', margin: '0 auto 20px auto' }}>
              All sample data has been cleared. Take your first verified typing test to claim the #1 spot on the real-time leaderboard!
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
                <th>Best WPM</th>
                <th>Accuracy</th>
                <th>Streak</th>
                <th>Tier</th>
              </tr>
            </thead>
            <tbody>
              {sortedLeaders.map((item, index) => {
                const rank = index + 1;
                return (
                  <tr
                    key={item.userId || item.name}
                    style={item.isCurrent ? { background: '#eff6ff', fontWeight: 700 } : {}}
                  >
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {rank === 1 && <Crown size={18} color="#eab308" />}
                        {rank === 2 && <Medal size={18} color="#94a3b8" />}
                        {rank === 3 && <Medal size={18} color="#b45309" />}
                        #{rank}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img
                          src={item.avatar || defaultAvatar}
                          alt={item.name}
                          style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                        <span>{item.name}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: '1rem', fontWeight: 800, color: '#2563eb' }}>
                      {item.wpm}
                    </td>
                    <td>{item.accuracy}%</td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ef4444' }}>
                        <Flame size={14} /> {item.streak || 0}d
                      </span>
                    </td>
                    <td>
                      <span className="badge-tag great">
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
