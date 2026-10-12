import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Clock, Search, Download, Trash2, ArrowUpDown, FileText, CheckCircle2, X, FileSpreadsheet, RotateCcw } from 'lucide-react';
import { supabaseService } from '../services/supabaseService';
import ReviewMistakesView from './ReviewMistakesView';
import { exportTestHistoryToExcel } from '../utils/excelExport';

export default function HistoryView({ recentTests = [], onHistoryCleared, onNavigate }) {
  const currentUser = supabaseService.getCurrentUser();
  const userId = currentUser?.id;

  const [historyList, setHistoryList] = useState(() => {
    if (Array.isArray(recentTests) && recentTests.length > 0) return recentTests;
    if (userId) return supabaseService._getLocal(`test_logs_${userId}`, []);
    return [];
  });
  const [dataLoading, setDataLoading] = useState(historyList.length === 0);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterDuration, setFilterDuration] = useState('all');
  const [clearing, setClearing] = useState(false);
  const [selectedTestForReview, setSelectedTestForReview] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [reloading, setReloading] = useState(false);

  const handleOpenReview = async (test) => {
    // 1. Immediately open modal with the test record so the UI opens with 0ms latency
    setSelectedTestForReview(test);

    // 2. If prompt_text is not yet present on this test row, fetch full canonical attempt in background
    if (!test.prompt_text && !test.promptText) {
      try {
        const canonical = await supabaseService.fetchTestAttemptById(test.id, userId);
        if (canonical) {
          setSelectedTestForReview(canonical);
        }
      } catch (err) {
        console.warn('Extra telemetry load note:', err);
      }
    }
  };

  const handleReloadHistory = async () => {
    setReloading(true);
    try {
      await loadHistory();
      setToastMessage('Test history reloaded successfully!');
      setTimeout(() => setToastMessage(''), 3000);
    } catch (err) {
      console.warn('Reload history error:', err);
    } finally {
      setReloading(false);
    }
  };

  // Sync when recentTests prop updates from parent
  useEffect(() => {
    if (Array.isArray(recentTests) && recentTests.length > 0) {
      setHistoryList(recentTests);
      setDataLoading(false);
    }
  }, [recentTests]);

  // Fetch live test logs from Supabase & localStorage on mount and across sessions
  const loadHistory = useCallback(async () => {
    if (!userId) {
      setDataLoading(false);
      return;
    }
    try {
      const logs = await supabaseService.fetchUserTestLogs(userId);
      if (Array.isArray(logs) && logs.length > 0) {
        setHistoryList(logs);
      }
    } catch (err) {
      console.warn('Failed to fetch user test history:', err);
    } finally {
      setDataLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadHistory();

    // Subscribe to live test submissions across tabs and portals
    const unsubscribe = supabaseService.subscribeToUserTestLogs(userId, () => {
      loadHistory();
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [userId, loadHistory]);

  // Defensively deduplicate tests so only 1 report is displayed per test session
  const uniqueRecentTests = useMemo(() => {
    const list = [];
    for (const t of historyList) {
      const isDup = list.some(existing => {
        if (existing.id && t.id && existing.id === t.id) return true;
        if (existing.created_at && t.created_at) {
          const diff = Math.abs(new Date(existing.created_at).getTime() - new Date(t.created_at).getTime());
          if (diff < 5000 && existing.wpm === t.wpm && existing.errors === t.errors) return true;
        }
        return false;
      });
      if (!isDup) {
        list.push(t);
      }
    }
    return list;
  }, [historyList]);

  const filtered = uniqueRecentTests.filter((t) => {
    const q = searchTerm.trim().toLowerCase();
    const matchesSearch = !q ||
      (t.result || '').toLowerCase().includes(q) ||
      (t.date || '').toLowerCase().includes(q) ||
      String(t.wpm || '').includes(q) ||
      (t.category || '').toLowerCase().includes(q) ||
      (t.difficulty || '').toLowerCase().includes(q);
    const matchesDuration = filterDuration === 'all' || (t.duration || '').includes(filterDuration);
    return matchesSearch && matchesDuration;
  });

  const handleClearHistory = async () => {
    if (window.confirm('Are you sure you want to clear your entire test history log? This cannot be undone.')) {
      setClearing(true);
      try {
        await supabaseService.clearTestHistory();
        setHistoryList([]);
        if (onHistoryCleared) {
          onHistoryCleared();
        }
      } finally {
        setClearing(false);
      }
    }
  };

  const handleExportExcel = () => {
    if (filtered.length === 0) return;
    exportTestHistoryToExcel(filtered, 'TypeMaster_Test_History.xlsx');
    setToastMessage(`Exported ${filtered.length} test records to Excel (.xlsx)!`);
    setTimeout(() => setToastMessage(''), 3500);
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
    setToastMessage(`Exported ${filtered.length} records to CSV!`);
    setTimeout(() => setToastMessage(''), 3500);
  };

  return (
    <div className="page-container" style={{ position: 'relative' }}>
      {/* Toast Feedback Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            background: '#0F172A',
            color: '#FFFFFF',
            padding: '12px 20px',
            borderRadius: '12px',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.86rem',
            fontWeight: 600,
            animation: 'fadeIn 0.2s ease-in-out'
          }}
        >
          <CheckCircle2 size={18} color="#10B981" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="greeting-header">
        <div className="greeting-text">
          <h1>Test History Log</h1>
          <p>Chronological record of every completed typing test session.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={handleReloadHistory}
            disabled={reloading || dataLoading}
            style={{
              background: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: '10px',
              padding: '8px 14px',
              fontSize: '0.84rem',
              fontWeight: 700,
              color: '#334155',
              cursor: (reloading || dataLoading) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              transition: 'background 0.15s'
            }}
            title="Reload complete test history from database"
          >
            <RotateCcw size={15} style={{ transform: (reloading || dataLoading) ? 'rotate(180deg)' : 'none', transition: 'transform 0.4s ease' }} />
            <span>{reloading ? 'Reloading...' : 'Reload History'}</span>
          </button>
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
              {/* Primary Excel (.xlsx) Download Button */}
              <button
                onClick={handleExportExcel}
                style={{
                  background: '#10B981',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '8px 16px',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)',
                  transition: 'background 0.15s'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#059669')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#10B981')}
                title="Download complete test history in Excel (.xlsx) spreadsheet format"
              >
                <FileSpreadsheet size={16} /> Export Excel (.xlsx)
              </button>
              {/* Optional CSV Download Button */}
              <button
                onClick={exportCSV}
                style={{
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '10px',
                  padding: '8px 14px',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  color: '#334155',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                title="Download test history as CSV"
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
                      onClick={() => handleOpenReview(test)}
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
                  promptText: selectedTestForReview.prompt_text || selectedTestForReview.promptText || '',
                  prompt_text: selectedTestForReview.prompt_text || selectedTestForReview.promptText || '',
                  typedInput: selectedTestForReview.typed_input || selectedTestForReview.typedInput || '',
                  typed_input: selectedTestForReview.typed_input || selectedTestForReview.typedInput || '',
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
