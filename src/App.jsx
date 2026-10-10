import React, { useState, useEffect, useCallback } from 'react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
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
import AdminPortal from './views/admin/AdminPortal';
import SupabaseModal from './components/SupabaseModal';
import PremiumModal from './components/PremiumModal';
import TestDetailModal from './components/TestDetailModal';
import { supabaseService } from './services/supabaseService';
import { useAuth } from './context/AuthContext';

export default function App() {
  const authContext = useAuth ? useAuth() : null;
  const authContextUser = authContext?.user;
  const authContextLogout = authContext?.logout;
  const refreshProfile = authContext?.refreshProfile;

  // Session Authentication State (Enforces Login First on initial visit)
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const isAuthedSession = sessionStorage.getItem('typemaster_session_authenticated') === 'true';
    const cu = supabaseService.getCurrentUser();
    // Mandatory Initial Route: Visiting '/' or localhost:5173 initially ALWAYS requires Login
    if (window.location.pathname === '/' || window.location.pathname === '' || !isAuthedSession || !cu) {
      return false;
    }
    return true;
  });

  // Current authenticated user session (stores admin or regular user account)
  const [authUser, setAuthUser] = useState(() => {
    const isAuthedSession = sessionStorage.getItem('typemaster_session_authenticated') === 'true';
    if (!isAuthedSession) return null;
    return supabaseService.getCurrentUser();
  });

  // Sync auth state whenever AuthContext user updates
  useEffect(() => {
    if (authContextUser) {
      setAuthUser(authContextUser);
      setIsAuthenticated(true);
    }
  }, [authContextUser]);

  // Portal Management: 'user' vs 'admin' (Dual-Portal Architecture)
  const [portal, setPortal] = useState(() => {
    const saved = localStorage.getItem('typemaster_active_portal');
    const u = supabaseService.getCurrentUser();
    if (saved === 'admin' && (u?.role === 'admin' || u?.email === 'admin@typemaster.com')) {
      return 'admin';
    }
    return 'user';
  });

  // Active View Router
  const [currentView, setCurrentView] = useState(() => {
    const isAuthedSession = sessionStorage.getItem('typemaster_session_authenticated') === 'true';
    if (!isAuthedSession || !supabaseService.getCurrentUser()) {
      return 'login';
    }
    const path = window.location.pathname.replace(/^\//, '');
    if (path === 'admin' || path.startsWith('admin/')) return 'admin';
    if (path === 'practice') return 'practice';
    if (path === 'performance') return 'performance';
    if (path === 'test-history' || path === 'history') return 'history';
    if (path === 'typing-test') return 'typing-test';
    if (path === 'leaderboard') return 'leaderboard';
    if (path === 'progress') return 'progress';
    if (path === 'settings') return 'settings';
    if (path === 'help') return 'help';
    return 'dashboard';
  });

  const [dashboardData, setDashboardData] = useState(null);
  const [supabaseConnected, setSupabaseConnected] = useState(supabaseService.isConfigured());
  const [showAccessDeniedModal, setShowAccessDeniedModal] = useState(false);

  // Theme Management (Light, Dark, System)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('typemaster_theme') || 'system';
  });

  useEffect(() => {
    const applyTheme = (t) => {
      document.documentElement.setAttribute('data-theme-setting', t);
      if (t === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
      } else if (t === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
      } else {
        const isSystemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.setAttribute('data-theme', isSystemDark ? 'system-dark' : 'system-light');
      }
    };

    applyTheme(theme);
    localStorage.setItem('typemaster_theme', theme);

    if (theme === 'system' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applyTheme('system');
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', listener);
        return () => mediaQuery.removeEventListener('change', listener);
      } else if (mediaQuery.addListener) {
        mediaQuery.addListener(listener);
        return () => mediaQuery.removeListener(listener);
      }
    }
  }, [theme]);

  // Auth Guard & URL Synchronization on Mount and Updates
  useEffect(() => {
    // 1. If not authenticated, enforce redirect to /login
    if (!isAuthenticated) {
      if (window.location.pathname !== '/login') {
        window.history.replaceState(null, '', '/login');
      }
      setCurrentView('login');
      return;
    }

    // 2. If authenticated and visiting root '/', redirect to role-appropriate portal
    if (window.location.pathname === '/' || window.location.pathname === '') {
      if (portal === 'admin') {
        window.history.replaceState(null, '', '/admin');
      } else {
        window.history.replaceState(null, '', '/dashboard');
      }
    }
  }, [isAuthenticated, portal]);

  // Handle browser back/forward buttons (popstate)
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.replace(/^\//, '');

      if (!isAuthenticated) {
        window.history.replaceState(null, '', '/login');
        setCurrentView('login');
        return;
      }

      if (path === 'login') {
        setCurrentView('login');
      } else if (path === 'admin' || path.startsWith('admin/')) {
        const isAllowedAdmin = authUser?.role === 'admin' || authUser?.email === 'admin@typemaster.com';
        if (!isAllowedAdmin) {
          setShowAccessDeniedModal(true);
          window.history.replaceState(null, '', '/dashboard');
          setPortal('user');
          setCurrentView('dashboard');
        } else {
          setPortal('admin');
          setCurrentView('admin');
        }
      } else {
        setPortal('user');
        const viewMap = {
          'dashboard': 'dashboard',
          'practice': 'practice',
          'performance': 'performance',
          'test-history': 'history',
          'history': 'history',
          'typing-test': 'typing-test',
          'leaderboard': 'leaderboard',
          'progress': 'progress',
          'settings': 'settings',
          'help': 'help'
        };
        setCurrentView(viewMap[path] || 'dashboard');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isAuthenticated, authUser]);

  // Navigation Helper with URL PushState and Role Guard
  const navigateTo = (view, targetPortal = null) => {
    // Auth Guard
    if (!isAuthenticated && view !== 'login') {
      window.history.replaceState(null, '', '/login');
      setCurrentView('login');
      return;
    }

    const nextPortal = targetPortal || (view === 'admin' || view.startsWith('admin/') ? 'admin' : 'user');

    // Strict Role Authorization Middleware for Admin
    if (nextPortal === 'admin' || view === 'admin' || view.startsWith('admin/')) {
      const isAllowedAdmin = authUser?.role === 'admin' || authUser?.email === 'admin@typemaster.com';
      if (!isAllowedAdmin) {
        setShowAccessDeniedModal(true);
        return;
      }
      setPortal('admin');
      setCurrentView('admin');
      localStorage.setItem('typemaster_active_portal', 'admin');
      window.history.pushState(null, '', '/admin');
      return;
    }

    // Standard User Portal Navigation
    setPortal('user');
    localStorage.setItem('typemaster_active_portal', 'user');
    setCurrentView(view);

    let urlPath = `/${view}`;
    if (view === 'history') urlPath = '/test-history';
    window.history.pushState(null, '', urlPath);
  };

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

  // Active User Profile Context for User Mode (Strictly bound to authenticated session)
  const effectiveUser = authContextUser || authUser || supabaseService.getCurrentUser();
  const activeTypistUser = effectiveUser || {
    id: 'user_active',
    username: 'Typist',
    displayName: 'Typist',
    display_name: 'Typist',
    email: '',
    role: 'user',
    is_premium: false
  };

  // Refresh Dashboard Aggregation in Real-Time
  const refreshDashboard = useCallback(async () => {
    try {
      if (!isAuthenticated) {
        setDashboardData(null);
        return;
      }
      const data = await supabaseService.fetchDashboardData(activeTypistUser);
      setDashboardData(data);
      setSupabaseConnected(supabaseService.isConfigured());
    } catch (err) {
      console.warn('Refresh dashboard error:', err);
    }
  }, [isAuthenticated, activeTypistUser]);

  useEffect(() => {
    if (isAuthenticated) {
      refreshDashboard();
    }
  }, [isAuthenticated, refreshDashboard]);

  // Realtime Profile Sync listener (admin upgrades tier -> immediate User Portal refresh)
  useEffect(() => {
    const handleProfileSync = () => {
      if (refreshProfile) refreshProfile();
      refreshDashboard();
    };
    window.addEventListener('typemaster-profile-sync', handleProfileSync);
    return () => window.removeEventListener('typemaster-profile-sync', handleProfileSync);
  }, [refreshProfile, refreshDashboard]);

  // Handle starting a test
  const handleStartTest = (settings) => {
    setTestSettings(settings);
    navigateTo('typing-test');
  };

  // Handle user tier toggle
  const handleTogglePremium = async (newVal) => {
    await supabaseService.setUserTier(newVal, activeTypistUser?.id);
    if (refreshProfile) refreshProfile();
    refreshDashboard();
  };

  // ==========================================================
  // PROGRAMMATIC ROLE-BASED LOGIN REDIRECTION
  // ==========================================================
  const handleLoginSuccess = async (authenticatedUser, targetPortal = 'user') => {
    setIsAuthenticated(true);
    sessionStorage.setItem('typemaster_session_authenticated', 'true');
    setAuthUser(authenticatedUser);

    const isAdmin = authenticatedUser.role === 'admin' || authenticatedUser.email === 'admin@typemaster.com';

    if (targetPortal === 'admin' && isAdmin) {
      setPortal('admin');
      setCurrentView('admin');
      localStorage.setItem('typemaster_active_portal', 'admin');
      window.history.pushState(null, '', '/admin');
    } else {
      setPortal('user');
      setCurrentView('dashboard');
      localStorage.setItem('typemaster_active_portal', 'user');
      window.history.pushState(null, '', '/dashboard');
    }

    await refreshDashboard();
  };

  const handleSignOut = async () => {
    if (authContextLogout) {
      await authContextLogout();
    } else {
      await supabaseService.signOut();
    }
    setIsAuthenticated(false);
    sessionStorage.removeItem('typemaster_session_authenticated');
    localStorage.removeItem('typemaster_active_portal');
    setAuthUser(null);
    setDashboardData(null);
    setPortal('user');
    setCurrentView('login');
    window.history.pushState(null, '', '/login');
  };

  // ==========================================================
  // 1. AUTH GUARD: MANDATORY INITIAL ROUTE TO LOGIN VIEW
  // ==========================================================
  if (!isAuthenticated || currentView === 'login') {
    return (
      <>
        <LoginView
          onLoginSuccess={handleLoginSuccess}
          onCancel={isAuthenticated ? () => navigateTo('dashboard') : null}
          onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
          supabaseConnected={supabaseConnected}
          initialPortal={portal}
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

  // ==========================================================
  // 2. DUAL-PORTAL ARCHITECTURE: ADMIN PORTAL
  // Strict Role Authorization Enforced
  // ==========================================================
  if (portal === 'admin') {
    const isAllowedAdmin = authUser?.role === 'admin' || authUser?.email === 'admin@typemaster.com';
    if (!isAllowedAdmin) {
      // Trigger Access Denied Notice
      return (
        <AccessDeniedView
          onReturnToDashboard={() => {
            setPortal('user');
            navigateTo('dashboard');
          }}
        />
      );
    }

    const adminProfile = authUser?.role === 'admin' ? authUser : DEFAULT_ADMIN_USER;

    return (
      <>
        <AdminPortal
          currentUser={adminProfile}
          onSwitchToUserPortal={() => {
            setPortal('user');
            localStorage.setItem('typemaster_active_portal', 'user');
            navigateTo('dashboard');
          }}
          onSignOut={handleSignOut}
          onUserUpdate={refreshDashboard}
        />
      </>
    );
  }

  // ==========================================================
  // 3. DUAL-PORTAL ARCHITECTURE: USER PORTAL
  // ==========================================================
  const displayedUser = activeTypistUser;
  const isPremium = Boolean(displayedUser?.is_premium);
  const hasAdminPrivileges = authUser?.role === 'admin' || authUser?.email === 'admin@typemaster.com';

  return (
    <div className="app-layout">
      {/* Strict Role Authorization Modal */}
      {showAccessDeniedModal && (
        <AccessDeniedModal
          onClose={() => setShowAccessDeniedModal(false)}
          onReturnToDashboard={() => {
            setShowAccessDeniedModal(false);
            setPortal('user');
            navigateTo('dashboard');
          }}
        />
      )}

      {/* Left Sidebar (User Portal) */}
      <Sidebar
        currentView={currentView}
        setCurrentView={(view) => navigateTo(view)}
        onOpenUpgradeModal={() => setIsUpgradeModalOpen(true)}
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
        onOpenLogin={() => navigateTo('login')}
        isPremium={isPremium}
        supabaseConnected={supabaseConnected}
      />

      {/* Main Content Area */}
      <main className="app-main">
        {/* Top Header - displays active typist profile (e.g. shika - Standard Typist) */}
        <TopHeader
          streak={dashboardData?.streak?.current_streak || 0}
          user={displayedUser}
          authRole={authUser?.role}
          hasAdminPrivileges={hasAdminPrivileges}
          onOpenUpgradeModal={() => setIsUpgradeModalOpen(true)}
          onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
          onOpenLogin={() => navigateTo('login')}
          onSignOut={handleSignOut}
          supabaseConnected={supabaseConnected}
          onSwitchToAdminPortal={() => {
            navigateTo('admin');
          }}
        />

        {/* View Switcher for User Portal */}
        {currentView === 'dashboard' && (
          <DashboardView
            dashboardData={dashboardData || {
              user: displayedUser,
              streak: { current_streak: 0 },
              recentTests: [],
              achievements: [],
              performanceGraph: [],
              accuracyTrend: []
            }}
            onStartTest={handleStartTest}
            onNavigate={(view) => navigateTo(view)}
            onViewTestDetails={(test) => setSelectedTestDetail(test)}
          />
        )}

        {currentView === 'typing-test' && (
          <TypingTestView
            initialSettings={testSettings}
            onTestCompleted={refreshDashboard}
            onNavigate={(view) => navigateTo(view)}
          />
        )}

        {currentView === 'performance' && (
          <PerformanceView
            user={displayedUser}
            isPremium={isPremium}
            recentTests={dashboardData?.recentTests || []}
            onOpenUpgradeModal={() => setIsUpgradeModalOpen(true)}
            onNavigate={(view) => navigateTo(view)}
          />
        )}

        {currentView === 'leaderboard' && (
          <LeaderboardView
            user={displayedUser}
            streak={dashboardData?.streak}
            onNavigate={(view) => navigateTo(view)}
          />
        )}

        {currentView === 'progress' && (
          <ProgressView dashboardData={dashboardData || { user: displayedUser }} />
        )}

        {currentView === 'practice' && (
          <PracticeView onStartTest={handleStartTest} />
        )}

        {currentView === 'history' && (
          <HistoryView
            recentTests={dashboardData?.recentTests || []}
            onHistoryCleared={refreshDashboard}
            onNavigate={(view) => navigateTo(view)}
          />
        )}

        {currentView === 'settings' && (
          <SettingsView
            user={displayedUser}
            onUserUpdate={refreshDashboard}
            onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
            supabaseConnected={supabaseConnected}
            theme={theme}
            onThemeChange={setTheme}
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

// Strict Role Authorization Modal
function AccessDeniedModal({ onClose, onReturnToDashboard }) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px'
      }}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '20px',
          maxWidth: '460px',
          width: '100%',
          padding: '32px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          textAlign: 'center'
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: '#FEF2F2',
            border: '2px solid #FECDD3',
            color: '#DC2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px'
          }}
        >
          <ShieldAlert size={34} />
        </div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
          Access Denied
        </h2>
        <p style={{ fontSize: '0.9rem', color: '#64748B', lineHeight: 1.5, marginBottom: '20px' }}>
          Admin role authorization required. Standard typist accounts cannot access the TypeMaster Admin Management Portal.
        </p>
        <div
          style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '12px',
            marginBottom: '24px',
            fontSize: '0.82rem',
            color: '#475569'
          }}
        >
          Active Role: <strong style={{ color: '#DC2626' }}>user</strong> • Required Role: <strong style={{ color: '#4F46E5' }}>admin</strong>
        </div>
        <button
          onClick={onReturnToDashboard}
          style={{
            width: '100%',
            padding: '12px 20px',
            background: '#4F46E5',
            color: '#FFFFFF',
            borderRadius: '10px',
            border: 'none',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)'
          }}
        >
          Return to User Portal Dashboard
        </button>
      </div>
    </div>
  );
}

