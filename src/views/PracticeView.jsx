import React, { useState, useEffect, useMemo } from 'react';
import { BookOpen, Play, Search, RefreshCw, Sparkles, CheckCircle2 } from 'lucide-react';
import { supabaseService } from '../services/supabaseService';
import { adminService } from '../services/adminService';

export default function PracticeView({ onStartTest }) {
  // Practice tests directly mirror Admin Portal "Practice Content Management"
  const [practiceItems, setPracticeItems] = useState(() => adminService.getPracticeContent());
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Synchronize practice items from the single source of truth
  const refreshPracticeItems = () => {
    const current = adminService.getPracticeContent();
    setPracticeItems(Array.isArray(current) ? current : []);
  };

  useEffect(() => {
    refreshPracticeItems();

    // 1. Instant cross-tab sync via BroadcastChannel
    let broadcast = null;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        broadcast = new BroadcastChannel('typemaster_practice_sync');
        broadcast.onmessage = (event) => {
          if (event.data?.items) {
            setPracticeItems(event.data.items);
          } else {
            refreshPracticeItems();
          }
        };
      } catch (e) {
        console.warn('BroadcastChannel notice:', e);
      }
    }

    // 2. Same-window and local storage events
    const handleSync = (e) => {
      if (e?.detail?.items) {
        setPracticeItems(e.detail.items);
      } else {
        refreshPracticeItems();
      }
    };

    const handleStorage = (e) => {
      if (e.key === 'admin_practice_content') {
        refreshPracticeItems();
      }
    };

    window.addEventListener('practice-content-sync', handleSync);
    window.addEventListener('storage', handleStorage);

    // 3. Supabase Realtime WebSocket synchronization
    let supabaseChannel = null;
    if (supabaseService.supabase) {
      try {
        supabaseChannel = supabaseService.supabase
          .channel('practice-content-changes')
          .on('broadcast', { event: 'practice-content-sync' }, (payload) => {
            if (payload?.payload) {
              setPracticeItems(payload.payload);
            } else {
              refreshPracticeItems();
            }
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'prompts' }, () => {
            refreshPracticeItems();
          })
          .subscribe();
      } catch (err) {
        console.warn('Supabase realtime practice subscription notice:', err);
      }
    }

    return () => {
      if (broadcast) broadcast.close();
      window.removeEventListener('practice-content-sync', handleSync);
      window.removeEventListener('storage', handleStorage);
      if (supabaseChannel && supabaseService.supabase) {
        supabaseService.supabase.removeChannel(supabaseChannel);
      }
    };
  }, []);

  // Category Filter Tabs
  const categoryTabs = [
    'All',
    'Mathematics',
    'Technology',
    'Science & Nature',
    'Code Passages',
    'Paragraphs',
    'Quotes',
    'Words'
  ];

  // Difficulty Sub-Filter Tabs
  const difficultyTabs = ['All', 'Easy', 'Medium', 'Hard'];

  // Dynamic Filtering Query
  const filteredDrills = useMemo(() => {
    return practiceItems.filter((item) => {
      // Respect visibility flags if defined
      if (item.publication_status && item.publication_status !== 'published') return false;
      if (item.is_active === false) return false;

      // Category matching (with alias support for programming/code)
      const itemCat = (item.category || '').toLowerCase().trim();
      const selCat = selectedCategory.toLowerCase().trim();
      const matchesCategory =
        selectedCategory === 'All' ||
        itemCat === selCat ||
        (selCat === 'code passages' && (itemCat.includes('code') || itemCat.includes('programming'))) ||
        (selCat === 'technology' && itemCat.includes('tech'));

      // Difficulty matching
      const itemDiff = (item.difficulty || 'Medium').toLowerCase().trim();
      const selDiff = selectedDifficulty.toLowerCase().trim();
      const matchesDifficulty =
        selectedDifficulty === 'All' || itemDiff === selDiff;

      // Search query filter
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesCategory && matchesDifficulty;

      const title = (item.title || '').toLowerCase();
      const content = (item.content || item.text || '').toLowerCase();
      const tags = Array.isArray(item.tags)
        ? item.tags.join(' ').toLowerCase()
        : (item.tags || '').toLowerCase();
      const keys = Array.isArray(item.focus_keys)
        ? item.focus_keys.join(' ').toLowerCase()
        : (item.focus_keys || '').toLowerCase();

      const matchesSearch =
        title.includes(q) ||
        content.includes(q) ||
        tags.includes(q) ||
        keys.includes(q);

      return matchesCategory && matchesDifficulty && matchesSearch;
    });
  }, [practiceItems, selectedCategory, selectedDifficulty, searchQuery]);

  return (
    <div className="page-container">
      {/* Header */}
      <div className="greeting-header">
        <div className="greeting-text">
          <h1>Targeted Practice Drills</h1>
          <p>Reinforce specific muscle memory patterns, mathematical symbols, difficult keys, and specialized vocabularies.</p>
        </div>
        <button
          onClick={refreshPracticeItems}
          title="Sync latest practice items from Admin Portal"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '10px',
            padding: '7px 14px',
            fontSize: '0.82rem',
            fontWeight: 600,
            color: '#475569',
            cursor: 'pointer'
          }}
        >
          <RefreshCw size={14} /> Refresh Sync
        </button>
      </div>

      {/* Category Tabs, Difficulty Sub-Filters & Search Bar */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '14px',
          padding: '16px 20px',
          border: '1px solid #e2e8f0',
          marginBottom: '22px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        {/* Top Row: Category Tabs & Search Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          {/* Main Category Filter Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', marginRight: '4px' }}>Category:</span>
            {categoryTabs.map((cat) => {
              const isSel = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    border: 'none',
                    background: isSel ? '#2563eb' : '#f1f5f9',
                    color: isSel ? '#ffffff' : '#475569',
                    fontSize: '0.82rem',
                    fontWeight: isSel ? 700 : 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '9px',
              padding: '7px 12px',
              minWidth: '260px'
            }}
          >
            <Search size={15} color="#94a3b8" />
            <input
              type="text"
              placeholder="Search drills, keys, or expressions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '0.84rem',
                color: '#1e293b',
                width: '100%'
              }}
            />
          </div>
        </div>

        {/* Bottom Row: Difficulty Sub-Filter Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '10px', borderTop: '1px solid #f1f5f9', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', marginRight: '4px' }}>Difficulty:</span>
          {difficultyTabs.map((diff) => {
            const isSel = selectedDifficulty === diff;
            const diffColor =
              diff === 'Easy'
                ? '#10b981'
                : diff === 'Medium'
                ? '#f59e0b'
                : diff === 'Hard'
                ? '#ef4444'
                : '#2563eb';
            const diffBg = isSel
              ? diff === 'Easy'
                ? '#ecfdf5'
                : diff === 'Medium'
                ? '#fffbeb'
                : diff === 'Hard'
                ? '#fef2f2'
                : '#eff6ff'
              : '#f8fafc';

            return (
              <button
                key={diff}
                onClick={() => setSelectedDifficulty(diff)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '7px',
                  border: isSel ? `1.5px solid ${diffColor}` : '1px solid #e2e8f0',
                  background: diffBg,
                  color: isSel ? diffColor : '#64748b',
                  fontSize: '0.78rem',
                  fontWeight: isSel ? 700 : 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                {diff !== 'All' && (
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: diffColor
                    }}
                  />
                )}
                {diff === 'All' ? 'All Difficulties' : diff}
              </button>
            );
          })}
        </div>
      </div>

      {/* Practice Drills Grid */}
      {filteredDrills.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '48px 20px',
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px dashed #cbd5e1'
          }}
        >
          <BookOpen size={36} color="#94a3b8" style={{ margin: '0 auto 12px auto' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
            No Practice Tests Found
          </h3>
          <p style={{ color: '#64748b', fontSize: '0.85rem', maxWidth: '440px', margin: '0 auto 16px auto' }}>
            {selectedCategory === 'All' && selectedDifficulty === 'All'
              ? 'No practice tests are currently configured in the database.'
              : `No practice drills found for Category: "${selectedCategory}" and Difficulty: "${selectedDifficulty}".`}
          </p>
          <button
            onClick={() => { setSelectedCategory('All'); setSelectedDifficulty('All'); setSearchQuery(''); }}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              background: '#2563eb',
              color: '#ffffff',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer'
            }}
          >
            Show All Tests
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {filteredDrills.map((drill) => {
            const wordCount = drill.wordCount || (drill.content ? drill.content.trim().split(/\s+/).filter(Boolean).length : 0);
            const isCode = drill.category === 'Code Passages' || drill.category === 'Programming / Code';
            const isMath = drill.category === 'Mathematics';

            const diffColor =
              drill.difficulty === 'Easy'
                ? '#059669'
                : drill.difficulty === 'Hard'
                ? '#dc2626'
                : '#d97706';
            const diffBg =
              drill.difficulty === 'Easy'
                ? '#ecfdf5'
                : drill.difficulty === 'Hard'
                ? '#fef2f2'
                : '#fffbeb';
            const diffBorder =
              drill.difficulty === 'Easy'
                ? '#a7f3d0'
                : drill.difficulty === 'Hard'
                ? '#fecaca'
                : '#fde68a';

            const catColor =
              drill.category === 'Code Passages' || drill.category === 'Programming / Code'
                ? '#4f46e5'
                : drill.category === 'Mathematics'
                ? '#7c3aed'
                : drill.category === 'Science & Nature'
                ? '#059669'
                : drill.category === 'Quotes'
                ? '#d97706'
                : drill.category === 'Technology'
                ? '#2563eb'
                : '#475569';
            const catBg =
              drill.category === 'Code Passages' || drill.category === 'Programming / Code'
                ? '#eef2ff'
                : drill.category === 'Mathematics'
                ? '#f5f3ff'
                : drill.category === 'Science & Nature'
                ? '#ecfdf5'
                : drill.category === 'Quotes'
                ? '#fffbeb'
                : drill.category === 'Technology'
                ? '#eff6ff'
                : '#f1f5f9';

            return (
              <div
                key={drill.id}
                className="dashboard-card"
                style={{
                  justifyContent: 'space-between',
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '20px',
                  borderRadius: '14px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
                }}
              >
                <div>
                  {/* Top Badges: Category & Difficulty */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: catBg,
                          color: catColor
                        }}
                      >
                        {drill.category}
                      </span>
                      <span
                        style={{
                          fontSize: '0.70rem',
                          fontWeight: 700,
                          padding: '2px 7px',
                          borderRadius: '6px',
                          background: diffBg,
                          color: diffColor,
                          border: `1px solid ${diffBorder}`
                        }}
                      >
                        {drill.difficulty || 'Medium'}
                      </span>
                    </div>

                    <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>
                      {wordCount} words
                    </span>
                  </div>

                  {/* Title */}
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                    {drill.title}
                  </h3>

                  {/* Focus Keys Banner (if present) */}
                  {drill.focus_keys && (
                    <div
                      style={{
                        background: '#eff6ff',
                        border: '1px solid #bfdbfe',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '0.74rem',
                        color: '#1d4ed8',
                        fontWeight: 600,
                        marginBottom: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        width: 'fit-content'
                      }}
                    >
                      <span style={{ fontWeight: 700 }}>Focus Keys:</span>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>
                        {Array.isArray(drill.focus_keys) ? drill.focus_keys.join(' ') : drill.focus_keys}
                      </span>
                    </div>
                  )}

                  {/* Content Preview Box */}
                  <div
                    style={{
                      background: isCode ? '#1e293b' : isMath ? '#faf5ff' : '#f8fafc',
                      color: isCode ? '#38bdf8' : isMath ? '#581c87' : '#334155',
                      border: '1px solid',
                      borderColor: isCode ? '#334155' : isMath ? '#e9d5ff' : '#e2e8f0',
                      padding: '12px',
                      borderRadius: '10px',
                      fontFamily: isCode || isMath ? 'monospace' : 'inherit',
                      fontSize: '0.82rem',
                      lineHeight: 1.5,
                      marginBottom: '14px',
                      maxHeight: '110px',
                      overflowY: 'auto',
                      whiteSpace: isCode || isMath ? 'pre-wrap' : 'normal'
                    }}
                  >
                    {drill.content || drill.text}
                  </div>

                  {/* Tags Row */}
                  {Array.isArray(drill.tags) && drill.tags.length > 0 && (
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
                      {drill.tags.map((t, idx) => (
                        <span
                          key={idx}
                          style={{
                            fontSize: '0.72rem',
                            color: '#64748b',
                            background: '#f1f5f9',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontWeight: 600
                          }}
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Launch Button: Passes exact text, category, difficulty, drillTitle, and focusKeys */}
                <button
                  onClick={() =>
                    onStartTest({
                      duration: drill.durationSeconds || 60,
                      difficulty: drill.difficulty || 'Medium',
                      category: drill.category || 'Mathematics',
                      customPrompt: drill.content || drill.text,
                      drillTitle: drill.title,
                      focusKeys: drill.focus_keys
                    })
                  }
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '10px',
                    background: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.15s ease',
                    boxShadow: '0 2px 6px rgba(37, 99, 235, 0.2)'
                  }}
                >
                  <Play size={14} fill="#ffffff" /> Start Practice Drill
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
