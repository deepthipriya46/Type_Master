import React, { useState } from 'react';
import {
  Keyboard,
  Plus,
  Edit,
  Trash2,
  Eye,
  CheckCircle2,
  X,
  Clock,
  Tag,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { adminService } from '../../services/adminService';

export default function AdminTypingTestsView() {
  const [tests, setTests] = useState(() => adminService.getTypingTests());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewTest, setPreviewTest] = useState(null);
  const [editingTestId, setEditingTestId] = useState(null);

  const [form, setForm] = useState({
    title: '',
    difficulty: 'Easy',
    duration: '1 min',
    category: 'General',
    active: true,
    content: ''
  });

  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const refreshTests = () => {
    setTests(adminService.getTypingTests());
  };

  const handleOpenAddModal = () => {
    setEditingTestId(null);
    setForm({
      title: '',
      difficulty: 'Easy',
      duration: '1 min',
      category: 'General',
      active: true,
      content: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (t) => {
    setEditingTestId(t.id);
    setForm({
      title: t.title,
      difficulty: t.difficulty,
      duration: t.duration,
      category: t.category,
      active: t.active,
      content: t.content
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title || !form.content) {
      alert('Please fill in both title and passage content.');
      return;
    }

    if (editingTestId) {
      adminService.updateTypingTest(editingTestId, form);
      showToast('Typing test updated successfully!');
    } else {
      adminService.createTypingTest(form);
      showToast('New typing test created successfully!');
    }
    refreshTests();
    setIsModalOpen(false);
  };

  const handleToggleActive = (t) => {
    const nextState = adminService.toggleTestActive(t.id);
    refreshTests();
    showToast(`Test "${t.title}" is now ${nextState ? 'Active' : 'Inactive'}.`);
  };

  const handleDelete = (t) => {
    if (window.confirm(`Are you sure you want to delete test "${t.title}"?`)) {
      adminService.deleteTypingTest(t.id);
      refreshTests();
      showToast('Test deleted successfully.');
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
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.3px', margin: 0 }}>
            Typing Tests Management
          </h1>
          <p style={{ fontSize: '0.86rem', color: '#64748B', marginTop: '4px', marginBottom: 0 }}>
            Create and manage typing tests and challenges for users
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
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
            boxShadow: '0 2px 8px rgba(79, 70, 229, 0.3)',
            transition: 'background 0.15s'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#4338CA')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#4F46E5')}
        >
          <Plus size={16} />
          <span>Add Test</span>
        </button>
      </div>

      {/* Tests Table (Matching Screenshot 2) */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
          overflow: 'hidden'
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B' }}>
                <th style={{ padding: '14px 16px', width: '50px' }}>#</th>
                <th style={{ padding: '14px 16px' }}>Test Title</th>
                <th style={{ padding: '14px 16px' }}>Difficulty</th>
                <th style={{ padding: '14px 16px' }}>Duration</th>
                <th style={{ padding: '14px 16px' }}>Category</th>
                <th style={{ padding: '14px 16px', textAlign: 'center' }}>Active</th>
                <th style={{ padding: '14px 16px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tests.map((t, index) => (
                <tr
                  key={t.id}
                  style={{
                    borderBottom: '1px solid #F1F5F9',
                    transition: 'background 0.15s'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '#FFFFFF')}
                >
                  <td style={{ padding: '14px 16px', color: '#94A3B8' }}>{index + 1}</td>
                  <td style={{ padding: '14px 16px', fontWeight: 600, color: '#1E293B' }}>
                    {t.title}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span
                      style={{
                        padding: '3px 10px',
                        borderRadius: '999px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        backgroundColor:
                          t.difficulty === 'Easy'
                            ? '#ECFDF5'
                            : t.difficulty === 'Medium'
                            ? '#FFFBEB'
                            : '#FEF2F2',
                        color:
                          t.difficulty === 'Easy'
                            ? '#059669'
                            : t.difficulty === 'Medium'
                            ? '#D97706'
                            : '#DC2626',
                        border: `1px solid ${
                          t.difficulty === 'Easy'
                            ? '#A7F3D0'
                            : t.difficulty === 'Medium'
                            ? '#FDE68A'
                            : '#FECDD3'
                        }`
                      }}
                    >
                      {t.difficulty}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', color: '#475569' }}>{t.duration}</td>
                  <td style={{ padding: '14px 16px', color: '#475569' }}>{t.category}</td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    {/* Toggle Switch */}
                    <div
                      onClick={() => handleToggleActive(t)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        cursor: 'pointer'
                      }}
                      title={t.active ? 'Click to deactivate' : 'Click to activate'}
                    >
                      <div
                        style={{
                          width: '36px',
                          height: '20px',
                          borderRadius: '10px',
                          backgroundColor: t.active ? '#3B82F6' : '#CBD5E1',
                          position: 'relative',
                          transition: 'background-color 0.2s'
                        }}
                      >
                        <div
                          style={{
                            width: '16px',
                            height: '16px',
                            borderRadius: '50%',
                            backgroundColor: '#FFFFFF',
                            position: 'absolute',
                            top: '2px',
                            left: t.active ? '18px' : '2px',
                            transition: 'left 0.2s',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                          }}
                        />
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        onClick={() => setPreviewTest(t)}
                        title="Preview passage text"
                        style={actionIconBtnStyle('#EEF2FF', '#4F46E5')}
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => handleOpenEditModal(t)}
                        title="Edit test"
                        style={actionIconBtnStyle('#FFFBEB', '#D97706')}
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(t)}
                        title="Delete test"
                        style={actionIconBtnStyle('#FEF2F2', '#EF4444')}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Test Modal */}
      {isModalOpen && (
        <div style={modalOverlayStyle}>
          <div style={modalCardStyle}>
            <div style={modalHeaderStyle}>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>
                {editingTestId ? 'Edit Typing Test' : 'Create New Typing Test'}
              </div>
              <button onClick={() => setIsModalOpen(false)} style={closeBtnStyle}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '20px 24px' }}>
              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Test Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. JavaScript Async Primitives"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={labelStyle}>Difficulty</label>
                  <select
                    value={form.difficulty}
                    onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                    style={inputStyle}
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Duration</label>
                  <select
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                    style={inputStyle}
                  >
                    <option value="1 min">1 min</option>
                    <option value="2 min">2 min</option>
                    <option value="3 min">3 min</option>
                    <option value="5 min">5 min</option>
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    style={inputStyle}
                  >
                    <option value="General">General</option>
                    <option value="Coding">Coding</option>
                    <option value="Quotes">Quotes</option>
                    <option value="Mixed">Numbers & Symbols</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Passage Text Content</label>
                <textarea
                  rows={6}
                  required
                  placeholder="Enter or paste the passage text that typists will type..."
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  style={{ ...inputStyle, fontFamily: form.category === 'Coding' ? 'monospace' : 'inherit', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                <input
                  type="checkbox"
                  id="activeToggle"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  style={{ width: '16px', height: '16px', accentColor: '#4F46E5', cursor: 'pointer' }}
                />
                <label htmlFor="activeToggle" style={{ fontSize: '0.84rem', color: '#1E293B', fontWeight: 600, cursor: 'pointer' }}>
                  Publish immediately (Active for all typists)
                </label>
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
                  {editingTestId ? 'Save Changes' : 'Create Test'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Text Modal */}
      {previewTest && (
        <div style={modalOverlayStyle}>
          <div style={{ ...modalCardStyle, maxWidth: '540px' }}>
            <div style={modalHeaderStyle}>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>
                Passage Preview: {previewTest.title}
              </div>
              <button onClick={() => setPreviewTest(null)} style={closeBtnStyle}>
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                <span style={{ fontSize: '0.72rem', padding: '3px 8px', borderRadius: '6px', background: '#F1F5F9', color: '#475569', fontWeight: 600 }}>
                  Category: {previewTest.category}
                </span>
                <span style={{ fontSize: '0.72rem', padding: '3px 8px', borderRadius: '6px', background: '#F1F5F9', color: '#475569', fontWeight: 600 }}>
                  Duration: {previewTest.duration}
                </span>
                <span style={{ fontSize: '0.72rem', padding: '3px 8px', borderRadius: '6px', background: '#F1F5F9', color: '#475569', fontWeight: 600 }}>
                  Difficulty: {previewTest.difficulty}
                </span>
              </div>
              <div
                style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '10px',
                  padding: '16px',
                  fontSize: '0.88rem',
                  lineHeight: '1.6',
                  color: '#1E293B',
                  whiteSpace: 'pre-wrap',
                  maxHeight: '320px',
                  overflowY: 'auto'
                }}
              >
                {previewTest.content}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const actionIconBtnStyle = (bg, col) => ({
  background: bg,
  color: col,
  border: 'none',
  borderRadius: '6px',
  width: '28px',
  height: '28px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
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
  maxWidth: '600px',
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
