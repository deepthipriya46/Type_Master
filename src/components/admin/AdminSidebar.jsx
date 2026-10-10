import React from 'react';
import ParAcademyLogo from '../ParAcademyLogo';
import {
  LayoutDashboard,
  Users,
  LineChart,
  Keyboard,
  BookOpen,
  Trophy,
  FileBarChart,
  MessageSquare,
  Megaphone,
  Settings,
  LogOut,
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function AdminSidebar({
  currentView,
  onNavigate,
  onSwitchToUserPortal,
  onSignOut,
  collapsed,
  onToggleCollapse
}) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'performance', label: 'User Performance', icon: LineChart },
    { id: 'typing-tests', label: 'Typing Tests', icon: Keyboard },
    { id: 'practice-content', label: 'Practice Content', icon: BookOpen },
    { id: 'achievements', label: 'Achievements', icon: Trophy },
    { id: 'reports', label: 'Reports & Analytics', icon: FileBarChart },
    { id: 'feedback', label: 'Feedback', icon: MessageSquare },
    { id: 'announcements', label: 'Announcements', icon: Megaphone },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside
      className={`admin-sidebar ${collapsed ? 'collapsed' : ''}`}
      style={{
        width: collapsed ? '80px' : '260px',
        backgroundColor: '#0F172A',
        color: '#94A3B8',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        borderRight: '1px solid #1E293B',
        userSelect: 'none'
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          padding: collapsed ? '20px 12px' : '22px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          borderBottom: '1px solid #1E293B'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          {collapsed ? (
            <ParAcademyLogo
              height={36}
              collapsed={true}
              onClick={() => onNavigate('dashboard')}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <ParAcademyLogo
                height={42}
                style={{ cursor: 'pointer' }}
                onClick={() => onNavigate('dashboard')}
              />
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', paddingLeft: '2px' }}>
                <span
                  style={{
                    fontSize: '0.64rem',
                    fontWeight: 800,
                    color: '#38BDF8',
                    letterSpacing: '1px',
                    textTransform: 'uppercase'
                  }}
                >
                  ADMIN PORTAL
                </span>
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#10B981',
                    boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.3)'
                  }}
                />
              </div>
            </div>
          )}
        </div>

        <button
          onClick={onToggleCollapse}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{
            background: '#1E293B',
            border: 'none',
            color: '#94A3B8',
            borderRadius: '6px',
            width: '26px',
            height: '26px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s'
          }}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Navigation List */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: collapsed ? '16px 8px' : '16px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              title={collapsed ? item.label : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: collapsed ? '12px 0' : '10px 14px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                borderRadius: '10px',
                border: 'none',
                background: isActive
                  ? 'linear-gradient(135deg, #4F46E5, #6366F1)'
                  : 'transparent',
                color: isActive ? '#FFFFFF' : '#94A3B8',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.88rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: isActive ? '0 4px 14px rgba(79, 70, 229, 0.35)' : 'none',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = '#1E293B';
                  e.currentTarget.style.color = '#F1F5F9';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#94A3B8';
                }
              }}
            >
              <Icon size={19} style={{ flexShrink: 0, color: isActive ? '#FFFFFF' : '#94A3B8' }} />
              {!collapsed && (
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.label}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Switcher & Logout */}
      <div
        style={{
          padding: collapsed ? '14px 8px' : '14px 12px',
          borderTop: '1px solid #1E293B',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}
      >
        {/* Switch to User Portal */}
        <button
          onClick={onSwitchToUserPortal}
          title="Switch to User Portal"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            width: '100%',
            padding: collapsed ? '10px 0' : '9px 12px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            borderRadius: '9px',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            background: 'rgba(99, 102, 241, 0.1)',
            color: '#A5B4FC',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(99, 102, 241, 0.2)';
            e.currentTarget.style.color = '#FFFFFF';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)';
            e.currentTarget.style.color = '#A5B4FC';
          }}
        >
          <ArrowLeftRight size={17} style={{ flexShrink: 0 }} />
          {!collapsed && <span>Switch to User Portal</span>}
        </button>

        {/* Logout */}
        <button
          onClick={onSignOut}
          title="Sign Out"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            width: '100%',
            padding: collapsed ? '10px 0' : '9px 12px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            borderRadius: '9px',
            border: 'none',
            background: 'transparent',
            color: '#F87171',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <LogOut size={17} style={{ flexShrink: 0 }} />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
