import React, { useState, useEffect } from 'react';
import {
  Keyboard,
  Mail,
  Lock,
  User,
  ArrowRight,
  Sparkles,
  Database,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  Shield,
  Zap,
  BarChart3,
  Trophy,
  RefreshCw,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { supabaseService } from '../services/supabaseService';
import keyboardHeroImg from '../assets/keyboard_hero.jpg';

export default function LoginView({
  onLoginSuccess,
  onCancel,
  onOpenSupabaseModal,
  supabaseConnected = true,
  initialPortal = 'user'
}) {
  // Navigation & Mode States
  const [isAdminMode, setIsAdminMode] = useState(initialPortal === 'admin');
  const [activeTab, setActiveTab] = useState('signin'); // 'signin', 'register', 'guest', 'forgot'

  // Input states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [guestNickname, setGuestNickname] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Sync initialPortal prop if changed
  useEffect(() => {
    if (initialPortal === 'admin') {
      setIsAdminMode(true);
      setEmail('');
      setPassword('');
    }
  }, [initialPortal]);

  // Handle Tab Switch
  const switchTab = (tab) => {
    setActiveTab(tab);
    setErrorMsg('');
    setSuccessMsg('');
  };

  // Switch Admin Mode
  const toggleAdminMode = (enable) => {
    setIsAdminMode(enable);
    setErrorMsg('');
    setSuccessMsg('');
    setEmail('');
    setPassword('');
    if (enable) {
      setActiveTab('signin');
    }
  };

  // Sign In Handler
  const handleSignIn = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMsg('Please enter both your email address and password.');
      return;
    }

    setErrorMsg('');
    setLoading(true);

    try {
      const res = await supabaseService.signIn(email.trim(), password);
      if (res.success && res.user) {
        if (isAdminMode) {
          // Strict Role Authorization Check
          const isAdmin = res.user.role === 'admin' || res.user.email === 'admin@typemaster.com';
          if (!isAdmin) {
            await supabaseService.signOut();
            setErrorMsg('Access Denied: Account lacks Administrator privileges. Only authorized administrators can access this portal.');
            return;
          }
          onLoginSuccess(res.user, 'admin');
        } else {
          onLoginSuccess(res.user, 'user');
        }
      } else {
        setErrorMsg(res.message || 'Invalid email or password. Please try again.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Authentication error. Please check your network connection.');
    } finally {
      setLoading(false);
    }
  };

  // Registration Handler
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !password) {
      setErrorMsg('Please complete all registration fields.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter your password.');
      return;
    }

    setErrorMsg('');
    setLoading(true);

    try {
      const res = await supabaseService.signUp(email.trim(), password, fullName.trim());
      if (res.success && res.user) {
        onLoginSuccess(res.user, 'user');
      } else {
        setErrorMsg(res.message || 'Failed to create your account. Please try again.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'An error occurred during registration.');
    } finally {
      setLoading(false);
    }
  };

  // Guest Mode Handler
  const handleGuestLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const nick = guestNickname.trim() || `Typist_${Math.floor(1000 + Math.random() * 9000)}`;
      const res = await supabaseService.signInGuest(nick);
      if (res.success && res.user) {
        onLoginSuccess(res.user, 'user');
      }
    } catch (err) {
      setErrorMsg('Could not initialize guest session. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  // Google OAuth Login Handler
  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await supabaseService.signInWithOAuth('google');
      if (res.success && res.user) {
        onLoginSuccess(res.user, 'user');
      }
    } catch (err) {
      setErrorMsg('Google login was cancelled or failed.');
    } finally {
      setLoading(false);
    }
  };

  // Password Recovery
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg('Please enter your email address to receive password reset instructions.');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    try {
      const res = await supabaseService.resetPasswordForEmail(email.trim());
      if (res.success) {
        setSuccessMsg(res.message || 'Password reset link sent to your email.');
      } else {
        setErrorMsg(res.message || 'Failed to send reset link.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Could not process password recovery request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'row',
        background: '#060B19',
        overflowX: 'hidden',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
      }}
    >
      {/* ========================================================= */}
      {/* LEFT BRAND HERO PANEL (DARK NEON THEME) */}
      {/* ========================================================= */}
      <div
        style={{
          flex: '1.15',
          minHeight: '100vh',
          background: 'linear-gradient(145deg, #050B1A 0%, #08112C 55%, #040816 100%)',
          position: 'relative',
          padding: '44px 56px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          overflow: 'hidden',
          boxSizing: 'border-box'
        }}
        className="brand-hero-panel"
      >
        {/* Background Ambient Glows */}
        <div
          style={{
            position: 'absolute',
            top: '20%',
            left: '30%',
            width: '460px',
            height: '460px',
            background: 'radial-gradient(circle, rgba(6, 182, 212, 0.16) 0%, rgba(59, 130, 246, 0.08) 50%, transparent 70%)',
            filter: 'blur(40px)',
            pointerEvents: 'none'
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '15%',
            right: '10%',
            width: '420px',
            height: '420px',
            background: 'radial-gradient(circle, rgba(168, 85, 247, 0.18) 0%, rgba(236, 72, 153, 0.08) 50%, transparent 70%)',
            filter: 'blur(40px)',
            pointerEvents: 'none'
          }}
        />

        {/* Faint Background Watermark Logo */}
        <div
          style={{
            position: 'absolute',
            top: '15%',
            left: '25%',
            fontSize: '7.5rem',
            fontWeight: 900,
            letterSpacing: '8px',
            color: 'rgba(255, 255, 255, 0.02)',
            userSelect: 'none',
            pointerEvents: 'none',
            lineHeight: 1,
            zIndex: 1
          }}
        >
          PAR
          <div style={{ fontSize: '2.5rem', letterSpacing: '14px', marginTop: '10px' }}>ACADEMY</div>
        </div>

        {/* Top Header: PAR ACADEMY Brand & Tagline */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            position: 'relative',
            zIndex: 10
          }}
        >
          {/* Logo */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              <span
                style={{
                  fontSize: '2.3rem',
                  fontWeight: 900,
                  letterSpacing: '2px',
                  background: 'linear-gradient(90deg, #00E5FF 0%, #3B82F6 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  lineHeight: 1
                }}
              >
                PAR
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginTop: '4px'
              }}
            >
              <div style={{ width: '16px', height: '2px', background: 'rgba(148, 163, 184, 0.6)' }} />
              <span
                style={{
                  fontSize: '0.66rem',
                  fontWeight: 800,
                  letterSpacing: '4px',
                  color: '#94A3B8',
                  textTransform: 'uppercase'
                }}
              >
                ACADEMY
              </span>
              <div style={{ width: '16px', height: '2px', background: 'rgba(148, 163, 184, 0.6)' }} />
            </div>
          </div>

          {/* Tagline */}
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: '#E2E8F0', fontSize: '0.86rem', fontWeight: 600 }}>Type Today,</div>
            <div style={{ color: '#94A3B8', fontSize: '0.82rem', fontWeight: 500 }}>A Better Tomorrow.</div>
          </div>
        </div>

        {/* Center Main Content Area: Headline + Value Badges + 3D Visual */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative',
            zIndex: 10,
            margin: '28px 0',
            gap: '24px'
          }}
        >
          {/* Left Column: Headlines & Badges */}
          <div style={{ maxWidth: '420px', flex: '1' }}>
            <h1
              style={{
                fontSize: '3.4rem',
                fontWeight: 900,
                lineHeight: 1.06,
                letterSpacing: '-1.5px',
                color: '#FFFFFF',
                margin: '0 0 16px 0'
              }}
            >
              Test.
              <br />
              Practice.
              <br />
              <span
                style={{
                  background: 'linear-gradient(90deg, #00E5FF 0%, #38BDF8 30%, #818CF8 65%, #C084FC 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                Get Faster.
              </span>
            </h1>

            <p
              style={{
                fontSize: '0.94rem',
                color: '#94A3B8',
                lineHeight: 1.55,
                margin: '0 0 28px 0'
              }}
            >
              Improve your typing speed, accuracy and consistency with fun tests and real-time feedback.
            </p>

            {/* 3 Value Proposition Badges */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Badge 1: Real-time Results */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                    boxShadow: '0 4px 14px rgba(124, 58, 237, 0.4)',
                    flexShrink: 0
                  }}
                >
                  <Zap size={18} />
                </div>
                <div>
                  <div style={{ color: '#FFFFFF', fontWeight: 800, fontSize: '0.92rem' }}>
                    Real-time Results
                  </div>
                  <div style={{ color: '#94A3B8', fontSize: '0.8rem' }}>
                    See your WPM, accuracy & more
                  </div>
                </div>
              </div>

              {/* Badge 2: Track Progress */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #2563EB, #0284C7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)',
                    flexShrink: 0
                  }}
                >
                  <BarChart3 size={18} />
                </div>
                <div>
                  <div style={{ color: '#FFFFFF', fontWeight: 800, fontSize: '0.92rem' }}>
                    Track Progress
                  </div>
                  <div style={{ color: '#94A3B8', fontSize: '0.8rem' }}>
                    View your history and analytics
                  </div>
                </div>
              </div>

              {/* Badge 3: Compete */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #C026D3, #7C3AED)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                    boxShadow: '0 4px 14px rgba(192, 38, 211, 0.4)',
                    flexShrink: 0
                  }}
                >
                  <Trophy size={18} />
                </div>
                <div>
                  <div style={{ color: '#FFFFFF', fontWeight: 800, fontSize: '0.92rem' }}>
                    Compete
                  </div>
                  <div style={{ color: '#94A3B8', fontSize: '0.8rem' }}>
                    Challenge yourself on leaderboards
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: 3D Mechanical Keyboard Hero Visual */}
          <div
            style={{
              flex: '1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              maxWidth: '380px'
            }}
          >
            <div
              style={{
                position: 'relative',
                borderRadius: '24px',
                overflow: 'hidden',
                boxShadow: '0 24px 60px rgba(0, 229, 255, 0.18), 0 12px 30px rgba(0,0,0,0.5)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                transition: 'transform 0.3s ease',
                background: 'rgba(15, 23, 42, 0.4)'
              }}
            >
              <img
                src={keyboardHeroImg}
                alt="Mechanical Keyboard with Floating Neon Keycaps"
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                  transform: 'scale(1.02)'
                }}
              />
            </div>
          </div>
        </div>

        {/* Bottom Social Proof Counter Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '48px',
            position: 'relative',
            zIndex: 10,
            paddingTop: '20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          <div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.1 }}>
              500+
            </div>
            <div style={{ fontSize: '0.76rem', color: '#94A3B8', marginTop: '4px' }}>
              Typing Passages
            </div>
          </div>

          <div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.1 }}>
              10K+
            </div>
            <div style={{ fontSize: '0.76rem', color: '#94A3B8', marginTop: '4px' }}>
              Active Users
            </div>
          </div>

          <div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.1 }}>
              99%
            </div>
            <div style={{ fontSize: '0.76rem', color: '#94A3B8', marginTop: '4px' }}>
              Positive Feedback
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* RIGHT AUTH FORM PANEL (CLEAN WHITE MODE) */}
      {/* ========================================================= */}
      <div
        style={{
          flex: '1',
          minHeight: '100vh',
          backgroundColor: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '40px 52px',
          boxSizing: 'border-box',
          position: 'relative',
          overflowY: 'auto'
        }}
        className="auth-form-panel"
      >
        {/* Top Bar: New to TypeMaster & Admin Portal Toggle */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px'
          }}
        >
          {/* Left: Quick Switch Text */}
          <div style={{ fontSize: '0.84rem', color: '#64748B' }}>
            {isAdminMode ? (
              <span style={{ fontWeight: 600, color: '#0F172A' }}>Master Administrator Console</span>
            ) : activeTab === 'register' ? (
              <span>
                Already have an account?{' '}
                <button
                  onClick={() => switchTab('signin')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#2563EB',
                    fontWeight: 700,
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  Sign In
                </button>
              </span>
            ) : (
              <span>
                New to TypeMaster?{' '}
                <button
                  onClick={() => switchTab('register')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#2563EB',
                    fontWeight: 700,
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  Create Account
                </button>
              </span>
            )}
          </div>

          {/* Right: Admin Portal Button */}
          <button
            onClick={() => toggleAdminMode(!isAdminMode)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '999px',
              border: isAdminMode ? '1px solid #3B82F6' : '1px solid #E2E8F0',
              background: isAdminMode ? '#EFF6FF' : '#FFFFFF',
              color: isAdminMode ? '#1D4ED8' : '#0F172A',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              transition: 'all 0.15s'
            }}
          >
            {isAdminMode ? (
              <>
                <User size={15} color="#1D4ED8" />
                <span>User Portal</span>
              </>
            ) : (
              <>
                <Shield size={15} color="#2563EB" />
                <span>Admin Portal</span>
              </>
            )}
          </button>
        </div>

        {/* Center Main Form Card */}
        <div style={{ maxWidth: '440px', width: '100%', margin: '0 auto' }}>
          {/* Brand Header */}
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            {/* Keycap Icon */}
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '16px',
                background: isAdminMode
                  ? 'linear-gradient(135deg, #0F172A, #334155)'
                  : 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                color: '#FFFFFF',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isAdminMode
                  ? '0 8px 20px rgba(15, 23, 42, 0.25)'
                  : '0 8px 20px rgba(37, 99, 235, 0.3)',
                marginBottom: '12px'
              }}
            >
              {isAdminMode ? <ShieldCheck size={28} /> : <Keyboard size={28} />}
            </div>

            <h2
              style={{
                fontSize: '1.75rem',
                fontWeight: 800,
                color: '#0F172A',
                letterSpacing: '-0.4px',
                margin: '0 0 4px 0'
              }}
            >
              {isAdminMode ? 'TypeMaster Admin' : 'TypeMaster'}
            </h2>
            <p style={{ fontSize: '0.84rem', color: '#64748B', margin: 0 }}>
              {isAdminMode
                ? 'Authorized System Administrator Console'
                : 'Speed Typing & Precision Practice Platform'}
            </p>
          </div>

          {/* Database Connection Pill */}
          <div
            style={{
              background: '#ECFDF5',
              border: '1px solid #A7F3D0',
              borderRadius: '12px',
              padding: '9px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Database size={15} color="#059669" />
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#065F46' }}>
                Database: Supabase Cloud
              </span>
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#10B981',
                  display: 'inline-block'
                }}
              />
            </div>

            <button
              type="button"
              onClick={onOpenSupabaseModal}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#047857',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 6px',
                borderRadius: '6px'
              }}
            >
              <RefreshCw size={12} />
              Switch Mode
            </button>
          </div>

          {/* Navigation Tabs (Only shown in User Mode) */}
          {!isAdminMode && (
            <div
              style={{
                display: 'flex',
                borderBottom: '1px solid #E2E8F0',
                marginBottom: '22px'
              }}
            >
              <button
                type="button"
                onClick={() => switchTab('signin')}
                style={{
                  flex: 1,
                  padding: '10px 0',
                  background: 'none',
                  border: 'none',
                  fontSize: '0.88rem',
                  fontWeight: activeTab === 'signin' ? 800 : 600,
                  color: activeTab === 'signin' ? '#2563EB' : '#64748B',
                  borderBottom: activeTab === 'signin' ? '2.5px solid #2563EB' : '2.5px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                Sign In
              </button>

              <button
                type="button"
                onClick={() => switchTab('register')}
                style={{
                  flex: 1,
                  padding: '10px 0',
                  background: 'none',
                  border: 'none',
                  fontSize: '0.88rem',
                  fontWeight: activeTab === 'register' ? 800 : 600,
                  color: activeTab === 'register' ? '#2563EB' : '#64748B',
                  borderBottom: activeTab === 'register' ? '2.5px solid #2563EB' : '2.5px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                Register
              </button>

              <button
                type="button"
                onClick={() => switchTab('guest')}
                style={{
                  flex: 1,
                  padding: '10px 0',
                  background: 'none',
                  border: 'none',
                  fontSize: '0.88rem',
                  fontWeight: activeTab === 'guest' ? 800 : 600,
                  color: activeTab === 'guest' ? '#2563EB' : '#64748B',
                  borderBottom: activeTab === 'guest' ? '2.5px solid #2563EB' : '2.5px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                Guest
              </button>
            </div>
          )}

          {/* Admin Banner (if in Admin Mode) */}
          {isAdminMode && (
            <div
              style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                padding: '10px 14px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              <ShieldCheck size={18} color="#0F172A" />
              <div style={{ fontSize: '0.78rem', color: '#475569', lineHeight: 1.4 }}>
                Enter system administrator credentials. Standard users cannot log into this portal.
              </div>
            </div>
          )}

          {/* Error & Success Messages */}
          {errorMsg && (
            <div
              style={{
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                color: '#DC2626',
                borderRadius: '10px',
                padding: '10px 14px',
                fontSize: '0.82rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                marginBottom: '16px'
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>{errorMsg}</div>
            </div>
          )}

          {successMsg && (
            <div
              style={{
                background: '#ECFDF5',
                border: '1px solid #A7F3D0',
                color: '#059669',
                borderRadius: '10px',
                padding: '10px 14px',
                fontSize: '0.82rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '16px'
              }}
            >
              <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
              <div>{successMsg}</div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 1: SIGN IN (DEFAULT & ADMIN MODE) */}
          {/* ========================================================= */}
          {activeTab === 'signin' && (
            <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Email Address */}
              <div>
                <label style={labelStyle}>
                  {isAdminMode ? 'Admin Email Address' : 'Email Address'}
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail
                    size={17}
                    color="#94A3B8"
                    style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}
                  />
                  <input
                    type="email"
                    required
                    placeholder={isAdminMode ? 'Enter administrator email' : 'Enter your email address'}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ ...labelStyle, marginBottom: 0 }}>
                    {isAdminMode ? 'Admin Password' : 'Password'}
                  </label>
                  {!isAdminMode && (
                    <button
                      type="button"
                      onClick={() => switchTab('forgot')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#2563EB',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: 0
                      }}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>

                <div style={{ position: 'relative' }}>
                  <Lock
                    size={17}
                    color="#94A3B8"
                    style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder={isAdminMode ? 'Enter administrator password' : 'Enter your password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ ...inputStyle, paddingRight: '42px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#94A3B8',
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {/* CTA Button: Enter to TypeMaster -> */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '13px',
                  borderRadius: '12px',
                  border: 'none',
                  background: isAdminMode
                    ? 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)'
                    : 'linear-gradient(90deg, #1D4ED8 0%, #2563EB 100%)',
                  color: '#FFFFFF',
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: isAdminMode
                    ? '0 6px 18px rgba(15, 23, 42, 0.25)'
                    : '0 6px 18px rgba(37, 99, 235, 0.3)',
                  marginTop: '4px',
                  transition: 'transform 0.15s, box-shadow 0.15s'
                }}
              >
                {loading
                  ? 'Authenticating...'
                  : isAdminMode
                  ? 'Access Admin Dashboard →'
                  : 'Enter to TypeMaster →'}
              </button>



              {/* OR Divider & Google Login (Only for User Mode) */}
              {!isAdminMode && (
                <>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      margin: '10px 0',
                      color: '#94A3B8',
                      fontSize: '0.78rem',
                      fontWeight: 700
                    }}
                  >
                    <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }} />
                    <span style={{ padding: '0 12px', letterSpacing: '0.5px' }}>OR</span>
                    <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }} />
                  </div>

                  {/* Google OAuth Button */}
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '11px',
                      borderRadius: '12px',
                      border: '1px solid #E2E8F0',
                      background: '#FFFFFF',
                      color: '#0F172A',
                      fontSize: '0.86rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                    }}
                  >
                    {/* Google SVG Logo */}
                    <svg width="18" height="18" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.9c2.28-2.1 3.645-5.2 3.645-9.15z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.9-3.05c-1.08.72-2.45 1.16-4.03 1.16-3.1 0-5.74-2.1-6.68-4.93H1.28v3.15C3.31 21.36 7.37 24 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.32 14.27c-.24-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.28C.46 8.21 0 10.05 0 12s.46 3.79 1.28 5.42l4.04-3.15z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.77c1.76 0 3.35.61 4.6 1.79l3.45-3.45C17.95 1.19 15.24 0 12 0 7.37 0 3.31 2.64 1.28 6.58l4.04 3.15c.94-2.83 3.58-4.96 6.68-4.96z"
                      />
                    </svg>
                    <span>Login with Google</span>
                  </button>
                </>
              )}
            </form>
          )}

          {/* ========================================================= */}
          {/* TAB 2: REGISTER */}
          {/* ========================================================= */}
          {activeTab === 'register' && !isAdminMode && (
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Full Name */}
              <div>
                <label style={labelStyle}>Full Name</label>
                <div style={{ position: 'relative' }}>
                  <User
                    size={17}
                    color="#94A3B8"
                    style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}
                  />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Hunter"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label style={labelStyle}>Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail
                    size={17}
                    color="#94A3B8"
                    style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}
                  />
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label style={labelStyle}>Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock
                    size={17}
                    color="#94A3B8"
                    style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Create a strong password (min 6 chars)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ ...inputStyle, paddingRight: '42px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#94A3B8',
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label style={labelStyle}>Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock
                    size={17}
                    color="#94A3B8"
                    style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}
                  />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={{ ...inputStyle, paddingRight: '42px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#94A3B8',
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {/* CTA Button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '13px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(90deg, #1D4ED8 0%, #2563EB 100%)',
                  color: '#FFFFFF',
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 6px 18px rgba(37, 99, 235, 0.3)',
                  marginTop: '4px'
                }}
              >
                {loading ? 'Creating Account...' : 'Create Account & Start Typing →'}
              </button>

              {/* Divider & Google */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  margin: '8px 0',
                  color: '#94A3B8',
                  fontSize: '0.78rem',
                  fontWeight: 700
                }}
              >
                <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }} />
                <span style={{ padding: '0 12px' }}>OR</span>
                <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }} />
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '11px',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  background: '#FFFFFF',
                  color: '#0F172A',
                  fontSize: '0.86rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px'
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.9c2.28-2.1 3.645-5.2 3.645-9.15z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.9-3.05c-1.08.72-2.45 1.16-4.03 1.16-3.1 0-5.74-2.1-6.68-4.93H1.28v3.15C3.31 21.36 7.37 24 12 24z" />
                  <path fill="#FBBC05" d="M5.32 14.27c-.24-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.28C.46 8.21 0 10.05 0 12s.46 3.79 1.28 5.42l4.04-3.15z" />
                  <path fill="#EA4335" d="M12 4.77c1.76 0 3.35.61 4.6 1.79l3.45-3.45C17.95 1.19 15.24 0 12 0 7.37 0 3.31 2.64 1.28 6.58l4.04 3.15c.94-2.83 3.58-4.96 6.68-4.96z" />
                </svg>
                <span>Register with Google</span>
              </button>
            </form>
          )}

          {/* ========================================================= */}
          {/* TAB 3: GUEST MODE */}
          {/* ========================================================= */}
          {activeTab === 'guest' && !isAdminMode && (
            <form onSubmit={handleGuestLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div
                style={{
                  background: '#FAF5FF',
                  border: '1px solid #E9D5FF',
                  borderRadius: '12px',
                  padding: '14px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px'
                }}
              >
                <Sparkles size={18} color="#9333EA" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '0.82rem', color: '#6B21A8', lineHeight: 1.5 }}>
                  Practice typing instantly without registration. Your speed, accuracy, and test review
                  analytics will be tracked live for your active session.
                </div>
              </div>

              <div>
                <label style={labelStyle}>Choose a Typist Nickname</label>
                <div style={{ position: 'relative' }}>
                  <User
                    size={17}
                    color="#94A3B8"
                    style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}
                  />
                  <input
                    type="text"
                    placeholder="e.g. SwiftTypist"
                    value={guestNickname}
                    onChange={(e) => setGuestNickname(e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '13px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)',
                  color: '#FFFFFF',
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 6px 18px rgba(124, 58, 237, 0.35)',
                  marginTop: '4px'
                }}
              >
                {loading ? 'Starting Session...' : 'Start As Guest Typist →'}
              </button>
            </form>
          )}

          {/* ========================================================= */}
          {/* TAB 4: FORGOT PASSWORD */}
          {/* ========================================================= */}
          {activeTab === 'forgot' && !isAdminMode && (
            <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ fontSize: '0.84rem', color: '#64748B', lineHeight: 1.5, margin: 0 }}>
                Enter your registered email address and we will send you secure instructions to reset your password.
              </p>

              <div>
                <label style={labelStyle}>Registered Email</label>
                <div style={{ position: 'relative' }}>
                  <Mail
                    size={17}
                    color="#94A3B8"
                    style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}
                  />
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '13px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(90deg, #1D4ED8 0%, #2563EB 100%)',
                  color: '#FFFFFF',
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Sending Link...' : 'Send Password Reset Link →'}
              </button>

              <button
                type="button"
                onClick={() => switchTab('signin')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748B',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                ← Back to Sign In
              </button>
            </form>
          )}
        </div>

        {/* Footer Policy text */}
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <p style={{ fontSize: '0.74rem', color: '#94A3B8', margin: 0 }}>
            By continuing, you agree to our{' '}
            <span style={{ color: '#2563EB', fontWeight: 600, cursor: 'pointer' }}>Terms of Service</span> and{' '}
            <span style={{ color: '#2563EB', fontWeight: 600, cursor: 'pointer' }}>Privacy Policy</span>.
          </p>
        </div>
      </div>
    </div>
  );
}

const labelStyle = {
  display: 'block',
  fontSize: '0.8rem',
  fontWeight: 700,
  color: '#0F172A',
  marginBottom: '6px'
};

const inputStyle = {
  width: '100%',
  padding: '11px 14px 11px 40px',
  borderRadius: '10px',
  border: '1px solid #E2E8F0',
  fontSize: '0.86rem',
  color: '#0F172A',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s, box-shadow 0.15s'
};
