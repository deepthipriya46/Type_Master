import React, { useState } from 'react';
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
  KeyRound,
  FileSpreadsheet
} from 'lucide-react';
import { supabaseService } from '../services/supabaseService';

export default function LoginView({
  onLoginSuccess,
  onCancel,
  onOpenSupabaseModal,
  supabaseConnected,
  initialPortal = 'user'
}) {
  const [portalChoice, setPortalChoice] = useState(initialPortal); // 'user' or 'admin'
  const [mode, setMode] = useState('signin'); // 'signin', 'signup', 'guest', 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [guestName, setGuestName] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');



  const handleSignIn = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await supabaseService.signIn(email, password);
      if (res.success) {
        if (portalChoice === 'admin') {
          // Enforce Role-Based Access Control
          if (res.user.role === 'admin' || res.user.email === 'admin@typemaster.com') {
            onLoginSuccess(res.user, 'admin');
          } else {
            await supabaseService.signOut();
            setErrorMsg('Access Denied: This account is registered as a standard user ("role: user"). Only accounts with administrative privileges can access the Admin Portal.');
          }
        } else {
          onLoginSuccess(res.user, 'user');
        }
      } else {
        setErrorMsg(res.message || 'Failed to sign in.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!email || !password || !username) {
      setErrorMsg('Please fill in all fields (username, email, and password).');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password should be at least 6 characters.');
      return;
    }
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await supabaseService.signUp(email, password, username);
      if (res.success) {
        onLoginSuccess(res.user, 'user');
      } else {
        setErrorMsg(res.message || 'Failed to create account.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const name = guestName.trim() || 'Typist_' + Math.floor(1000 + Math.random() * 9000);
      const res = await supabaseService.signInGuest(name);
      if (res.success) {
        onLoginSuccess(res.user, 'user');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg('Please enter your email address to receive password reset instructions.');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    try {
      const res = await supabaseService.resetPasswordForEmail(email);
      if (res.success) {
        setSuccessMsg(res.message);
      } else {
        setErrorMsg(res.message || 'Failed to send reset link.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'An unexpected error occurred during password recovery.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        background: 'radial-gradient(circle at 15% 15%, #182859 0%, #0c183f 50%, #070e28 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Background glowing decorations */}
      <div
        style={{
          position: 'absolute',
          top: '-10%',
          right: '5%',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.22) 0%, transparent 70%)',
          pointerEvents: 'none'
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-10%',
          left: '5%',
          width: '450px',
          height: '450px',
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)',
          pointerEvents: 'none'
        }}
      />

      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          background: 'rgba(255, 255, 255, 0.98)',
          borderRadius: '24px',
          padding: '36px 32px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.35)',
          position: 'relative',
          zIndex: 10
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '16px',
              background: portalChoice === 'admin'
                ? 'linear-gradient(135deg, #1E293B, #0F172A)'
                : 'linear-gradient(135deg, #2563eb, #7c3aed)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: portalChoice === 'admin'
                ? '0 8px 20px rgba(15, 23, 42, 0.35)'
                : '0 8px 20px rgba(37, 99, 235, 0.35)',
              marginBottom: '10px',
              transition: 'all 0.25s'
            }}
          >
            {portalChoice === 'admin' ? <Shield size={26} color="#818CF8" /> : <Keyboard size={26} />}
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#111e38', letterSpacing: '-0.4px', margin: 0 }}>
            TypeMaster
          </h1>
          <p style={{ fontSize: '0.84rem', color: '#64748b', marginTop: '4px', marginBottom: 0 }}>
            {portalChoice === 'admin'
              ? 'Administrator Command & Analytics Center'
              : 'Speed Typing & Precision Practice Platform'}
          </p>
        </div>

        {/* Dual Portal Choice Cards (Section 1 Requirement) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '10px',
            marginBottom: '18px'
          }}
        >
          {/* User Portal Card */}
          <button
            type="button"
            onClick={() => {
              setPortalChoice('user');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            style={{
              padding: '12px 14px',
              borderRadius: '12px',
              border: portalChoice === 'user' ? '2px solid #2563EB' : '1px solid #E2E8F0',
              background: portalChoice === 'user' ? '#EFF6FF' : '#F8FAFC',
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              transition: 'all 0.15s ease'
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: portalChoice === 'user' ? '#2563EB' : '#E2E8F0',
                color: portalChoice === 'user' ? '#FFFFFF' : '#64748B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <User size={17} />
            </div>
            <div>
              <div style={{ fontSize: '0.84rem', fontWeight: 800, color: portalChoice === 'user' ? '#1E40AF' : '#1E293B' }}>
                User Portal
              </div>
              <div style={{ fontSize: '0.68rem', color: '#64748B' }}>
                Typing & Tests
              </div>
            </div>
          </button>

          {/* Admin Portal Card */}
          <button
            type="button"
            onClick={() => {
              setPortalChoice('admin');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            style={{
              padding: '12px 14px',
              borderRadius: '12px',
              border: portalChoice === 'admin' ? '2px solid #4F46E5' : '1px solid #E2E8F0',
              background: portalChoice === 'admin' ? '#EEF2FF' : '#F8FAFC',
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              transition: 'all 0.15s ease'
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: portalChoice === 'admin' ? '#4F46E5' : '#E2E8F0',
                color: portalChoice === 'admin' ? '#FFFFFF' : '#64748B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <ShieldCheck size={18} />
            </div>
            <div>
              <div style={{ fontSize: '0.84rem', fontWeight: 800, color: portalChoice === 'admin' ? '#4338CA' : '#1E293B' }}>
                Admin Portal
              </div>
              <div style={{ fontSize: '0.68rem', color: '#64748B' }}>
                Platform Control
              </div>
            </div>
          </button>
        </div>

        {/* Database Status Indicator */}
        <div
          onClick={onOpenSupabaseModal}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: supabaseConnected ? '#ecfdf5' : '#f8fafc',
            border: `1px solid ${supabaseConnected ? '#a7f3d0' : '#e2e8f0'}`,
            padding: '7px 12px',
            borderRadius: '10px',
            marginBottom: '18px',
            cursor: 'pointer'
          }}
          title="Click to configure database settings"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={14} color={supabaseConnected ? '#059669' : '#64748b'} />
            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: supabaseConnected ? '#065f46' : '#334155' }}>
              {supabaseConnected ? 'Database: Supabase Cloud 🟢' : 'Database: Local Offline ⚡'}
            </span>
          </div>
          <span style={{ fontSize: '0.7rem', color: '#2563eb', fontWeight: 600 }}>Switch Mode</span>
        </div>

        {/* Error / Success Notifications */}
        {errorMsg && (
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              borderRadius: '10px',
              padding: '10px 14px',
              fontSize: '0.78rem',
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
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              color: '#065f46',
              borderRadius: '10px',
              padding: '10px 14px',
              fontSize: '0.78rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px'
            }}
          >
            <CheckCircle2 size={16} />
            <div>{successMsg}</div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PORTAL VIEW: ADMIN AUTHENTICATION */}
        {/* ======================================================== */}
        {portalChoice === 'admin' ? (
          <div>
            {/* RBAC Notice Banner */}
            <div
              style={{
                background: '#0F172A',
                color: '#E2E8F0',
                borderRadius: '10px',
                padding: '10px 14px',
                fontSize: '0.76rem',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={16} color="#818CF8" />
                <span>
                  Admin Role Required (<code style={{ color: '#A5B4FC' }}>role: admin</code>)
                </span>
              </div>
            </div>

            <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700 }}>
                  Admin Email
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    className="form-input"
                    style={{ width: '100%', paddingLeft: '38px', fontSize: '0.86rem' }}
                    placeholder="admin@typemaster.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <Mail size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '13px' }} />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700 }}>
                  Admin Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    style={{ width: '100%', paddingLeft: '38px', paddingRight: '38px', fontSize: '0.86rem' }}
                    placeholder="Enter admin password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <Lock size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '13px' }} />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '12px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#94a3b8'
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '13px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #1E293B, #0F172A)',
                  color: '#ffffff',
                  border: '1px solid #334155',
                  fontWeight: 800,
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginTop: '8px',
                  boxShadow: '0 4px 14px rgba(15, 23, 42, 0.4)'
                }}
              >
                {loading ? 'Authenticating Admin...' : 'Authenticate & Enter Admin Portal'}
                <ArrowRight size={16} />
              </button>
            </form>


          </div>
        ) : (
          /* ======================================================== */
          /* PORTAL VIEW: USER AUTHENTICATION */
          /* ======================================================== */
          <div>
            {/* User Tab Switcher (Sign In / Register / Guest) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                background: '#f1f5f9',
                padding: '4px',
                borderRadius: '12px',
                marginBottom: '18px'
              }}
            >
              <button
                type="button"
                onClick={() => { setMode('signin'); setErrorMsg(''); setSuccessMsg(''); }}
                style={{
                  padding: '8px 0',
                  border: 'none',
                  background: mode === 'signin' ? '#ffffff' : 'transparent',
                  borderRadius: '9px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: mode === 'signin' ? '#1e293b' : '#64748b',
                  boxShadow: mode === 'signin' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                  cursor: 'pointer'
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setMode('signup'); setErrorMsg(''); setSuccessMsg(''); }}
                style={{
                  padding: '8px 0',
                  border: 'none',
                  background: mode === 'signup' ? '#ffffff' : 'transparent',
                  borderRadius: '9px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: mode === 'signup' ? '#1e293b' : '#64748b',
                  boxShadow: mode === 'signup' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                  cursor: 'pointer'
                }}
              >
                Register
              </button>
              <button
                type="button"
                onClick={() => { setMode('guest'); setErrorMsg(''); setSuccessMsg(''); }}
                style={{
                  padding: '8px 0',
                  border: 'none',
                  background: mode === 'guest' ? '#ffffff' : 'transparent',
                  borderRadius: '9px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: mode === 'guest' ? '#1e293b' : '#64748b',
                  boxShadow: mode === 'guest' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                  cursor: 'pointer'
                }}
              >
                Guest
              </button>
            </div>

            {/* User Sign In */}
            {mode === 'signin' && (
              <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Email Address</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="email"
                      className="form-input"
                      style={{ width: '100%', paddingLeft: '38px' }}
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    <Mail size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '13px' }} />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="form-label" style={{ marginBottom: '6px' }}>Password</label>
                    <button
                      type="button"
                      onClick={() => { setMode('forgot'); setErrorMsg(''); setSuccessMsg(''); }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#2563eb',
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Forgot?
                    </button>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="form-input"
                      style={{ width: '100%', paddingLeft: '38px', paddingRight: '38px' }}
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <Lock size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '13px' }} />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '12px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#94a3b8'
                      }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '13px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.92rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    marginTop: '8px',
                    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)'
                  }}
                >
                  {loading ? 'Entering...' : 'Enter User Portal'}
                  <ArrowRight size={16} />
                </button>
              </form>
            )}

            {/* User Register */}
            {mode === 'signup' && (
              <form onSubmit={handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Full Name / Display Name</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      className="form-input"
                      style={{ width: '100%', paddingLeft: '38px' }}
                      placeholder="e.g. Priya Sharma"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                    <User size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '13px' }} />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Email Address</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="email"
                      className="form-input"
                      style={{ width: '100%', paddingLeft: '38px' }}
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    <Mail size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '13px' }} />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Password (min 6 chars)</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="form-input"
                      style={{ width: '100%', paddingLeft: '38px', paddingRight: '38px' }}
                      placeholder="Create password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <Lock size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '13px' }} />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '12px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#94a3b8'
                      }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '13px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.92rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    marginTop: '8px',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)'
                  }}
                >
                  {loading ? 'Creating Account...' : 'Create Account & Start Typing'}
                  <ArrowRight size={16} />
                </button>
              </form>
            )}

            {/* Guest Mode */}
            {mode === 'guest' && (
              <form onSubmit={handleGuestLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <p style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
                  Practice typing instantly without entering an email or password.
                </p>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Nickname</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      className="form-input"
                      style={{ width: '100%', paddingLeft: '38px' }}
                      placeholder="e.g. SwiftTypist"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                    />
                    <Sparkles size={16} color="#f59e0b" style={{ position: 'absolute', left: '12px', top: '13px' }} />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '13px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.92rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    marginTop: '8px',
                    boxShadow: '0 4px 14px rgba(124, 58, 237, 0.35)'
                  }}
                >
                  {loading ? 'Entering...' : 'Start As Guest Typist'}
                  <ArrowRight size={16} />
                </button>
              </form>
            )}

            {/* Forgot Password */}
            {mode === 'forgot' && (
              <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>
                  Enter your email address to receive password reset instructions.
                </p>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '10px',
                    background: '#2563eb',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  Back to Sign In
                </button>
              </form>
            )}
          </div>
        )}

        {/* Cancel / Return option */}
        {onCancel && (
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <button
              type="button"
              onClick={onCancel}
              style={{
                background: 'none',
                border: 'none',
                color: '#64748b',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Back to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
