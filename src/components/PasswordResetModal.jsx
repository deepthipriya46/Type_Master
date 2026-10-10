import React, { useState } from 'react';
import { KeyRound, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, X, ShieldCheck } from 'lucide-react';
import { supabaseService } from '../services/supabaseService';

export default function PasswordResetModal({ isOpen, onClose, userEmail, onSuccess }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!newPassword || newPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please verify both fields.');
      return;
    }

    setLoading(true);
    try {
      const res = await supabaseService.updatePassword(newPassword);
      if (res.success) {
        setSuccessMsg('Your password has been successfully updated! You can now log in with it anytime.');
        sessionStorage.removeItem('typemaster_recovery_mode');
        
        // Clean URL hash tokens so user is on a clean URL
        if (typeof window !== 'undefined' && window.history?.replaceState) {
          window.history.replaceState(null, '', '/dashboard');
        }

        setTimeout(() => {
          if (onSuccess) onSuccess();
          if (onClose) onClose();
        }, 1500);
      } else {
        setErrorMsg(res.message || 'Failed to update password. Please try again.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error occurred while updating password.');
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    sessionStorage.removeItem('typemaster_recovery_mode');
    if (typeof window !== 'undefined' && window.history?.replaceState) {
      window.history.replaceState(null, '', '/dashboard');
    }
    if (onClose) onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(6, 11, 25, 0.78)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px'
      }}
    >
      <div
        style={{
          background: 'var(--card-bg, #ffffff)',
          color: 'var(--text-primary, #0f172a)',
          borderRadius: '20px',
          maxWidth: '460px',
          width: '100%',
          padding: '32px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
          border: '1px solid var(--card-border, #e2e8f0)',
          position: 'relative',
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
        }}
      >
        {/* Dismiss Button */}
        <button
          onClick={handleDismiss}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted, #94a3b8)',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Close"
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div style={{ textAlign: 'center', marginBottom: '22px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              color: '#ffffff',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(37, 99, 235, 0.35)',
              marginBottom: '14px'
            }}
          >
            <KeyRound size={28} />
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--text-primary, #0f172a)' }}>
            Set Your New Password
          </h2>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary, #64748b)', margin: 0, lineHeight: 1.5 }}>
            You're authenticated via your email link. Choose a new password below to update your account credentials.
          </p>
          {userEmail && (
            <div style={{ marginTop: '8px', fontSize: '0.78rem', color: '#2563eb', fontWeight: 600 }}>
              Account: {userEmail}
            </div>
          )}
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
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
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <div>{errorMsg}</div>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div
            style={{
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
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

        {/* Password Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: 700,
                color: 'var(--text-primary, #0f172a)',
                marginBottom: '6px'
              }}
            >
              New Password (min 6 characters)
            </label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={17}
                color="#94a3b8"
                style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 42px 12px 40px',
                  borderRadius: '10px',
                  border: '1px solid var(--input-border, #cbd5e1)',
                  background: 'var(--input-bg, #ffffff)',
                  color: 'var(--text-primary, #0f172a)',
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
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
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: 700,
                color: 'var(--text-primary, #0f172a)',
                marginBottom: '6px'
              }}
            >
              Confirm New Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={17}
                color="#94a3b8"
                style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 42px 12px 40px',
                  borderRadius: '10px',
                  border: '1px solid var(--input-border, #cbd5e1)',
                  background: 'var(--input-bg, #ffffff)',
                  color: 'var(--text-primary, #0f172a)',
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
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
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          {/* Submit CTA */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '13px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(90deg, #1d4ed8 0%, #2563eb 100%)',
              color: '#ffffff',
              fontSize: '0.92rem',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 6px 18px rgba(37, 99, 235, 0.3)',
              marginTop: '6px'
            }}
          >
            <ShieldCheck size={18} />
            <span>{loading ? 'Saving New Password...' : 'Save New Password & Continue'}</span>
          </button>

          {/* Skip / Dismiss button */}
          <button
            type="button"
            onClick={handleDismiss}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted, #64748b)',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              textAlign: 'center',
              padding: '4px'
            }}
          >
            Skip for now (Update anytime in Settings)
          </button>
        </form>
      </div>
    </div>
  );
}
