import React, { useState } from 'react';
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
  Users
} from 'lucide-react';
import { adminService } from '../../services/adminService';

export default function AdminAchievementsView() {
  const [activeTab, setActiveTab] = useState('leaderboard'); // 'leaderboard', 'badges'
  const [timeframe, setTimeframe] = useState('All-Time');
  const [badges, setBadges] = useState(() => adminService.getBadges());
  const rankings = adminService.getLeaderboardRankings(timeframe);

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
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
              {rankings.map((r) => (
                <tr
                  key={r.rank}
                  style={{
                    borderBottom: '1px solid #F1F5F9',
                    background: r.rank === 1 ? '#FFFDF5' : '#FFFFFF'
                  }}
                >
                  <td style={{ padding: '14px 18px', fontWeight: 800 }}>
                    {r.rank === 1 ? '🥇 #1' : r.rank === 2 ? '🥈 #2' : r.rank === 3 ? '🥉 #3' : `#${r.rank}`}
                  </td>
                  <td style={{ padding: '14px 18px', fontWeight: 700, color: '#0F172A' }}>
                    {r.user}
                  </td>
                  <td style={{ padding: '14px 18px', color: '#64748B' }}>{r.email}</td>
                  <td style={{ padding: '14px 18px', textAlign: 'center', fontWeight: 800, color: '#4F46E5' }}>
                    {r.wpm} WPM
                  </td>
                  <td style={{ padding: '14px 18px', textAlign: 'center', fontWeight: 700, color: '#10B981' }}>
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
                        background: r.tier === 'Master' ? '#F5F3FF' : '#EFF6FF',
                        color: r.tier === 'Master' ? '#7C3AED' : '#2563EB',
                        border: `1px solid ${r.tier === 'Master' ? '#DDD6FE' : '#BFDBFE'}`
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
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
