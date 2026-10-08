import React, { useState } from 'react';
import {
  Zap,
  BarChart3,
  Target,
  FileText,
  Flame,
  ArrowUpRight,
  Play,
  Trophy,
  Award,
  Star,
  BookOpen,
  Settings as SettingsIcon,
  Eye,
  MoreVertical,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { WpmPerformanceChart, AccuracyTrendChart } from '../components/AnalyticsCharts';

export default function DashboardView({
  dashboardData,
  onStartTest,
  onNavigate,
  onViewTestDetails
}) {
  const { user, streak, recentTests, achievements, performanceGraph, accuracyTrend } = dashboardData;

  const [selectedDuration, setSelectedDuration] = useState('1 min');
  const [selectedDifficulty, setSelectedDifficulty] = useState('Easy');

  const handleStartTestClick = () => {
    let sec = 60;
    if (selectedDuration === '3 min') sec = 180;
    if (selectedDuration === '5 min') sec = 300;
    if (selectedDuration === 'Custom') sec = 120;

    onStartTest({
      duration: sec,
      difficulty: selectedDifficulty,
      category: 'Random Text'
    });
  };

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: '2-digit',
    year: 'numeric'
  });

  return (
    <div className="page-container">
      {/* Top Greeting Header with Real-Time User & Date */}
      <div className="greeting-header">
        <div className="greeting-text">
          <h1>Welcome, {user?.username || 'Typist'}! 👋</h1>
          <p>
            {user?.tests_completed > 0
              ? `You've completed ${user.tests_completed} tests. Ready to break your ${user.best_wpm} WPM record?`
              : 'Ready to improve your typing speed? Take your first test and begin tracking real-time stats!'}
          </p>
        </div>
        <div className="greeting-date">
          <div className="date-str">{todayFormatted}</div>
          <div className="date-sub">Keep typing, keep growing!</div>
        </div>
      </div>

      {/* 5 Real-Time Stat Cards */}
      <div className="stats-grid-5">
        {/* Best WPM */}
        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-icon-wrapper blue">
              <Zap size={20} />
            </div>
            <span className="stat-label">Best WPM</span>
          </div>
          <div className="stat-card-bottom">
            <span className="stat-value">{user?.best_wpm || 0}</span>
            <div className="stat-trend positive">
              <ArrowUpRight size={14} /> {user?.best_wpm > 0 ? 'Live Peak' : 'No tests'}
            </div>
          </div>
        </div>

        {/* Average WPM */}
        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-icon-wrapper purple">
              <BarChart3 size={20} />
            </div>
            <span className="stat-label">Average WPM</span>
          </div>
          <div className="stat-card-bottom">
            <span className="stat-value">{user?.avg_wpm || 0}</span>
            <div className="stat-trend positive">
              <ArrowUpRight size={14} /> {user?.tests_completed > 0 ? 'Lifetime' : 'Baseline'}
            </div>
          </div>
        </div>

        {/* Accuracy */}
        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-icon-wrapper green">
              <Target size={20} />
            </div>
            <span className="stat-label">Accuracy</span>
          </div>
          <div className="stat-card-bottom">
            <span className="stat-value">{user?.accuracy || 0}%</span>
            <div className="stat-trend positive">
              <ArrowUpRight size={14} /> Precision
            </div>
          </div>
        </div>

        {/* Tests Completed */}
        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-icon-wrapper orange">
              <FileText size={20} />
            </div>
            <span className="stat-label">Tests Completed</span>
          </div>
          <div className="stat-card-bottom">
            <span className="stat-value">{user?.tests_completed || 0}</span>
            <div className="stat-trend positive">
              <ArrowUpRight size={14} /> Verified
            </div>
          </div>
        </div>

        {/* Current Streak */}
        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-icon-wrapper red">
              <Flame size={20} />
            </div>
            <span className="stat-label">Current Streak</span>
          </div>
          <div className="stat-card-bottom">
            <span className="stat-value">{streak?.current_streak || 0} days</span>
            <div className="stat-trend accent">
              <ArrowUpRight size={14} /> Active
            </div>
          </div>
        </div>
      </div>

      {/* Hero Banner matching Image 1 */}
      <div className="hero-banner">
        <div className="hero-banner-content">
          <div>
            <div className="hero-badge-tag">TYPING TEST</div>
            <h2 className="hero-title">Ready, Set, Type!</h2>
            <p className="hero-subtitle">Test your typing speed and accuracy with real-time feedback.</p>
          </div>

          <div className="hero-controls">
            {/* Duration Pills */}
            <div className="pill-group">
              {['1 min', '3 min', '5 min', 'Custom'].map((dur) => (
                <button
                  key={dur}
                  className={`pill-btn ${selectedDuration === dur ? 'active' : ''}`}
                  onClick={() => setSelectedDuration(dur)}
                >
                  {dur}
                </button>
              ))}
            </div>

            {/* Difficulty Pills */}
            <div className="pill-group">
              <span className="pill-label">Difficulty Level</span>
              <button
                className={`pill-btn diff-easy ${selectedDifficulty === 'Easy' ? 'active' : ''}`}
                onClick={() => setSelectedDifficulty('Easy')}
              >
                Easy
              </button>
              <button
                className={`pill-btn diff-med ${selectedDifficulty === 'Medium' ? 'active' : ''}`}
                onClick={() => setSelectedDifficulty('Medium')}
              >
                Medium
              </button>
              <button
                className={`pill-btn diff-hard ${selectedDifficulty === 'Hard' ? 'active' : ''}`}
                onClick={() => setSelectedDifficulty('Hard')}
              >
                Hard
              </button>
            </div>
          </div>

          <button className="hero-cta-btn" onClick={handleStartTestClick}>
            <Play size={18} fill="#2563eb" />
            Start Typing Test
          </button>
        </div>

        {/* 3D Character Illustration Area */}
        <div className="hero-illustration-wrapper">
          <img
            src="/hero-character.jpg"
            alt="3D Character typing on laptop"
            className="hero-img"
          />
        </div>
      </div>

      {/* Analytics Row: 2 Charts + Achievements Card */}
      <div className="analytics-row">
        <WpmPerformanceChart data={performanceGraph} />
        <AccuracyTrendChart data={accuracyTrend} />

        {/* Achievements Card */}
        <div className="dashboard-card">
          <div className="card-header-row">
            <div className="card-title-group">
              <Trophy size={18} color="#f59e0b" />
              <h3>Achievements</h3>
            </div>
            <span
              style={{ fontSize: '0.78rem', color: '#2563eb', fontWeight: 700, cursor: 'pointer' }}
              onClick={() => onNavigate('progress')}
            >
              View All
            </span>
          </div>

          <div className="achievements-list">
            {(achievements || []).slice(0, 4).map((ach) => {
              let iconColor = 'gold';
              let IconComp = Trophy;
              if (ach.id === 'accuracy_king') {
                iconColor = 'blue';
                IconComp = Target;
              } else if (ach.id === '10_day_streak') {
                iconColor = 'red';
                IconComp = Flame;
              } else if (ach.id === '100_tests') {
                iconColor = 'purple';
                IconComp = Star;
              }

              return (
                <div key={ach.id} className="achievement-item">
                  <div className={`achievement-icon ${iconColor}`}>
                    <IconComp size={18} />
                  </div>
                  <div className="achievement-info">
                    <div className="achievement-title">{ach.title}</div>
                    <div className="achievement-sub">{ach.description}</div>
                  </div>
                  <span
                    className="achievement-status-badge"
                    style={{ color: ach.unlocked ? '#10b981' : '#94a3b8' }}
                  >
                    {ach.unlocked ? 'Achieved ✓' : 'Locked'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Grid: Real-Time Recent Tests & Quick Links */}
      <div className="bottom-grid">
        {/* Recent Tests Table */}
        <div className="dashboard-card">
          <div className="card-header-row">
            <div className="card-title-group">
              <FileText size={18} color="#2563eb" />
              <h3>Recent Tests</h3>
            </div>
            <span
              style={{ fontSize: '0.78rem', color: '#2563eb', fontWeight: 700, cursor: 'pointer' }}
              onClick={() => onNavigate('history')}
            >
              View All
            </span>
          </div>

          {recentTests && recentTests.length > 0 ? (
            <table className="recent-tests-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Duration</th>
                  <th>WPM</th>
                  <th>Accuracy</th>
                  <th>Errors</th>
                  <th>Result</th>
                  <th>Action</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {recentTests.slice(0, 5).map((test) => {
                  let badgeClass = 'good';
                  if (test.result === 'Excellent') badgeClass = 'excellent';
                  if (test.result === 'Great') badgeClass = 'great';

                  return (
                    <tr key={test.id}>
                      <td>{test.date}</td>
                      <td>{test.duration}</td>
                      <td style={{ fontWeight: 700 }}>{test.wpm}</td>
                      <td>{test.accuracy}%</td>
                      <td style={{ color: test.errors > 5 ? '#ef4444' : '#64748b' }}>{test.errors}</td>
                      <td>
                        <span className={`badge-tag ${badgeClass}`}>
                          ★ {test.result}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn-view-test"
                          onClick={() => onViewTestDetails && onViewTestDetails(test)}
                        >
                          View
                        </button>
                      </td>
                      <td>
                        <MoreVertical size={14} color="#94a3b8" style={{ cursor: 'pointer' }} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div
              style={{
                textAlign: 'center',
                padding: '36px 16px',
                background: '#f8fafc',
                borderRadius: '12px',
                border: '1px dashed #cbd5e1'
              }}
            >
              <Sparkles size={28} color="#94a3b8" style={{ marginBottom: '8px' }} />
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#1e293b' }}>
                No Tests Completed Yet
              </div>
              <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px', marginBottom: '14px' }}>
                Take your first typing test to start recording live speed, accuracy, and anti-cheat verified logs!
              </p>
              <button
                className="hero-cta-btn"
                onClick={handleStartTestClick}
                style={{ padding: '8px 18px', fontSize: '0.86rem', margin: '0 auto' }}
              >
                <Play size={14} fill="#2563eb" /> Take Your First Test
              </button>
            </div>
          )}
        </div>

        {/* Quick Links 2x2 Grid */}
        <div className="dashboard-card">
          <div className="card-header-row">
            <div className="card-title-group">
              <Zap size={18} color="#4f46e5" />
              <h3>Quick Links</h3>
            </div>
          </div>

          <div className="quick-links-grid">
            <div className="quick-link-card practice" onClick={() => onNavigate('practice')}>
              <BookOpen size={20} />
              <span className="quick-link-title">Practice Mode</span>
              <span className="quick-link-desc">Improve your skills</span>
            </div>

            <div className="quick-link-card leaderboard" onClick={() => onNavigate('leaderboard')}>
              <Trophy size={20} />
              <span className="quick-link-title">Leaderboard</span>
              <span className="quick-link-desc">See top typists</span>
            </div>

            <div className="quick-link-card certificates" onClick={() => onNavigate('performance')}>
              <Award size={20} />
              <span className="quick-link-title">Certificates</span>
              <span className="quick-link-desc">Earn & Share</span>
            </div>

            <div className="quick-link-card settings" onClick={() => onNavigate('settings')}>
              <SettingsIcon size={20} />
              <span className="quick-link-title">Settings</span>
              <span className="quick-link-desc">Customize your experience</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
