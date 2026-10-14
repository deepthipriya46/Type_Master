import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  CalendarClock,
  Calendar,
  Clock,
  Play,
  Trophy,
  Plus,
  Search,
  RotateCw,
  Eye,
  Edit2,
  Copy,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Users,
  Timer,
  Check,
  Info
} from 'lucide-react';
import { supabaseService } from '../../services/supabaseService';
import { adminService } from '../../services/adminService';
import ScheduledTestResultsBoard from './ScheduledTestResultsBoard';
import ScheduledTestLeaderboard from './ScheduledTestLeaderboard';

export default function AdminScheduledTestsView({
  dateRange,
  onDateRangeChange
}) {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // Top-Level Section Navigation: 'tests' | 'results' | 'leaderboard'
  const [adminSection, setAdminSection] = useState('tests');
  const [selectedTestIdForResults, setSelectedTestIdForResults] = useState(null);

  // Filters & Search
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'upcoming', 'live', 'completed', 'cancelled', 'draft'
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Drawer / Modal states
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState('create'); // 'create' | 'edit'
  const [drawerTab, setDrawerTab] = useState('basic'); // 'basic', 'schedule', 'preview'
  const [editingTestId, setEditingTestId] = useState(null);

  // Form State
  const [form, setForm] = useState({
    title: '',
    description: '',
    content: '',
    category: 'General',
    difficulty: 'Easy',
    duration_minutes: 1,
    max_participants: '',
    starts_at: '',
    ends_at: '',
    publication_status: 'published'
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // Preview Modal
  const [previewTest, setPreviewTest] = useState(null);

  // Participants / Results Modal
  const [participantsModalTest, setParticipantsModalTest] = useState(null);
  const [attemptsList, setAttemptsList] = useState([]);
  const [loadingAttempts, setLoadingAttempts] = useState(false);

  // Delete Confirmation Modal
  const [deleteConfirmTest, setDeleteConfirmTest] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  // Helper to get local ISO string formatted for datetime-local input
  const toLocalDatetimeInput = (dateObj) => {
    const pad = (n) => String(n).padStart(2, '0');
    const d = new Date(dateObj);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  // Default time window: start in 5 minutes, end in 24 hours
  const getDefaultTimeWindow = () => {
    const now = new Date();
    const start = new Date(now.getTime() + 5 * 60 * 1000);
    const end = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    return {
      starts_at: toLocalDatetimeInput(start),
      ends_at: toLocalDatetimeInput(end)
    };
  };

  // Load scheduled tests from Supabase
  const loadTests = useCallback(async (manual = false) => {
    if (manual) setIsRefreshing(true);
    setLoading(true);
    try {
      const data = await supabaseService.fetchScheduledTests();
      setTests(data || []);
    } catch (err) {
      console.warn('Error loading scheduled tests:', err);
    } finally {
      setLoading(false);
      if (manual) setIsRefreshing(false);
    }
  }, []);

  // Multi-portal Realtime listener
  useEffect(() => {
    loadTests();
    const unsubscribe = supabaseService.subscribeScheduledTests(() => {
      loadTests();
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [loadTests]);

  // Periodic status refresh (to automatically transition upcoming -> live -> completed as real time progresses)
  useEffect(() => {
    const interval = setInterval(() => {
      setTests((prev) =>
        prev.map((t) => {
          const computedStatus = supabaseService.computeTestScheduleStatus(t);
          return {
            ...t,
            computedStatus,
            isLive: computedStatus === 'live',
            isUpcoming: computedStatus === 'upcoming',
            isCompleted: computedStatus === 'completed'
          };
        })
      );
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Real database dynamic metrics
  const metrics = useMemo(() => {
    const total = tests.filter((t) => t.publication_status === 'published').length;
    const upcoming = tests.filter((t) => t.publication_status === 'published' && t.computedStatus === 'upcoming').length;
    const live = tests.filter((t) => t.publication_status === 'published' && t.computedStatus === 'live').length;
    const completed = tests.filter((t) => t.computedStatus === 'completed').length;
    const cancelled = tests.filter((t) => t.publication_status === 'cancelled').length;
    const drafts = tests.filter((t) => t.publication_status === 'draft').length;

    return { total, upcoming, live, completed, cancelled, drafts };
  }, [tests]);

  // Tab Filtering
  const filteredByTab = useMemo(() => {
    switch (activeTab) {
      case 'upcoming':
        return tests.filter((t) => t.publication_status === 'published' && t.computedStatus === 'upcoming');
      case 'live':
        return tests.filter((t) => t.publication_status === 'published' && t.computedStatus === 'live');
      case 'completed':
        return tests.filter((t) => t.computedStatus === 'completed');
      case 'cancelled':
        return tests.filter((t) => t.publication_status === 'cancelled');
      case 'draft':
        return tests.filter((t) => t.publication_status === 'draft');
      default:
        return tests;
    }
  }, [tests, activeTab]);

  // Search & Select Filters
  const filteredTests = useMemo(() => {
    return filteredByTab.filter((t) => {
      // Search by title or category
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = (t.title || '').toLowerCase().includes(q);
        const matchesCat = (t.category || '').toLowerCase().includes(q);
        const matchesDesc = (t.description || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesCat && !matchesDesc) return false;
      }

      // Category filter
      if (categoryFilter !== 'All' && t.category !== categoryFilter) {
        return false;
      }

      // Difficulty filter
      if (difficultyFilter !== 'All' && t.difficulty !== difficultyFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'All') {
        const currentStat = t.computedStatus || t.status;
        if (statusFilter === 'Draft' && t.publication_status !== 'draft') return false;
        if (statusFilter === 'Cancelled' && t.publication_status !== 'cancelled') return false;
        if (statusFilter === 'Live' && currentStat !== 'live') return false;
        if (statusFilter === 'Upcoming' && currentStat !== 'upcoming') return false;
        if (statusFilter === 'Completed' && currentStat !== 'completed') return false;
      }

      return true;
    });
  }, [filteredByTab, searchQuery, categoryFilter, difficultyFilter, statusFilter]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredTests.length / pageSize));
  const paginatedTests = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTests.slice(start, start + pageSize);
  }, [filteredTests, currentPage, pageSize]);

  // Form Handlers
  const handleOpenCreateDrawer = () => {
    const defaultWindow = getDefaultTimeWindow();
    setForm({
      title: '',
      description: '',
      content: '',
      category: 'General',
      difficulty: 'Easy',
      duration_minutes: 1,
      max_participants: '',
      starts_at: defaultWindow.starts_at,
      ends_at: defaultWindow.ends_at,
      publication_status: 'published'
    });
    setFormErrors({});
    setDrawerMode('create');
    setDrawerTab('basic');
    setEditingTestId(null);
    setIsDrawerOpen(true);
  };

  const handleOpenEditDrawer = (test) => {
    setForm({
      title: test.title || '',
      description: test.description || '',
      content: test.content || '',
      category: test.category || 'General',
      difficulty: test.difficulty || 'Easy',
      duration_minutes: test.duration_minutes || Math.round((test.duration || 60) / 60) || 1,
      max_participants: test.max_participants ? String(test.max_participants) : '',
      starts_at: test.starts_at ? toLocalDatetimeInput(test.starts_at) : '',
      ends_at: test.ends_at ? toLocalDatetimeInput(test.ends_at) : '',
      publication_status: test.publication_status || 'published'
    });
    setFormErrors({});
    setDrawerMode('edit');
    setDrawerTab('basic');
    setEditingTestId(test.id);
    setIsDrawerOpen(true);
  };

  const handleValidateForm = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Test title is required';
    if (!form.content.trim()) errs.content = 'Typing passage content is required';
    if (form.content.trim().length < 20) errs.content = 'Typing passage must be at least 20 characters';

    const dur = Number(form.duration_minutes);
    if (!dur || dur <= 0 || dur > 60) errs.duration_minutes = 'Duration must be between 1 and 60 minutes';

    if (!form.starts_at) errs.starts_at = 'Start date and time is required';
    if (!form.ends_at) errs.ends_at = 'End date and time is required';

    if (form.starts_at && form.ends_at) {
      const start = new Date(form.starts_at).getTime();
      const end = new Date(form.ends_at).getTime();
      if (end <= start) {
        errs.ends_at = 'End time must be later than the scheduled start time';
      }
    }

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmitForm = async (e) => {
    e?.preventDefault();
    if (!handleValidateForm()) {
      showToast('Please correct form validation errors.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        content: form.content.trim(),
        category: form.category,
        difficulty: form.difficulty,
        duration_minutes: Number(form.duration_minutes) || 1,
        duration: (Number(form.duration_minutes) || 1) * 60,
        max_participants: form.max_participants ? Number(form.max_participants) : null,
        starts_at: new Date(form.starts_at).toISOString(),
        ends_at: new Date(form.ends_at).toISOString(),
        publication_status: form.publication_status
      };

      if (drawerMode === 'create') {
        const res = await supabaseService.createScheduledTest(payload);
        if (res.success) {
          showToast(`Scheduled Test "${payload.title}" created successfully!`);
          setIsDrawerOpen(false);
          loadTests();
        } else {
          showToast(res.message || 'Failed to create test.');
        }
      } else {
        const res = await supabaseService.updateScheduledTest(editingTestId, payload);
        if (res.success) {
          showToast(`Test "${payload.title}" updated successfully!`);
          setIsDrawerOpen(false);
          loadTests();
        } else {
          showToast(res.message || 'Failed to update test.');
        }
      }
    } catch (err) {
      console.error('Form submission error:', err);
      showToast('Error saving test to database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // AI Passage Generation with Gemini
  const handleGenerateAiPassage = async () => {
    setIsGeneratingAi(true);
    try {
      const durSec = (Number(form.duration_minutes) || 1) * 60;
      const geminiConfig = await supabaseService.getGeminiConfig();
      const response = await fetch('/api/typing/generate-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: form.category,
          difficulty: form.difficulty,
          durationSeconds: durSec,
          apiKey: geminiConfig?.apiKey || '',
          model: geminiConfig?.model || 'gemini-2.5-flash'
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.text) {
          setForm((prev) => ({ ...prev, content: data.text }));
          showToast('Passage generated with Gemini AI!');
          return;
        }
      }
      // Fallback: prompt generation from supabaseService
      const fallbackPrompt = await supabaseService.fetchPrompt(form.category, form.difficulty, '', durSec);
      if (fallbackPrompt?.prompt?.text) {
        setForm((prev) => ({ ...prev, content: fallbackPrompt.prompt.text }));
        showToast('Generated passage from TypeMaster verified curriculum!');
      } else {
        showToast('Unable to generate passage. Please type or paste your custom text.');
      }
    } catch (err) {
      console.warn('AI generation notice:', err);
      showToast('Could not reach AI generator. You can enter the passage manually.');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Admin Actions
  const handleDuplicate = async (test) => {
    const res = await supabaseService.duplicateScheduledTest(test.id);
    if (res.success) {
      showToast(`Duplicated "${test.title}" as draft!`);
      loadTests();
    } else {
      showToast('Failed to duplicate test.');
    }
  };

  const handleDelete = (test) => {
    setDeleteConfirmTest(test);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmTest) return;
    setIsDeleting(true);
    try {
      const res = await supabaseService.deleteScheduledTest(deleteConfirmTest.id);
      if (res.success) {
        showToast(`Deleted "${deleteConfirmTest.title}".`);
        setDeleteConfirmTest(null);
        loadTests();
      } else {
        showToast('Failed to delete test.');
      }
    } catch (err) {
      console.error(err);
      showToast('Error deleting test.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelTest = async (test) => {
    if (window.confirm(`Cancel scheduled test "${test.title}"? Users will no longer be able to start it.`)) {
      await supabaseService.updateScheduledTest(test.id, {
        publication_status: 'cancelled',
        status: 'cancelled'
      });
      showToast(`"${test.title}" has been cancelled.`);
      loadTests();
    }
  };

  const handlePublishDraft = async (test) => {
    await supabaseService.updateScheduledTest(test.id, {
      publication_status: 'published',
      status: 'scheduled'
    });
    showToast(`"${test.title}" published! Live synchronization sent to User Portal.`);
    loadTests();
  };

  // Open Participants / Results Board
  const handleOpenParticipants = (test) => {
    setSelectedTestIdForResults(test.id);
    setAdminSection('results');
  };

  // Open Leaderboard for Test
  const handleOpenLeaderboard = (test) => {
    setSelectedTestIdForResults(test.id);
    setAdminSection('leaderboard');
  };

  // Export to Excel
  const handleExportExcel = () => {
    adminService.exportScheduledTestsToExcel(filteredTests, 'xlsx');
    showToast('Scheduled tests exported to Excel (.xlsx)!');
  };

  // Badge Color Styles
  const getCategoryBadgeStyle = (cat) => {
    switch (cat) {
      case 'Programming':
        return { bg: '#F3E8FF', text: '#9333EA', border: '#E9D5FF' };
      case 'Quotes':
        return { bg: '#E0F2FE', text: '#0284C7', border: '#BAE6FD' };
      case 'Science':
      case 'Science & Nature':
        return { bg: '#FEF3C7', text: '#D97706', border: '#FDE68A' };
      case 'Literature':
        return { bg: '#DCFCE7', text: '#16A34A', border: '#BBF7D0' };
      case 'Technology':
        return { bg: '#CFFAFE', text: '#0891B2', border: '#A5F3FC' };
      default:
        return { bg: '#EEF2FF', text: '#4F46E5', border: '#C7D2FE' };
    }
  };

  const getDifficultyBadgeStyle = (diff) => {
    switch (diff) {
      case 'Hard':
        return { bg: '#FEE2E2', text: '#DC2626', border: '#FECACA' };
      case 'Medium':
        return { bg: '#FEF3C7', text: '#D97706', border: '#FDE68A' };
      default:
        return { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0' };
    }
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'live':
        return { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0', label: 'Live', isLiveDot: true };
      case 'upcoming':
        return { bg: '#EEF2FF', text: '#4F46E5', border: '#C7D2FE', label: 'Upcoming' };
      case 'scheduled':
        return { bg: '#F0F9FF', text: '#0284C7', border: '#BAE6FD', label: 'Scheduled' };
      case 'completed':
        return { bg: '#F1F5F9', text: '#475569', border: '#CBD5E1', label: 'Completed' };
      case 'draft':
        return { bg: '#FEF3C7', text: '#D97706', border: '#FDE68A', label: 'Draft' };
      case 'cancelled':
        return { bg: '#FEE2E2', text: '#DC2626', border: '#FECACA', label: 'Cancelled' };
      default:
        return { bg: '#F1F5F9', text: '#64748B', border: '#E2E8F0', label: status || 'Pending' };
    }
  };

  // Format Date for Display
  const formatDateTime = (isoStr) => {
    if (!isoStr) return 'N/A';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div style={{ padding: '28px 36px', backgroundColor: '#F8FAFC', minHeight: 'calc(100vh - 70px)' }}>
      {/* Toast Notification */}
      {toastMsg && (
        <div
          style={{
            position: 'fixed',
            bottom: '28px',
            right: '28px',
            background: '#0F172A',
            color: '#FFFFFF',
            padding: '14px 22px',
            borderRadius: '12px',
            boxShadow: '0 12px 28px rgba(0,0,0,0.25)',
            zIndex: 1000,
            fontSize: '0.88rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            border: '1px solid #334155'
          }}
        >
          <CheckCircle2 size={18} color="#10B981" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '28px',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: '#2563EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)'
            }}
          >
            <CalendarClock size={24} />
          </div>
          <div>
            <h1
              style={{
                fontSize: '1.75rem',
                fontWeight: 800,
                color: '#0F172A',
                letterSpacing: '-0.4px',
                margin: 0
              }}
            >
              Scheduled Tests
            </h1>
            <p style={{ fontSize: '0.88rem', color: '#64748B', margin: '4px 0 0 0' }}>
              Create, schedule, and manage typing tests and challenges for users
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={handleExportExcel}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '10px',
              border: 'none',
              background: '#10B981',
              color: '#FFFFFF',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)',
              transition: 'background 0.15s'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#059669')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#10B981')}
          >
            <FileSpreadsheet size={16} />
            <span>Export (.xlsx)</span>
          </button>

          <button
            onClick={handleOpenCreateDrawer}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '10px',
              border: 'none',
              background: '#2563EB',
              color: '#FFFFFF',
              fontSize: '0.88rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
              transition: 'all 0.15s'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1D4ED8')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2563EB')}
          >
            <Plus size={18} />
            <span>Create Scheduled Test</span>
          </button>
        </div>
      </div>

      {/* Top Section Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: '#FFFFFF',
          padding: '6px',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          marginBottom: '26px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
          width: 'fit-content'
        }}
      >
        <button
          onClick={() => setAdminSection('tests')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '12px',
            border: 'none',
            background: adminSection === 'tests' ? '#2563EB' : 'transparent',
            color: adminSection === 'tests' ? '#FFFFFF' : '#64748B',
            fontWeight: 700,
            fontSize: '0.88rem',
            cursor: 'pointer',
            boxShadow: adminSection === 'tests' ? '0 4px 12px rgba(37, 99, 235, 0.25)' : 'none',
            transition: 'all 0.15s'
          }}
        >
          <CalendarClock size={16} />
          <span>Scheduled Tests</span>
          <span
            style={{
              fontSize: '0.74rem',
              padding: '2px 8px',
              borderRadius: '999px',
              background: adminSection === 'tests' ? 'rgba(255,255,255,0.2)' : '#F1F5F9',
              color: adminSection === 'tests' ? '#FFFFFF' : '#64748B'
            }}
          >
            {tests.length}
          </span>
        </button>

        <button
          onClick={() => {
            setAdminSection('results');
            if (!selectedTestIdForResults && tests.length > 0) {
              setSelectedTestIdForResults(tests[0].id);
            }
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '12px',
            border: 'none',
            background: adminSection === 'results' ? '#2563EB' : 'transparent',
            color: adminSection === 'results' ? '#FFFFFF' : '#64748B',
            fontWeight: 700,
            fontSize: '0.88rem',
            cursor: 'pointer',
            boxShadow: adminSection === 'results' ? '0 4px 12px rgba(37, 99, 235, 0.25)' : 'none',
            transition: 'all 0.15s'
          }}
        >
          <FileSpreadsheet size={16} />
          <span>Results Board</span>
        </button>

        <button
          onClick={() => {
            setAdminSection('leaderboard');
            if (!selectedTestIdForResults && tests.length > 0) {
              setSelectedTestIdForResults(tests[0].id);
            }
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '12px',
            border: 'none',
            background: adminSection === 'leaderboard' ? '#2563EB' : 'transparent',
            color: adminSection === 'leaderboard' ? '#FFFFFF' : '#64748B',
            fontWeight: 700,
            fontSize: '0.88rem',
            cursor: 'pointer',
            boxShadow: adminSection === 'leaderboard' ? '0 4px 12px rgba(37, 99, 235, 0.25)' : 'none',
            transition: 'all 0.15s'
          }}
        >
          <Trophy size={16} />
          <span>Leaderboard</span>
        </button>
      </div>

      {/* Scheduled Test Results Board Section */}
      {adminSection === 'results' && (
        <ScheduledTestResultsBoard
          tests={tests}
          selectedTestId={selectedTestIdForResults}
          onSelectTest={(id) => setSelectedTestIdForResults(id)}
        />
      )}

      {/* Scheduled Test Leaderboard Section */}
      {adminSection === 'leaderboard' && (
        <ScheduledTestLeaderboard
          tests={tests}
          selectedTestId={selectedTestIdForResults}
          onSelectTest={(id) => setSelectedTestIdForResults(id)}
        />
      )}

      {/* Scheduled Tests Management Section */}
      {adminSection === 'tests' && (
        <>
          {/* Dashboard Summary Cards (Row of 4 Cards) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
              gap: '18px',
              marginBottom: '28px'
            }}
          >
        {/* Card 1: Total Scheduled Tests */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            padding: '20px 22px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}
        >
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: '#EFF6FF',
              color: '#2563EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Calendar size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>
              {metrics.total}
            </div>
            <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#334155', marginTop: '2px' }}>
              Total Scheduled Tests
            </div>
            <div style={{ fontSize: '0.74rem', color: '#94A3B8', marginTop: '2px' }}>
              All scheduled and published tests
            </div>
          </div>
        </div>

        {/* Card 2: Upcoming Tests */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            padding: '20px 22px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}
        >
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: '#FAF5FF',
              color: '#9333EA',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Clock size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>
              {metrics.upcoming}
            </div>
            <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#334155', marginTop: '2px' }}>
              Upcoming Tests
            </div>
            <div style={{ fontSize: '0.74rem', color: '#94A3B8', marginTop: '2px' }}>
              Tests scheduled for future dates
            </div>
          </div>
        </div>

        {/* Card 3: Live Tests */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            padding: '20px 22px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}
        >
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: '#ECFDF5',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Play size={24} style={{ marginLeft: '2px' }} />
          </div>
          <div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>
              {metrics.live}
            </div>
            <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#334155', marginTop: '2px' }}>
              Live Tests
            </div>
            <div style={{ fontSize: '0.74rem', color: '#94A3B8', marginTop: '2px' }}>
              Currently active and available
            </div>
          </div>
        </div>

        {/* Card 4: Completed Tests */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            padding: '20px 22px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}
        >
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: '#FFFBEB',
              color: '#D97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Trophy size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>
              {metrics.completed}
            </div>
            <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#334155', marginTop: '2px' }}>
              Completed Tests
            </div>
            <div style={{ fontSize: '0.74rem', color: '#94A3B8', marginTop: '2px' }}>
              Tests that have ended
            </div>
          </div>
        </div>
      </div>

      {/* Main Container: Tests Table Card and Drawer */}
      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
        {/* Left Side: Table & Controls */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Filter Tabs matching reference mockup */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px',
              flexWrap: 'wrap'
            }}
          >
            {[
              { id: 'all', label: 'All Tests', count: tests.length },
              { id: 'upcoming', label: 'Upcoming', count: metrics.upcoming },
              { id: 'live', label: 'Live', count: metrics.live },
              { id: 'completed', label: 'Completed', count: metrics.completed },
              { id: 'cancelled', label: 'Cancelled', count: metrics.cancelled },
              { id: 'draft', label: 'Drafts', count: metrics.drafts }
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setCurrentPage(1);
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: '10px',
                    border: '1px solid',
                    borderColor: isActive ? '#2563EB' : '#E2E8F0',
                    background: isActive ? '#2563EB' : '#FFFFFF',
                    color: isActive ? '#FFFFFF' : '#475569',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  <span>{tab.label}</span>
                  <span
                    style={{
                      padding: '2px 7px',
                      borderRadius: '999px',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      background: isActive ? 'rgba(255, 255, 255, 0.25)' : '#F1F5F9',
                      color: isActive ? '#FFFFFF' : '#64748B'
                    }}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search, Select Filters, and Refresh Row */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px 16px 0 0',
              padding: '16px 20px',
              border: '1px solid #E2E8F0',
              borderBottom: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap'
            }}
          >
            {/* Search Input */}
            <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: '220px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '10px',
                  padding: '7px 12px',
                  width: '100%',
                  maxWidth: '340px'
                }}
              >
                <Search size={15} color="#94A3B8" />
                <input
                  type="text"
                  placeholder="Search tests by title or category..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
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

            {/* Filter Dropdowns */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setCurrentPage(1);
                }}
                style={{
                  padding: '7px 12px',
                  borderRadius: '9px',
                  border: '1px solid #E2E8F0',
                  background: '#F8FAFC',
                  fontSize: '0.82rem',
                  color: '#334155',
                  fontWeight: 600,
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="All">All Categories</option>
                <option value="General">General</option>
                <option value="Programming">Programming</option>
                <option value="Quotes">Quotes</option>
                <option value="Science">Science</option>
                <option value="Literature">Literature</option>
                <option value="Technology">Technology</option>
              </select>

              {/* Difficulty Filter */}
              <select
                value={difficultyFilter}
                onChange={(e) => {
                  setDifficultyFilter(e.target.value);
                  setCurrentPage(1);
                }}
                style={{
                  padding: '7px 12px',
                  borderRadius: '9px',
                  border: '1px solid #E2E8F0',
                  background: '#F8FAFC',
                  fontSize: '0.82rem',
                  color: '#334155',
                  fontWeight: 600,
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="All">All Difficulties</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                style={{
                  padding: '7px 12px',
                  borderRadius: '9px',
                  border: '1px solid #E2E8F0',
                  background: '#F8FAFC',
                  fontSize: '0.82rem',
                  color: '#334155',
                  fontWeight: 600,
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="All">All Status</option>
                <option value="Live">Live</option>
                <option value="Upcoming">Upcoming</option>
                <option value="Completed">Completed</option>
                <option value="Draft">Draft</option>
                <option value="Cancelled">Cancelled</option>
              </select>

              {/* Refresh Button */}
              <button
                onClick={() => loadTests(true)}
                title="Refresh Live Scheduled Tests"
                style={{
                  padding: '8px',
                  borderRadius: '9px',
                  border: '1px solid #E2E8F0',
                  background: '#FFFFFF',
                  color: '#475569',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <RotateCw size={15} className={isRefreshing ? 'spin' : ''} />
              </button>
            </div>
          </div>

          {/* Test Management Table */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '0 0 16px 16px',
              border: '1px solid #E2E8F0',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)'
            }}
          >
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B' }}>
                    <th style={{ padding: '12px 14px' }}>#</th>
                    <th style={{ padding: '12px 14px' }}>Test Title</th>
                    <th style={{ padding: '12px 14px' }}>Category</th>
                    <th style={{ padding: '12px 14px' }}>Difficulty</th>
                    <th style={{ padding: '12px 14px' }}>Duration</th>
                    <th style={{ padding: '12px 14px' }}>Start Date & Time</th>
                    <th style={{ padding: '12px 14px' }}>End Date & Time</th>
                    <th style={{ padding: '12px 14px' }}>Status</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center' }}>Participants</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={10} style={{ textAlign: 'center', padding: '40px 20px', color: '#94A3B8' }}>
                        <RotateCw size={24} className="spin" style={{ margin: '0 auto 8px' }} />
                        <div>Loading scheduled tests...</div>
                      </td>
                    </tr>
                  ) : paginatedTests.length === 0 ? (
                    <tr>
                      <td colSpan={10} style={{ textAlign: 'center', padding: '50px 20px', color: '#64748B' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '48px',
                              height: '48px',
                              borderRadius: '12px',
                              background: '#EFF6FF',
                              color: '#2563EB',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <CalendarClock size={24} />
                          </div>
                          <div style={{ fontWeight: 700, fontSize: '0.98rem', color: '#1E293B' }}>
                            {tests.length === 0 ? 'No Scheduled Tests Found' : 'No tests match your filter'}
                          </div>
                          <div style={{ fontSize: '0.84rem', color: '#64748B', maxWidth: '380px' }}>
                            {tests.length === 0
                              ? 'Get started by creating your first scheduled typing test for users.'
                              : 'Try adjusting your search criteria or resetting filters.'}
                          </div>
                          {tests.length === 0 ? (
                            <button
                              onClick={handleOpenCreateDrawer}
                              style={{
                                marginTop: '8px',
                                padding: '8px 16px',
                                background: '#2563EB',
                                color: '#FFFFFF',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '0.82rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}
                            >
                              <Plus size={15} />
                              <span>Create First Scheduled Test</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setActiveTab('all');
                                setSearchQuery('');
                                setCategoryFilter('All');
                                setDifficultyFilter('All');
                                setStatusFilter('All');
                              }}
                              style={{
                                marginTop: '8px',
                                padding: '6px 14px',
                                background: '#EEF2FF',
                                color: '#4F46E5',
                                border: '1px solid #C7D2FE',
                                borderRadius: '8px',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              Reset Filters
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedTests.map((t, idx) => {
                      const catStyle = getCategoryBadgeStyle(t.category);
                      const diffStyle = getDifficultyBadgeStyle(t.difficulty);
                      const currentStatus = t.computedStatus || t.status;
                      const statStyle = getStatusBadgeStyle(currentStatus);
                      const rowIndex = (currentPage - 1) * pageSize + idx + 1;

                      return (
                        <tr
                          key={t.id}
                          style={{
                            borderBottom: '1px solid #F1F5F9',
                            transition: 'background 0.15s'
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          {/* Row Number */}
                          <td style={{ padding: '14px', color: '#94A3B8', fontWeight: 600 }}>
                            {rowIndex}
                          </td>

                          {/* Test Title */}
                          <td style={{ padding: '14px' }}>
                            <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.86rem' }}>
                              {t.title}
                            </div>
                            {t.description && (
                              <div
                                style={{
                                  fontSize: '0.74rem',
                                  color: '#64748B',
                                  marginTop: '2px',
                                  maxWidth: '240px',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                {t.description}
                              </div>
                            )}
                          </td>

                          {/* Category Badge */}
                          <td style={{ padding: '14px' }}>
                            <span
                              style={{
                                padding: '3px 9px',
                                borderRadius: '6px',
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                background: catStyle.bg,
                                color: catStyle.text,
                                border: `1px solid ${catStyle.border}`
                              }}
                            >
                              {t.category || 'General'}
                            </span>
                          </td>

                          {/* Difficulty Badge */}
                          <td style={{ padding: '14px' }}>
                            <span
                              style={{
                                padding: '3px 9px',
                                borderRadius: '6px',
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                background: diffStyle.bg,
                                color: diffStyle.text,
                                border: `1px solid ${diffStyle.border}`
                              }}
                            >
                              {t.difficulty || 'Easy'}
                            </span>
                          </td>

                          {/* Duration */}
                          <td style={{ padding: '14px', color: '#334155', fontWeight: 600 }}>
                            {t.duration_minutes || Math.round((t.duration || 60) / 60)} min
                          </td>

                          {/* Start Date & Time */}
                          <td style={{ padding: '14px', color: '#475569', fontSize: '0.78rem' }}>
                            {formatDateTime(t.starts_at)}
                          </td>

                          {/* End Date & Time */}
                          <td style={{ padding: '14px', color: '#475569', fontSize: '0.78rem' }}>
                            {formatDateTime(t.ends_at)}
                          </td>

                          {/* Status Badge */}
                          <td style={{ padding: '14px' }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '3px 10px',
                                borderRadius: '999px',
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                background: statStyle.bg,
                                color: statStyle.text,
                                border: `1px solid ${statStyle.border}`
                              }}
                            >
                              {statStyle.isLiveDot && (
                                <span
                                  style={{
                                    width: '6px',
                                    height: '6px',
                                    borderRadius: '50%',
                                    background: '#10B981',
                                    boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.3)'
                                  }}
                                />
                              )}
                              <span>{statStyle.label}</span>
                            </span>
                          </td>

                          {/* Participants */}
                          <td style={{ padding: '14px', textAlign: 'center' }}>
                            <button
                              onClick={() => handleOpenParticipants(t)}
                              title="Click to view participant attempts"
                              style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                color: t.participants_count > 0 ? '#2563EB' : '#64748B',
                                textDecoration: t.participants_count > 0 ? 'underline' : 'none'
                              }}
                            >
                              {t.participants_count || 0} / {t.max_participants || '∞'}
                            </button>
                          </td>

                          {/* Actions matching reference mockup icons */}
                          <td style={{ padding: '14px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                              {/* Results Board */}
                              <button
                                onClick={() => handleOpenParticipants(t)}
                                title="View Scheduled Test Results Board"
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: '#10B981',
                                  padding: '5px',
                                  borderRadius: '6px',
                                  cursor: 'pointer'
                                }}
                              >
                                <FileSpreadsheet size={15} />
                              </button>

                              {/* Leaderboard */}
                              <button
                                onClick={() => handleOpenLeaderboard(t)}
                                title="View Challenge Leaderboard"
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: '#F59E0B',
                                  padding: '5px',
                                  borderRadius: '6px',
                                  cursor: 'pointer'
                                }}
                              >
                                <Trophy size={15} />
                              </button>

                              {/* Preview Eye */}
                              <button
                                onClick={() => setPreviewTest(t)}
                                title="Preview typing passage"
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: '#3B82F6',
                                  padding: '5px',
                                  borderRadius: '6px',
                                  cursor: 'pointer'
                                }}
                              >
                                <Eye size={15} />
                              </button>

                              {/* Edit Pen */}
                              <button
                                onClick={() => handleOpenEditDrawer(t)}
                                title="Edit test configuration"
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: '#F59E0B',
                                  padding: '5px',
                                  borderRadius: '6px',
                                  cursor: 'pointer'
                                }}
                              >
                                <Edit2 size={15} />
                              </button>

                              {/* Duplicate Copy */}
                              <button
                                onClick={() => handleDuplicate(t)}
                                title="Duplicate test"
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: '#6366F1',
                                  padding: '5px',
                                  borderRadius: '6px',
                                  cursor: 'pointer'
                                }}
                              >
                                <Copy size={15} />
                              </button>

                              {/* Delete Trash */}
                              <button
                                onClick={() => handleDelete(t)}
                                title="Delete test"
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: '#EF4444',
                                  padding: '5px',
                                  borderRadius: '6px',
                                  cursor: 'pointer'
                                }}
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            {filteredTests.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 20px',
                  borderTop: '1px solid #E2E8F0',
                  fontSize: '0.8rem',
                  color: '#64748B'
                }}
              >
                <div>
                  Showing {Math.min((currentPage - 1) * pageSize + 1, filteredTests.length)} to{' '}
                  {Math.min(currentPage * pageSize, filteredTests.length)} of {filteredTests.length} tests
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      border: '1px solid #E2E8F0',
                      background: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                      color: currentPage === 1 ? '#CBD5E1' : '#334155'
                    }}
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        border: '1px solid',
                        borderColor: currentPage === page ? '#2563EB' : '#E2E8F0',
                        background: currentPage === page ? '#2563EB' : '#FFFFFF',
                        color: currentPage === page ? '#FFFFFF' : '#334155',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        cursor: 'pointer'
                      }}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      border: '1px solid #E2E8F0',
                      background: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                      color: currentPage === totalPages ? '#CBD5E1' : '#334155'
                    }}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Create / Edit Form Drawer matching Reference Mockup */}
        {isDrawerOpen && (
          <div
            style={{
              width: '420px',
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              padding: '24px',
              flexShrink: 0
            }}
          >
            {/* Drawer Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '18px'
              }}
            >
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                {drawerMode === 'create' ? 'Create Scheduled Test' : 'Edit Scheduled Test'}
              </h2>
              <button
                onClick={() => setIsDrawerOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Tabs */}
            <div
              style={{
                display: 'flex',
                borderBottom: '1px solid #E2E8F0',
                marginBottom: '20px'
              }}
            >
              {[
                { id: 'basic', label: 'Basic Information' },
                { id: 'schedule', label: 'Schedule & Settings' },
                { id: 'preview', label: 'Preview' }
              ].map((tab) => {
                const isActive = drawerTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setDrawerTab(tab.id)}
                    style={{
                      flex: 1,
                      padding: '8px 4px',
                      background: 'transparent',
                      border: 'none',
                      borderBottom: isActive ? '2px solid #2563EB' : '2px solid transparent',
                      color: isActive ? '#2563EB' : '#64748B',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab 1: Basic Information */}
            {drawerTab === 'basic' && (
              <form onSubmit={handleSubmitForm} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Title */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                    Test Title <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter test title"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid',
                      borderColor: formErrors.title ? '#EF4444' : '#E2E8F0',
                      fontSize: '0.84rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  {formErrors.title && (
                    <div style={{ fontSize: '0.72rem', color: '#EF4444', marginTop: '3px' }}>
                      {formErrors.title}
                    </div>
                  )}
                </div>

                {/* Description */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>
                      Description <span style={{ fontSize: '0.74rem', color: '#94A3B8', fontWeight: 400 }}>(Optional)</span>
                    </label>
                    <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>{form.description.length}/300</span>
                  </div>
                  <textarea
                    rows={2}
                    maxLength={300}
                    placeholder="Enter a brief description and instructions for the test..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #E2E8F0',
                      fontSize: '0.82rem',
                      outline: 'none',
                      resize: 'vertical',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Typing Passage / Content */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>
                      Typing Passage / Content <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={handleGenerateAiPassage}
                        disabled={isGeneratingAi}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: '#EFF6FF',
                          color: '#2563EB',
                          border: '1px solid #BFDBFE',
                          borderRadius: '6px',
                          padding: '2px 8px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        <Sparkles size={12} className={isGeneratingAi ? 'spin' : ''} />
                        <span>{isGeneratingAi ? 'Generating...' : 'AI Generate'}</span>
                      </button>
                      <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>{form.content.length}/5000</span>
                    </div>
                  </div>
                  <textarea
                    rows={5}
                    maxLength={5000}
                    placeholder="Enter the typing passage for this test..."
                    value={form.content}
                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid',
                      borderColor: formErrors.content ? '#EF4444' : '#E2E8F0',
                      fontSize: '0.82rem',
                      outline: 'none',
                      resize: 'vertical',
                      lineHeight: 1.5,
                      boxSizing: 'border-box'
                    }}
                  />
                  {formErrors.content && (
                    <div style={{ fontSize: '0.72rem', color: '#EF4444', marginTop: '3px' }}>
                      {formErrors.content}
                    </div>
                  )}
                </div>

                {/* Category & Difficulty Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                      Category <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: '1px solid #E2E8F0',
                        fontSize: '0.82rem',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    >
                      <option value="General">General</option>
                      <option value="Programming">Programming</option>
                      <option value="Quotes">Quotes</option>
                      <option value="Science">Science</option>
                      <option value="Literature">Literature</option>
                      <option value="Technology">Technology</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                      Difficulty <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <select
                      value={form.difficulty}
                      onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: '1px solid #E2E8F0',
                        fontSize: '0.82rem',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                </div>

                {/* Duration & Max Participants */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                      Duration (minutes) <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={form.duration_minutes}
                      onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })}
                      placeholder="e.g. 3"
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: '1px solid',
                        borderColor: formErrors.duration_minutes ? '#EF4444' : '#E2E8F0',
                        fontSize: '0.82rem',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                      Max Participants <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 400 }}>(Optional)</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={form.max_participants}
                      onChange={(e) => setForm({ ...form, max_participants: e.target.value })}
                      placeholder="e.g. 100"
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: '1px solid #E2E8F0',
                        fontSize: '0.82rem',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setDrawerTab('schedule')}
                    style={{
                      padding: '9px 18px',
                      background: '#2563EB',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '0.84rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Next: Schedule & Settings →
                  </button>
                </div>
              </form>
            )}

            {/* Tab 2: Schedule & Settings */}
            {drawerTab === 'schedule' && (
              <form onSubmit={handleSubmitForm} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Start Date & Time */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                    Start Date & Time <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={form.starts_at}
                    onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid',
                      borderColor: formErrors.starts_at ? '#EF4444' : '#E2E8F0',
                      fontSize: '0.84rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  {formErrors.starts_at && (
                    <div style={{ fontSize: '0.72rem', color: '#EF4444', marginTop: '3px' }}>
                      {formErrors.starts_at}
                    </div>
                  )}
                </div>

                {/* End Date & Time */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                    End Date & Time <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={form.ends_at}
                    onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid',
                      borderColor: formErrors.ends_at ? '#EF4444' : '#E2E8F0',
                      fontSize: '0.84rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  {formErrors.ends_at && (
                    <div style={{ fontSize: '0.72rem', color: '#EF4444', marginTop: '3px' }}>
                      {formErrors.ends_at}
                    </div>
                  )}
                </div>

                {/* Publication Status Radios matching Reference Mockup */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                    Publication Status <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        cursor: 'pointer',
                        padding: '8px',
                        borderRadius: '8px',
                        background: form.publication_status === 'published' ? '#EFF6FF' : 'transparent',
                        border: '1px solid',
                        borderColor: form.publication_status === 'published' ? '#BFDBFE' : 'transparent'
                      }}
                    >
                      <input
                        type="radio"
                        name="pub_status"
                        checked={form.publication_status === 'published'}
                        onChange={() => setForm({ ...form, publication_status: 'published' })}
                        style={{ marginTop: '3px' }}
                      />
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1E293B' }}>
                          Publish and schedule
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#64748B' }}>
                          Test will be visible to users at the specified time window
                        </div>
                      </div>
                    </label>

                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        cursor: 'pointer',
                        padding: '8px',
                        borderRadius: '8px',
                        background: form.publication_status === 'draft' ? '#FFFBEB' : 'transparent',
                        border: '1px solid',
                        borderColor: form.publication_status === 'draft' ? '#FDE68A' : 'transparent'
                      }}
                    >
                      <input
                        type="radio"
                        name="pub_status"
                        checked={form.publication_status === 'draft'}
                        onChange={() => setForm({ ...form, publication_status: 'draft' })}
                        style={{ marginTop: '3px' }}
                      />
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1E293B' }}>
                          Save as draft
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#64748B' }}>
                          Test will not be visible to users until published
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Form Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                  <button
                    type="button"
                    onClick={() => setIsDrawerOpen(false)}
                    style={{
                      padding: '9px 16px',
                      background: '#F1F5F9',
                      color: '#475569',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '0.84rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => setDrawerTab('preview')}
                    style={{
                      padding: '9px 16px',
                      background: '#EEF2FF',
                      color: '#4F46E5',
                      border: '1px solid #C7D2FE',
                      borderRadius: '8px',
                      fontSize: '0.84rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Preview
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{
                      padding: '9px 20px',
                      background: '#2563EB',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '0.84rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)'
                    }}
                  >
                    {isSubmitting ? 'Saving...' : drawerMode === 'create' ? 'Create Test' : 'Save Changes'}
                  </button>
                </div>
              </form>
            )}

            {/* Tab 3: Preview */}
            {drawerTab === 'preview' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ background: '#F8FAFC', borderRadius: '12px', padding: '16px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', marginBottom: '6px' }}>
                    {form.title || 'Untitled Test'}
                  </div>
                  {form.description && (
                    <div style={{ fontSize: '0.82rem', color: '#64748B', marginBottom: '12px' }}>
                      {form.description}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                    <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700, background: '#EEF2FF', color: '#4F46E5' }}>
                      {form.category}
                    </span>
                    <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700, background: '#ECFDF5', color: '#059669' }}>
                      {form.difficulty}
                    </span>
                    <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700, background: '#F1F5F9', color: '#475569' }}>
                      {form.duration_minutes} min
                    </span>
                  </div>

                  <div style={{ fontSize: '0.78rem', color: '#475569', marginBottom: '10px' }}>
                    <div><strong>Starts:</strong> {form.starts_at ? new Date(form.starts_at).toLocaleString() : 'Not set'}</div>
                    <div><strong>Ends:</strong> {form.ends_at ? new Date(form.ends_at).toLocaleString() : 'Not set'}</div>
                  </div>

                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Typing Passage ({form.content.trim().split(/\s+/).filter(Boolean).length} words, {form.content.length} characters):
                  </div>
                  <div
                    style={{
                      maxHeight: '160px',
                      overflowY: 'auto',
                      padding: '10px',
                      background: '#FFFFFF',
                      borderRadius: '8px',
                      border: '1px solid #E2E8F0',
                      fontSize: '0.82rem',
                      lineHeight: 1.6,
                      color: '#1E293B',
                      fontFamily: 'monospace'
                    }}
                  >
                    {form.content || 'No passage content entered yet.'}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setDrawerTab('schedule')}
                    style={{
                      padding: '8px 14px',
                      background: '#F1F5F9',
                      color: '#475569',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitForm}
                    disabled={isSubmitting}
                    style={{
                      padding: '9px 20px',
                      background: '#2563EB',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '0.84rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {isSubmitting ? 'Saving...' : drawerMode === 'create' ? 'Create Test' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      </>
      )}

      {/* Preview Passage Modal */}
      {previewTest && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '20px'
          }}
          onClick={() => setPreviewTest(null)}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '20px',
              maxWidth: '640px',
              width: '100%',
              padding: '28px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  {previewTest.title}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                  <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 700, background: '#EEF2FF', color: '#4F46E5' }}>
                    {previewTest.category}
                  </span>
                  <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 700, background: '#ECFDF5', color: '#059669' }}>
                    {previewTest.difficulty}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
                    {previewTest.duration_minutes || Math.round((previewTest.duration || 60) / 60)} min duration
                  </span>
                </div>
              </div>

              <button
                onClick={() => setPreviewTest(null)}
                style={{
                  background: '#F1F5F9',
                  border: 'none',
                  borderRadius: '8px',
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

            {previewTest.description && (
              <p style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '14px', lineHeight: 1.5 }}>
                {previewTest.description}
              </p>
            )}

            <div
              style={{
                fontSize: '0.78rem',
                fontWeight: 700,
                color: '#64748B',
                marginBottom: '6px',
                textTransform: 'uppercase'
              }}
            >
              Exact Typing Passage ({previewTest.content?.trim().split(/\s+/).length || 0} words):
            </div>
            <div
              style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                padding: '16px',
                fontSize: '0.92rem',
                lineHeight: 1.7,
                color: '#1E293B',
                fontFamily: "'Courier New', Courier, monospace",
                maxHeight: '300px',
                overflowY: 'auto'
              }}
            >
              {previewTest.content}
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: '20px',
                paddingTop: '16px',
                borderTop: '1px solid #E2E8F0',
                fontSize: '0.8rem',
                color: '#64748B'
              }}
            >
              <div>
                <strong>Availability:</strong> {formatDateTime(previewTest.starts_at)} → {formatDateTime(previewTest.ends_at)}
              </div>
              <button
                onClick={() => setPreviewTest(null)}
                style={{
                  padding: '8px 18px',
                  background: '#0F172A',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Participants & Results Modal */}
      {participantsModalTest && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '20px'
          }}
          onClick={() => setParticipantsModalTest(null)}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '20px',
              maxWidth: '700px',
              width: '100%',
              padding: '28px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Participant Results: {participantsModalTest.title}
                </h3>
                <div style={{ fontSize: '0.82rem', color: '#64748B', marginTop: '2px' }}>
                  Total attempts completed: {attemptsList.length}
                </div>
              </div>
              <button
                onClick={() => setParticipantsModalTest(null)}
                style={{
                  background: '#F1F5F9',
                  border: 'none',
                  borderRadius: '8px',
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

            {loadingAttempts ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#94A3B8' }}>
                <RotateCw size={24} className="spin" style={{ margin: '0 auto 8px' }} />
                <div>Loading attempts...</div>
              </div>
            ) : attemptsList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748B' }}>
                <Users size={36} color="#94A3B8" style={{ margin: '0 auto 8px' }} />
                <div style={{ fontWeight: 700, color: '#1E293B', fontSize: '0.95rem' }}>No participants yet</div>
                <div style={{ fontSize: '0.82rem', color: '#64748B', marginTop: '4px' }}>
                  Users who complete this scheduled challenge will have their speed and accuracy scores recorded here.
                </div>
              </div>
            ) : (
              <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B' }}>
                      <th style={{ padding: '10px 12px' }}>Typist</th>
                      <th style={{ padding: '10px 12px' }}>Speed</th>
                      <th style={{ padding: '10px 12px' }}>Accuracy</th>
                      <th style={{ padding: '10px 12px' }}>Errors</th>
                      <th style={{ padding: '10px 12px' }}>Completed At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attemptsList.map((a, i) => (
                      <tr key={a.id || i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '12px', fontWeight: 700, color: '#0F172A' }}>
                          {a.user_name || 'Typist'}
                          {a.user_email && <div style={{ fontSize: '0.74rem', color: '#94A3B8', fontWeight: 400 }}>{a.user_email}</div>}
                        </td>
                        <td style={{ padding: '12px', fontWeight: 800, color: '#2563EB' }}>
                          {a.wpm} WPM
                        </td>
                        <td style={{ padding: '12px', fontWeight: 700, color: '#059669' }}>
                          {a.accuracy}%
                        </td>
                        <td style={{ padding: '12px', color: '#64748B' }}>
                          {a.errors || 0}
                        </td>
                        <td style={{ padding: '12px', color: '#64748B', fontSize: '0.78rem' }}>
                          {formatDateTime(a.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button
                onClick={() => setParticipantsModalTest(null)}
                style={{
                  padding: '8px 18px',
                  background: '#0F172A',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmTest && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '20px'
          }}
          onClick={() => !isDeleting && setDeleteConfirmTest(null)}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              maxWidth: '440px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid #FEE2E2',
              animation: 'fadeIn 0.2s ease-out'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: '#FEE2E2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#DC2626',
                  flexShrink: 0
                }}
              >
                <Trash2 size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>
                  Delete Scheduled Test
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#64748B' }}>
                  Permanently remove from database & typists
                </p>
              </div>
            </div>

            <p style={{ fontSize: '0.88rem', color: '#334155', lineHeight: 1.5, margin: '0 0 20px' }}>
              Are you sure you want to delete <strong style={{ color: '#0F172A' }}>"{deleteConfirmTest.title}"</strong>?
              This will remove the test and its results from the database. This action cannot be undone.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteConfirmTest(null)}
                style={{
                  padding: '9px 18px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  color: '#475569',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: isDeleting ? 'not-allowed' : 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                style={{
                  padding: '9px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#DC2626',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {isDeleting ? (
                  <>
                    <RotateCw size={14} className="spin" /> Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={14} /> Delete Test
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
