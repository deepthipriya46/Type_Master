import React, { useState, useEffect } from 'react';
import {
  Database,
  Volume2,
  User,
  CheckCircle2,
  Sun,
  Moon,
  Laptop,
  Bell,
  Lock,
  Flame,
  Award,
  Eye,
  EyeOff,
  Trash2
} from 'lucide-react';
import { supabaseService } from '../services/supabaseService';
import { soundSynth } from '../services/soundSynthesizer';

const PRESET_AVATARS = [
  'https://api.dicebear.com/7.x/bottts/svg?seed=TypeMaster',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix',
  'https://api.dicebear.com/7.x/pixel-art/svg?seed=Gamer',
  'https://api.dicebear.com/7.x/lorelei/svg?seed=ProTypist',
  'https://api.dicebear.com/7.x/micah/svg?seed=Speedster',
  'https://api.dicebear.com/7.x/shapes/svg?seed=Matrix'
];

export default function SettingsView({
  user,
  onUserUpdate,
  onOpenSupabaseModal,
  supabaseConnected,
  theme = 'system',
  onThemeChange
}) {
  // Account Profile States
  const [username, setUsername] = useState(user?.username || 'Typist');
  const [email, setEmail] = useState(user?.email || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || PRESET_AVATARS[0]);
  const [isPremium, setIsPremium] = useState(Boolean(user?.is_premium));

  // Security & Password States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Notification Preferences States
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem('typemaster_notifications');
      return saved ? JSON.parse(saved) : { dailyStreak: true, achievements: true, sounds: true };
    } catch {
      return { dailyStreak: true, achievements: true, sounds: true };
    }
  });

  // Sound Synthesizer State
  const [soundType, setSoundType] = useState(() => soundSynth.switchType || 'blue');
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Sync props when user changes
  useEffect(() => {
    if (user) {
      if (user.username) setUsername(user.username);
      if (user.email) setEmail(user.email);
      if (user.avatar_url) setAvatarUrl(user.avatar_url);
      if (user.is_premium !== undefined) setIsPremium(Boolean(user.is_premium));
    }
  }, [user]);

  // Save Account Profile
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    await supabaseService.updateUserProfile({
      username,
      avatar_url: avatarUrl,
      email
    });
    await supabaseService.setUserTier(isPremium);
    if (onUserUpdate) onUserUpdate();
    setProfileSuccess(true);
    setTimeout(() => setProfileSuccess(false), 2500);
  };

  // Change Password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword.length < 6) {
      setPasswordMsg({ error: true, text: 'New password must be at least 6 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ error: true, text: 'New passwords do not match. Please verify.' });
      return;
    }

    setPasswordLoading(true);
    const res = await supabaseService.updatePassword(newPassword);
    setPasswordLoading(false);

    if (res.success) {
      setPasswordMsg({ error: false, text: 'Password successfully updated!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordMsg(null), 3000);
    } else {
      setPasswordMsg({ error: true, text: res.message || 'Failed to update password.' });
    }
  };

  // Toggle Notification
  const handleToggleNotification = (key) => {
    const updated = { ...notifications, [key]: !notifications[key] };
    setNotifications(updated);
    localStorage.setItem('typemaster_notifications', JSON.stringify(updated));
  };

  // Reset Performance Data
  const handleResetData = async () => {
    if (window.confirm('Are you sure you want to completely clear and reset all your test logs, streaks, performance stats, and achievements to 0?')) {
      await supabaseService.clearCurrentUserData();
      if (onUserUpdate) onUserUpdate();
      setResetSuccess(true);
      setTimeout(() => setResetSuccess(false), 3000);
    }
  };

  // Play Switch Acoustic Test
  const testAudio = () => {
    soundSynth.setEnabled(true);
    soundSynth.setSwitchType(soundType);
    soundSynth.playKeySound();
    setTimeout(() => soundSynth.playBackspaceSound(), 140);
  };

  return (
    <div className="page-container">
      {/* Top Greeting Header */}
      <div className="greeting-header">
        <div className="greeting-text">
          <h1>Application Settings</h1>
          <p>Manage your account profile, visual themes, notifications, and Supabase integration.</p>
        </div>
      </div>

      {/* 4-Column Responsive Settings Grid */}
      <div className="settings-grid">
        
        {/* ==================================================== */}
        {/* 1. ACCOUNT PROFILE & SECURITY (Spans 2 columns) */}
        {/* ==================================================== */}
        <div className="dashboard-card settings-col-span-2" style={{ padding: '24px' }}>
          <div className="card-header-row" style={{ marginBottom: '18px' }}>
            <div className="card-title-group">
              <User size={19} color="#2563eb" />
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Account Profile</h3>
            </div>
            {profileSuccess && (
              <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px' }}>
                <CheckCircle2 size={16} /> Profile Changes Saved!
              </span>
            )}
          </div>

          <form onSubmit={handleSaveProfile}>
            {/* Avatar Preview & Chooser */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '18px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative' }}>
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  style={{
                    width: '68px',
                    height: '68px',
                    borderRadius: '50%',
                    background: '#6366f1',
                    border: '3px solid #2563eb',
                    objectFit: 'cover'
                  }}
                  onError={(e) => {
                    e.target.src = PRESET_AVATARS[0];
                  }}
                />
              </div>

              <div>
                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                  Select Preset Avatar or Custom URL
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {PRESET_AVATARS.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAvatarUrl(p)}
                      style={{
                        padding: '2px',
                        borderRadius: '50%',
                        border: avatarUrl === p ? '2px solid #2563eb' : '1px solid #cbd5e1',
                        background: '#f8fafc',
                        cursor: 'pointer',
                        transition: 'transform 0.15s'
                      }}
                    >
                      <img src={p} alt="Preset" style={{ width: '32px', height: '32px', borderRadius: '50%', display: 'block' }} />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Display Name & Email Address */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Display Name / Username</label>
                <input
                  type="text"
                  className="form-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Typist Username"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                />
              </div>
            </div>

            {/* Custom Avatar URL & Membership Tier */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Custom Avatar Image URL</label>
                <input
                  type="text"
                  className="form-input"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://api.dicebear.com/..."
                />
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Membership Tier</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.86rem', color: 'var(--text-primary)' }}>
                    <input
                      type="radio"
                      name="tier"
                      checked={!isPremium}
                      onChange={() => setIsPremium(false)}
                    />
                    <span>Standard Typist</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.86rem', fontWeight: 700, color: '#7c3aed' }}>
                    <input
                      type="radio"
                      name="tier"
                      checked={isPremium}
                      onChange={() => setIsPremium(true)}
                    />
                    <span>👑 Premium Active</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Save Profile Button */}
            <button
              type="submit"
              style={{
                padding: '10px 22px',
                borderRadius: '10px',
                background: '#2563eb',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(37,99,235,0.25)',
                transition: 'all 0.15s ease'
              }}
            >
              Save Profile Changes
            </button>
          </form>

          {/* Security & Password Section */}
          <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--card-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Lock size={18} color="#7c3aed" />
              <h4 style={{ fontSize: '0.96rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Security & Password
              </h4>
            </div>

            <form onSubmit={handleChangePassword}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Current Password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">New Password (min 6 chars)</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Confirm New Password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {passwordMsg && (
                <div
                  style={{
                    marginTop: '12px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    background: passwordMsg.error ? '#fef2f2' : '#ecfdf5',
                    color: passwordMsg.error ? '#991b1b' : '#065f46',
                    border: `1px solid ${passwordMsg.error ? '#fecaca' : '#a7f3d0'}`
                  }}
                >
                  {passwordMsg.text}
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '16px' }}>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '9px',
                    background: '#7c3aed',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.86rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(124,58,237,0.25)'
                  }}
                >
                  {passwordLoading ? 'Updating...' : 'Update Password'}
                </button>

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '0.82rem',
                    color: '#64748b',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  {showPassword ? 'Hide Passwords' : 'Show Passwords'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* ==================================================== */}
        {/* 2. APPEARANCE & THEME (Spans 1 column) */}
        {/* ==================================================== */}
        <div className="dashboard-card settings-col-span-1" style={{ padding: '24px' }}>
          <div className="card-header-row" style={{ marginBottom: '12px' }}>
            <div className="card-title-group">
              <Sun size={19} color="#f59e0b" />
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Appearance & Theme</h3>
            </div>
          </div>

          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '18px', lineHeight: 1.5 }}>
            Customize the visual style of your typing interface to match your preferences.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            {/* Light Option */}
            <div
              onClick={() => onThemeChange && onThemeChange('light')}
              style={{
                border: theme === 'light' ? '2px solid #2563eb' : '1px solid var(--card-border)',
                background: '#ffffff',
                borderRadius: '12px',
                padding: '16px 8px',
                textAlign: 'center',
                cursor: 'pointer',
                boxShadow: theme === 'light' ? '0 4px 12px rgba(37,99,235,0.2)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ color: '#f59e0b', marginBottom: '8px' }}>
                <Sun size={24} style={{ margin: '0 auto' }} />
              </div>
              <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#1e293b' }}>Light</div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>Crisp Bright</div>
            </div>

            {/* Dark Option (Deep Navy) */}
            <div
              onClick={() => onThemeChange && onThemeChange('dark')}
              style={{
                border: theme === 'dark' ? '2px solid #38bdf8' : '1px solid var(--card-border)',
                background: '#0b0f19',
                borderRadius: '12px',
                padding: '16px 8px',
                textAlign: 'center',
                cursor: 'pointer',
                boxShadow: theme === 'dark' ? '0 4px 14px rgba(56,189,248,0.35)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ color: '#38bdf8', marginBottom: '8px' }}>
                <Moon size={24} style={{ margin: '0 auto' }} />
              </div>
              <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#f8fafc' }}>Dark</div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px' }}>Deep Navy</div>
            </div>

            {/* System Option */}
            <div
              onClick={() => onThemeChange && onThemeChange('system')}
              style={{
                border: theme === 'system' ? '2px solid #8b5cf6' : '1px solid var(--card-border)',
                background: 'linear-gradient(135deg, #ffffff 50%, #0b0f19 50%)',
                borderRadius: '12px',
                padding: '16px 8px',
                textAlign: 'center',
                cursor: 'pointer',
                boxShadow: theme === 'system' ? '0 4px 12px rgba(139,92,246,0.25)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ color: '#8b5cf6', marginBottom: '8px' }}>
                <Laptop size={24} style={{ margin: '0 auto' }} />
              </div>
              <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#1e293b' }}>System</div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>Auto Match</div>
            </div>
          </div>
        </div>

        {/* ==================================================== */}
        {/* 3. NOTIFICATIONS & ALERTS (Spans 1 column) */}
        {/* ==================================================== */}
        <div className="dashboard-card settings-col-span-1" style={{ padding: '24px' }}>
          <div className="card-header-row" style={{ marginBottom: '12px' }}>
            <div className="card-title-group">
              <Bell size={19} color="#10b981" />
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Notifications & Alerts</h3>
            </div>
          </div>

          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '18px', lineHeight: 1.5 }}>
            Stay motivated with milestone notifications, streak alerts, and audio chimes.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Daily Streak Alerts */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '11px 13px',
                borderRadius: '10px',
                background: 'var(--bg-app)',
                border: '1px solid var(--card-border)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Flame size={18} color="#f97316" />
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Daily Streak Alerts
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Notify when consecutive daily practice is preserved
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={notifications.dailyStreak}
                onChange={() => handleToggleNotification('dailyStreak')}
                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#2563eb' }}
              />
            </div>

            {/* Achievement Milestone Popups */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '11px 13px',
                borderRadius: '10px',
                background: 'var(--bg-app)',
                border: '1px solid var(--card-border)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Award size={18} color="#8b5cf6" />
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Achievement Milestone Popups
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Celebrate unlocked badges and speed awards
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={notifications.achievements}
                onChange={() => handleToggleNotification('achievements')}
                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#2563eb' }}
              />
            </div>

            {/* Acoustic Completion Chime */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '11px 13px',
                borderRadius: '10px',
                background: 'var(--bg-app)',
                border: '1px solid var(--card-border)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Volume2 size={18} color="#3b82f6" />
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Acoustic Completion Chime
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Play celebratory 4-note chime when test finishes
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={notifications.sounds}
                onChange={() => handleToggleNotification('sounds')}
                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#2563eb' }}
              />
            </div>
          </div>
        </div>

        {/* ==================================================== */}
        {/* 4. ACOUSTIC SYNTHESIZER (Spans 1 column) */}
        {/* ==================================================== */}
        <div className="dashboard-card settings-col-span-1" style={{ padding: '24px' }}>
          <div className="card-header-row" style={{ marginBottom: '12px' }}>
            <div className="card-title-group">
              <Volume2 size={19} color="#2563eb" />
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Acoustic Synthesizer</h3>
            </div>
          </div>

          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
            Zero-latency mechanical switch acoustics synthesized via Web Audio oscillators.
          </p>

          <div className="form-group" style={{ marginBottom: '14px' }}>
            <label className="form-label">Switch Sound Profile</label>
            <select
              className="form-input"
              value={soundType}
              onChange={(e) => {
                const val = e.target.value;
                setSoundType(val);
                soundSynth.setSwitchType(val);
              }}
            >
              <option value="blue">Cherry MX Blue (Crisp Click & Clack)</option>
              <option value="brown">Cherry MX Brown (Tactile Bump)</option>
              <option value="red">Cherry MX Red (Linear Soft Thock)</option>
              <option value="typewriter">Vintage Typewriter (Metallic Strike)</option>
            </select>
          </div>

          <button
            onClick={testAudio}
            type="button"
            style={{
              padding: '9px 16px',
              borderRadius: '9px',
              background: 'var(--bg-app)',
              border: '1px solid var(--card-border)',
              fontWeight: 700,
              fontSize: '0.84rem',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            🎵 Test Acoustic Feedback
          </button>
        </div>

        {/* ==================================================== */}
        {/* 5. SUPABASE POSTGRESQL CONNECTIVITY (Spans 1 column) */}
        {/* ==================================================== */}
        <div className="dashboard-card settings-col-span-1" style={{ padding: '24px' }}>
          <div className="card-header-row" style={{ marginBottom: '12px' }}>
            <div className="card-title-group">
              <Database size={19} color="#10b981" />
              <h3 style={{ fontSize: '0.98rem', fontWeight: 700 }}>Database Connection Mode</h3>
            </div>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '3px 9px',
                borderRadius: '12px',
                background: supabaseConnected ? '#ecfdf5' : '#fffbeb',
                color: supabaseConnected ? '#059669' : '#d97706',
                border: `1px solid ${supabaseConnected ? '#a7f3d0' : '#fde68a'}`,
                whiteSpace: 'nowrap'
              }}
            >
              {supabaseConnected ? 'Supabase Cloud 🟢' : 'Local Engine ⚡'}
            </span>
          </div>

          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '18px' }}>
            Choose whether to sync your tests and streaks to live Supabase PostgreSQL or run in private offline local mode.
          </p>

          <button
            onClick={onOpenSupabaseModal}
            type="button"
            style={{
              padding: '10px 18px',
              borderRadius: '10px',
              background: '#10b981',
              color: '#ffffff',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.86rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: '100%',
              boxShadow: '0 4px 12px rgba(16,185,129,0.25)'
            }}
          >
            <Database size={16} /> Select Database Engine
          </button>
        </div>

        {/* ==================================================== */}
        {/* 6. CLEAR & RESET PERFORMANCE DATA (Spans 2 columns) */}
        {/* ==================================================== */}
        <div className="dashboard-card settings-col-span-2" style={{ padding: '24px' }}>
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ef4444' }}>
              Clear & Reset Account Performance Data
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px', marginBottom: '14px' }}>
              Resets your WPM records, streaks, completed test logs, and unlocked badges back to clean 0.
            </div>
          </div>

          <div>
            <button
              onClick={handleResetData}
              type="button"
              style={{
                padding: '9px 18px',
                borderRadius: '10px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#dc2626',
                fontWeight: 700,
                fontSize: '0.84rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
            >
              <Trash2 size={15} /> Clear All My Stats (Set to 0)
            </button>
          </div>

          {resetSuccess && (
            <div style={{ marginTop: '12px', fontSize: '0.82rem', color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px' }}>
              <CheckCircle2 size={15} /> All stats, streaks, and test history have been cleared to fresh 0 baseline!
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
