import React from 'react';
import { Flame, Trophy, Target, Star, Zap, Award, Calendar, CheckCircle } from 'lucide-react';

export default function ProgressView({ dashboardData }) {
  const { streak, achievements = [], user, recentTests = [] } = dashboardData || {};

  // Generate 35 days heatmap cells strictly based on real completed tests
  const days = Array.from({ length: 35 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (34 - i));
    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    
    // Count how many tests on this day
    const testsOnDay = (recentTests || []).filter(t => t.date === dateStr).length;
    
    const active = testsOnDay > 0;
    let level = 0;
    if (testsOnDay > 5) level = 4;
    else if (testsOnDay > 3) level = 3;
    else if (testsOnDay > 1) level = 2;
    else if (testsOnDay === 1) level = 1;

    return { day: d.getDate(), active, level, dateStr, testsOnDay };
  });

  const practiceDaysCount = days.filter(d => d.active).length;
  const practiceRate = Math.round((practiceDaysCount / 35) * 100);
  const masteryLevel = Math.max(1, Math.floor((user?.tests_completed || 0) / 5) + 1);

  return (
    <div className="page-container">
      <div className="greeting-header">
        <div className="greeting-text">
          <h1>Progress & Practice Consistency</h1>
          <p>Track your daily typing habits, milestones, and unlocked masteries in real time.</p>
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
            <span className="stat-value">{streak?.current_streak || 0} Days</span>
            <span style={{ fontSize: '0.75rem', color: (streak?.current_streak || 0) > 0 ? '#10b981' : '#64748b', fontWeight: 700 }}>
              {(streak?.current_streak || 0) > 0 ? 'Active' : 'Not started'}
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-icon-wrapper purple"><Trophy size={20} /></div>
            <span className="stat-label">Longest Streak</span>
          </div>
          <div className="stat-card-bottom">
            <span className="stat-value">{streak?.longest_streak || 0} Days</span>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Personal Record</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-icon-wrapper blue"><Calendar size={20} /></div>
            <span className="stat-label">Practice Days</span>
          </div>
          <div className="stat-card-bottom">
            <span className="stat-value">{practiceDaysCount} / 35</span>
            <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700 }}>{practiceRate}% rate</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-icon-wrapper green"><CheckCircle size={20} /></div>
            <span className="stat-label">Unlocked Badges</span>
          </div>
          <div className="stat-card-bottom">
            <span className="stat-value">
              {achievements?.filter(a => a.unlocked).length || 0} / {achievements?.length || 8}
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-icon-wrapper orange"><Star size={20} /></div>
            <span className="stat-label">Mastery Level</span>
          </div>
          <div className="stat-card-bottom">
            <span className="stat-value">Level {masteryLevel}</span>
            <span style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 700 }}>
              {masteryLevel >= 5 ? 'Pro' : masteryLevel >= 2 ? 'Apprentice' : 'Beginner'}
            </span>
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

        <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '8px' }}>
          Real-time activity recorded each calendar day from your anti-cheat verified test logs.
        </p>

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
                title={`${item.dateStr}: ${item.testsOnDay} tests (Level ${item.level})`}
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
                  cursor: 'pointer',
                  border: item.level === 0 ? '1px solid #e2e8f0' : 'none'
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
                opacity: ach.unlocked ? 1 : 0.6,
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