// Strict Role Authorization Full View (if direct navigation blocked)
function AccessDeniedView({ onReturnToDashboard }) {
  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        width: '100vw',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0F172A',
        padding: '24px'
      }}
    >
      <div
        style={{
          background: '#1E293B',
          border: '1px solid #334155',
          borderRadius: '20px',
          maxWidth: '480px',
          width: '100%',
          padding: '36px',
          textAlign: 'center',
          color: '#F8FAFC'
        }}
      >
        <div
          style={{
            width: '68px',
            height: '68px',
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '2px solid rgba(239, 68, 68, 0.3)',
            color: '#F87171',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px'
          }}
        >
          <ShieldAlert size={36} />
        </div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '10px', color: '#FFFFFF' }}>
          Access Denied • Admin Role Required
        </h1>
        <p style={{ fontSize: '0.9rem', color: '#94A3B8', lineHeight: 1.5, marginBottom: '24px' }}>
          This route (<code style={{ color: '#F43F5E' }}>/admin</code>) is protected by Strict Role Authorization Middleware. You are currently authenticated as a standard user with role <code style={{ color: '#F59E0B' }}>user</code>.
        </p>
        <button
          onClick={onReturnToDashboard}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            width: '100%',
            padding: '13px 20px',
            background: '#4F46E5',
            color: '#FFFFFF',
            borderRadius: '12px',
            border: 'none',
            fontWeight: 700,
            fontSize: '0.92rem',
            cursor: 'pointer'
          }}
        >
          <ArrowLeft size={16} />
          <span>Return to User Portal Dashboard</span>
        </button>
      </div>
    </div>
  );
}
