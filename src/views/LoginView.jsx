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
  EyeOff
} from 'lucide-react';
import { supabaseService } from '../services/supabaseService';

export default function LoginView({ onLoginSuccess, onCancel, onOpenSupabaseModal, supabaseConnected }) {
  const [mode, setMode] = useState('signin'); // 'signin', 'signup', 'guest'
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
        setSuccessMsg('Signed in successfully! Loading real-time stats...');
        setTimeout(() => {
          onLoginSuccess(res.user);
        }, 600);
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
        setSuccessMsg('Account created successfully! Real-time workspace ready.');
        setTimeout(() => {
          onLoginSuccess(res.user);
        }, 600);
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
        onLoginSuccess(res.user);
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
          maxWidth: '460px',
          background: 'rgba(255, 255, 255, 0.98)',
          borderRadius: '24px',
          padding: '40px 36px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.35)',
          position: 'relative',
          zIndex: 10
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 8px 20px rgba(37, 99, 235, 0.35)',
              marginBottom: '12px'
            }}
          >
            <Keyboard size={28} />
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#111e38', letterSpacing: '-0.4px' }}>
            TypeMaster
          </h1>
          <p style={{ fontSize: '0.86rem', color: '#64748b', marginTop: '4px' }}>
            Real-Time Speed Testing & Analytics Platform
          </p>
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
            padding: '8px 14px',
            borderRadius: '12px',
            marginBottom: '20px',
            cursor: 'pointer'
          }}
          title="Click to configure Supabase"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={15} color={supabaseConnected ? '#059669' : '#64748b'} />
            <span style={{ fontSize: '0.76rem', fontWeight: 700, color: supabaseConnected ? '#065f46' : '#334155' }}>
              {supabaseConnected ? 'Connected to Supabase PostgreSQL' : 'Local Realtime Engine (Click to link Supabase)'}
            </span>
          </div>
          <span style={{ fontSize: '0.72rem', color: '#2563eb', fontWeight: 600 }}>Configure</span>
        </div>

        {/* Tab Switcher */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            background: '#f1f5f9',
            padding: '4px',
            borderRadius: '12px',
            marginBottom: '22px'
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
              fontSize: '0.84rem',
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
              fontSize: '0.84rem',
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
              fontSize: '0.84rem',
              fontWeight: 700,
              color: mode === 'guest' ? '#1e293b' : '#64748b',
              boxShadow: mode === 'guest' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              cursor: 'pointer'
            }}
          >
            Guest
          </button>
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
              fontSize: '0.8rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px'
            }}
          >
            <AlertCircle size={16} />
            {errorMsg}
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
              fontSize: '0.8rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px'
            }}
          >
            <CheckCircle2 size={16} />
            {successMsg}
          </div>
        )}

        {/* Sign In Form */}
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
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  style={{ width: '100%', paddingLeft: '38px', paddingRight: '38px' }}
                  placeholder="••••••••"
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

            {/* Forgot Password Link */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-4px' }}>
              <button
                type="button"
                onClick={() => { setMode('forgot'); setErrorMsg(''); setSuccessMsg(''); }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: '#2563eb',
                  cursor: 'pointer',
                  padding: '2px 0'
                }}
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '13px',
                borderRadius: '12px',
                background: '#2563eb',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.92rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '6px',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)'
              }}
            >
              {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
              <ArrowRight size={16} />
            </button>
          </form>
        )}

        {/* Forgot Password Recovery Form */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ textAlign: 'center', marginBottom: '6px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1e293b' }}>
                Recover Your Password
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                Enter your account email to receive reset instructions.
              </p>
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

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '13px',
                borderRadius: '12px',
                background: '#2563eb',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.92rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '6px',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)'
              }}
            >
              {loading ? 'Sending Recovery Link...' : 'Send Password Reset Link'}
              <ArrowRight size={16} />
            </button>

            <button
              type="button"
              onClick={() => { setMode('signin'); setErrorMsg(''); setSuccessMsg(''); }}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '0.84rem',
                fontWeight: 700,
                color: '#64748b',
                cursor: 'pointer',
                padding: '8px 0',
                textAlign: 'center'
              }}
            >
              ← Back to Sign In
            </button>
          </form>
        )}

        {/* Register Form */}
        {mode === 'signup' && (
          <form onSubmit={handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Username / Display Name</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="form-input"
                  style={{ width: '100%', paddingLeft: '38px' }}
                  placeholder="Your Name (e.g. John Doe)"
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
              <label className="form-label">Password (min 6 characters)</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  style={{ width: '100%', paddingLeft: '38px' }}
                  placeholder="Create secure password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Lock size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '13px' }} />
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
                marginTop: '10px',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)'
              }}
            >
              {loading ? 'Creating Profile...' : 'Create Real-Time Account'}
              <ArrowRight size={16} />
            </button>
          </form>
        )}

        {/* Instant Guest / Demo Mode */}
        {mode === 'guest' && (
          <form onSubmit={handleGuestLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: 1.4 }}>
              Jump straight into typing speed tests without registration. All tests, WPM records, streaks, and achievements will be tracked in real-time for your session.
            </p>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Choose a Nickname</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="form-input"
                  style={{ width: '100%', paddingLeft: '38px' }}
                  placeholder="e.g. SwiftKey"
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
                marginTop: '10px',
                boxShadow: '0 4px 14px rgba(124, 58, 237, 0.35)'
              }}
            >
              {loading ? 'Entering...' : 'Start As Guest Typist'}
              <ArrowRight size={16} />
            </button>
          </form>
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
