import React, { useState, useEffect, useMemo } from 'react';
import { BookOpen, Play, Search, RefreshCw, Sparkles, CheckCircle2 } from 'lucide-react';
import { supabaseService } from '../services/supabaseService';
import { adminService } from '../services/adminService';

export default function PracticeView({ onStartTest }) {
  // Practice tests directly mirror Admin Portal "Practice Content Management"
  const [practiceItems, setPracticeItems] = useState(() => adminService.getPracticeContent());
  const [selectedTab, setSelectedTab] = useState('All');
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

  // Category Tabs matching Admin Portal
  const categoryTabs = ['All', 'Paragraphs', 'Words', 'Quotes', 'Code Passages'];

  // Real-time filtering matching Admin Portal categories and search query
  const filteredDrills = useMemo(() => {
    return practiceItems.filter((item) => {
      // Respect visibility flags if defined
      if (item.publication_status && item.publication_status !== 'published') return false;
      if (item.is_active === false) return false;

      // Category filter matching
      const itemCat = (item.category || '').toLowerCase().trim();
      const currentTab = selectedTab.toLowerCase().trim();
      const matchCategory = currentTab === 'all' || itemCat === currentTab;

      // Search query filter
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchCategory;

      const title = (item.title || '').toLowerCase();
      const content = (item.content || item.text || '').toLowerCase();
      const tags = Array.isArray(item.tags)
        ? item.tags.join(' ').toLowerCase()
        : (item.tags || '').toLowerCase();
      const keys = Array.isArray(item.focus_keys)
        ? item.focus_keys.join(' ').toLowerCase()
        : (item.focus_keys || '').toLowerCase();

      const matchSearch =
        title.includes(q) ||
        content.includes(q) ||
        tags.includes(q) ||
        keys.includes(q);

      return matchCategory && matchSearch;
    });
  }, [practiceItems, selectedTab, searchQuery]);

  return (
    <div className="page-container">
      {/* Header */}
      <div className="greeting-header">
        <div className="greeting-text">
          <h1>Targeted Practice Drills</h1>
          <p>Reinforce specific muscle memory patterns, difficult keys, and specialized vocabularies.</p>
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

      {/* Category Tabs & Search Bar */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '14px',
          padding: '14px 18px',
          border: '1px solid #e2e8f0',
          marginBottom: '22px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        {/* Category Pills matching Admin */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {categoryTabs.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedTab(cat)}
              style={{
                padding: '7px 15px',
                borderRadius: '9px',
                border: 'none',
                background: selectedTab === cat ? '#2563eb' : '#f1f5f9',
                color: selectedTab === cat ? '#ffffff' : '#475569',
                fontSize: '0.83rem',
                fontWeight: selectedTab === cat ? 700 : 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '7px 14px',
            width: '280px'
          }}
        >
          <Search size={15} color="#94a3b8" />
          <input
            type="text"
            placeholder="Search drills, tags, or content..."
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

      {/* Practice Drills Grid - Exactly matches Admin Portal */}
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
          <p style={{ color: '#64748b', fontSize: '0.85rem', maxWidth: '420px', margin: '0 auto 16px auto' }}>
            {selectedTab === 'All'
              ? 'No practice tests are currently configured in the Admin Portal.'
              : `No practice tests under category "${selectedTab}".`}
          </p>
          <button
            onClick={() => { setSelectedTab('All'); setSearchQuery(''); }}
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
            const isCode = drill.category === 'Code Passages';

            return (
              <div
                key={drill.id}
                className="dashboard-card"
                style={{
                  justifyContent: 'space-between',
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '20px'
                }}
              >
                <div>
                  {/* Top Badges */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '3px 10px',
                        borderRadius: '12px',
                        background: drill.difficulty === 'Easy' ? '#ecfdf5' : drill.difficulty === 'Medium' ? '#fffbeb' : '#fef2f2',
                        color: drill.difficulty === 'Easy' ? '#059669' : drill.difficulty === 'Medium' ? '#d97706' : '#dc2626'
                      }}
                    >
                      {drill.difficulty || 'Medium'}
                    </span>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: drill.category === 'Code Passages' ? '#4f46e5' : drill.category === 'Quotes' ? '#d97706' : drill.category === 'Words' ? '#059669' : '#2563eb'
                      }}
                    >
                      {drill.category}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 style={{ fontSize: '1.08rem', fontWeight: 700, color: '#0f172a', marginBottom: '10px' }}>
                    {drill.title}
                  </h3>

                  {/* Content Preview Box */}
                  <div
                    style={{
                      background: isCode ? '#1e293b' : '#f8fafc',
                      color: isCode ? '#38bdf8' : '#334155',
                      border: '1px solid',
                      borderColor: isCode ? '#334155' : '#e2e8f0',
                      padding: '12px',
                      borderRadius: '10px',
                      fontFamily: isCode ? 'monospace' : 'inherit',
                      fontSize: '0.82rem',
                      lineHeight: 1.5,
                      marginBottom: '14px',
                      maxHeight: '110px',
                      overflowY: 'auto',
                      whiteSpace: isCode ? 'pre-wrap' : 'normal'
                    }}
                  >
                    {drill.content || drill.text}
                  </div>

                  {/* Tags & Word Count Row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {Array.isArray(drill.tags) && drill.tags.map((t, idx) => (
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
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>
                      {wordCount} words
                    </span>
                  </div>

                  {/* Focus Keys (if present) */}
                  {drill.focus_keys && drill.focus_keys.length > 0 && (
                    <div
                      style={{
                        background: '#eff6ff',
                        border: '1px solid #bfdbfe',
                        padding: '6px 10px',
                        borderRadius: '8px',
                        fontFamily: 'monospace',
                        fontSize: '0.78rem',
                        color: '#1d4ed8',
                        fontWeight: 700,
                        marginBottom: '14px'
                      }}
                    >
                      Focus: {Array.isArray(drill.focus_keys) ? drill.focus_keys.join(' ') : drill.focus_keys}
                    </div>
                  )}
                </div>

                {/* Launch Button */}
                <button
                  onClick={() => onStartTest({
                    duration: drill.durationSeconds || 60,
                    difficulty: drill.difficulty || 'Medium',
                    category: drill.category || 'Paragraphs',
                    customPrompt: drill.content || drill.text,
                    drillTitle: drill.title
                  })}
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
