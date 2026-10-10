import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Bell,
  Calendar,
  ChevronDown,
  User,
  Settings,
  LogOut,
  ArrowLeftRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Info
} from 'lucide-react';

export default function AdminTopHeader({
  currentUser,
  onNavigate,
  onSwitchToUserPortal,
  onSignOut,
  dateRange = 'Oct 1, 2026 - Oct 31, 2026',
  onDateRangeChange
}) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const profileRef = useRef(null);
  const notifRef = useRef(null);
  const dateRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (dateRef.current && !dateRef.current.contains(e.target)) {
        setShowDatePicker(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const notifications = [
    { id: 1, title: 'New User Registered', desc: 'Priya Sharma joined with 85 WPM benchmark', time: '10m ago', type: 'info' },
    { id: 2, title: 'Milestone Unlocked', desc: 'Rahul Verma achieved Speed Master badge', time: '45m ago', type: 'success' },
    { id: 3, title: 'High Error Rate Flag', desc: 'Test passage #4 reported by 2 typists', time: '2h ago', type: 'warning' },
    { id: 4, title: 'Excel Export Completed', desc: 'User roster downloaded successfully', time: '4h ago', type: 'info' },
    { id: 5, title: 'Database Health Optimal', desc: 'Supabase PostgreSQL synchronization 100%', time: '1d ago', type: 'success' }
  ];

  const dateOptions = [
    'Today',
    'Last 7 Days',
    'Last 30 Days (Oct 1 - Oct 31, 2026)',
    'This Quarter',
    'All Time'
  ];

  return (
    <header
      style={{
        height: '70px',
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #E2E8F0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 28px',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
      }}
    >
      {/* Search Bar */}
      <div style={{ display: 'flex', alignItems: 'center', flex: 1, maxWidth: '420px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '10px',
            padding: '8px 14px',
            width: '100%',
            transition: 'border-color 0.15s, box-shadow 0.15s'
          }}
        >
          <Search size={17} color="#94A3B8" />
          <input
            type="text"
            placeholder="Search users, tests, or reports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              border: 'none',
              background: 'transparent',
              outline: 'none',
              fontSize: '0.86rem',
              color: '#1E293B',
              width: '100%'
            }}
          />
        </div>
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Switch Portal Button */}
        <button
          onClick={onSwitchToUserPortal}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '7px',
            background: '#EEF2FF',
            border: '1px solid #C7D2FE',
            color: '#4F46E5',
            padding: '7px 14px',
            borderRadius: '9px',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.15s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#E0E7FF';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#EEF2FF';
          }}
        >
          <ArrowLeftRight size={15} />
          <span>User Portal</span>
        </button>

        {/* Date Filter Dropdown */}
        <div style={{ position: 'relative' }} ref={dateRef}>
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '9px',
              padding: '7px 12px',
              fontSize: '0.82rem',
              fontWeight: 600,
              color: '#334155',
              cursor: 'pointer'
            }}
          >
            <Calendar size={15} color="#6366F1" />
            <span>{dateRange}</span>
            <ChevronDown size={14} color="#94A3B8" />
          </button>

          {showDatePicker && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                right: 0,
                width: '260px',
                background: '#FFFFFF',
                borderRadius: '12px',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                border: '1px solid #E2E8F0',
                padding: '6px',
                zIndex: 60
              }}
            >
              <div style={{ padding: '8px 12px', fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>
                Select Reporting Period
              </div>
              {dateOptions.map((opt) => (
                <div
                  key={opt}
                  onClick={() => {
                    if (onDateRangeChange) onDateRangeChange(opt);
                    setShowDatePicker(false);
                  }}
                  style={{
                    padding: '8px 12px',
                    fontSize: '0.82rem',
                    color: '#1E293B',
                    borderRadius: '7px',
                    cursor: 'pointer',
                    fontWeight: dateRange === opt ? 700 : 500,
                    background: dateRange === opt ? '#EEF2FF' : 'transparent'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#F1F5F9')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = dateRange === opt ? '#EEF2FF' : 'transparent')}
                >
                  {opt}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notifications Popover */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            style={{
              position: 'relative',
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              border: '1px solid #E2E8F0',
              background: '#F8FAFC',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#475569'
            }}
          >
            <Bell size={18} />
            <span
              style={{
                position: 'absolute',
                top: '5px',
                right: '5px',
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                background: '#EF4444',
                color: '#FFFFFF',
                fontSize: '0.65rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              5
            </span>
          </button>

          {showNotifications && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '330px',
                background: '#FFFFFF',
                borderRadius: '14px',
                boxShadow: '0 12px 30px rgba(0, 0, 0, 0.12)',
                border: '1px solid #E2E8F0',
                overflow: 'hidden',
                zIndex: 60
              }}
            >
              <div
                style={{
                  padding: '12px 16px',
                  background: '#0F172A',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ fontSize: '0.88rem', fontWeight: 700 }}>Notifications</div>
                <div style={{ fontSize: '0.72rem', color: '#818CF8', fontWeight: 600 }}>5 Unread</div>
              </div>
              <div style={{ maxHeight: '320px', overflowY: 'auto', padding: '6px' }}>
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      marginBottom: '4px',
                      display: 'flex',
                      gap: '10px',
                      alignItems: 'flex-start',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ marginTop: '2px' }}>
                      {n.type === 'success' && <CheckCircle2 size={16} color="#10B981" />}
                      {n.type === 'warning' && <AlertTriangle size={16} color="#F59E0B" />}
                      {n.type === 'info' && <Info size={16} color="#6366F1" />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1E293B' }}>{n.title}</div>
                      <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>{n.desc}</div>
                      <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '4px' }}>{n.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile Avatar & Menu */}
        <div style={{ position: 'relative' }} ref={profileRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '4px 6px',
              borderRadius: '10px'
            }}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #1E293B, #0F172A)',
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
              }}
            >
              A
            </div>
            <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#1E293B', lineHeight: 1.2 }}>
                Admin
              </span>
              <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 500 }}>
                Administrator
              </span>
            </div>
            <ChevronDown size={14} color="#94A3B8" />
          </button>

          {showProfileMenu && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '210px',
                background: '#FFFFFF',
                borderRadius: '12px',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                border: '1px solid #E2E8F0',
                padding: '6px',
                zIndex: 60
              }}
            >
              <div style={{ padding: '8px 12px', borderBottom: '1px solid #F1F5F9' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A' }}>
                  {currentUser?.username || 'Administrator'}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                  {currentUser?.email || 'admin@typemaster.com'}
                </div>
              </div>
              <div style={{ padding: '4px 0' }}>
                <button
                  onClick={() => {
                    onNavigate('settings');
                    setShowProfileMenu(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'transparent',
                    color: '#334155',
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    fontWeight: 500
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <Settings size={15} color="#6366F1" />
                  <span>Admin Settings</span>
                </button>
                <button
                  onClick={() => {
                    onSwitchToUserPortal();
                    setShowProfileMenu(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'transparent',
                    color: '#334155',
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    fontWeight: 500
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <ArrowLeftRight size={15} color="#4F46E5" />
                  <span>Switch to User Portal</span>
                </button>
                <div style={{ height: '1px', background: '#F1F5F9', margin: '4px 0' }} />
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    onSignOut();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'transparent',
                    color: '#EF4444',
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#FEF2F2')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <LogOut size={15} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
