import React, { useState } from 'react';
import {
  Megaphone,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Info,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  X
} from 'lucide-react';
import { adminService } from '../../services/adminService';

export default function AdminAnnouncementsView() {
  const [announcements, setAnnouncements] = useState(() => adminService.getAnnouncements());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const [form, setForm] = useState({
    title: '',
    type: 'Feature Update',
    audience: 'All Typists',
    message: '',
    status: 'Published'
  });

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const refreshAnnouncements = () => {
    setAnnouncements(adminService.getAnnouncements());
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title || !form.message) {
      alert('Please fill in title and message');
      return;
    }
    adminService.createAnnouncement(form);
    refreshAnnouncements();
    setIsModalOpen(false);
    setForm({ title: '', type: 'Feature Update', audience: 'All Typists', message: '', status: 'Published' });
    showToast('Announcement broadcasted to user portal!');
  };

  const handleToggleStatus = (a) => {
    const nextStatus = adminService.toggleAnnouncementStatus(a.id);
    refreshAnnouncements();
    showToast(`Announcement status is now ${nextStatus}`);
  };

  const handleDelete = (a) => {
    if (window.confirm(`Delete announcement "${a.title}"?`)) {
      adminService.deleteAnnouncement(a.id);
      refreshAnnouncements();
      showToast('Announcement removed.');
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
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.3px', margin: 0 }}>
            Announcements & Notices
          </h1>
          <p style={{ fontSize: '0.86rem', color: '#64748B', marginTop: '4px', marginBottom: 0 }}>
            Broadcast platform updates, maintenance schedules, and feature news
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#4F46E5',
            color: '#FFFFFF',
            border: 'none',
            padding: '9px 18px',
            borderRadius: '10px',
            fontSize: '0.84rem',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(79, 70, 229, 0.3)'
          }}
        >
          <Plus size={16} />
          <span>New Announcement</span>
        </button>
      </div>

      {/* Announcements List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {announcements.map((ann) => (
          <div
            key={ann.id}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '14px',
              border: '1px solid #E2E8F0',
              padding: '20px 24px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    padding: '3px 9px',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    background:
                      ann.type === 'Maintenance'
                        ? '#FEF2F2'
                        : ann.type === 'Feature Update'
                        ? '#EEF2FF'
                        : '#ECFDF5',
                    color:
                      ann.type === 'Maintenance'
                        ? '#DC2626'
                        : ann.type === 'Feature Update'
                        ? '#4F46E5'
                        : '#059669'
                  }}
                >
                  {ann.type}
                </span>

                <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 500 }}>
                  Audience: <strong style={{ color: '#1E293B' }}>{ann.audience}</strong>
                </span>

                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: '999px',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    background: ann.status === 'Published' ? '#ECFDF5' : '#F1F5F9',
                    color: ann.status === 'Published' ? '#059669' : '#64748B'
                  }}
                >
                  {ann.status}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '0.74rem', color: '#94A3B8' }}>{ann.date}</span>
                <button
                  onClick={() => handleToggleStatus(ann)}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '6px',
                    border: '1px solid #E2E8F0',
                    background: '#F8FAFC',
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    color: '#334155',
                    cursor: 'pointer'
                  }}
                >
                  {ann.status === 'Published' ? 'Unpublish' : 'Publish'}
                </button>
                <button
                  onClick={() => handleDelete(ann)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#EF4444',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>

            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', marginBottom: '6px' }}>
              {ann.title}
            </div>

            <p style={{ fontSize: '0.86rem', color: '#334155', lineHeight: '1.5', margin: 0 }}>
              {ann.message}
            </p>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div style={modalOverlayStyle}>
          <div style={modalCardStyle}>
            <div style={modalHeaderStyle}>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>
                Create Platform Announcement
              </div>
              <button onClick={() => setIsModalOpen(false)} style={closeBtnStyle}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '20px 24px' }}>
              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Announcement Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Scheduled Maintenance Notice"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={labelStyle}>Category Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    style={inputStyle}
                  >
                    <option value="Feature Update">Feature Update</option>
                    <option value="Maintenance">Maintenance Alert</option>
                    <option value="Content">Content Update</option>
                    <option value="Notice">General Notice</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Target Audience</label>
                  <select
                    value={form.audience}
                    onChange={(e) => setForm({ ...form, audience: e.target.value })}
                    style={inputStyle}
                  >
                    <option value="All Typists">All Typists</option>
                    <option value="Free Users">Free Users Only</option>
                    <option value="Premium Members">Premium Members</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Message Body</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Enter announcement text that will be displayed to users..."
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
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
                  Publish Announcement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

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
  maxWidth: '520px',
  backgroundColor: '#FFFFFF',
  borderRadius: '16px',
  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
  overflow: 'hidden'
};

const modalHeaderStyle = {
  padding: '16px 24px',
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
