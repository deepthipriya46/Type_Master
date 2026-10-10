import React, { useState } from 'react';
import { X, Database, ShieldCheck, HardDrive, Check, Cloud } from 'lucide-react';
import { supabaseService } from '../services/supabaseService';

export default function SupabaseModal({ isOpen, onClose, onConnectedChange }) {
  const [loading, setLoading] = useState(false);
  const currentEngine = supabaseService.getEngineMode();

  if (!isOpen) return null;

  const handleConnectSupabase = async () => {
    setLoading(true);
    await supabaseService.setEngineMode('supabase');
    setLoading(false);
    if (onConnectedChange) {
      onConnectedChange(true);
    }
    onClose();
  };

  const handleUseLocal = async () => {
    setLoading(true);
    await supabaseService.setEngineMode('local');
    setLoading(false);
    if (onConnectedChange) {
      onConnectedChange(false);
    }
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: '480px', padding: '28px' }}>
        <button className="modal-close-btn" onClick={onClose} title="Close">
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: '#ecfdf5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#059669',
              boxShadow: '0 4px 12px rgba(5, 150, 105, 0.15)'
            }}
          >
            <Database size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', letterSpacing: '-0.3px' }}>
              Database Connection Mode
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
              Choose your active database engine for telemetry storage.
            </p>
          </div>
        </div>

        {/* Engine Modes Preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '22px' }}>
          {/* Supabase Engine Card */}
          <div
            onClick={handleConnectSupabase}
            style={{
              border: currentEngine === 'supabase' ? '2px solid #10b981' : '1px solid #e2e8f0',
              background: currentEngine === 'supabase' ? '#f0fdf4' : '#ffffff',
              borderRadius: '12px',
              padding: '14px 16px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px'
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: '#dcfce7',
                color: '#16a34a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: '2px'
              }}
            >
              <Cloud size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>
                  Supabase Cloud Engine
                </span>
                {currentEngine === 'supabase' && (
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      background: '#10b981',
                      color: '#ffffff',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Check size={11} /> Active
                  </span>
                )}
              </div>
              <p style={{ fontSize: '0.78rem', color: '#475569', marginTop: '4px', lineHeight: 1.4 }}>
                Real-time PostgreSQL sync for test logs, streaks, dynamic achievements, and global typist rankings.
              </p>
            </div>
          </div>

          {/* Local Engine Card */}
          <div
            onClick={handleUseLocal}
            style={{
              border: currentEngine === 'local' ? '2px solid #3b82f6' : '1px solid #e2e8f0',
              background: currentEngine === 'local' ? '#eff6ff' : '#ffffff',
              borderRadius: '12px',
              padding: '14px 16px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px'
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: '#dbeafe',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: '2px'
              }}
            >
              <HardDrive size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>
                  Local In-Browser Engine
                </span>
                {currentEngine === 'local' && (
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      background: '#2563eb',
                      color: '#ffffff',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Check size={11} /> Active
                  </span>
                )}
              </div>
              <p style={{ fontSize: '0.78rem', color: '#475569', marginTop: '4px', lineHeight: 1.4 }}>
                Private, offline browser storage with 0ms network latency. Practice freely without cloud connectivity.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={handleConnectSupabase}
            disabled={loading}
            style={{
              flex: 1.2,
              padding: '12px',
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
              gap: '6px',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
              transition: 'background 0.2s ease'
            }}
          >
            <ShieldCheck size={16} />
            {loading ? 'Connecting...' : 'Connect to Supabase'}
          </button>

          <button
            onClick={handleUseLocal}
            disabled={loading}
            style={{
              flex: 1,
              padding: '12px 14px',
              borderRadius: '10px',
              background: '#f1f5f9',
              border: '1px solid #cbd5e1',
              color: '#475569',
              fontWeight: 700,
              fontSize: '0.84rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            <HardDrive size={15} />
            Use Local Engine
          </button>
        </div>
      </div>
    </div>
  );
}
