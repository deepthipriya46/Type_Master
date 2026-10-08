import React, { useState } from 'react';
import { Award, Zap, Target, TrendingUp, Download, CheckCircle2, Lock } from 'lucide-react';

export default function PerformanceView({ user, isPremium, onOpenUpgradeModal }) {
  const [selectedKeyGroup, setSelectedKeyGroup] = useState('all');

  const keyAccuracies = [
    { key: 'A', acc: 99, speed: 74 },
    { key: 'S', acc: 98, speed: 76 },
    { key: 'D', acc: 97, speed: 80 },
    { key: 'F', acc: 98, speed: 82 },
    { key: 'J', acc: 96, speed: 79 },
    { key: 'K', acc: 95, speed: 75 },
    { key: 'L', acc: 98, speed: 77 },
    { key: 'E', acc: 94, speed: 84 },
    { key: 'T', acc: 92, speed: 71 },
    { key: 'O', acc: 95, speed: 78 },
    { key: 'N', acc: 93, speed: 70 },
    { key: 'P', acc: 88, speed: 64 },
    { key: 'Q', acc: 86, speed: 59 },
    { key: 'Z', acc: 89, speed: 61 }
  ];

  return (
    <div className="page-container">
      <div className="greeting-header">
        <div className="greeting-text">
          <h1>My Performance Analytics</h1>
          <p>Comprehensive telemetry on typing cadence, key accuracy, and mastery curves.</p>
        </div>
      </div>

      {/* Top Metric Highlights */}
      <div className="stats-grid-5">
        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-icon-wrapper blue"><Zap size={20} /></div>
            <span className="stat-label">Peak Speed</span>
          </div>
          <div className="stat-card-bottom">
            <span className="stat-value">{user?.best_wpm || 78} WPM</span>
            <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700 }}>Top 5%</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-icon-wrapper purple"><TrendingUp size={20} /></div>
            <span className="stat-label">Avg Speed</span>
          </div>
          <div className="stat-card-bottom">
            <span className="stat-value">{user?.avg_wpm || 64} WPM</span>
            <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700 }}>Steady</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-icon-wrapper green"><Target size={20} /></div>
            <span className="stat-label">Precision</span>
          </div>
          <div className="stat-card-bottom">
            <span className="stat-value">{user?.accuracy || 96.4}%</span>
            <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700 }}>Optimal</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-icon-wrapper orange"><Award size={20} /></div>
            <span className="stat-label">Consistency</span>
          </div>
          <div className="stat-card-bottom">
            <span className="stat-value">91%</span>
            <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700 }}>Smooth</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-icon-wrapper red"><CheckCircle2 size={20} /></div>
            <span className="stat-label">Total Keystrokes</span>
          </div>
          <div className="stat-card-bottom">
            <span className="stat-value">46.2k</span>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>Lifetime</span>
          </div>
        </div>
      </div>

      {/* Premium Gatekeeper Feature Demonstration */}
      {!isPremium ? (
        <div
          style={{
            background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
            borderRadius: '20px',
            padding: '36px',
            color: '#ffffff',
            textAlign: 'center',
            position: 'relative'
          }}
        >
          <Lock size={40} color="#fbbf24" style={{ marginBottom: '12px' }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '8px' }}>
            Detailed Finger & Key Heatmap Analytics (Premium)
          </h2>
          <p style={{ color: '#c7d2fe', maxWidth: '520px', margin: '0 auto 20px auto', fontSize: '0.9rem' }}>
            Unlock finger stroke latency breakdowns, per-key error distribution, speed percentiles, and printable official certificates.
          </p>
          <button
            onClick={onOpenUpgradeModal}
            className="upgrade-btn"
            style={{ width: 'auto', padding: '12px 28px', fontSize: '0.95rem' }}
          >
            Unlock Premium Analytics
          </button>
        </div>
      ) : (
        /* Detailed Analytics Grid */
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
          {/* Key Accuracy Matrix */}
          <div className="dashboard-card">
            <div className="card-header-row">
              <div className="card-title-group">
                <Target size={18} color="#2563eb" />
                <h3>Individual Key Accuracy Matrix</h3>
              </div>
            </div>

            <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '16px' }}>
              Accuracy and typing velocity mapped per individual mechanical key.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '10px' }}>
              {keyAccuracies.map((k) => (
                <div
                  key={k.key}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '10px 8px',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b' }}>{k.key}</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: k.acc >= 95 ? '#10b981' : '#f59e0b' }}>
                    {k.acc}% acc
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{k.speed} WPM</div>
                </div>
              ))}
            </div>
          </div>

          {/* Official Typing Certificate Preview Card */}
          <div className="dashboard-card" style={{ background: 'linear-gradient(145deg, #fdfbf7 0%, #fffbf0 100%)', border: '2px solid #fde68a' }}>
            <div className="card-header-row">
              <div className="card-title-group">
                <Award size={20} color="#d97706" />
                <h3 style={{ color: '#92400e' }}>Official Typing Certificate</h3>
              </div>
              <button
                onClick={() => window.print()}
                style={{
                  background: '#d97706',
                  color: '#ffffff',
                  border: 'none',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Download size={14} /> Download / Print
              </button>
            </div>

            <div
              style={{
                border: '2px dashed #d97706',
                borderRadius: '14px',
                padding: '24px',
                textAlign: 'center',
                background: '#ffffff'
              }}
            >
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '2px', color: '#b45309', fontWeight: 800 }}>
                Certificate of Competence
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1e293b', margin: '8px 0' }}>
                {user?.username || 'Tirumala'}
              </h2>
              <p style={{ fontSize: '0.82rem', color: '#475569', marginBottom: '14px' }}>
                Has successfully demonstrated certified typing proficiency on TypeMaster with verified parameters:
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '14px' }}>
                <div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2563eb' }}>{user?.best_wpm || 78} WPM</div>
                  <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Speed Rate</span>
                </div>
                <div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981' }}>{user?.accuracy || 96.4}%</div>
                  <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Accuracy Rate</span>
                </div>
              </div>
              <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                Date: October 05, 2026 • Verified by Anti-Cheat Engine & Supabase
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
