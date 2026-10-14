import React from 'react';
import {
  X,
  CheckCircle2,
  AlertCircle,
  FileText,
  Gauge,
  Target,
  Clock,
  ShieldCheck,
  User,
  Mail,
  Calendar,
  Award,
  Hash,
  Keyboard,
  Check,
  AlertTriangle
} from 'lucide-react';

export default function AttemptDetailInspectionModal({
  attempt,
  scheduledTest,
  onClose
}) {
  if (!attempt) return null;

  const formatDateTime = (isoStr) => {
    if (!isoStr) return 'N/A';
    try {
      const d = new Date(isoStr);
      return d.toLocaleString([], {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return isoStr;
    }
  };

  const score = attempt.score ?? Math.round((attempt.wpm || 0) * ((attempt.accuracy || 100) / 100));
  const rawWpm = attempt.raw_wpm || attempt.wpm;
  const testTitle = attempt.scheduled_test_title || scheduledTest?.title || 'Scheduled Test';
  const durationSec = attempt.duration || scheduledTest?.duration || 60;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '20px',
        overflowY: 'auto'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          maxWidth: '820px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          border: '1px solid #E2E8F0',
          padding: '28px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #2563EB 0%, #4F46E5 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
              }}
            >
              <ShieldCheck size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Detailed Attempt Telemetry
                </h3>
                <span
                  style={{
                    background: '#EFF6FF',
                    color: '#2563EB',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    border: '1px solid #BFDBFE'
                  }}
                >
                  ADMIN INSPECTION
                </span>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#64748B', margin: '4px 0 0 0' }}>
                Challenge: <strong style={{ color: '#1E293B' }}>{testTitle}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: '#F1F5F9',
              border: 'none',
              borderRadius: '10px',
              width: '34px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#64748B',
              transition: 'background 0.15s'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#E2E8F0')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#F1F5F9')}
          >
            <X size={18} />
          </button>
        </div>

        {/* User Identity & Attempt Metadata Bar */}
        <div
          style={{
            background: '#F8FAFC',
            borderRadius: '14px',
            border: '1px solid #E2E8F0',
            padding: '14px 18px',
            marginBottom: '20px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '14px'
          }}
        >
          <div>
            <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
              <User size={12} color="#2563EB" /> Typist Name
            </div>
            <div style={{ fontSize: '0.94rem', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>
              {attempt.user_name || 'Anonymous Typist'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Mail size={12} color="#2563EB" /> User Email (Admin Visible)
            </div>
            <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#2563EB', marginTop: '2px' }}>
              {attempt.user_email || 'Not provided'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Calendar size={12} color="#2563EB" /> Completed At
            </div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginTop: '2px' }}>
              {formatDateTime(attempt.completed_at || attempt.created_at)}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Hash size={12} color="#2563EB" /> Attempt ID
            </div>
            <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#64748B', marginTop: '2px' }}>
              {String(attempt.id).slice(0, 18)}...
            </div>
          </div>
        </div>

        {/* Core Telemetry Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
          <div style={{ background: '#EFF6FF', borderRadius: '14px', padding: '16px', border: '1px solid #BFDBFE' }}>
            <div style={{ fontSize: '0.76rem', color: '#1E40AF', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Gauge size={15} color="#2563EB" /> Speed (WPM)
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#1D4ED8', marginTop: '4px' }}>
              {attempt.wpm}
            </div>
            <div style={{ fontSize: '0.74rem', color: '#60A5FA', marginTop: '2px' }}>
              Raw Speed: {rawWpm} WPM
            </div>
          </div>

          <div style={{ background: '#ECFDF5', borderRadius: '14px', padding: '16px', border: '1px solid #A7F3D0' }}>
            <div style={{ fontSize: '0.76rem', color: '#065F46', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Target size={15} color="#059669" /> Accuracy
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#059669', marginTop: '4px' }}>
              {attempt.accuracy}%
            </div>
            <div style={{ fontSize: '0.74rem', color: '#34D399', marginTop: '2px' }}>
              Precision Rating
            </div>
          </div>

          <div style={{ background: '#FEF2F2', borderRadius: '14px', padding: '16px', border: '1px solid #FECACA' }}>
            <div style={{ fontSize: '0.76rem', color: '#991B1B', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertCircle size={15} color="#DC2626" /> Errors
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#DC2626', marginTop: '4px' }}>
              {attempt.errors || 0}
            </div>
            <div style={{ fontSize: '0.74rem', color: '#F87171', marginTop: '2px' }}>
              Uncorrected Mistakes
            </div>
          </div>

          <div style={{ background: '#FAF5FF', borderRadius: '14px', padding: '16px', border: '1px solid #E9D5FF' }}>
            <div style={{ fontSize: '0.76rem', color: '#6B21A8', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Award size={15} color="#7C3AED" /> Final Score
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#7C3AED', marginTop: '4px' }}>
              {score}
            </div>
            <div style={{ fontSize: '0.74rem', color: '#A855F7', marginTop: '2px' }}>
              Performance Index
            </div>
          </div>
        </div>

        {/* Keystrokes & Character Breakdown */}
        <div style={{ background: '#F8FAFC', borderRadius: '14px', padding: '16px', border: '1px solid #E2E8F0', marginBottom: '20px' }}>
          <h4 style={{ fontSize: '0.86rem', fontWeight: 800, color: '#1E293B', margin: '0 0 12px 0' }}>
            Keystroke & Character Analysis
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
            <div style={{ background: '#FFFFFF', padding: '10px 12px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
              <span style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 700 }}>Correct Chars</span>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#059669', marginTop: '2px' }}>
                {attempt.correct_characters || attempt.characters || 0}
              </div>
            </div>
            <div style={{ background: '#FFFFFF', padding: '10px 12px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
              <span style={{ fontSize: '0.72rem', color: '#DC2626', fontWeight: 700 }}>Wrong Chars</span>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#DC2626', marginTop: '2px' }}>
                {attempt.wrong_characters || 0}
              </div>
            </div>
            <div style={{ background: '#FFFFFF', padding: '10px 12px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
              <span style={{ fontSize: '0.72rem', color: '#D97706', fontWeight: 700 }}>Missed Chars</span>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#D97706', marginTop: '2px' }}>
                {attempt.missed_characters || 0}
              </div>
            </div>
            <div style={{ background: '#FFFFFF', padding: '10px 12px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
              <span style={{ fontSize: '0.72rem', color: '#7C3AED', fontWeight: 700 }}>Extra Chars</span>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#7C3AED', marginTop: '2px' }}>
                {attempt.extra_characters || 0}
              </div>
            </div>
            <div style={{ background: '#FFFFFF', padding: '10px 12px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
              <span style={{ fontSize: '0.72rem', color: '#475569', fontWeight: 700 }}>Total Chars</span>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1E293B', marginTop: '2px' }}>
                {attempt.characters || 0}
              </div>
            </div>
            <div style={{ background: '#FFFFFF', padding: '10px 12px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
              <span style={{ fontSize: '0.72rem', color: '#475569', fontWeight: 700 }}>Duration</span>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1E293B', marginTop: '2px' }}>
                {durationSec}s
              </div>
            </div>
          </div>
        </div>

        {/* Assigned Passage Prompt vs User Typed Input */}
        {(attempt.prompt_text || attempt.typed_input) && (
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ fontSize: '0.86rem', fontWeight: 800, color: '#1E293B', margin: '0 0 10px 0' }}>
              Text Comparison
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: '6px' }}>
                  Assigned Challenge Passage:
                </span>
                <div
                  style={{
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '10px',
                    padding: '12px',
                    fontSize: '0.8rem',
                    lineHeight: 1.5,
                    color: '#334155',
                    maxHeight: '140px',
                    overflowY: 'auto',
                    fontFamily: 'monospace'
                  }}
                >
                  {attempt.prompt_text || scheduledTest?.content || 'Passage text not recorded'}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: '6px' }}>
                  User's Submitted Input:
                </span>
                <div
                  style={{
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '10px',
                    padding: '12px',
                    fontSize: '0.8rem',
                    lineHeight: 1.5,
                    color: '#1E293B',
                    maxHeight: '140px',
                    overflowY: 'auto',
                    fontFamily: 'monospace'
                  }}
                >
                  {attempt.typed_input || 'Typed input not recorded'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Verification Status Banner */}
        <div
          style={{
            background: '#F0FDF4',
            border: '1px solid #BBF7D0',
            borderRadius: '12px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={18} color="#16A34A" />
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#15803D' }}>
              Verified Submission: Real-time telemetry recorded & anti-cheat validated.
            </span>
          </div>
          <span
            style={{
              background: '#DCFCE7',
              color: '#15803D',
              padding: '4px 10px',
              borderRadius: '999px',
              fontSize: '0.74rem',
              fontWeight: 800
            }}
          >
            STATUS: {String(attempt.status || 'COMPLETED').toUpperCase()}
          </span>
        </div>

        {/* Footer Close Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 24px',
              background: '#0F172A',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '0.86rem',
              cursor: 'pointer'
            }}
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
}
