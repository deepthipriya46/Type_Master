import React, { useState } from 'react';
import { Database, Volume2, User, Sliders, CheckCircle2, ShieldAlert, Sparkles, Copy, Check } from 'lucide-react';
import { supabaseService } from '../services/supabaseService';
import { soundSynth } from '../services/soundSynthesizer';

export default function SettingsView({
  user,
  onUserUpdate,
  onOpenSupabaseModal,
  supabaseConnected
}) {
  const [username, setUsername] = useState(user?.username || 'Tirumala');
  const [isPremium, setIsPremium] = useState(Boolean(user?.is_premium));
  const [soundType, setSoundType] = useState('blue');
  const [copiedSql, setCopiedSql] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveProfile = async () => {
    const updated = await supabaseService.setUserTier(isPremium);
    if (onUserUpdate) {
      onUserUpdate({ ...updated, username });
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const testAudio = () => {
    soundSynth.switchType = soundType;
    soundSynth.playKeySound();
  };

  return (
    <div className="page-container">
      <div className="greeting-header">
        <div className="greeting-text">
          <h1>Application Settings</h1>
          <p>Configure your Supabase database integration, keyboard acoustic profile, and account parameters.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Supabase Database Settings Card */}
        <div className="dashboard-card">
          <div className="card-header-row">
            <div className="card-title-group">
              <Database size={20} color="#10b981" />
              <h3>Supabase Backend Connectivity</h3>
            </div>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: '12px',
                background: supabaseConnected ? '#ecfdf5' : '#fffbeb',
                color: supabaseConnected ? '#059669' : '#d97706'
              }}
            >
              {supabaseConnected ? 'Connected 🟢' : 'Local Fallback Engine ⚡'}
            </span>
          </div>

          <p style={{ fontSize: '0.84rem', color: '#475569', lineHeight: 1.5, marginBottom: '16px' }}>
            TypeMaster utilizes <strong>Supabase (PostgreSQL)</strong> for test log storage, dynamic prompts retrieval, anti-cheat score validation, and streak tracking as requested in your architecture.
          </p>

          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '14px',
              marginBottom: '16px'
            }}
          >
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b', marginBottom: '4px' }}>
              Database Status: {supabaseConnected ? 'Online (Supabase Live)' : 'Operational (Local Mode)'}
            </div>
            <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
              {supabaseConnected
                ? 'All typing prompts and submissions are querying your Supabase project in real-time.'
                : 'Using embedded zero-config database engine with identical schema so you can test right away.'}
            </div>
          </div>

          <button
            onClick={onOpenSupabaseModal}
            style={{
              padding: '11px 18px',
              borderRadius: '10px',
              background: '#10b981',
              color: '#ffffff',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <Database size={16} /> Configure Supabase Credentials
          </button>
        </div>

        {/* Acoustic Keyboard Engine */}
        <div className="dashboard-card">
          <div className="card-header-row">
            <div className="card-title-group">
              <Volume2 size={20} color="#2563eb" />
              <h3>Acoustic Synthesizer (Web Audio)</h3>
            </div>
          </div>

          <p style={{ fontSize: '0.84rem', color: '#475569', marginBottom: '16px' }}>
            Zero-latency mechanical switch acoustics synthesized dynamically using browser oscillators.
          </p>

          <div className="form-group">
            <label className="form-label">Switch Sound Profile</label>
            <select
              className="form-input"
              value={soundType}
              onChange={(e) => {
                setSoundType(e.target.value);
                soundSynth.switchType = e.target.value;
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
            style={{
              padding: '10px 16px',
              borderRadius: '10px',
              background: '#f1f5f9',
              border: '1px solid #cbd5e1',
              fontWeight: 700,
              fontSize: '0.84rem',
              color: '#334155',
              cursor: 'pointer',
              marginTop: '4px'
            }}
          >
            🎵 Test Acoustic Feedback
          </button>
        </div>

        {/* User Account & Membership Settings */}
        <div className="dashboard-card" style={{ gridColumn: 'span 2' }}>
          <div className="card-header-row">
            <div className="card-title-group">
              <User size={20} color="#7c3aed" />
              <h3>User Profile & Premium Gatekeeper</h3>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="form-group">
              <label className="form-label">Display Name</label>
              <input
                type="text"
                className="form-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Membership Tier</label>
              <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.88rem' }}>
                  <input
                    type="radio"
                    name="tier"
                    checked={!isPremium}
                    onChange={() => setIsPremium(false)}
                  />
                  <span>Standard (Free)</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 700, color: '#7c3aed' }}>
                  <input
                    type="radio"
                    name="tier"
                    checked={isPremium}
                    onChange={() => setIsPremium(true)}
                  />
                  <span>👑 Premium User</span>
                </label>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '16px' }}>
            <button
              onClick={handleSaveProfile}
              style={{
                padding: '11px 24px',
                borderRadius: '10px',
                background: '#2563eb',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              Save Profile Settings
            </button>
            {savedSuccess && (
              <span style={{ fontSize: '0.84rem', color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={16} /> Settings saved successfully!
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
