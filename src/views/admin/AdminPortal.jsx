import React, { useState } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminTopHeader from '../../components/admin/AdminTopHeader';
import AdminDashboardView from './AdminDashboardView';
import AdminUsersView from './AdminUsersView';
import AdminPerformanceView from './AdminPerformanceView';
import AdminPracticeContentView from './AdminPracticeContentView';
import AdminAchievementsView from './AdminAchievementsView';
import AdminScheduledTestsView from './AdminScheduledTestsView';
import AdminReportsView from './AdminReportsView';
import AdminFeedbackView from './AdminFeedbackView';
import AdminAnnouncementsView from './AdminAnnouncementsView';
import AdminSettingsView from './AdminSettingsView';

export default function AdminPortal({
  currentUser,
  onSwitchToUserPortal,
  onSignOut,
  onUserUpdate
}) {
  const getInitialView = () => {
    if (typeof window !== 'undefined') {
      const p = window.location.pathname.toLowerCase();
      if (p.includes('/admin/users') || p === '/users') return 'users';
      if (p.includes('/admin/performance')) return 'performance';
      if (p.includes('/admin/practice')) return 'practice-content';
      if (p.includes('/admin/achievements')) return 'achievements';
      if (p.includes('/admin/scheduled-tests')) return 'scheduled-tests';
      if (p.includes('/admin/reports')) return 'reports';
      if (p.includes('/admin/feedback')) return 'feedback';
      if (p.includes('/admin/announcements')) return 'announcements';
      if (p.includes('/admin/settings')) return 'settings';
    }
    return 'dashboard';
  };

  const [currentAdminView, setCurrentAdminView] = useState(getInitialView);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [dateRange, setDateRange] = useState('Oct 1, 2026 - Oct 31, 2026');
  const [selectedUserForAnalytics, setSelectedUserForAnalytics] = useState(null);

  const handleNavigate = (view) => {
    setCurrentAdminView(view);
    if (typeof window !== 'undefined' && window.history) {
      const targetPath = view === 'dashboard' ? '/admin' : `/admin/${view}`;
      if (window.location.pathname !== targetPath) {
        window.history.pushState(null, '', targetPath);
      }
    }
  };

  // Sync on browser back/forward
  React.useEffect(() => {
    const handlePopState = () => {
      setCurrentAdminView(getInitialView());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleSelectUser = (user) => {
    setSelectedUserForAnalytics(user);
    handleNavigate('performance');
  };

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        width: '100vw',
        backgroundColor: '#F8FAFC',
        fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif"
      }}
    >
      {/* Dark-themed Admin Sidebar */}
      <AdminSidebar
        currentView={currentAdminView}
        onNavigate={handleNavigate}
        onSwitchToUserPortal={onSwitchToUserPortal}
        onSignOut={onSignOut}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Admin Content Canvas */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowX: 'hidden' }}>
        {/* Sticky Admin Top Header */}
        <AdminTopHeader
          currentUser={currentUser}
          onNavigate={handleNavigate}
          onSwitchToUserPortal={onSwitchToUserPortal}
          onSignOut={onSignOut}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
        />

        {/* View Switcher for the 10 Admin Sections */}
        <div style={{ flex: 1 }}>
          {currentAdminView === 'dashboard' && (
            <AdminDashboardView
              onNavigate={handleNavigate}
              onSelectUserForAnalytics={handleSelectUser}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
            />
          )}

          {currentAdminView === 'users' && (
            <AdminUsersView
              onSelectUserForAnalytics={handleSelectUser}
              onNavigate={handleNavigate}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
            />
          )}

          {currentAdminView === 'performance' && (
            <AdminPerformanceView
              initialUser={selectedUserForAnalytics}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
            />
          )}

          {currentAdminView === 'practice-content' && (
            <AdminPracticeContentView />
          )}

          {currentAdminView === 'achievements' && (
            <AdminAchievementsView
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
            />
          )}

          {currentAdminView === 'scheduled-tests' && (
            <AdminScheduledTestsView
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
            />
          )}

          {currentAdminView === 'reports' && (
            <AdminReportsView
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
            />
          )}

          {currentAdminView === 'feedback' && (
            <AdminFeedbackView
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
            />
          )}

          {currentAdminView === 'announcements' && (
            <AdminAnnouncementsView />
          )}

          {currentAdminView === 'settings' && (
            <AdminSettingsView
              currentUser={currentUser}
              onUserUpdate={onUserUpdate}
            />
          )}
        </div>
      </div>
    </div>
  );
}
