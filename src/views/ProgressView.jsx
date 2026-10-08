import React from 'react';
import { Flame, Trophy, Target, Star, Zap, Award, Calendar, CheckCircle } from 'lucide-react';

export default function ProgressView({ dashboardData }) {
  const { streak, achievements, user } = dashboardData;

  // Generate 35 days heatmap cells
  const days = Array.from({ length: 35 }, (_, i) => {
    const active = i % 3 !== 0; // simulated active days
    const level = active ? (i % 4) + 1 : 0;
    return { day: i + 1, active, level };
  });

  return (
    <div className="page-container">
      <div className="greeting-header">
        <div className="greeting-text">
          <h1>Progress & Practice Consistency</h1>
          <p>Track your daily typing habits, milestones, and unlocked masteries.</p>
        </div>
      </div>

      {/* Streak Summary */}
      <div className="stats-grid-5">
        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-icon-wrapper red"><Flame size={20} /></div>
            <span className="stat-label">Current Streak</span>
          </div>
          <div className="stat-card-bottom">
            <span className="stat-value">{streak?.current_streak || 12} Days</span>
            <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700 }}>Active</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-icon-wrapper purple"><Trophy size={20} /></div>
            <span className="stat-label">Longest Streak</span>
          </div>
          <div className="stat-card-bottom">
            <span className="stat-value">{streak?.longest_streak || 18} Days</span>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Record</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-icon-wrapper blue"><Calendar size={20} /></div>
            <span className="stat-label">Practice Days</span>
          </div>
          <div className="stat-card-bottom">
            <span className="stat-value">28 / 30</span>
            <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700 }}>93% rate</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-icon-wrapper green"><CheckCircle size={20} /></div>
            <span className="stat-label">Unlocked Badges</span>
          </div>
          <div className="stat-card-bottom">
            <span className="stat-value">
              {achievements?.filter(a => a.unlocked).length || 4} / {achievements?.length || 6}
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-icon-wrapper orange"><Star size={20} /></div>
            <span className="stat-label">Mastery Level</span>
          </div>
          <div className="stat-card-bottom">
            <span className="stat-value">Level 14</span>
            <span style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 700 }}>Pro</span>
          </div>
        </div>
      </div>

      {/* Heatmap Card */}
      <div className="dashboard-card">
        <div className="card-header-row">
          <div className="card-title-group">
            <Calendar size={18} color="#2563eb" />
            <h3>Daily Practice Heatmap (Last 5 Weeks)</h3>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', maxWidth: '420px', marginTop: '12px' }}>
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, idx) => (
            <div key={idx} style={{ textAlign: 'center', fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700 }}>
              {d}
            </div>
          ))}
          {days.map((item, idx) => {
            let bg = '#f1f5f9';
            if (item.level === 1) bg = '#bbf7d0';
            if (item.level === 2) bg = '#86efac';
            if (item.level === 3) bg = '#4ade80';
            if (item.level === 4) bg = '#22c55e';

            return (
              <div
                key={idx}
                title={`Day ${item.day}: Level ${item.level} practice`}
                style={{
                  height: '36px',
                  borderRadius: '8px',
                  background: bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  color: item.level > 2 ? '#ffffff' : '#334155',
                  cursor: 'pointer'
                }}
              >
                {item.day}
              </div>
            );
          })}
        </div>
      </div>

      {/* Full Achievements Gallery */}
      <div className="dashboard-card">
        <div className="card-header-row">
          <div className="card-title-group">
            <Trophy size={18} color="#f59e0b" />
            <h3>Achievements Gallery</h3>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', marginTop: '10px' }}>
          {(achievements || []).map((ach) => (
            <div
              key={ach.id}
              className="achievement-item"
              style={{
                opacity: ach.unlocked ? 1 : 0.5,
                background: ach.unlocked ? '#f8fafc' : '#f1f5f9',
                border: ach.unlocked ? '1px solid #e2e8f0' : '1px dashed #cbd5e1'
              }}
            >
              <div className={`achievement-icon ${ach.unlocked ? 'gold' : 'purple'}`}>
                <Trophy size={20} />
              </div>
              <div className="achievement-info">
                <div className="achievement-title">{ach.title}</div>
                <div className="achievement-sub">{ach.description}</div>
              </div>
              <span className={`achievement-status-badge ${!ach.unlocked ? 'locked' : ''}`}>
                {ach.unlocked ? 'Achieved ✓' : 'Locked'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
