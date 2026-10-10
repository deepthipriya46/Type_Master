import React from 'react';
import ParAcademyLogo from './ParAcademyLogo';
import {
  LayoutDashboard,
  Keyboard,
  BarChart2,
  Trophy,
  TrendingUp,
  BookOpen,
  Clock,
  Settings,
  HelpCircle,
  Crown,
  CheckCircle2,
  Database,
  UserCheck,
  MessageSquare
} from 'lucide-react';

export default function Sidebar({
  currentView,
  setCurrentView,
  onOpenUpgradeModal,
  onOpenSupabaseModal,
  onOpenLogin,
  isPremium,
  supabaseConnected
}) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'typing-test', label: 'Typing Test', icon: Keyboard },
    { id: 'performance', label: 'My Performance', icon: BarChart2 },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
    { id: 'progress', label: 'Progress', icon: TrendingUp },
    { id: 'practice', label: 'Practice', icon: BookOpen },
    { id: 'history', label: 'Test History', icon: Clock },
    { id: 'feedback', label: 'Feedback', icon: MessageSquare },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'help', label: 'Help & Support', icon: HelpCircle }
  ];

  return (
    <aside className="app-sidebar">
      {/* Top Brand Logo (Matching Reference Screenshot) */}
      <div
        className="sidebar-logo"
        style={{
          padding: '8px 12px 24px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start'
        }}
      >
        <ParAcademyLogo
          height={48}
          style={{ cursor: 'pointer' }}
          onClick={() => setCurrentView('dashboard')}
        />
      </div>

      {/* Navigation Links */}
      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <div
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setCurrentView(item.id)}
            >
              <Icon className="icon" />
              <span>{item.label}</span>
            </div>
          );
        })}

        {/* Quick Auth Navigation item */}
        <div
          className={`nav-item ${currentView === 'login' ? 'active' : ''}`}
          onClick={onOpenLogin}
          style={{ marginTop: '8px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '10px' }}
        >
          <UserCheck className="icon" />
          <span>Account & Auth</span>
        </div>
      </nav>

      {/* Supabase status badge in sidebar footer */}
      <div
        onClick={onOpenSupabaseModal}
        style={{
          background: supabaseConnected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.08)',
          border: `1px solid ${supabaseConnected ? '#10b981' : 'rgba(255, 255, 255, 0.15)'}`,
          borderRadius: '10px',
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer',
          marginTop: '10px',
          transition: 'all 0.2s ease'
        }}
        title="Click to configure Supabase Connection"
      >
        <Database size={15} color={supabaseConnected ? '#34d399' : '#94a3b8'} />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '0.74rem', color: '#ffffff', fontWeight: 700 }}>
            {supabaseConnected ? 'Supabase Live' : 'Supabase Ready'}
          </span>
          <span style={{ fontSize: '0.65rem', color: '#93c5fd' }}>
            {supabaseConnected ? 'Connected & Synced' : 'Click to connect DB'}
          </span>
        </div>
      </div>

      {/* Upgrade to Premium Card matching Image 1 & 2 */}
      <div className="sidebar-upgrade-card">
        <div className="upgrade-header">
          <Crown className="upgrade-crown" />
          <h4>{isPremium ? 'Premium Active' : 'Upgrade to Premium'}</h4>
        </div>
        <ul className="upgrade-features">
          <li><CheckCircle2 size={13} /> {isPremium ? 'Unlimited Tests Unlocked' : 'Advanced Tests'}</li>
          <li><CheckCircle2 size={13} /> Detailed Analytics</li>
          <li><CheckCircle2 size={13} /> Ad Free Experience</li>
          <li><CheckCircle2 size={13} /> Official Certificates</li>
        </ul>
        <button
          className="upgrade-btn"
          onClick={onOpenUpgradeModal}
        >
          {isPremium ? 'Manage Membership' : 'Upgrade Now'}
        </button>
      </div>
    </aside>
  );
}
