import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import TopHeader from './components/TopHeader';
import DashboardView from './views/DashboardView';
import TypingTestView from './views/TypingTestView';
import PerformanceView from './views/PerformanceView';
import LeaderboardView from './views/LeaderboardView';
import ProgressView from './views/ProgressView';
import PracticeView from './views/PracticeView';
import HistoryView from './views/HistoryView';
import SettingsView from './views/SettingsView';
import HelpView from './views/HelpView';
import LoginView from './views/LoginView';
import SupabaseModal from './components/SupabaseModal';
import PremiumModal from './components/PremiumModal';
import TestDetailModal from './components/TestDetailModal';
import { supabaseService } from './services/supabaseService';

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState(null);
  const [supabaseConnected, setSupabaseConnected] = useState(supabaseService.isConfigured());

  // Test setup passing to TypingTestView
  const [testSettings, setTestSettings] = useState({
    duration: 60,
    difficulty: 'Easy',
    category: 'Random Text'
  });

  // Modals
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [selectedTestDetail, setSelectedTestDetail] = useState(null);

  // Fetch Dashboard Aggregation in Real-Time (Architecture Step 6)
  const refreshDashboard = useCallback(async () => {
    try {
      const data = await supabaseService.fetchDashboardData();
      setDashboardData(data);
      setSupabaseConnected(supabaseService.isConfigured());
    } catch (err) {
      console.warn('Refresh dashboard error:', err);
    }
  }, []);

  useEffect(() => {
    refreshDashboard();
  }, [refreshDashboard]);

  // Handle starting a test from Dashboard or Practice mode
  const handleStartTest = (settings) => {
    setTestSettings(settings);
    setCurrentView('typing-test');
  };

  // Handle user tier toggle
  const handleTogglePremium = async (newVal) => {
    await supabaseService.setUserTier(newVal);
    refreshDashboard();
  };

  // Handle user authentication transitions
  const handleLoginSuccess = (authUser) => {
    refreshDashboard();
    setCurrentView('dashboard');
  };

  const handleSignOut = async () => {
    await supabaseService.signOut();
    await supabaseService.signInGuest();
    refreshDashboard();
    setCurrentView('dashboard');
  };

  if (!dashboardData) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#f4f7fc' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#2563eb', marginBottom: '8px' }}>
            TypeMaster
          </div>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Connecting real-time Supabase engine...</p>
        </div>
      </div>
    );
  }

  // If user navigated to login view, render the dedicated Login / Register screen
  if (currentView === 'login') {
    return (
      <>
        <LoginView
          onLoginSuccess={handleLoginSuccess}
          onCancel={() => setCurrentView('dashboard')}
          onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
          supabaseConnected={supabaseConnected}
        />
        <SupabaseModal
          isOpen={isSupabaseModalOpen}
          onClose={() => setIsSupabaseModalOpen(false)}
          onConnectedChange={(connected) => {
            setSupabaseConnected(connected);
            refreshDashboard();
          }}
        />
      </>
    );
  }

  const { user, streak, recentTests } = dashboardData;
  const isPremium = Boolean(user?.is_premium);

  return (
    <div className="app-layout">
      {/* Left Sidebar matching Image 1 & 2 */}
      <Sidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
        onOpenUpgradeModal={() => setIsUpgradeModalOpen(true)}
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
        onOpenLogin={() => setCurrentView('login')}
        isPremium={isPremium}
        supabaseConnected={supabaseConnected}
      />

      {/* Main Content Area */}
      <main className="app-main">
        {/* Top Header matching Image 1 & 2 */}
        <TopHeader
          streak={streak?.current_streak || 0}
          user={user}
          onOpenUpgradeModal={() => setIsUpgradeModalOpen(true)}
          onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
          onOpenLogin={() => setCurrentView('login')}
          onSignOut={handleSignOut}
          supabaseConnected={supabaseConnected}
        />

        {/* View Switcher */}
        {currentView === 'dashboard' && (
          <DashboardView
            dashboardData={dashboardData}
            onStartTest={handleStartTest}
            onNavigate={(view) => setCurrentView(view)}
            onViewTestDetails={(test) => setSelectedTestDetail(test)}
          />
        )}

        {currentView === 'typing-test' && (
          <TypingTestView
            initialSettings={testSettings}
            onTestCompleted={refreshDashboard}
            onNavigate={(view) => setCurrentView(view)}
          />
        )}

        {currentView === 'performance' && (
          <PerformanceView
            user={user}
            isPremium={isPremium}
            recentTests={recentTests}
            onOpenUpgradeModal={() => setIsUpgradeModalOpen(true)}
          />
        )}

        {currentView === 'leaderboard' && (
          <LeaderboardView user={user} streak={streak} />
        )}

        {currentView === 'progress' && (
          <ProgressView dashboardData={dashboardData} />
        )}

        {currentView === 'practice' && (
          <PracticeView onStartTest={handleStartTest} />
        )}

        {currentView === 'history' && (
          <HistoryView recentTests={recentTests} />
        )}

        {currentView === 'settings' && (
          <SettingsView
            user={user}
            onUserUpdate={refreshDashboard}
            onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
            supabaseConnected={supabaseConnected}
          />
        )}

        {currentView === 'help' && (
          <HelpView />
        )}
      </main>

      {/* Supabase Connection Setup Modal */}
      <SupabaseModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        onConnectedChange={(connected) => {
          setSupabaseConnected(connected);
          refreshDashboard();
        }}
      />

      {/* Upgrade to Premium Modal */}
      <PremiumModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        isPremium={isPremium}
        onTogglePremium={handleTogglePremium}
      />

      {/* Test Log Details Modal */}
      <TestDetailModal
        test={selectedTestDetail}
        onClose={() => setSelectedTestDetail(null)}
      />
    </div>
  );
}
