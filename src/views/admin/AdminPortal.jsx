import React, { useState } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminTopHeader from '../../components/admin/AdminTopHeader';
import AdminDashboardView from './AdminDashboardView';
import AdminUsersView from './AdminUsersView';
import AdminPerformanceView from './AdminPerformanceView';
import AdminTypingTestsView from './AdminTypingTestsView';
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
  const [currentAdminView, setCurrentAdminView] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [dateRange, setDateRange] = useState('Oct 1, 2026 - Oct 31, 2026');
  const [selectedUserForAnalytics, setSelectedUserForAnalytics] = useState(null);

  const handleSelectUser = (user) => {
    setSelectedUserForAnalytics(user);
    setCurrentAdminView('performance');
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
        onNavigate={(view) => setCurrentAdminView(view)}
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
          onNavigate={(view) => setCurrentAdminView(view)}
          onSwitchToUserPortal={onSwitchToUserPortal}
          onSignOut={onSignOut}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
        />

        {/* View Switcher for the 10 Admin Sections */}
        <div style={{ flex: 1 }}>
          {currentAdminView === 'dashboard' && (
            <AdminDashboardView
              onNavigate={(view) => setCurrentAdminView(view)}
              onSelectUserForAnalytics={handleSelectUser}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
            />
          )}

          {currentAdminView === 'users' && (
            <AdminUsersView
              onSelectUserForAnalytics={handleSelectUser}
              onNavigate={(view) => setCurrentAdminView(view)}
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

          {currentAdminView === 'typing-tests' && (
            <AdminTypingTestsView
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
