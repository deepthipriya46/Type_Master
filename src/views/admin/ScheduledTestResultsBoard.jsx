import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  CalendarClock,
  Clock,
  Trophy,
  Search,
  RotateCw,
  Eye,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  Users,
  Timer,
  CheckCircle2,
  AlertCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  Download,
  ShieldCheck,
  Award
} from 'lucide-react';
import { supabaseService } from '../../services/supabaseService';
import { adminService } from '../../services/adminService';
import AttemptDetailInspectionModal from './AttemptDetailInspectionModal';

export default function ScheduledTestResultsBoard({
  tests = [],
  selectedTestId,
  onSelectTest
}) {
  const [activeTestId, setActiveTestId] = useState(selectedTestId || tests[0]?.id || null);
  const [testFilter, setTestFilter] = useState('all'); // 'all' | 'live' | 'upcoming' | 'completed' | 'cancelled'
  const [attempts, setAttempts] = useState([]);
  const [loadingAttempts, setLoadingAttempts] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Search & Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('wpm'); // 'wpm' | 'accuracy' | 'errors' | 'score' | 'created_at' | 'duration'
  const [sortDirection, setSortDirection] = useState('desc'); // 'asc' | 'desc'
  const [statusFilter, setStatusFilter] = useState('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Attempt Inspection Modal
  const [inspectingAttempt, setInspectingAttempt] = useState(null);

  // Sync activeTestId with selectedTestId prop
  useEffect(() => {
    if (selectedTestId) {
      setActiveTestId(selectedTestId);
    } else if (!activeTestId && tests.length > 0) {
      setActiveTestId(tests[0].id);
    }
  }, [selectedTestId, tests]);

  // Selected Test Object
  const currentTest = useMemo(() => {
    return tests.find((t) => t.id === activeTestId) || tests[0] || null;
  }, [tests, activeTestId]);

  // Load attempts for selected test
  const loadAttempts = useCallback(async (manual = false) => {
    if (!activeTestId) {
      setAttempts([]);
      return;
    }

    if (manual) setIsRefreshing(true);
    setLoadingAttempts(true);

    try {
      const data = await supabaseService.fetchScheduledTestAttempts(activeTestId);
      setAttempts(data || []);
      setCurrentPage(1);
    } catch (err) {
      console.warn('Error loading scheduled test attempts:', err);
      setAttempts([]);
    } finally {
      setLoadingAttempts(false);
      if (manual) setIsRefreshing(false);
    }
  }, [activeTestId]);

  // Initial and reactive load
  useEffect(() => {
    loadAttempts();
  }, [loadAttempts]);

  // Realtime subscription: auto-updates when any user completes this scheduled test!
  useEffect(() => {
    const unsubscribe = supabaseService.subscribeScheduledTests(() => {
      loadAttempts();
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [loadAttempts]);

  // Filtered Scheduled Tests for the dropdown selector
  const selectorTests = useMemo(() => {
    return tests.filter((t) => {
      if (testFilter === 'all') return true;
      const status = t.computedStatus || t.status;
      return status === testFilter;
    });
  }, [tests, testFilter]);

  // Filtered & Sorted Attempts
  const processedAttempts = useMemo(() => {
    let list = [...attempts];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (a) =>
          (a.user_name || '').toLowerCase().includes(q) ||
          (a.user_email || '').toLowerCase().includes(q)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      list = list.filter((a) => (a.status || 'completed') === statusFilter);
    }

    // Sorting
    list.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (sortField === 'score') {
        valA = a.score ?? Math.round((a.wpm || 0) * ((a.accuracy || 100) / 100));
        valB = b.score ?? Math.round((b.wpm || 0) * ((b.accuracy || 100) / 100));
      } else if (sortField === 'created_at') {
        valA = new Date(a.created_at || 0).getTime();
        valB = new Date(b.created_at || 0).getTime();
      } else {
        valA = Number(valA) || 0;
        valB = Number(valB) || 0;
      }

      if (valA === valB) {
        // Tie-breaker: higher accuracy, then fewer errors
        if (a.accuracy !== b.accuracy) return b.accuracy - a.accuracy;
        return a.errors - b.errors;
      }

      return sortDirection === 'desc' ? valB - valA : valA - valB;
    });

    // Assign Rank deterministically
    return list.map((item, idx) => ({
      ...item,
      rank: idx + 1
    }));
  }, [attempts, searchQuery, statusFilter, sortField, sortDirection]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(processedAttempts.length / pageSize));
  const paginatedAttempts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedAttempts.slice(start, start + pageSize);
  }, [processedAttempts, currentPage, pageSize]);

  // Metrics summary
  const summaryMetrics = useMemo(() => {
    if (attempts.length === 0) {
      return { total: 0, avgWpm: 0, avgAccuracy: 0, topWpm: 0 };
    }
    const total = attempts.length;
    const avgWpm = Math.round(attempts.reduce((acc, a) => acc + (a.wpm || 0), 0) / total);
    const avgAccuracy = Math.round((attempts.reduce((acc, a) => acc + (a.accuracy || 0), 0) / total) * 10) / 10;
    const topWpm = Math.max(...attempts.map((a) => a.wpm || 0));
    return { total, avgWpm, avgAccuracy, topWpm };
  }, [attempts]);

  // Sorting toggle helper
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Export handlers
  const handleExport = (format) => {
    if (!currentTest) return;
    adminService.exportScheduledTestResultsToExcel(currentTest.title, processedAttempts, format);
  };

  const formatDateTime = (isoStr) => {
    if (!isoStr) return 'N/A';
    try {
      const d = new Date(isoStr);
      return d.toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div>
      {/* Header Bar with Challenge Selector & Filter */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          padding: '20px 24px',
          marginBottom: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '16px'
          }}
        >
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
              Scheduled Test Results Board
            </h2>
            <p style={{ fontSize: '0.84rem', color: '#64748B', margin: '4px 0 0 0' }}>
              Select a test to view, inspect, search, and export all user attempts and anti-cheat telemetry.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => loadAttempts(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 14px',
                borderRadius: '10px',
                border: '1px solid #E2E8F0',
                background: '#FFFFFF',
                color: '#475569',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
              title="Refresh results"
            >
              <RotateCw size={14} className={isRefreshing ? 'spin' : ''} />
              <span>Refresh</span>
            </button>

            <button
              onClick={() => handleExport('xlsx')}
              disabled={attempts.length === 0}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 14px',
                borderRadius: '10px',
                border: 'none',
                background: attempts.length === 0 ? '#E2E8F0' : '#10B981',
                color: attempts.length === 0 ? '#94A3B8' : '#FFFFFF',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: attempts.length === 0 ? 'not-allowed' : 'pointer',
                boxShadow: attempts.length > 0 ? '0 4px 12px rgba(16, 185, 129, 0.25)' : 'none'
              }}
            >
              <Download size={14} />
              <span>Export Excel</span>
            </button>

            <button
              onClick={() => handleExport('csv')}
              disabled={attempts.length === 0}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 14px',
                borderRadius: '10px',
                border: '1px solid #E2E8F0',
                background: '#FFFFFF',
                color: '#475569',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: attempts.length === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              <span>CSV</span>
            </button>
          </div>
        </div>

        {/* Challenge Selection Controls */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', alignItems: 'center' }}>
          {/* Test Selector Dropdown */}
          <div>
            <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#64748B', marginBottom: '6px' }}>
              SELECT SCHEDULED TEST ({tests.length} AVAILABLE):
            </label>
            <select
              value={activeTestId || ''}
              onChange={(e) => {
                setActiveTestId(e.target.value);
                if (onSelectTest) onSelectTest(e.target.value);
              }}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid #CBD5E1',
                background: '#F8FAFC',
                fontSize: '0.88rem',
                fontWeight: 700,
                color: '#0F172A',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {selectorTests.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} • ({t.computedStatus || t.status}) • {t.participants_count || 0} participants
                </option>
              ))}
            </select>
          </div>

          {/* Test Status Quick Filter Tabs */}
          <div>
            <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#64748B', marginBottom: '6px' }}>
              FILTER TESTS BY STATUS:
            </label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {['all', 'live', 'upcoming', 'completed', 'cancelled'].map((st) => (
                <button
                  key={st}
                  onClick={() => setTestFilter(st)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: '1px solid',
                    borderColor: testFilter === st ? '#2563EB' : '#E2E8F0',
                    background: testFilter === st ? '#EFF6FF' : '#FFFFFF',
                    color: testFilter === st ? '#2563EB' : '#64748B',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {st.charAt(0).toUpperCase() + st.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Selected Test Context Card */}
        {currentTest && (
          <div
            style={{
              marginTop: '16px',
              padding: '12px 16px',
              background: '#F8FAFC',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span
                style={{
                  background:
                    (currentTest.computedStatus || currentTest.status) === 'live'
                      ? '#ECFDF5'
                      : (currentTest.computedStatus || currentTest.status) === 'upcoming'
                      ? '#EEF2FF'
                      : '#F1F5F9',
                  color:
                    (currentTest.computedStatus || currentTest.status) === 'live'
                      ? '#059669'
                      : (currentTest.computedStatus || currentTest.status) === 'upcoming'
                      ? '#4F46E5'
                      : '#64748B',
                  padding: '4px 10px',
                  borderRadius: '999px',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  border: '1px solid rgba(0,0,0,0.06)'
                }}
              >
                {String(currentTest.computedStatus || currentTest.status || 'SCHEDULED').toUpperCase()}
              </span>

              <div>
                <strong style={{ fontSize: '0.92rem', color: '#0F172A' }}>{currentTest.title}</strong>
                <span style={{ fontSize: '0.78rem', color: '#64748B', marginLeft: '10px' }}>
                  {currentTest.category} • {currentTest.difficulty} •{' '}
                  {currentTest.duration_minutes || Math.round((currentTest.duration || 60) / 60)} min
                </span>
              </div>
            </div>

            <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
              Scheduled: <strong>{formatDateTime(currentTest.starts_at)}</strong> to{' '}
              <strong>{formatDateTime(currentTest.ends_at)}</strong>
            </div>
          </div>
        )}
      </div>

      {/* Summary KPI Statistics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '18px 22px', border: '1px solid #E2E8F0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Users size={15} color="#2563EB" /> TOTAL USER ATTEMPTS
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#0F172A', marginTop: '4px' }}>
            {summaryMetrics.total}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: '2px' }}>
            Verified attempts completed
          </div>
        </div>

        <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '18px 22px', border: '1px solid #E2E8F0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Trophy size={15} color="#F59E0B" /> TOP TYPING SPEED
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#2563EB', marginTop: '4px' }}>
            {summaryMetrics.topWpm} <span style={{ fontSize: '1rem', fontWeight: 700 }}>WPM</span>
          </div>
          <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: '2px' }}>
            Fastest recorded test speed
          </div>
        </div>

        <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '18px 22px', border: '1px solid #E2E8F0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Timer size={15} color="#3B82F6" /> AVERAGE SPEED
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#0F172A', marginTop: '4px' }}>
            {summaryMetrics.avgWpm} <span style={{ fontSize: '1rem', fontWeight: 700 }}>WPM</span>
          </div>
          <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: '2px' }}>
            Cohort mean velocity
          </div>
        </div>

        <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '18px 22px', border: '1px solid #E2E8F0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 size={15} color="#10B981" /> AVERAGE ACCURACY
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#059669', marginTop: '4px' }}>
            {summaryMetrics.avgAccuracy}%
          </div>
          <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: '2px' }}>
            Cohort mean precision
          </div>
        </div>
      </div>

      {/* Main Results Table Card */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          overflow: 'hidden'
        }}
      >
        {/* Table Filters & Search Bar */}
        <div
          style={{
            padding: '18px 22px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '260px' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: '340px' }}>
              <Search
                size={16}
                color="#94A3B8"
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="text"
                placeholder="Search by typist name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px 9px 36px',
                  borderRadius: '10px',
                  border: '1px solid #E2E8F0',
                  fontSize: '0.84rem',
                  outline: 'none',
                  background: '#F8FAFC'
                }}
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '9px 12px',
                borderRadius: '10px',
                border: '1px solid #E2E8F0',
                background: '#FFFFFF',
                fontSize: '0.82rem',
                color: '#475569',
                fontWeight: 600,
                outline: 'none'
              }}
            >
              <option value="all">All Completion States</option>
              <option value="completed">Completed Only</option>
              <option value="timed_out">Timed Out Only</option>
            </select>
          </div>

          <div style={{ fontSize: '0.82rem', color: '#64748B', fontWeight: 600 }}>
            Showing {paginatedAttempts.length} of {processedAttempts.length} user results
          </div>
        </div>

        {/* Results Table */}
        {loadingAttempts ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94A3B8' }}>
            <RotateCw size={28} className="spin" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontWeight: 700, color: '#334155' }}>Loading user attempt results...</div>
            <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>Querying secure Supabase database telemetry</div>
          </div>
        ) : processedAttempts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748B' }}>
            <Users size={44} color="#CBD5E1" style={{ margin: '0 auto 12px' }} />
            <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1E293B', margin: '0 0 6px 0' }}>
              No Attempts Recorded Yet
            </h4>
            <p style={{ fontSize: '0.84rem', color: '#64748B', margin: 0, maxWidth: '440px', marginInline: 'auto' }}>
              {currentTest
                ? `No participants have completed "${currentTest.title}". As users attempt this scheduled challenge, verified results will appear here in real time.`
                : 'Please select a scheduled test to inspect results.'}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 700, width: '60px' }}>Rank</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Typist (Name & Email)</th>
                  <th
                    style={{ padding: '12px 16px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
                    onClick={() => handleSort('wpm')}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      Speed (WPM)
                      {sortField === 'wpm' && (sortDirection === 'desc' ? <ArrowDown size={14} /> : <ArrowUp size={14} />)}
                    </span>
                  </th>
                  <th
                    style={{ padding: '12px 16px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
                    onClick={() => handleSort('accuracy')}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      Accuracy
                      {sortField === 'accuracy' && (sortDirection === 'desc' ? <ArrowDown size={14} /> : <ArrowUp size={14} />)}
                    </span>
                  </th>
                  <th
                    style={{ padding: '12px 16px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
                    onClick={() => handleSort('errors')}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      Errors
                      {sortField === 'errors' && (sortDirection === 'desc' ? <ArrowDown size={14} /> : <ArrowUp size={14} />)}
                    </span>
                  </th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Characters</th>
                  <th
                    style={{ padding: '12px 16px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
                    onClick={() => handleSort('score')}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      Final Score
                      {sortField === 'score' && (sortDirection === 'desc' ? <ArrowDown size={14} /> : <ArrowUp size={14} />)}
                    </span>
                  </th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Duration & Status</th>
                  <th
                    style={{ padding: '12px 16px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
                    onClick={() => handleSort('created_at')}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      Completed At
                      {sortField === 'created_at' && (sortDirection === 'desc' ? <ArrowDown size={14} /> : <ArrowUp size={14} />)}
                    </span>
                  </th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedAttempts.map((attempt) => {
                  const finalScore = attempt.score ?? Math.round((attempt.wpm || 0) * ((attempt.accuracy || 100) / 100));
                  const isTop3 = attempt.rank <= 3;

                  return (
                    <tr
                      key={attempt.id}
                      style={{
                        borderBottom: '1px solid #F1F5F9',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      {/* Rank Column */}
                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '26px',
                            height: '26px',
                            borderRadius: '8px',
                            fontWeight: 800,
                            fontSize: '0.78rem',
                            background:
                              attempt.rank === 1
                                ? '#FEF3C7'
                                : attempt.rank === 2
                                ? '#F1F5F9'
                                : attempt.rank === 3
                                ? '#FFEDD5'
                                : 'transparent',
                            color:
                              attempt.rank === 1
                                ? '#B45309'
                                : attempt.rank === 2
                                ? '#475569'
                                : attempt.rank === 3
                                ? '#C2410C'
                                : '#64748B',
                            border: isTop3 ? '1px solid rgba(0,0,0,0.1)' : 'none'
                          }}
                        >
                          #{attempt.rank}
                        </span>
                      </td>

                      {/* User Name & Email */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>{attempt.user_name || 'Typist'}</span>
                          {attempt.user_email && (
                            <span
                              style={{
                                background: '#EFF6FF',
                                color: '#2563EB',
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                padding: '1px 6px',
                                borderRadius: '4px'
                              }}
                            >
                              USER
                            </span>
                          )}
                        </div>
                        {attempt.user_email ? (
                          <div style={{ fontSize: '0.76rem', color: '#2563EB', marginTop: '2px' }}>
                            {attempt.user_email}
                          </div>
                        ) : (
                          <div style={{ fontSize: '0.74rem', color: '#94A3B8', marginTop: '2px' }}>
                            Guest Session
                          </div>
                        )}
                      </td>

                      {/* Speed (WPM) */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 800, color: '#2563EB', fontSize: '1rem' }}>
                          {attempt.wpm} <span style={{ fontSize: '0.74rem', fontWeight: 600 }}>WPM</span>
                        </div>
                        {attempt.raw_wpm && attempt.raw_wpm !== attempt.wpm && (
                          <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                            Raw: {attempt.raw_wpm}
                          </div>
                        )}
                      </td>

                      {/* Accuracy */}
                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            fontWeight: 800,
                            color: attempt.accuracy >= 98 ? '#059669' : attempt.accuracy >= 92 ? '#2563EB' : '#D97706'
                          }}
                        >
                          {attempt.accuracy}%
                        </span>
                      </td>

                      {/* Errors */}
                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            background: attempt.errors > 0 ? '#FEE2E2' : '#F0FDF4',
                            color: attempt.errors > 0 ? '#DC2626' : '#16A34A',
                            fontWeight: 700,
                            fontSize: '0.78rem'
                          }}
                        >
                          {attempt.errors || 0}
                        </span>
                      </td>

                      {/* Characters */}
                      <td style={{ padding: '14px 16px', color: '#475569' }}>
                        <div>
                          <strong style={{ color: '#059669' }}>{attempt.correct_characters || attempt.characters || 0}</strong>
                          <span style={{ color: '#94A3B8' }}> correct</span>
                        </div>
                        {attempt.characters > 0 && (
                          <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                            {attempt.characters} total chars
                          </div>
                        )}
                      </td>

                      {/* Final Score */}
                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            fontWeight: 800,
                            color: '#7C3AED',
                            fontSize: '0.96rem'
                          }}
                        >
                          {finalScore}
                        </span>
                      </td>

                      {/* Duration & Status */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ color: '#334155', fontWeight: 600 }}>
                          {attempt.duration || 60}s
                        </div>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            color: attempt.status === 'completed' ? '#059669' : '#D97706'
                          }}
                        >
                          {attempt.status || 'completed'}
                        </span>
                      </td>

                      {/* Date Completed */}
                      <td style={{ padding: '14px 16px', color: '#64748B', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                        {formatDateTime(attempt.completed_at || attempt.created_at)}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <button
                          onClick={() => setInspectingAttempt(attempt)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            border: '1px solid #CBD5E1',
                            background: '#FFFFFF',
                            color: '#0F172A',
                            fontWeight: 700,
                            fontSize: '0.78rem',
                            cursor: 'pointer',
                            transition: 'all 0.15s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#2563EB';
                            e.currentTarget.style.color = '#FFFFFF';
                            e.currentTarget.style.borderColor = '#2563EB';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#FFFFFF';
                            e.currentTarget.style.color = '#0F172A';
                            e.currentTarget.style.borderColor = '#CBD5E1';
                          }}
                        >
                          <Eye size={13} />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {processedAttempts.length > pageSize && (
          <div
            style={{
              padding: '14px 20px',
              borderTop: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
              Page {currentPage} of {totalPages}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                  background: currentPage === 1 ? '#F8FAFC' : '#FFFFFF',
                  color: currentPage === 1 ? '#CBD5E1' : '#334155',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                }}
              >
                Previous
              </button>

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                  background: currentPage === totalPages ? '#F8FAFC' : '#FFFFFF',
                  color: currentPage === totalPages ? '#CBD5E1' : '#334155',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Attempt Inspection Modal */}
      {inspectingAttempt && (
        <AttemptDetailInspectionModal
          attempt={inspectingAttempt}
          scheduledTest={currentTest}
          onClose={() => setInspectingAttempt(null)}
        />
      )}
    </div>
  );
}
