import React, { useState } from 'react';
import {
  MessageSquare,
  Star,
  CheckCircle2,
  Trash2,
  AlertCircle,
  Filter,
  Reply,
  X
} from 'lucide-react';
import { adminService } from '../../services/adminService';

export default function AdminFeedbackView() {
  const [feedback, setFeedback] = useState(() => adminService.getFeedback());
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [replyModalItem, setReplyModalItem] = useState(null);
  const [replyNote, setReplyNote] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const refreshFeedback = () => {
    setFeedback(adminService.getFeedback());
  };

  const filtered = feedback.filter((f) => {
    const matchCat = filterCategory === 'All' ? true : f.category === filterCategory;
    const matchStatus = filterStatus === 'All' ? true : f.status === filterStatus;
    return matchCat && matchStatus;
  });

  const handleResolve = (f) => {
    adminService.resolveFeedback(f.id, 'Acknowledged and resolved by admin team.');
    refreshFeedback();
    showToast(`Feedback from ${f.userName} marked as Resolved.`);
  };

  const handleOpenReplyModal = (f) => {
    setReplyModalItem(f);
    setReplyNote(f.adminReply || '');
  };

  const handleSaveReply = (e) => {
    e.preventDefault();
    if (replyModalItem) {
      adminService.resolveFeedback(replyModalItem.id, replyNote);
      refreshFeedback();
      showToast('Admin note saved and feedback updated!');
      setReplyModalItem(null);
    }
  };

  const handleDelete = (f) => {
    if (window.confirm(`Delete feedback entry from ${f.userName}?`)) {
      adminService.deleteFeedback(f.id);
      refreshFeedback();
      showToast('Feedback entry deleted.');
    }
  };

  return (
    <div style={{ padding: '24px 32px', backgroundColor: '#F8FAFC', minHeight: 'calc(100vh - 70px)' }}>
      {/* Toast */}
      {toastMsg && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: '#0F172A',
            color: '#FFFFFF',
            padding: '12px 20px',
            borderRadius: '10px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            zIndex: 100,
            fontSize: '0.86rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <CheckCircle2 size={17} color="#10B981" />
          {toastMsg}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.3px', margin: 0 }}>
          Feedback & Support
        </h1>
        <p style={{ fontSize: '0.86rem', color: '#64748B', marginTop: '4px', marginBottom: 0 }}>
          User satisfaction reviews, reported passage typos, and feature requests
        </p>
      </div>

      {/* Filter Row */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '14px',
          padding: '14px 20px',
          border: '1px solid #E2E8F0',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>Category:</span>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            style={selectStyle}
          >
            <option value="All">All Categories</option>
            <option value="Praise">Praise & Reviews</option>
            <option value="Suggestion">Suggestions & Requests</option>
            <option value="Bug">Passage Errors & Bugs</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>Status:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={selectStyle}
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Reviewed">Reviewed</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* Feedback List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {filtered.map((item) => (
          <div
            key={item.id}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '14px',
              border: '1px solid #E2E8F0',
              padding: '18px 22px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.94rem' }}>
                  {item.userName}
                </span>
                <span style={{ color: '#64748B', fontSize: '0.78rem' }}>{item.userEmail}</span>
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: '999px',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    background:
                      item.status === 'Resolved'
                        ? '#ECFDF5'
                        : item.status === 'Reviewed'
                        ? '#EFF6FF'
                        : '#FFFBEB',
                    color:
                      item.status === 'Resolved'
                        ? '#059669'
                        : item.status === 'Reviewed'
                        ? '#2563EB'
                        : '#D97706'
                  }}
                >
                  {item.status}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#F59E0B', fontSize: '0.9rem' }}>
                  {'★'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)}
                </span>
                <span style={{ fontSize: '0.74rem', color: '#94A3B8' }}>{item.date}</span>
              </div>
            </div>

            <p style={{ fontSize: '0.88rem', color: '#334155', lineHeight: '1.5', margin: '0 0 10px 0' }}>
              "{item.comment}"
            </p>

            {item.adminReply && (
              <div
                style={{
                  background: '#F8FAFC',
                  borderLeft: '3px solid #4F46E5',
                  padding: '8px 12px',
                  borderRadius: '0 8px 8px 0',
                  fontSize: '0.8rem',
                  color: '#475569',
                  marginBottom: '10px'
                }}
              >
                <span style={{ fontWeight: 700, color: '#4F46E5' }}>Admin Response: </span>
                {item.adminReply}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '8px', borderTop: '1px solid #F1F5F9' }}>
              <button
                onClick={() => handleOpenReplyModal(item)}
                style={actionBtnStyle('#EEF2FF', '#4F46E5')}
              >
                <Reply size={13} /> Add Note / Reply
              </button>
              {item.status !== 'Resolved' && (
                <button
                  onClick={() => handleResolve(item)}
                  style={actionBtnStyle('#ECFDF5', '#059669')}
                >
                  <CheckCircle2 size={13} /> Mark Resolved
                </button>
              )}
              <button
                onClick={() => handleDelete(item)}
                style={actionBtnStyle('#FEF2F2', '#EF4444')}
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Reply Modal */}
      {replyModalItem && (
        <div style={modalOverlayStyle}>
          <div style={modalCardStyle}>
            <div style={modalHeaderStyle}>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>
                Respond to Feedback ({replyModalItem.userName})
              </div>
              <button onClick={() => setReplyModalItem(null)} style={closeBtnStyle}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveReply} style={{ padding: '20px 24px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Admin Notes / Follow-up Resolution</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Enter administrator notes or resolution detail..."
                  value={replyNote}
                  onChange={(e) => setReplyNote(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setReplyModalItem(null)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    background: '#FFFFFF',
                    color: '#64748B',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 18px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#4F46E5',
                    color: '#FFFFFF',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Save & Resolve
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const selectStyle = {
  padding: '6px 10px',
  borderRadius: '8px',
  border: '1px solid #E2E8F0',
  background: '#FFFFFF',
  fontSize: '0.8rem',
  color: '#1E293B',
  fontWeight: 600,
  cursor: 'pointer',
  outline: 'none'
};

const actionBtnStyle = (bg, col) => ({
  background: bg,
  color: col,
  border: 'none',
  borderRadius: '6px',
  padding: '5px 10px',
  fontSize: '0.76rem',
  fontWeight: 700,
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  cursor: 'pointer'
});

const modalOverlayStyle = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(15, 23, 42, 0.6)',
  backdropFilter: 'blur(3px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 100,
  padding: '20px'
};

const modalCardStyle = {
  width: '100%',
  maxWidth: '480px',
  backgroundColor: '#FFFFFF',
  borderRadius: '16px',
  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
  overflow: 'hidden'
};

const modalHeaderStyle = {
  padding: '16px 20px',
  borderBottom: '1px solid #E2E8F0',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  background: '#F8FAFC'
};

const closeBtnStyle = {
  background: 'transparent',
  border: 'none',
  color: '#94A3B8',
  cursor: 'pointer'
};

const labelStyle = {
  display: 'block',
  fontSize: '0.78rem',
  fontWeight: 700,
  color: '#334155',
  marginBottom: '6px'
};

const inputStyle = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: '8px',
  border: '1px solid #E2E8F0',
  fontSize: '0.84rem',
  outline: 'none',
  boxSizing: 'border-box'
};
