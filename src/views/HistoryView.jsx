import React, { useState, useMemo } from 'react';
import { Clock, Search, Download, Trash2, ArrowUpDown, FileText, CheckCircle2, X } from 'lucide-react';
import { supabaseService } from '../services/supabaseService';
import ReviewMistakesView from './ReviewMistakesView';

export default function HistoryView({ recentTests = [], onHistoryCleared, onNavigate }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDuration, setFilterDuration] = useState('all');
  const [clearing, setClearing] = useState(false);
  const [selectedTestForReview, setSelectedTestForReview] = useState(null);

  // Defensively deduplicate recent tests so only 1 report is displayed per test session
  const uniqueRecentTests = useMemo(() => {
    const list = [];
    for (const t of recentTests) {
      const isDup = list.some(existing => {
        if (existing.id && t.id && existing.id === t.id) return true;
        if (existing.created_at && t.created_at) {
          const diff = Math.abs(new Date(existing.created_at).getTime() - new Date(t.created_at).getTime());
          if (diff < 5000 && existing.wpm === t.wpm && existing.errors === t.errors) return true;
        }
        return (
          existing.date === t.date &&
          existing.duration === t.duration &&
          existing.wpm === t.wpm &&
          Math.round(existing.accuracy) === Math.round(t.accuracy) &&
          existing.errors === t.errors
        );
      });
      if (!isDup) {
        list.push(t);
      }
    }
    return list;
  }, [recentTests]);

  const filtered = uniqueRecentTests.filter((t) => {
    const matchesSearch = (t.result || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (t.date || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDuration = filterDuration === 'all' || (t.duration || '').includes(filterDuration);
    return matchesSearch && matchesDuration;
  });

  const handleClearHistory = async () => {
    if (window.confirm('Are you sure you want to clear your entire test history log? This cannot be undone.')) {
      setClearing(true);
      try {
        await supabaseService.clearTestHistory();
        if (onHistoryCleared) {
          onHistoryCleared();
        }
      } finally {
        setClearing(false);
      }
    }
  };

  const exportCSV = () => {
    if (filtered.length === 0) return;
    const headers = ['Date,Duration,WPM,Accuracy,Errors,Result'];
    const rows = filtered.map(r => `"${r.date}","${r.duration}",${r.wpm},${r.accuracy}%,${r.errors},"${r.result}"`);
    const csvString = [headers, ...rows].join('\r\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'TypeMaster_Test_History.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="page-container">
      <div className="greeting-header">
        <div className="greeting-text">
          <h1>Test History Log</h1>
          <p>Chronological record of every completed typing test session.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {uniqueRecentTests.length > 0 && (
            <>
              <button
                onClick={handleClearHistory}
                disabled={clearing}
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '10px',
                  padding: '8px 14px',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  color: '#dc2626',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Trash2 size={15} /> Clear Log
              </button>
              <button
                onClick={exportCSV}
                style={{
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '10px',
                  padding: '8px 16px',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  color: '#334155',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Download size={15} /> Export CSV
              </button>
            </>
          )}
        </div>
      </div>

      <div className="dashboard-card">
        {/* Search & Filter Bar */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <div className="header-search" style={{ width: '280px' }}>
            <Search size={16} />
            <input
              type="text"
              placeholder="Search tests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            value={filterDuration}
            onChange={(e) => setFilterDuration(e.target.value)}
            style={{
              padding: '8px 14px',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              fontSize: '0.84rem',
              fontWeight: 600,
              background: '#f8fafc',
              color: '#334155',
              outline: 'none'
            }}
          >
            <option value="all">All Durations</option>
            <option value="1">1 min tests</option>
            <option value="3">3 min tests</option>
            <option value="5">5 min tests</option>
          </select>
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: '#f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              color: '#64748b'
            }}>
              <FileText size={26} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
              No Test History Recorded
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.86rem', maxWidth: '420px', margin: '0 auto 18px auto' }}>
              Take a typing test to begin generating your personal chronological history log with verified anti-cheat badges.
            </p>
            {onNavigate && (
              <button
                className="hero-cta-btn"
                onClick={() => onNavigate('typing-test')}
                style={{ width: 'auto', padding: '10px 24px', fontSize: '0.88rem', margin: '0 auto' }}
              >
                Start Your First Test
              </button>
            )}
          </div>
        ) : (
          <table className="recent-tests-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Duration</th>
                <th>WPM</th>
                <th>Accuracy</th>
                <th>Errors</th>
                <th>Result</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Review Mistakes</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((test) => (
                <tr key={test.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>{test.date}</span>
                      {(test.scheduled_test_id || test.scheduled_test_title) && (
                        <span
                          style={{
                            background: '#EDE9FE',
                            color: '#6D28D9',
                            fontSize: '0.68rem',
                            padding: '2px 7px',
                            borderRadius: '999px',
                            fontWeight: 700
                          }}
                          title={test.scheduled_test_title || 'Official Scheduled Test'}
                        >
                          Scheduled
                        </span>
                      )}
                    </div>
                  </td>
                  <td>{test.duration}</td>
                  <td style={{ fontWeight: 800, color: '#2563eb' }}>{test.wpm}</td>
                  <td>{test.accuracy}%</td>
                  <td style={{ color: test.errors > 5 ? '#ef4444' : '#64748b' }}>{test.errors}</td>
                  <td>
                    <span className={`badge-tag ${
                      test.result === 'Excellent' ? 'excellent' :
                      test.result === 'Great' ? 'great' :
                      test.result === 'Fair' ? 'fair' :
                      test.result === 'Completed' ? 'completed' :
                      test.result === 'Needs Practice' ? 'needs-practice' :
                      test.result === 'Invalid' ? 'invalid' :
                      test.result === 'Flagged' ? 'flagged' : 'good'
                    }`}>
                      ★ {test.result}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.74rem', color: '#10b981', fontWeight: 600 }}>
                    Verified ✓
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={() => setSelectedTestForReview(test)}
                      style={{
                        background: '#EEF2FF',
                        color: '#4F46E5',
                        border: '1px solid #C7D2FE',
                        padding: '5px 12px',
                        borderRadius: '8px',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        boxShadow: '0 1px 3px rgba(79, 70, 229, 0.1)'
                      }}
                    >
                      <FileText size={12} /> Review Mistakes
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Review Past Test Mistakes Modal Overlay */}
      {selectedTestForReview && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(6px)',
            zIndex: 10000,
            overflowY: 'auto',
            padding: '24px 20px'
          }}
        >
          <div
            style={{
              maxWidth: '1300px',
              margin: '0 auto',
              background: '#FFFFFF',
              borderRadius: '24px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
              border: '1px solid #E2E8F0',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Modal Close Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 24px',
                borderBottom: '1px solid #E2E8F0',
                background: '#F8FAFC'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} color="#4F46E5" />
                <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A' }}>
                  Past Session Mistake Analysis
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTestForReview(null)}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #CBD5E1',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#64748B'
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Render ReviewMistakesView */}
            <div style={{ padding: '12px' }}>
              <ReviewMistakesView
                sessionData={{
                  ...selectedTestForReview,
                  promptText: selectedTestForReview.prompt_text || selectedTestForReview.promptText || 'The quick brown fox jumps over the lazy dog.',
                  typedInput: selectedTestForReview.typed_input || selectedTestForReview.typedInput || '',
                  timestamp: selectedTestForReview.created_at || selectedTestForReview.date,
                  formattedDate: selectedTestForReview.date
                }}
                onNavigate={(v) => {
                  setSelectedTestForReview(null);
                  if (onNavigate) onNavigate(v);
                }}
                onRetryTest={() => {
                  setSelectedTestForReview(null);
                  if (onNavigate) onNavigate('typing-test');
                }}
                onPracticeMistakes={() => {
                  setSelectedTestForReview(null);
                  if (onNavigate) onNavigate('typing-test');
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
