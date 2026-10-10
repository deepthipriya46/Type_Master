import React, { useState } from 'react';
import { Search, Flame, Bell, Check, Database, ShieldCheck, Crown, LogIn, LogOut, User } from 'lucide-react';

export default function TopHeader({
  streak = 0,
  user,
  authRole,
  hasAdminPrivileges = false,
  onOpenUpgradeModal,
  onOpenSupabaseModal,
  onOpenLogin,
  onSignOut,
  supabaseConnected,
  onSwitchToAdminPortal
}) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Admin Portal Toggle: ONLY visible if authenticated session has admin role
  const isAdmin = Boolean(hasAdminPrivileges || authRole === 'admin' || user?.role === 'admin' || user?.email === 'admin@typemaster.com');

  const notifications = [
    { id: 1, title: 'Real-Time Telemetry Active', desc: 'Supabase PostgreSQL connected for dynamic tracking', time: 'Just now' },
    { id: 2, title: 'Anti-Cheat Protection', desc: 'Real-time keystroke integrity validation enabled', time: 'Active' },
    { id: 3, title: 'Dual-Portal Architecture', desc: 'Admin Portal & User Portal fully synchronized', time: 'Active' }
  ];

  const defaultAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.username || 'Typist')}`;

  return (
    <header className="top-header">
      {/* Search Bar */}
      <div className="header-search">
        <Search size={18} />
        <input
          type="text"
          placeholder="Search tests, modes, metrics..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Header Actions */}
      <div className="header-actions">
        {/* Admin Portal Switcher button if user has admin privileges */}
        {isAdmin && onSwitchToAdminPortal && (
          <button
            onClick={onSwitchToAdminPortal}
            style={{
              background: '#0F172A',
              border: '1px solid #1E293B',
              color: '#FFFFFF',
              padding: '6px 12px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(15, 23, 42, 0.3)'
            }}
            title="Switch to Admin Management Portal"
          >
            <ShieldCheck size={15} color="#818CF8" />
            <span>Admin Portal</span>
          </button>
        )}

        {/* Streak Counter Pill */}
        <div className="streak-pill" title="Daily Practice Streak">
          <Flame size={17} />
          <span>{streak} Day Streak</span>
        </div>

        {/* Database Quick Status */}
        <button
          onClick={onOpenSupabaseModal}
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            padding: '6px 12px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.78rem',
            fontWeight: 700,
            color: supabaseConnected ? '#059669' : '#64748b',
            cursor: 'pointer'
          }}
          title="Supabase Database Settings"
        >
          <Database size={15} color={supabaseConnected ? '#10b981' : '#64748b'} />
          <span>{supabaseConnected ? 'Supabase 🟢' : 'Supabase Setup'}</span>
        </button>

        {/* Notification Bell */}
        <div style={{ position: 'relative' }}>
          <button
            className="notification-btn"
            onClick={() => setShowNotifications(!showNotifications)}
            title="Notifications"
          >
            <Bell size={18} />
            <span className="notification-badge">2</span>
          </button>

          {showNotifications && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: '48px',
                width: '290px',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '14px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.12)',
                padding: '12px',
                zIndex: 100
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b' }}>Notifications</span>
                <span style={{ fontSize: '0.72rem', color: '#2563eb', cursor: 'pointer', fontWeight: 600 }}>Clear</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {notifications.map((n) => (
                  <div key={n.id} style={{ padding: '8px', background: '#f8fafc', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1e293b' }}>{n.title}</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{n.desc}</div>
                    <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '2px' }}>{n.time}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile / Login Button */}
        <div style={{ position: 'relative' }}>
          <div
            className="user-profile-widget"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <img
              src={user?.avatar_url || defaultAvatar}
              alt={user?.username || 'Typist'}
              className="user-avatar"
            />
            <div className="user-info">
              <span className="user-name">{user?.username || 'Guest Typist'}</span>
              <span className="user-tier">
                {(user?.isGuest || user?.id?.startsWith('guest_'))
                  ? '⚡ Guest Mode'
                  : (user?.is_premium ? '👑 Premium User' : 'Standard Typist')}
              </span>
            </div>
          </div>

          {showUserMenu && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: '56px',
                width: '230px',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '14px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.12)',
                padding: '12px',
                zIndex: 100
              }}
            >
              <div style={{ padding: '6px 8px', borderBottom: '1px solid #f1f5f9', marginBottom: '8px' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>{user?.username}</div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  {(user?.isGuest || user?.id?.startsWith('guest_')) ? 'Guest Mode (Anonymous)' : (user?.email || 'Guest Mode')}
                </div>
                <div
                  style={{
                    fontSize: '0.7rem',
                    color: (user?.isGuest || user?.id?.startsWith('guest_')) ? '#d97706' : (user?.is_premium ? '#7c3aed' : '#059669'),
                    fontWeight: 600,
                    marginTop: '2px'
                  }}
                >
                  {(user?.isGuest || user?.id?.startsWith('guest_'))
                    ? '⚡ Guest Typist'
                    : (user?.is_premium ? '👑 Premium Member' : 'Standard Member')}
                </div>
              </div>

              {isAdmin && onSwitchToAdminPortal && (
                <button
                  onClick={() => { setShowUserMenu(false); onSwitchToAdminPortal(); }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    background: '#EEF2FF',
                    border: '1px solid #C7D2FE',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: '#4F46E5',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginBottom: '6px'
                  }}
                >
                  <ShieldCheck size={15} color="#4F46E5" />
                  Enter Admin Portal
                </button>
              )}

              <button
                onClick={() => { setShowUserMenu(false); onOpenLogin(); }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  background: 'none',
                  border: 'none',
                  padding: '8px',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: '#2563eb',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <LogIn size={15} />
                Sign In / Switch Account
              </button>

              <button
                onClick={() => { setShowUserMenu(false); onOpenUpgradeModal(); }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  background: 'none',
                  border: 'none',
                  padding: '8px',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: '#475569',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Crown size={15} color="#eab308" />
                {user?.is_premium ? 'Membership Details' : 'Upgrade to Premium'}
              </button>

              <button
                onClick={() => { setShowUserMenu(false); onOpenSupabaseModal(); }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  background: 'none',
                  border: 'none',
                  padding: '8px',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: '#475569',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Database size={15} color="#10b981" />
                Supabase Settings
              </button>

              <div style={{ borderTop: '1px solid #f1f5f9', marginTop: '6px', paddingTop: '6px' }}>
                <button
                  onClick={() => { setShowUserMenu(false); onSignOut(); }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    padding: '8px',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: '#ef4444',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <LogOut size={15} />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
