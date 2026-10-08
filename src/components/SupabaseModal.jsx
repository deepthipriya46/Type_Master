import React, { useState } from 'react';
import { X, Database, CheckCircle2, AlertCircle, ExternalLink, Key, Globe, ShieldCheck } from 'lucide-react';
import { supabaseService } from '../services/supabaseService';

export default function SupabaseModal({ isOpen, onClose, onConnectedChange }) {
  const creds = supabaseService.getCredentials();
  const [url, setUrl] = useState(creds.url || '');
  const [anonKey, setAnonKey] = useState(creds.anonKey || '');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  if (!isOpen) return null;

  const handleSaveAndTest = async () => {
    setLoading(true);
    setStatusMessage(null);
    const res = await supabaseService.setCredentials(url, anonKey);
    setLoading(false);
    setStatusMessage(res);
    if (res.success && onConnectedChange) {
      onConnectedChange(supabaseService.isConfigured());
    }
  };

  const handleUseLocalFallback = async () => {
    await supabaseService.setCredentials('', '');
    setUrl('');
    setAnonKey('');
    setStatusMessage({ success: true, message: 'Switched to Local Fallback Engine. 100% operational!' });
    if (onConnectedChange) {
      onConnectedChange(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <button className="modal-close-btn" onClick={onClose}>
          <X size={18} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: '#ecfdf5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#059669'
            }}
          >
            <Database size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>
              Supabase Database Setup
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Connect your live Supabase project for real-time Postgres storage.
            </p>
          </div>
        </div>

        {/* Step Guide */}
        <div
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '12px 16px',
            marginBottom: '18px',
            fontSize: '0.78rem',
            color: '#475569',
            lineHeight: 1.5
          }}
        >
          <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: '4px' }}>
            📋 Quick Setup:
          </div>
          1. Run <code style={{ background: '#e2e8f0', padding: '1px 5px', borderRadius: '4px' }}>supabase_schema.sql</code> in your <strong>Supabase SQL Editor</strong>.<br />
          2. Copy your <strong>Project URL</strong> and <strong>anon public API key</strong> from <em>Project Settings → API</em>.
        </div>

        <div className="form-group">
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Globe size={14} color="#2563eb" /> Project URL
          </label>
          <input
            type="text"
            className="form-input"
            placeholder="https://xyzcompany.supabase.co"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Key size={14} color="#2563eb" /> Anon Public API Key
          </label>
          <input
            type="password"
            className="form-input"
            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            value={anonKey}
            onChange={(e) => setAnonKey(e.target.value)}
          />
        </div>

        {statusMessage && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              marginBottom: '16px',
              fontSize: '0.8rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: statusMessage.success ? '#ecfdf5' : '#fef2f2',
              color: statusMessage.success ? '#065f46' : '#991b1b',
              border: `1px solid ${statusMessage.success ? '#a7f3d0' : '#fecaca'}`
            }}
          >
            {statusMessage.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            {statusMessage.message}
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
          <button
            onClick={handleSaveAndTest}
            disabled={loading}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '10px',
              background: '#10b981',
              color: '#ffffff',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <ShieldCheck size={16} />
            {loading ? 'Connecting...' : 'Connect to Supabase'}
          </button>

          <button
            onClick={handleUseLocalFallback}
            style={{
              padding: '12px 16px',
              borderRadius: '10px',
              background: '#f1f5f9',
              border: '1px solid #cbd5e1',
              color: '#475569',
              fontWeight: 700,
              fontSize: '0.84rem',
              cursor: 'pointer'
            }}
          >
            Use Local Engine
          </button>
        </div>
      </div>
    </div>
  );
}
