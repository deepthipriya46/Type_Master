import React from 'react';
import { X, CheckCircle2, AlertCircle, FileText, Gauge, Target, Clock, ShieldCheck } from 'lucide-react';

export default function TestDetailModal({ test, onClose, onReviewMistakes }) {
  if (!test) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <button className="modal-close-btn" onClick={onClose}>
          <X size={18} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: '#eff6ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#2563eb'
            }}
          >
            <FileText size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>
              Test Session Details
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Completed on {test.date} • Duration {test.duration}
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
          <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
              <Gauge size={14} color="#2563eb" /> Speed (WPM)
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#2563eb', marginTop: '4px' }}>
              {test.wpm}
            </div>
          </div>

          <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
              <Target size={14} color="#10b981" /> Accuracy
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>
              {test.accuracy}%
            </div>
          </div>

          <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
              <AlertCircle size={14} color="#ef4444" /> Uncorrected Errors
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ef4444', marginTop: '4px' }}>
              {test.errors}
            </div>
          </div>

          <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
              <ShieldCheck size={14} color="#7c3aed" /> Grade Awarded
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#7c3aed', marginTop: '8px' }}>
              ★ {test.result}
            </div>
          </div>
        </div>

        <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '10px 14px', borderRadius: '10px', fontSize: '0.78rem', color: '#065f46', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={16} /> Verified via Post-Submission Validation & Anti-Cheat Engine.
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
          {onReviewMistakes && (
            <button
              onClick={() => {
                onReviewMistakes(test);
                onClose();
              }}
              style={{
                flex: 1,
                padding: '11px',
                borderRadius: '10px',
                border: '1px solid #C7D2FE',
                background: '#EEF2FF',
                color: '#4F46E5',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <FileText size={15} /> Review Mistakes
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '11px',
              borderRadius: '10px',
              border: 'none',
              background: '#2563eb',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
