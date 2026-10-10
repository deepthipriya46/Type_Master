import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Tag,
  Edit,
  Trash2,
  CheckCircle2,
  X,
  Code,
  Quote,
  FileText,
  Layers
} from 'lucide-react';
import { adminService } from '../../services/adminService';

export default function AdminPracticeContentView() {
  const [items, setItems] = useState(() => adminService.getPracticeContent());
  const [selectedCategory, setSelectedCategory] = useState('All'); // 'All', 'Paragraphs', 'Words', 'Quotes', 'Code Passages'
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

  const [form, setForm] = useState({
    title: '',
    category: 'Paragraphs',
    difficulty: 'Medium',
    tags: 'Focus, Drill',
    content: ''
  });

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const refreshItems = () => {
    setItems(adminService.getPracticeContent());
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchCat = selectedCategory === 'All' ? true : item.category === selectedCategory;
      const matchSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [items, selectedCategory, searchQuery]);

  const handleOpenAddModal = () => {
    setEditingId(null);
    setForm({
      title: '',
      category: selectedCategory === 'All' ? 'Paragraphs' : selectedCategory,
      difficulty: 'Medium',
      tags: 'Daily, Training',
      content: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      category: item.category,
      difficulty: item.difficulty,
      tags: item.tags.join(', '),
      content: item.content
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title || !form.content) {
      alert('Please fill in title and content.');
      return;
    }
    const tagsArr = form.tags.split(',').map((t) => t.trim()).filter(Boolean);

    if (editingId) {
      adminService.updatePracticeContent(editingId, {
        ...form,
        tags: tagsArr
      });
      showToast('Practice item updated!');
    } else {
      adminService.createPracticeContent({
        ...form,
        tags: tagsArr
      });
      showToast('New practice content added!');
    }
    refreshItems();
    setIsModalOpen(false);
  };

  const handleDelete = (item) => {
    if (window.confirm(`Delete practice passage "${item.title}"?`)) {
      adminService.deletePracticeContent(item.id);
      refreshItems();
      showToast('Passage removed from practice pool.');
    }
  };

  const categories = ['All', 'Paragraphs', 'Words', 'Quotes', 'Code Passages'];

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
            Practice Content Management
          </h1>
          <p style={{ fontSize: '0.86rem', color: '#64748B', marginTop: '4px', marginBottom: 0 }}>
            Manage passages, word drills, quotes, and coding exercises
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
            boxShadow: '0 2px 8px rgba(79, 70, 229, 0.3)'
          }}
        >
          <Plus size={16} />
          <span>Add Practice Item</span>
        </button>
      </div>

      {/* Category Tabs & Search Bar */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '14px',
          padding: '16px 20px',
          border: '1px solid #E2E8F0',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        {/* Category Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '7px 14px',
                borderRadius: '8px',
                border: 'none',
                background: selectedCategory === cat ? '#EEF2FF' : 'transparent',
                color: selectedCategory === cat ? '#4F46E5' : '#64748B',
                fontSize: '0.82rem',
                fontWeight: selectedCategory === cat ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '9px',
            padding: '7px 12px',
            minWidth: '280px'
          }}
        >
          <Search size={16} color="#94A3B8" />
          <input
            type="text"
            placeholder="Search title, tag, or content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              border: 'none',
              background: 'transparent',
              outline: 'none',
              fontSize: '0.84rem',
              color: '#1E293B',
              width: '100%'
            }}
          />
        </div>
      </div>

      {/* Content Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: '16px'
        }}
      >
        {filteredItems.map((item) => (
          <div
            key={item.id}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '14px',
              border: '1px solid #E2E8F0',
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
              position: 'relative'
            }}
          >
            <div>
              {/* Card Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span
                  style={{
                    fontSize: '0.72rem',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontWeight: 700,
                    background:
                      item.category === 'Code Passages'
                        ? '#EEF2FF'
                        : item.category === 'Quotes'
                        ? '#FFFBEB'
                        : '#ECFDF5',
                    color:
                      item.category === 'Code Passages'
                        ? '#4F46E5'
                        : item.category === 'Quotes'
                        ? '#D97706'
                        : '#059669'
                  }}
                >
                  {item.category}
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <button
                    onClick={() => handleOpenEditModal(item)}
                    style={iconBtnStyle}
                    title="Edit item"
                  >
                    <Edit size={13} color="#64748B" />
                  </button>
                  <button
                    onClick={() => handleDelete(item)}
                    style={iconBtnStyle}
                    title="Delete item"
                  >
                    <Trash2 size={13} color="#EF4444" />
                  </button>
                </div>
              </div>

              <div style={{ fontSize: '0.98rem', fontWeight: 700, color: '#0F172A', marginBottom: '8px' }}>
                {item.title}
              </div>

              {/* Text Preview Box */}
              <div
                style={{
                  background: '#F8FAFC',
                  border: '1px solid #F1F5F9',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  fontSize: '0.8rem',
                  lineHeight: '1.5',
                  color: '#334155',
                  maxHeight: '100px',
                  overflowY: 'auto',
                  fontFamily: item.category === 'Code Passages' ? 'monospace' : 'inherit',
                  whiteSpace: 'pre-wrap',
                  marginBottom: '12px'
                }}
              >
                {item.content}
              </div>
            </div>

            {/* Footer with tags and word count */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '10px',
                borderTop: '1px solid #F1F5F9',
                fontSize: '0.74rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                {item.tags.map((t) => (
                  <span
                    key={t}
                    style={{
                      background: '#F1F5F9',
                      color: '#475569',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontWeight: 600
                    }}
                  >
                    #{t}
                  </span>
                ))}
              </div>
              <span style={{ color: '#94A3B8', fontWeight: 600 }}>{item.wordCount} words</span>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div style={modalOverlayStyle}>
          <div style={modalCardStyle}>
            <div style={modalHeaderStyle}>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>
                {editingId ? 'Edit Practice Item' : 'Add Practice Content'}
              </div>
              <button onClick={() => setIsModalOpen(false)} style={closeBtnStyle}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '20px 24px' }}>
              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Passage Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ergonomics & Posture Guide"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={labelStyle}>Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    style={inputStyle}
                  >
                    <option value="Paragraphs">Paragraphs</option>
                    <option value="Words">Words</option>
                    <option value="Quotes">Quotes</option>
                    <option value="Code Passages">Code Passages</option>
                  </select>
                </div>
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
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Tags (comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. React, JavaScript, Frontend"
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Passage Content</label>
                <textarea
                  rows={6}
                  required
                  placeholder="Enter practice text..."
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  style={{ ...inputStyle, fontFamily: form.category === 'Code Passages' ? 'monospace' : 'inherit', resize: 'vertical' }}
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
                  {editingId ? 'Save Changes' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const iconBtnStyle = {
  background: '#F8FAFC',
  border: '1px solid #E2E8F0',
  borderRadius: '6px',
  width: '26px',
  height: '26px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer'
};

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
  maxWidth: '560px',
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
