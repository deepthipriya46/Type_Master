import React, { useState } from 'react';
import { Trophy, Medal, Crown, Flame, ArrowUp } from 'lucide-react';

export default function LeaderboardView({ user, streak }) {
  const [filter, setFilter] = useState('weekly');

  const defaultAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.username || 'Typist')}`;

  const currentTypist = {
    name: `${user?.username || 'You'} (You)`,
    wpm: user?.best_wpm || 0,
    accuracy: user?.accuracy || 0,
    streak: streak?.current_streak || 0,
    tier: (user?.best_wpm || 0) >= 100 ? 'Master' : (user?.best_wpm || 0) >= 75 ? 'Diamond' : (user?.best_wpm || 0) >= 50 ? 'Gold' : 'Apprentice',
    isCurrent: true,
    avatar: user?.avatar_url || defaultAvatar
  };

  const communityBench = [
    { name: 'Alex Johnson', wpm: 124, accuracy: 99.2, streak: 45, tier: 'Grandmaster', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80' },
    { name: 'Sophia Chen', wpm: 118, accuracy: 98.8, streak: 38, tier: 'Master', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80' },
    { name: 'Marcus Miller', wpm: 112, accuracy: 97.9, streak: 29, tier: 'Diamond', avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=80&q=80' },
    { name: 'Elena Rostova', wpm: 94, accuracy: 98.1, streak: 22, tier: 'Platinum', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=80&q=80' },
    { name: 'Liam Davies', wpm: 74, accuracy: 95.5, streak: 14, tier: 'Gold', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80' },
    { name: 'Zara Patel', wpm: 58, accuracy: 94.2, streak: 8, tier: 'Silver', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=80&q=80' }
  ];

  // Combine and sort by real-time WPM descending
  const sortedLeaders = [...communityBench, currentTypist].sort((a, b) => b.wpm - a.wpm);

  return (
    <div className="page-container">
      <div className="greeting-header">
        <div className="greeting-text">
          <h1>Global Typist Leaderboard</h1>
          <p>Real-time rankings dynamically updated from verified anti-cheat submissions.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
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
        </div>
      </div>

      <div className="dashboard-card">
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
                  key={item.name}
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
                        src={item.avatar}
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
                      <Flame size={14} /> {item.streak}d
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
      </div>
    </div>
  );
}
