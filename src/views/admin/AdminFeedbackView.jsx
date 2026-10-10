import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  MessageSquare,
  Star,
  CheckCircle2,
  Trash2,
  AlertCircle,
  Filter,
  Reply,
  X,
  Search,
  RefreshCw,
  Clock,
  ShieldCheck,
  Eye,
  Image as ImageIcon,
  Inbox,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Send,
  Check,
  FileSpreadsheet
} from 'lucide-react';
import { adminService, isDateInPeriod } from '../../services/adminService';
import { supabaseService } from '../../services/supabaseService';

export default function AdminFeedbackView({ dateRange = 'All Time', onDateRangeChange }) {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters and Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterRating, setFilterRating] = useState('All');

  // Response Modal State
  const [replyModalItem, setReplyModalItem] = useState(null);
  const [replyNote, setReplyNote] = useState('');
  const [replyStatus, setReplyStatus] = useState('Resolved');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  // Lightbox Modal for Attachment
  const [lightboxImage, setLightboxImage] = useState(null);

  // Toast notification
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  // Load Live Feedback from Supabase & local sync (Purging any mock/sample data)
  const loadLiveFeedback = useCallback(async (manual = false) => {
    if (manual) setIsRefreshing(true);
    try {
      const liveList = await adminService.fetchFeedbackLive();
      setFeedback(liveList || []);
    } catch (err) {
      console.warn('Error loading admin feedback:', err);
    } finally {
      setLoading(false);
      if (manual) setTimeout(() => setIsRefreshing(false), 500);
    }
  }, []);

  // Mount & Real-time Subscription
  useEffect(() => {
    loadLiveFeedback();

    // Subscribe to live two-way updates across Supabase & cross-portal broadcasts
    const unsubscribe = supabaseService.subscribeToAdminFeedback((payload) => {
      loadLiveFeedback();
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [loadLiveFeedback]);

  // Statistics derived strictly from real live data
  const totalCount = feedback.length;
  const pendingCount = feedback.filter(
    (f) => f.status === 'Pending' || f.status === 'Received' || !f.status
  ).length;
  const inProgressCount = feedback.filter((f) => f.status === 'In Progress' || f.status === 'Reviewed').length;
  const resolvedCount = feedback.filter((f) => f.status === 'Resolved').length;

  const ratedItems = feedback.filter((f) => f.rating && Number(f.rating) > 0);
  const averageRating =
    ratedItems.length > 0
      ? (ratedItems.reduce((acc, curr) => acc + Number(curr.rating), 0) / ratedItems.length).toFixed(1)
      : null;

  // Filtered list
  const filtered = useMemo(() => {
    return feedback.filter((f) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesUser = (f.userName || '').toLowerCase().includes(q);
        const matchesEmail = (f.userEmail || '').toLowerCase().includes(q);
        const matchesSubject = (f.subject || '').toLowerCase().includes(q);
        const matchesMessage = (f.message || f.comment || '').toLowerCase().includes(q);
        if (!matchesUser && !matchesEmail && !matchesSubject && !matchesMessage) {
          return false;
        }
      }

      // Category
      if (filterCategory !== 'All' && f.category !== filterCategory) {
        return false;
      }

      // Status
      if (filterStatus !== 'All') {
        if (filterStatus === 'Pending' && (f.status === 'Pending' || f.status === 'Received' || !f.status)) {
          // matches
        } else if (filterStatus === 'Reviewed' && (f.status === 'Reviewed' || f.status === 'In Progress')) {
          // matches
        } else if (f.status !== filterStatus) {
          return false;
        }
      }

      // Rating
      if (filterRating !== 'All') {
        const r = Number(f.rating) || 0;
        if (filterRating === '5' && r !== 5) return false;
        if (filterRating === '4' && r !== 4) return false;
        if (filterRating === '3' && r !== 3) return false;
        if (filterRating === '1-2' && (r < 1 || r > 2)) return false;
        if (filterRating === 'unrated' && r > 0) return false;
      }

      // Date Range filter
      if (dateRange && dateRange !== 'All Time') {
        const itemDate = f.created_at || f.date;
        if (!isDateInPeriod(itemDate, dateRange)) {
          return false;
        }
      }

      return true;
    });
  }, [feedback, searchQuery, filterCategory, filterStatus, filterRating, dateRange]);

  // Handle Quick Status Updates
  const handleQuickStatus = async (item, newStatus) => {
    try {
      await adminService.respondToFeedback(
        item.id,
        item.admin_response || item.adminReply || '',
        newStatus
      );
      loadLiveFeedback();
      showToast(`Feedback from ${item.userName} marked as ${newStatus}.`);
    } catch (err) {
      showToast('Failed to update status.');
    }
  };

  // Open Reply Modal
  const handleOpenReplyModal = (item) => {
    setReplyModalItem(item);
    setReplyNote(item.admin_response || item.adminReply || '');
    setReplyStatus(item.status === 'Pending' ? 'Resolved' : item.status || 'Resolved');
  };

  // Save Reply & Send to User
  const handleSaveReply = async (e) => {
    e.preventDefault();
    if (!replyModalItem) return;

    setIsSubmittingReply(true);
    try {
      await adminService.respondToFeedback(replyModalItem.id, replyNote, replyStatus);
      await loadLiveFeedback();
      showToast(`Response sent! User portal updated in real-time.`);
      setReplyModalItem(null);
    } catch (err) {
      console.error('Error sending reply:', err);
      showToast('Error saving response. Please try again.');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  // Delete Feedback
  const handleDelete = async (item) => {
    if (window.confirm(`Permanently delete feedback from ${item.userName}?`)) {
      try {
        await adminService.deleteFeedback(item.id);
        await loadLiveFeedback();
        showToast('Feedback record removed.');
      } catch (err) {
        showToast('Error deleting feedback.');
      }
    }
  };

  const handleExportFeedback = () => {
    const listToExport = filtered && filtered.length > 0 ? filtered : feedback;
    if (!listToExport || listToExport.length === 0) {
      showToast('No feedback records to export.');
      return;
    }
    adminService.exportFeedbackToExcel(listToExport);
    showToast('User feedback records exported to Excel (.xlsx)!');
  };

  // Category Badge Colors
  const getCategoryBadge = (cat) => {
    switch (cat) {
      case 'Bug Report':
        return { bg: '#FEF2F2', color: '#DC2626', border: '#FECACA' };
      case 'Feature Request':
        return { bg: '#FAF5FF', color: '#9333EA', border: '#E9D5FF' };
      case 'Suggestion':
        return { bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE' };
      case 'Appreciation':
        return { bg: '#FFFBEB', color: '#D97706', border: '#FDE68A' };
      default:
        return { bg: '#F1F5F9', color: '#475569', border: '#CBD5E1' };
    }
  };

  // Status Badge Colors
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Resolved':
        return { bg: '#ECFDF5', color: '#059669', border: '#A7F3D0' };
      case 'In Progress':
        return { bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE' };
      case 'Reviewed':
        return { bg: '#EEF2FF', color: '#4F46E5', border: '#C7D2FE' };
      default:
        return { bg: '#FFFBEB', color: '#D97706', border: '#FDE68A' };
    }
  };

  // Quick Reply Template Presets
  const quickTemplates = [
    'Thank you for your feedback! We have resolved this issue.',
    'Great suggestion! We have added this to our upcoming release roadmap.',
    'Thank you for reporting this typo. The typing passage has been corrected.',
    'We appreciate the kind words and support! Happy typing!'
  ];

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
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <CheckCircle2 size={18} color="#10B981" />
          {toastMsg}
        </div>
      )}

      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
            <h1
              style={{
                fontSize: '1.75rem',
                fontWeight: 800,
                color: '#0F172A',
                letterSpacing: '-0.4px',
                margin: 0
              }}
            >
              Feedback & User Support
            </h1>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: '#ECFDF5',
                color: '#059669',
                padding: '4px 10px',
                borderRadius: '999px',
                fontSize: '0.74rem',
                fontWeight: 700,
                border: '1px solid #A7F3D0'
              }}
            >
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: '#10B981',
                  boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.3)'
                }}
              />
              Live Telemetry Active
            </div>
          </div>
          <p style={{ fontSize: '0.88rem', color: '#64748B', margin: 0 }}>
            Real-time user feedback, bug reports, feature requests, and inquiries submitted from the User Portal
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handleExportFeedback}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 16px',
              borderRadius: '10px',
              border: 'none',
              background: '#10B981',
              color: '#FFFFFF',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)',
              transition: 'background 0.15s'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#059669')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#10B981')}
          >
            <FileSpreadsheet size={15} />
            <span>Export Feedback (.xlsx)</span>
          </button>

          <button
            onClick={() => loadLiveFeedback(true)}
            disabled={isRefreshing}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 16px',
              borderRadius: '10px',
              border: '1px solid #E2E8F0',
              background: '#FFFFFF',
              color: '#1E293B',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              transition: 'all 0.15s'
            }}
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            {isRefreshing ? 'Syncing...' : 'Refresh Feed'}
          </button>
        </div>
      </div>

      {/* Real-time Statistics Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}
      >
        {/* Card 1: Total */}
        <div style={statCardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={statLabelStyle}>Total Submissions</span>
            <div style={statIconBox('#EFF6FF', '#2563EB')}>
              <MessageSquare size={18} />
            </div>
          </div>
          <div style={statValueStyle}>{totalCount}</div>
          <div style={statSubStyle}>Actual user inquiries</div>
        </div>

        {/* Card 2: Pending */}
        <div style={statCardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={statLabelStyle}>Pending Review</span>
            <div style={statIconBox('#FFFBEB', '#D97706')}>
              <AlertCircle size={18} />
            </div>
          </div>
          <div style={{ ...statValueStyle, color: pendingCount > 0 ? '#D97706' : '#0F172A' }}>
            {pendingCount}
          </div>
          <div style={statSubStyle}>Awaiting admin response</div>
        </div>

        {/* Card 3: In Progress */}
        <div style={statCardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={statLabelStyle}>In Progress</span>
            <div style={statIconBox('#EEF2FF', '#4F46E5')}>
              <Clock size={18} />
            </div>
          </div>
          <div style={statValueStyle}>{inProgressCount}</div>
          <div style={statSubStyle}>Under active investigation</div>
        </div>

        {/* Card 4: Resolved */}
        <div style={statCardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={statLabelStyle}>Resolved</span>
            <div style={statIconBox('#ECFDF5', '#059669')}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div style={{ ...statValueStyle, color: '#059669' }}>{resolvedCount}</div>
          <div style={statSubStyle}>Closed with admin response</div>
        </div>

        {/* Card 5: Rating */}
        <div style={statCardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={statLabelStyle}>Avg User Rating</span>
            <div style={statIconBox('#FEF3C7', '#D97706')}>
              <Star size={18} />
            </div>
          </div>
          <div style={{ ...statValueStyle, color: '#D97706' }}>
            {averageRating ? `${averageRating} / 5.0` : '—'}
          </div>
          <div style={statSubStyle}>{ratedItems.length} rated responses</div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          padding: '16px 20px',
          border: '1px solid #E2E8F0',
          marginBottom: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          flexWrap: 'wrap'
        }}
      >
        {/* Search Input */}
        <div style={{ position: 'relative', flex: '1 1 240px', minWidth: '220px' }}>
          <Search
            size={16}
            color="#94A3B8"
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            placeholder="Search user, email, subject, keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              borderRadius: '10px',
              border: '1px solid #E2E8F0',
              fontSize: '0.84rem',
              color: '#1E293B',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Category Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>Category:</span>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            style={selectStyle}
          >
            <option value="All">All Categories</option>
            <option value="General Feedback">General Feedback</option>
            <option value="Bug Report">Bug Report</option>
            <option value="Feature Request">Feature Request</option>
            <option value="Suggestion">Suggestion</option>
            <option value="Appreciation">Appreciation</option>
          </select>
        </div>

        {/* Status Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>Status:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={selectStyle}
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Reviewed">Reviewed</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>

        {/* Rating Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>Rating:</span>
          <select
            value={filterRating}
            onChange={(e) => setFilterRating(e.target.value)}
            style={selectStyle}
          >
            <option value="All">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="1-2">1-2 Stars</option>
            <option value="unrated">Unrated</option>
          </select>
        </div>

        {/* Reset button if filtered */}
        {(searchQuery || filterCategory !== 'All' || filterStatus !== 'All' || filterRating !== 'All') && (
          <button
            onClick={() => {
              setSearchQuery('');
              setFilterCategory('All');
              setFilterStatus('All');
              setFilterRating('All');
            }}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              border: 'none',
              background: '#F1F5F9',
              color: '#475569',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            padding: '60px 24px',
            textAlign: 'center',
            border: '1px solid #E2E8F0'
          }}
        >
          <RefreshCw size={24} className="animate-spin" color="#4F46E5" style={{ margin: '0 auto 12px' }} />
          <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#1E293B' }}>
            Loading Live Feedback...
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '4px' }}>
            Connecting to Supabase telemetry feed
          </div>
        </div>
      ) : feedback.length === 0 ? (
        /* Empty State: Zero Feedback submitted yet */
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            padding: '70px 32px',
            textAlign: 'center',
            border: '1px solid #E2E8F0',
            boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              background: '#EFF6FF',
              color: '#3B82F6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 18px',
              border: '1px solid #DBEAFE'
            }}
          >
            <Inbox size={30} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', margin: '0 0 8px 0' }}>
            No User Feedback Yet
          </h3>
          <p
            style={{
              fontSize: '0.88rem',
              color: '#64748B',
              maxWidth: '460px',
              margin: '0 auto 20px',
              lineHeight: 1.6
            }}
          >
            All sample data has been removed. Live user submissions, bug reports, passage typo reports, and
            feature suggestions submitted in the User Portal will appear here instantly.
          </p>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              background: '#F8FAFC',
              borderRadius: '999px',
              border: '1px solid #E2E8F0',
              fontSize: '0.78rem',
              color: '#475569',
              fontWeight: 600
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#10B981',
                boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.2)'
              }}
            />
            Realtime Listener is actively waiting for user submissions
          </div>
        </div>
      ) : filtered.length === 0 ? (
        /* No matches for active filters */
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            padding: '50px 24px',
            textAlign: 'center',
            border: '1px solid #E2E8F0'
          }}
        >
          <Filter size={28} color="#94A3B8" style={{ margin: '0 auto 12px' }} />
          <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0F172A', margin: '0 0 6px 0' }}>
            No Feedback Matches Current Filters
          </h4>
          <p style={{ fontSize: '0.84rem', color: '#64748B', margin: '0 0 16px 0' }}>
            Try clearing or adjusting your search keyword and filter criteria.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setFilterCategory('All');
              setFilterStatus('All');
              setFilterRating('All');
            }}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
              background: '#FFFFFF',
              color: '#2563EB',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        /* Feedback Card List */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filtered.map((item) => {
            const catBadge = getCategoryBadge(item.category);
            const statusBadge = getStatusBadge(item.status);
            const initial = (item.userName || 'T').charAt(0).toUpperCase();

            return (
              <div
                key={item.id}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '18px',
                  border: '1px solid #E2E8F0',
                  padding: '22px 26px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                  transition: 'transform 0.15s, box-shadow 0.15s'
                }}
              >
                {/* Header Row: User Info, Category, Status, Rating, Date */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '14px',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {/* User Avatar */}
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #3B82F6, #6366F1)',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '1rem',
                        boxShadow: '0 2px 6px rgba(59, 130, 246, 0.25)'
                      }}
                    >
                      {initial}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.98rem' }}>
                          {item.userName || 'Registered Typist'}
                        </span>
                        {item.userEmail && (
                          <span style={{ color: '#64748B', fontSize: '0.8rem' }}>{item.userEmail}</span>
                        )}
                        {!item.userEmail && (
                          <span
                            style={{
                              fontSize: '0.7rem',
                              color: '#94A3B8',
                              background: '#F1F5F9',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontWeight: 600
                            }}
                          >
                            Guest Session
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                        {/* Category Badge */}
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            background: catBadge.bg,
                            color: catBadge.color,
                            border: `1px solid ${catBadge.border}`
                          }}
                        >
                          {item.category || 'General Feedback'}
                        </span>

                        {/* Status Badge */}
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            background: statusBadge.bg,
                            color: statusBadge.color,
                            border: `1px solid ${statusBadge.border}`
                          }}
                        >
                          {item.status || 'Pending'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Rating & Timestamp */}
                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    {item.rating && Number(item.rating) > 0 ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ color: '#F59E0B', fontSize: '0.96rem', letterSpacing: '1px' }}>
                          {'★'.repeat(Number(item.rating))}
                          {'☆'.repeat(5 - Number(item.rating))}
                        </span>
                        <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#D97706' }}>
                          {item.rating}.0
                        </span>
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.74rem', color: '#94A3B8', fontStyle: 'italic' }}>
                        No Rating Given
                      </span>
                    )}

                    <span style={{ fontSize: '0.76rem', color: '#94A3B8' }}>{item.date || 'Recent'}</span>
                  </div>
                </div>

                {/* Subject Title */}
                {item.subject && (
                  <div
                    style={{
                      fontSize: '0.95rem',
                      fontWeight: 800,
                      color: '#0F172A',
                      marginBottom: '8px'
                    }}
                  >
                    {item.subject}
                  </div>
                )}

                {/* Message Body */}
                <p
                  style={{
                    fontSize: '0.88rem',
                    color: '#334155',
                    lineHeight: '1.6',
                    margin: '0 0 14px 0',
                    whiteSpace: 'pre-wrap',
                    background: '#F8FAFC',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: '1px solid #F1F5F9'
                  }}
                >
                  {item.message || item.comment || 'No additional comments provided.'}
                </p>

                {/* Attachment Thumbnail (if user uploaded a screenshot) */}
                {item.attachment_url && (
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748B', marginBottom: '6px' }}>
                      Attached Screenshot:
                    </div>
                    <div
                      onClick={() => setLightboxImage(item.attachment_url)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        background: '#EFF6FF',
                        border: '1px solid #BFDBFE',
                        color: '#2563EB',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      <ImageIcon size={14} />
                      <span>View Attached Screenshot</span>
                    </div>
                  </div>
                )}

                {/* Official Admin Response Display */}
                {(item.admin_response || item.adminReply) && (
                  <div
                    style={{
                      background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.05), rgba(37, 99, 235, 0.08))',
                      border: '1px solid rgba(99, 102, 241, 0.25)',
                      borderRadius: '12px',
                      padding: '14px 18px',
                      marginBottom: '14px'
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '6px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <ShieldCheck size={16} color="#4F46E5" />
                        <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#4F46E5' }}>
                          Official Admin Response
                        </span>
                      </div>
                      <button
                        onClick={() => handleOpenReplyModal(item)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#4F46E5',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          padding: 0
                        }}
                      >
                        Edit Reply
                      </button>
                    </div>

                    <p style={{ fontSize: '0.86rem', color: '#1E293B', margin: 0, lineHeight: 1.5 }}>
                      {item.admin_response || item.adminReply}
                    </p>
                  </div>
                )}

                {/* Bottom Action Toolbar */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '12px',
                    borderTop: '1px solid #F1F5F9',
                    flexWrap: 'wrap',
                    gap: '10px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* Quick status dropdown */}
                    <span style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>Status:</span>
                    <select
                      value={item.status || 'Pending'}
                      onChange={(e) => handleQuickStatus(item, e.target.value)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        border: '1px solid #E2E8F0',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        color: '#1E293B',
                        background: '#FFFFFF',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Reviewed">Reviewed</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* Respond / Reply Button */}
                    <button
                      onClick={() => handleOpenReplyModal(item)}
                      style={actionBtnStyle('#EEF2FF', '#4F46E5')}
                    >
                      <Reply size={14} />
                      {item.admin_response || item.adminReply ? 'Update Reply' : 'Respond / Reply'}
                    </button>

                    {/* Mark Resolved Quick Button */}
                    {item.status !== 'Resolved' && (
                      <button
                        onClick={() => handleQuickStatus(item, 'Resolved')}
                        style={actionBtnStyle('#ECFDF5', '#059669')}
                      >
                        <CheckCircle2 size={14} /> Mark Resolved
                      </button>
                    )}

                    {/* Delete button */}
                    <button
                      onClick={() => handleDelete(item)}
                      title="Delete Feedback Record"
                      style={actionBtnStyle('#FEF2F2', '#EF4444')}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Admin Response Modal */}
      {replyModalItem && (
        <div style={modalOverlayStyle}>
          <div style={modalCardStyle}>
            {/* Modal Header */}
            <div style={modalHeaderStyle}>
              <div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>
                  Respond to User Feedback
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '2px' }}>
                  Replying to <strong style={{ color: '#0F172A' }}>{replyModalItem.userName}</strong>
                </div>
              </div>
              <button
                onClick={() => setReplyModalItem(null)}
                style={closeBtnStyle}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveReply} style={{ padding: '20px 24px' }}>
              {/* Context Summary Box */}
              <div
                style={{
                  background: '#F8FAFC',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  border: '1px solid #E2E8F0',
                  marginBottom: '16px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>
                    User Subject & Feedback
                  </span>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: '#EEF2FF',
                      color: '#4F46E5'
                    }}
                  >
                    {replyModalItem.category}
                  </span>
                </div>
                <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>
                  "{replyModalItem.subject || 'Feedback'}"
                </div>
                <p style={{ fontSize: '0.82rem', color: '#64748B', margin: 0, maxHeight: '60px', overflowY: 'auto' }}>
                  {replyModalItem.message || replyModalItem.comment}
                </p>
              </div>

              {/* Status Selector */}
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Update Ticket Status</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                  {['Pending', 'Reviewed', 'In Progress', 'Resolved'].map((st) => {
                    const isSelected = replyStatus === st;
                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setReplyStatus(st)}
                        style={{
                          padding: '8px 4px',
                          borderRadius: '8px',
                          border: isSelected ? '2px solid #4F46E5' : '1px solid #E2E8F0',
                          background: isSelected ? '#EEF2FF' : '#FFFFFF',
                          color: isSelected ? '#4F46E5' : '#475569',
                          fontWeight: 700,
                          fontSize: '0.76rem',
                          cursor: 'pointer',
                          textAlign: 'center'
                        }}
                      >
                        {st}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quick Template Presets */}
              <div style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <Sparkles size={13} color="#6366F1" />
                  <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#6366F1' }}>
                    Quick Response Templates:
                  </span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {quickTemplates.map((tmpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setReplyNote(tmpl)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        background: '#F1F5F9',
                        border: '1px solid #E2E8F0',
                        color: '#475569',
                        fontSize: '0.72rem',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      {tmpl.slice(0, 32)}...
                    </button>
                  ))}
                </div>
              </div>

              {/* Admin Note / Reply Textarea */}
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>
                  Official Response Message <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Type your official reply to this user. This will be synchronized instantly to the user's portal..."
                  value={replyNote}
                  onChange={(e) => setReplyNote(e.target.value)}
                  style={inputStyle}
                />
                <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '4px' }}>
                  This message appears in the user's Feedback history and in their test review dialogs.
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setReplyModalItem(null)}
                  style={{
                    padding: '9px 16px',
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
                  disabled={isSubmittingReply || !replyNote.trim()}
                  style={{
                    padding: '9px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    background: isSubmittingReply || !replyNote.trim() ? '#94A3B8' : '#4F46E5',
                    color: '#FFFFFF',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: isSubmittingReply || !replyNote.trim() ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)'
                  }}
                >
                  {isSubmittingReply ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      Send Response & Sync
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox Modal for Screenshots */}
      {lightboxImage && (
        <div style={modalOverlayStyle} onClick={() => setLightboxImage(null)}>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#0F172A',
              borderRadius: '16px',
              padding: '16px',
              maxWidth: '850px',
              maxHeight: '90vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ color: '#FFFFFF', fontWeight: 700, fontSize: '0.9rem' }}>Attached Screenshot</span>
              <button
                onClick={() => setLightboxImage(null)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>
            <img
              src={lightboxImage}
              alt="Screenshot Preview"
              style={{
                maxWidth: '100%',
                maxHeight: '75vh',
                objectFit: 'contain',
                borderRadius: '8px'
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Styling Constants
const statCardStyle = {
  backgroundColor: '#FFFFFF',
  borderRadius: '16px',
  padding: '18px 20px',
  border: '1px solid #E2E8F0',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)'
};

const statLabelStyle = {
  fontSize: '0.78rem',
  color: '#64748B',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.3px'
};

const statIconBox = (bg, col) => ({
  width: '36px',
  height: '36px',
  borderRadius: '10px',
  background: bg,
  color: col,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
});

const statValueStyle = {
  fontSize: '1.65rem',
  fontWeight: 800,
  color: '#0F172A',
  marginTop: '8px',
  lineHeight: 1.1
};

const statSubStyle = {
  fontSize: '0.74rem',
  color: '#94A3B8',
  marginTop: '4px'
};

const selectStyle = {
  padding: '7px 12px',
  borderRadius: '8px',
  border: '1px solid #E2E8F0',
  background: '#FFFFFF',
  fontSize: '0.8rem',
  color: '#1E293B',
  fontWeight: 600,
  cursor: 'pointer',
  outline: 'none'
};

const actionBtnStyle = (bg, col) => ({
  background: bg,
  color: col,
  border: 'none',
  borderRadius: '8px',
  padding: '6px 12px',
  fontSize: '0.78rem',
  fontWeight: 700,
  display: 'inline-flex',
  alignItems: 'center',
  gap: '5px',
  cursor: 'pointer',
  transition: 'opacity 0.15s'
});

const modalOverlayStyle = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(15, 23, 42, 0.65)',
  backdropFilter: 'blur(4px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: '20px'
};

const modalCardStyle = {
  width: '100%',
  maxWidth: '520px',
  backgroundColor: '#FFFFFF',
  borderRadius: '20px',
  boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
  overflow: 'hidden'
};

const modalHeaderStyle = {
  padding: '18px 24px',
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
  cursor: 'pointer',
  padding: '4px',
  display: 'flex',
  alignItems: 'center'
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
  padding: '10px 14px',
  borderRadius: '10px',
  border: '1px solid #CBD5E1',
  fontSize: '0.86rem',
  outline: 'none',
  boxSizing: 'border-box',
  lineHeight: 1.5,
  fontFamily: 'inherit'
};
