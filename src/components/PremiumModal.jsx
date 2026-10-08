import React from 'react';
import { X, Crown, CheckCircle2, Zap, Shield, Award, Sparkles } from 'lucide-react';

export default function PremiumModal({ isOpen, onClose, isPremium, onTogglePremium }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <button className="modal-close-btn" onClick={onClose}>
          <X size={18} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 8px 20px rgba(245, 158, 11, 0.35)',
              marginBottom: '12px'
            }}
          >
            <Crown size={32} />
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1e293b' }}>
            {isPremium ? 'You are a Premium Typist!' : 'Upgrade to TypeMaster Premium'}
          </h2>
          <p style={{ fontSize: '0.86rem', color: '#64748b', marginTop: '4px' }}>
            {isPremium
              ? 'Your account has full unrestricted access to all pro analytics & certificates.'
              : 'Elevate your performance with pro-grade telemetry and verifiable credentials.'}
          </p>
        </div>

        {/* Feature List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
          {[
            { title: 'Detailed Key & Finger Analytics', desc: 'Per-key error rate, finger travel distance, and cadence curves' },
            { title: 'Official Printable Certificates', desc: 'Verifiable typing speed diplomas signed with verification stamp' },
            { title: 'Unlimited Tests & Custom Texts', desc: 'Paste your own articles, code snippets, or book chapters' },
            { title: 'Ad-Free High-Performance Interface', desc: 'Pure distraction-free focus mode with mechanical switch acoustics' }
          ].map((f, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                background: '#f8fafc',
                padding: '12px 14px',
                borderRadius: '12px',
                border: '1px solid #f1f5f9'
              }}
            >
              <CheckCircle2 size={18} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#1e293b' }}>{f.title}</div>
                <div style={{ fontSize: '0.74rem', color: '#64748b' }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Action Button */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => {
              onTogglePremium(!isPremium);
              onClose();
            }}
            style={{
              flex: 1,
              padding: '13px',
              borderRadius: '12px',
              border: 'none',
              background: isPremium ? '#ef4444' : 'linear-gradient(135deg, #7c3aed, #4f46e5)',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '0.95rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 6px 18px rgba(124, 58, 237, 0.35)'
            }}
          >
            <Sparkles size={18} />
            {isPremium ? 'Deactivate Premium (Test Free Mode)' : 'Activate Premium Membership Now'}
          </button>
        </div>
      </div>
    </div>
  );
}
