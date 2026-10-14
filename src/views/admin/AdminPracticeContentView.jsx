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
import { supabaseService } from '../../services/supabaseService';

export default function AdminPracticeContentView() {
  const [items, setItems] = useState(() => adminService.getPracticeContent());
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

  const [form, setForm] = useState({
    title: '',
    category: 'Mathematics',
    difficulty: 'Medium',
    tags: 'Math, Algebra, Equations',
    focus_keys: '+, -, *, /, =, (, )',
    content: '',
    publication_status: 'published',
    is_active: true
  });

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  const refreshItems = () => {
    setItems(adminService.getPracticeContent());
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const itemCat = (item.category || '').toLowerCase().trim();
      const selCat = selectedCategory.toLowerCase().trim();
      const matchCat =
        selectedCategory === 'All' ||
        itemCat === selCat ||
        (selCat.includes('code') && itemCat.includes('code')) ||
        (selCat.includes('math') && itemCat.includes('math')) ||
        (selCat.includes('science') && itemCat.includes('science'));

      const itemDiff = (item.difficulty || 'Medium').toLowerCase().trim();
      const selDiff = selectedDifficulty.toLowerCase().trim();
      const matchDiff = selectedDifficulty === 'All' || itemDiff === selDiff;

      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchCat && matchDiff;

      const title = (item.title || '').toLowerCase();
      const content = (item.content || item.text || '').toLowerCase();
      const tags = (Array.isArray(item.tags) ? item.tags.join(' ') : (item.tags || '')).toLowerCase();
      const keys = (Array.isArray(item.focus_keys) ? item.focus_keys.join(' ') : (item.focus_keys || '')).toLowerCase();

      const matchSearch = title.includes(q) || content.includes(q) || tags.includes(q) || keys.includes(q);
      return matchCat && matchDiff && matchSearch;
    });
  }, [items, selectedCategory, selectedDifficulty, searchQuery]);

  const handleOpenAddModal = () => {
    setEditingId(null);
    setForm({
      title: '',
      category: selectedCategory === 'All' ? 'Mathematics' : selectedCategory,
      difficulty: selectedDifficulty === 'All' ? 'Medium' : selectedDifficulty,
      tags: 'Math, Drill, Practice',
      focus_keys: '+, -, *, /, =',
      content: '',
      publication_status: 'published',
      is_active: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      category: item.category,
      difficulty: item.difficulty,
      tags: Array.isArray(item.tags) ? item.tags.join(', ') : item.tags || '',
      focus_keys: Array.isArray(item.focus_keys) ? item.focus_keys.join(', ') : (item.keys || item.focus_keys || ''),
      content: item.content || item.text || '',
      publication_status: item.publication_status || 'published',
      is_active: item.is_active !== undefined ? item.is_active : true
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.content) {
      alert('Please fill in title and content.');
      return;
    }

    const tagsArray = form.tags.split(',').map((t) => t.trim()).filter(Boolean);
    const focusKeysArray = form.focus_keys
      ? form.focus_keys.split(',').map((k) => k.trim()).filter(Boolean)
      : [];

    // Ensure every insert payload includes mandatory visibility flags & exact category casing
    const newPracticeItem = {
      title: form.title,
      category: form.category, // Exact casing match ('Code Passages', 'Paragraphs', 'Quotes', 'Words')
      difficulty: form.difficulty || 'Medium',
      content: form.content,
      text: form.content,
      focus_keys: focusKeysArray || [],
      tags: tagsArray || [],
      publication_status: 'published', // MANDATORY for User Portal filtering
      is_active: true
    };

    // 1. Supabase .insert() / .update() with visible error handling
    if (supabaseService.supabase) {
      try {
        const dbRecord = {
          category: newPracticeItem.category,
          difficulty: newPracticeItem.difficulty,
          text: newPracticeItem.content,
          word_count: newPracticeItem.content.trim().split(/\s+/).filter(Boolean).length,
          title: newPracticeItem.title,
          content: newPracticeItem.content,
          focus_keys: newPracticeItem.focus_keys,
          tags: newPracticeItem.tags,
          publication_status: newPracticeItem.publication_status,
          is_active: newPracticeItem.is_active
        };

        if (editingId && !editingId.startsWith('prac_')) {
          const { error } = await supabaseService.supabase
            .from('prompts')
            .update(dbRecord)
            .eq('id', editingId);

          if (error) {
            console.warn('Supabase prompts update error:', error);
            showToast(`Sync Notice: ${error.message || 'RLS restricted'}. Saved to local pool!`);
          }
        } else {
          const { error } = await supabaseService.supabase
            .from('prompts')
            .insert([dbRecord]);

          if (error) {
            console.warn('Supabase prompts insert error:', error);
            // Handle error visibly with an alert or toast message if RLS blocks the write
            showToast(`Sync Notice: ${error.message || 'RLS restricted'}. Saved to local pool!`);
          } else {
            showToast('Practice item saved and synced to Supabase cloud!');
          }
        }
      } catch (err) {
        console.warn('Supabase insert exception:', err);
        showToast(`Sync Notice: ${err.message || 'RLS policy blocked write'}. Saved to local pool!`);
      }
    }

    // 2. Persist locally to adminService for guaranteed offline and immediate cross-portal availability
    if (editingId) {
      adminService.updatePracticeContent(editingId, newPracticeItem);
      showToast('Practice item updated and synced to User Portal!');
    } else {
      adminService.createPracticeContent(newPracticeItem);
      showToast('New practice item published and synced to User Portal!');
    }

    // 3. Broadcast Realtime Sync to User Portal
    if (supabaseService.supabase) {
      try {
        const channel = supabaseService.supabase.channel('practice-content-changes');
        channel.send({
          type: 'broadcast',
          event: 'practice-content-sync',
          payload: newPracticeItem
        });
      } catch (e) {
        // silent fallback
      }
    }

    refreshItems();
    setIsModalOpen(false);
  };

  const handleDelete = async (item) => {
    if (window.confirm(`Delete practice passage "${item.title}"?`)) {
      if (supabaseService.supabase && item.id && !item.id.startsWith('prac_')) {
        try {
          const { error } = await supabaseService.supabase
            .from('prompts')
            .delete()
            .eq('id', item.id);
          if (error) {
            console.warn('Supabase delete error:', error);
          }
        } catch (e) {
          // ignore
        }
      }
      adminService.deletePracticeContent(item.id);
      refreshItems();
      showToast('Passage removed from practice pool.');
    }
  };

  const categories = [
    'All',
    'Mathematics',
    'Science & Nature',
    'Technology',
    'Code Passages',
    'Paragraphs',
    'Quotes',
    'Words'
  ];

  const difficulties = [
    'All',
    'Easy',
    'Medium',
    'Hard'
  ];

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
            Manage domain-specific passages, mathematical expressions, quotes, and coding drills
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

      {/* Category Tabs, Difficulty Filter & Search Bar */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '14px',
          padding: '16px 20px',
          border: '1px solid #E2E8F0',
          marginBottom: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        {/* Top Row: Category Tabs & Search Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          {/* Category Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94A3B8', marginRight: '4px' }}>Category:</span>
            {categories.map((cat) => {
              const isSel = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    background: isSel ? '#4F46E5' : '#F1F5F9',
                    color: isSel ? '#FFFFFF' : '#475569',
                    fontSize: '0.81rem',
                    fontWeight: isSel ? 700 : 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  {cat}
                </button>
              );
            })}
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
              minWidth: '260px'
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

        {/* Bottom Row: Difficulty Sub-Filter Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '10px', borderTop: '1px solid #F1F5F9' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94A3B8', marginRight: '4px' }}>Difficulty:</span>
          {difficulties.map((diff) => {
            const isSel = selectedDifficulty === diff;
            const diffColor = diff === 'Easy' ? '#10B981' : diff === 'Medium' ? '#F59E0B' : diff === 'Hard' ? '#EF4444' : '#4F46E5';
            const diffBg = isSel ? (diff === 'Easy' ? '#ECFDF5' : diff === 'Medium' ? '#FFFBEB' : diff === 'Hard' ? '#FEF2F2' : '#EEF2FF') : '#F8FAFC';
            return (
              <button
                key={diff}
                onClick={() => setSelectedDifficulty(diff)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '7px',
                  border: isSel ? `1.5px solid ${diffColor}` : '1px solid #E2E8F0',
                  background: diffBg,
                  color: isSel ? diffColor : '#64748B',
                  fontSize: '0.78rem',
                  fontWeight: isSel ? 700 : 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s'
                }}
              >
                {diff !== 'All' && (
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: diffColor }} />
                )}
                {diff === 'All' ? 'All Difficulties' : diff}
              </button>
            );
          })}
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
        {filteredItems.map((item) => {
          const diffColor =
            item.difficulty === 'Easy'
              ? '#10B981'
              : item.difficulty === 'Hard'
              ? '#EF4444'
              : '#F59E0B';
          const diffBg =
            item.difficulty === 'Easy'
              ? '#ECFDF5'
              : item.difficulty === 'Hard'
              ? '#FEF2F2'
              : '#FFFBEB';
          const diffBorder =
            item.difficulty === 'Easy'
              ? '#A7F3D0'
              : item.difficulty === 'Hard'
              ? '#FECACA'
              : '#FDE68A';

          return (
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
                {/* Card Header: Category & Difficulty Badges + Actions */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontWeight: 700,
                        background:
                          item.category === 'Code Passages' || item.category === 'Programming / Code'
                            ? '#EEF2FF'
                            : item.category === 'Mathematics'
                            ? '#F5F3FF'
                            : item.category === 'Science & Nature'
                            ? '#ECFDF5'
                            : item.category === 'Quotes'
                            ? '#FFFBEB'
                            : item.category === 'Technology'
                            ? '#EFF6FF'
                            : '#F1F5F9',
                        color:
                          item.category === 'Code Passages' || item.category === 'Programming / Code'
                            ? '#4F46E5'
                            : item.category === 'Mathematics'
                            ? '#7C3AED'
                            : item.category === 'Science & Nature'
                            ? '#059669'
                            : item.category === 'Quotes'
                            ? '#D97706'
                            : item.category === 'Technology'
                            ? '#2563EB'
                            : '#475569'
                      }}
                    >
                      {item.category}
                    </span>

                    {/* Difficulty Badge */}
                    <span
                      style={{
                        fontSize: '0.70rem',
                        padding: '2px 7px',
                        borderRadius: '6px',
                        fontWeight: 700,
                        background: diffBg,
                        color: diffColor,
                        border: `1px solid ${diffBorder}`
                      }}
                    >
                      {item.difficulty || 'Medium'}
                    </span>
                  </div>

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

                <div style={{ fontSize: '0.98rem', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>
                  {item.title}
                </div>

                {/* Focus Keys Banner */}
                {item.focus_keys && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '0.72rem',
                      color: '#4F46E5',
                      background: '#EEF2FF',
                      padding: '3px 8px',
                      borderRadius: '5px',
                      marginBottom: '8px',
                      width: 'fit-content'
                    }}
                  >
                    <span style={{ fontWeight: 700 }}>Focus Keys:</span>
                    <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                      {Array.isArray(item.focus_keys) ? item.focus_keys.join(' ') : item.focus_keys}
                    </span>
                  </div>
                )}

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
                    fontFamily: item.category === 'Code Passages' || item.category === 'Mathematics' ? 'monospace' : 'inherit',
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
                  {(item.tags || []).map((t) => (
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
                <span style={{ color: '#94A3B8', fontWeight: 600 }}>{item.wordCount || (item.content ? item.content.split(/\s+/).filter(Boolean).length : 0)} words</span>
              </div>
            </div>
          );
        })}
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
                  placeholder="e.g. Arithmetic Operators & Expressions"
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
                    <option value="Mathematics">Mathematics</option>
                    <option value="Science & Nature">Science & Nature</option>
                    <option value="Programming / Code">Programming / Code</option>
                    <option value="Technology">Technology</option>
                    <option value="Code Passages">Code Passages</option>
                    <option value="Paragraphs">Paragraphs</option>
                    <option value="Quotes">Quotes</option>
                    <option value="Words">Words</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Difficulty Level</label>
                  <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
                    {['Easy', 'Medium', 'Hard'].map((diff) => {
                      const isSel = form.difficulty === diff;
                      const diffColor = diff === 'Easy' ? '#10B981' : diff === 'Medium' ? '#F59E0B' : '#EF4444';
                      const diffBg = isSel ? (diff === 'Easy' ? '#ECFDF5' : diff === 'Medium' ? '#FFFBEB' : '#FEF2F2') : '#F8FAFC';
                      return (
                        <label
                          key={diff}
                          style={{
                            flex: 1,
                            padding: '8px 6px',
                            borderRadius: '8px',
                            border: isSel ? `2px solid ${diffColor}` : '1px solid #CBD5E1',
                            background: diffBg,
                            color: isSel ? diffColor : '#475569',
                            fontWeight: isSel ? 700 : 500,
                            fontSize: '0.80rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '5px',
                            transition: 'all 0.15s'
                          }}
                        >
                          <input
                            type="radio"
                            name="formDifficulty"
                            value={diff}
                            checked={isSel}
                            onChange={() => setForm({ ...form, difficulty: diff })}
                            style={{ margin: 0, accentColor: diffColor, cursor: 'pointer' }}
                          />
                          {diff}
                        </label>
                      );
                    })}
                  </div>
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

              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Target Focus Keys (comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. A, S, D, F, J, K or { }, =>"
                  value={form.focus_keys}
                  onChange={(e) => setForm({ ...form, focus_keys: e.target.value })}
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
