import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  MessageSquare,
  Clock,
  CheckCircle2,
  Star,
  Send,
  RotateCcw,
  UploadCloud,
  Image as ImageIcon,
  X,
  Eye,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Sparkles,
  Inbox
} from 'lucide-react';
import { supabaseService } from '../services/supabaseService';

const CATEGORIES = [
  'General Feedback',
  'Bug Report',
  'Feature Request',
  'Suggestion',
  'Appreciation'
];

export default function FeedbackView({ user, onNavigate }) {
  const effectiveUserId = user?.id || supabaseService.getCurrentUser()?.id || 'guest_user';

  // Form states
  const [category, setCategory] = useState('General Feedback');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [attachedFile, setAttachedFile] = useState(null);
  const [attachedPreview, setAttachedPreview] = useState(null);

  // Submission & UI states
  const [loading, setLoading] = useState(false);
  const [successToast, setSuccessToast] = useState('');
  const [errorToast, setErrorToast] = useState('');

  // Real-time user feedback data
  const [feedbackList, setFeedbackList] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Modal & View Details state
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [showAllRecent, setShowAllRecent] = useState(false);

  // FAQ Accordion state
  const [expandedFaq, setExpandedFaq] = useState(null);

  // File input ref
  const fileInputRef = useRef(null);

  // Fetch real-time user feedback
  const loadFeedback = useCallback(async () => {
    if (!effectiveUserId) return;
    try {
      const records = await supabaseService.fetchUserFeedbackLive(effectiveUserId);
      setFeedbackList(records || []);
    } catch (err) {
      console.warn('Load feedback error:', err);
    } finally {
      setDataLoading(false);
    }
  }, [effectiveUserId]);

  useEffect(() => {
    loadFeedback();

    // Subscribe to live Supabase updates for this user
    const unsubscribe = supabaseService.subscribeToUserFeedback(effectiveUserId, () => {
      loadFeedback();
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [effectiveUserId, loadFeedback]);

  // Keep open feedback details modal synchronized live when admin replies
  useEffect(() => {
    if (selectedFeedback) {
      const match = feedbackList.find((f) => f.id === selectedFeedback.id);
      if (
        match &&
        (match.admin_response !== selectedFeedback.admin_response ||
          match.status !== selectedFeedback.status)
      ) {
        setSelectedFeedback(match);
      }
    }
  }, [feedbackList, selectedFeedback]);

  // Real Statistics Calculation (STRICTLY FROM USER'S REAL DATA)
  const totalCount = feedbackList.length;
  const pendingCount = feedbackList.filter(
    (f) => f.status === 'Pending' || f.status === 'Received' || !f.status
  ).length;
  const resolvedCount = feedbackList.filter((f) => f.status === 'Resolved').length;

  const ratedItems = feedbackList.filter((f) => f.rating && Number(f.rating) > 0);
  const ratedCount = ratedItems.length;
  const averageRating =
    ratedCount > 0
      ? ratedItems.reduce((acc, curr) => acc + Number(curr.rating), 0) / ratedCount
      : null;

  // Handle Screenshot Attachment
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorToast('Screenshot must be 5MB or smaller.');
      setTimeout(() => setErrorToast(''), 4000);
      return;
    }

    setAttachedFile(file);
    const previewUrl = URL.createObjectURL(file);
    setAttachedPreview(previewUrl);
  };

  const handleRemoveAttachment = () => {
    setAttachedFile(null);
    if (attachedPreview) {
      URL.revokeObjectURL(attachedPreview);
      setAttachedPreview(null);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Form Reset
  const handleReset = () => {
    setCategory('General Feedback');
    setRating(0);
    setHoverRating(0);
    setSubject('');
    setMessage('');
    handleRemoveAttachment();
    setErrorToast('');
  };

  // Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    // Validation
    const cleanSubject = subject.trim();
    const cleanMessage = message.trim();

    if (!cleanSubject) {
      setErrorToast('Please enter a subject for your feedback.');
      setTimeout(() => setErrorToast(''), 4000);
      return;
    }

    if (cleanSubject.length > 100) {
      setErrorToast('Subject must be 100 characters or fewer.');
      setTimeout(() => setErrorToast(''), 4000);
      return;
    }

    if (!cleanMessage) {
      setErrorToast('Please provide your feedback details in the message field.');
      setTimeout(() => setErrorToast(''), 4000);
      return;
    }

    if (cleanMessage.length > 500) {
      setErrorToast('Message must be 500 characters or fewer.');
      setTimeout(() => setErrorToast(''), 4000);
      return;
    }

    setLoading(true);
    setErrorToast('');

    try {
      let attachmentUrl = null;
      if (attachedFile) {
        attachmentUrl = await supabaseService.uploadFeedbackAttachment(
          attachedFile,
          effectiveUserId
        );
      }

      const res = await supabaseService.submitFeedback({
        userId: effectiveUserId,
        userName: user?.username || user?.displayName || 'Typist',
        userEmail: user?.email || '',
        category,
        subject: cleanSubject,
        message: cleanMessage,
        rating: rating > 0 ? rating : null,
        attachmentUrl
      });

      if (res?.success) {
        setSuccessToast('Thank you! Your feedback has been submitted successfully.');
        setTimeout(() => setSuccessToast(''), 4500);
        handleReset();
        await loadFeedback();
      } else {
        setErrorToast('Failed to submit feedback. Please try again.');
        setTimeout(() => setErrorToast(''), 4000);
      }
    } catch (err) {
      console.error('Submission error:', err);
      setErrorToast(err.message || 'An error occurred while submitting feedback.');
      setTimeout(() => setErrorToast(''), 4000);
    } finally {
      setLoading(false);
    }
  };

  // Helper badge styles
  const getTypeBadgeStyle = (cat) => {
    switch (cat) {
      case 'Suggestion':
        return { background: '#1E3A8A', color: '#93C5FD', border: '1px solid rgba(147, 197, 253, 0.25)' };
      case 'Bug Report':
        return { background: '#831843', color: '#F472B6', border: '1px solid rgba(244, 114, 182, 0.25)' };
      case 'Appreciation':
        return { background: '#4C1D95', color: '#C084FC', border: '1px solid rgba(192, 132, 252, 0.25)' };
      case 'Feature Request':
        return { background: '#1E1B4B', color: '#818CF8', border: '1px solid rgba(129, 140, 248, 0.25)' };
      default:
        return { background: '#334155', color: '#CBD5E1', border: '1px solid rgba(203, 213, 225, 0.25)' };
    }
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'Resolved':
        return { background: '#064E3B', color: '#34D399', border: '1px solid rgba(52, 211, 153, 0.25)' };
      case 'In Progress':
        return { background: '#78350F', color: '#FBBF24', border: '1px solid rgba(251, 191, 36, 0.25)' };
      default:
        return { background: '#1E293B', color: '#94A3B8', border: '1px solid rgba(148, 163, 184, 0.25)' };
    }
  };

  const displayedList = showAllRecent ? feedbackList : feedbackList.slice(0, 5);

  const faqs = [
    {
      id: 1,
      question: 'How long does it take to get a response?',
      answer: 'We usually respond within 1-2 business days.'
    },
    {
      id: 2,
      question: 'What kind of feedback can I give?',
      answer: 'You can share suggestions, report bugs, request new features, or give general feedback.'
    },
    {
      id: 3,
      question: 'Can I attach a screenshot?',
      answer: 'Yes, you can attach an image to help us understand the issue better.'
    },
    {
      id: 4,
      question: 'Will I be notified about the status of my feedback?',
      answer: 'Yes, you can check the status in the "My Recent Feedback" section.'
    }
  ];

  return (
    <div
      style={{
        backgroundColor: '#070D1D',
        minHeight: 'calc(100vh - 65px)',
        padding: '24px 32px',
        color: '#FFFFFF',
        fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif"
      }}
    >
      {/* Toast Notification Alert */}
      {successToast && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: 'linear-gradient(135deg, #065F46, #047857)',
            border: '1px solid #10B981',
            color: '#FFFFFF',
            padding: '14px 20px',
            borderRadius: '12px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
            zIndex: 1000,
            fontSize: '0.88rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <CheckCircle2 size={18} color="#34D399" />
          <span>{successToast}</span>
        </div>
      )}

      {errorToast && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: '#7F1D1D',
            border: '1px solid #EF4444',
            color: '#FFFFFF',
            padding: '14px 20px',
            borderRadius: '12px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
            zIndex: 1000,
            fontSize: '0.88rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <AlertCircle size={18} color="#F87171" />
          <span>{errorToast}</span>
        </div>
      )}

      {/* ==================================================== */}
      {/* TOP HEADER CARD: Matching Reference Screenshot */}
      {/* ==================================================== */}
      <div
        style={{
          background: 'linear-gradient(135deg, #111C38 0%, #0F172A 100%)',
          border: '1px solid #1E294B',
          borderRadius: '18px',
          padding: '24px 28px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Left: Icon + Title + Subtitle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: '#2563EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)',
              flexShrink: 0
            }}
          >
            <MessageSquare size={26} color="#FFFFFF" />
          </div>
          <div>
            <h1
              style={{
                fontSize: '1.75rem',
                fontWeight: 800,
                color: '#FFFFFF',
                letterSpacing: '-0.4px',
                margin: 0
              }}
            >
              Feedback
            </h1>
            <p style={{ fontSize: '0.88rem', color: '#94A3B8', marginTop: '4px', marginBottom: 0 }}>
              We value your feedback! Help us make Typing Master better for everyone.
            </p>
          </div>
        </div>

        {/* Right: Decorative Speech Bubble Graphic */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            position: 'relative'
          }}
        >
          {/* Stylized Floating Message Bubble */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'linear-gradient(135deg, #2563EB, #3B82F6)',
              borderRadius: '14px 14px 2px 14px',
              padding: '8px 14px',
              boxShadow: '0 4px 16px rgba(37, 99, 235, 0.3)'
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FFFFFF' }} />
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FFFFFF' }} />
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FFFFFF' }} />
          </div>

          {/* Hand-written text badge */}
          <div
            style={{
              fontFamily: "'Caveat', 'Comic Sans MS', cursive, sans-serif",
              fontSize: '1.35rem',
              fontWeight: 700,
              color: '#F472B6',
              transform: 'rotate(-4deg)',
              display: 'flex',
              flexDirection: 'column',
              lineHeight: 1.1
            }}
          >
            <span>Your opinion</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              matters! <span style={{ fontSize: '1rem' }}>❤️</span>
            </span>
          </div>
        </div>
      </div>

      {/* ==================================================== */}
      {/* 4 STAT SUMMARY CARDS: Strictly Real-Time User Data */}
      {/* ==================================================== */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}
      >
        {/* Card 1: Feedback Given */}
        <div
          style={{
            background: '#111C38',
            border: '1px solid #1E294B',
            borderRadius: '16px',
            padding: '18px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: '#10B981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
            }}
          >
            <MessageSquare size={22} color="#FFFFFF" />
          </div>
          <div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.1 }}>
              {totalCount}
            </div>
            <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#FFFFFF', marginTop: '2px' }}>
              Feedback Given
            </div>
            <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '2px' }}>
              {totalCount > 0 ? 'Thank you for your support!' : 'No feedback submitted yet'}
            </div>
          </div>
        </div>

        {/* Card 2: Pending Response */}
        <div
          style={{
            background: '#111C38',
            border: '1px solid #1E294B',
            borderRadius: '16px',
            padding: '18px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: '#8B5CF6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
            }}
          >
            <Clock size={22} color="#FFFFFF" />
          </div>
          <div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.1 }}>
              {pendingCount}
            </div>
            <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#FFFFFF', marginTop: '2px' }}>
              Pending Response
            </div>
            <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '2px' }}>
              {pendingCount > 0 ? 'Our team will respond soon.' : 'All reviews up to date'}
            </div>
          </div>
        </div>

        {/* Card 3: Resolved */}
        <div
          style={{
            background: '#111C38',
            border: '1px solid #1E294B',
            borderRadius: '16px',
            padding: '18px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: '#2563EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
            }}
          >
            <CheckCircle2 size={22} color="#FFFFFF" />
          </div>
          <div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.1 }}>
              {resolvedCount}
            </div>
            <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#FFFFFF', marginTop: '2px' }}>
              Resolved
            </div>
            <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '2px' }}>
              {resolvedCount > 0 ? 'Issues fixed' : 'Zero unresolved reports'}
            </div>
          </div>
        </div>

        {/* Card 4: Average Rating */}
        <div
          style={{
            background: '#111C38',
            border: '1px solid #1E294B',
            borderRadius: '16px',
            padding: '18px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: '#F59E0B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
            }}
          >
            <Star size={22} color="#FFFFFF" fill="#FFFFFF" />
          </div>
          <div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.1 }}>
              {averageRating !== null ? averageRating.toFixed(1) : '—'}
            </div>
            <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#FFFFFF', marginTop: '2px' }}>
              Your Average Rating
            </div>
            <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '2px' }}>
              {ratedCount > 0
                ? `Based on ${ratedCount} rating${ratedCount === 1 ? '' : 's'}`
                : 'No ratings given yet'}
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================== */}
      {/* TWO-COLUMN LAYOUT: Send Feedback + Recent Feedback / FAQ */}
      {/* ==================================================== */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))',
          gap: '24px',
          alignItems: 'start'
        }}
      >
        {/* ==================================================== */}
        {/* LEFT COLUMN: Send Feedback Form Card */}
        {/* ==================================================== */}
        <div
          style={{
            background: '#111C38',
            border: '1px solid #1E294B',
            borderRadius: '18px',
            padding: '24px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
          }}
        >
          {/* Card Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: '#2563EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)',
                flexShrink: 0
              }}
            >
              <Send size={20} color="#FFFFFF" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.18rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                Send Feedback
              </h2>
              <p style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: '3px', marginBottom: 0 }}>
                Share your suggestions, report issues, or let us know what you like about Typing Master.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Row: Feedback Type & Rating */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '14px'
              }}
            >
              {/* Feedback Type Dropdown */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: '#E2E8F0',
                    marginBottom: '6px'
                  }}
                >
                  Feedback Type
                </label>
                <div style={{ position: 'relative' }}>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: '#0B132B',
                      border: '1px solid #1E294B',
                      borderRadius: '10px',
                      color: '#FFFFFF',
                      fontSize: '0.86rem',
                      fontWeight: 600,
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat} style={{ background: '#0B132B', color: '#FFFFFF' }}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Rating (Optional) */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: '#E2E8F0',
                    marginBottom: '6px'
                  }}
                >
                  Rating (Optional)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '40px' }}>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {[1, 2, 3, 4, 5].map((starVal) => {
                      const isFilled = starVal <= (hoverRating || rating);
                      return (
                        <button
                          key={starVal}
                          type="button"
                          onClick={() => setRating(rating === starVal ? 0 : starVal)}
                          onMouseEnter={() => setHoverRating(starVal)}
                          onMouseLeave={() => setHoverRating(0)}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: '2px',
                            cursor: 'pointer',
                            color: isFilled ? '#F59E0B' : '#475569',
                            display: 'flex',
                            alignItems: 'center',
                            transition: 'transform 0.1s ease'
                          }}
                        >
                          <Star
                            size={20}
                            fill={isFilled ? '#F59E0B' : 'transparent'}
                            color={isFilled ? '#F59E0B' : '#64748B'}
                          />
                        </button>
                      );
                    })}
                  </div>
                  <span style={{ fontSize: '0.78rem', color: '#94A3B8', marginLeft: '6px' }}>
                    {rating > 0 ? `${rating} out of 5` : 'Optional'}
                  </span>
                </div>
              </div>
            </div>

            {/* Subject Input */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: '#E2E8F0',
                  marginBottom: '6px'
                }}
              >
                Subject
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  maxLength={100}
                  placeholder="Enter a short subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    background: '#0B132B',
                    border: '1px solid #1E294B',
                    borderRadius: '10px',
                    color: '#FFFFFF',
                    fontSize: '0.86rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div
                style={{
                  textAlign: 'right',
                  fontSize: '0.72rem',
                  color: '#64748B',
                  marginTop: '4px'
                }}
              >
                {subject.length}/100
              </div>
            </div>

            {/* Message Textarea */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: '#E2E8F0',
                  marginBottom: '6px'
                }}
              >
                Message
              </label>
              <div style={{ position: 'relative' }}>
                <textarea
                  rows={4}
                  maxLength={500}
                  placeholder="Tell us your feedback, suggestion, or issue in detail..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    background: '#0B132B',
                    border: '1px solid #1E294B',
                    borderRadius: '10px',
                    color: '#FFFFFF',
                    fontSize: '0.86rem',
                    outline: 'none',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
              <div
                style={{
                  textAlign: 'right',
                  fontSize: '0.72rem',
                  color: '#64748B',
                  marginTop: '4px'
                }}
              >
                {message.length}/500
              </div>
            </div>

            {/* Attach Screenshot (Optional) */}
            <div>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: '#E2E8F0',
                  marginBottom: '6px'
                }}
              >
                <ImageIcon size={15} color="#94A3B8" />
                <span>Attach Screenshot (Optional)</span>
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/jpg"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />

              {!attachedFile ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: '1.5px dashed #1E294B',
                    borderRadius: '12px',
                    padding: '18px',
                    background: '#0B132B',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <UploadCloud size={28} color="#60A5FA" />
                  <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#E2E8F0' }}>
                    Click to upload an image
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                    PNG, JPG up to 5MB
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    background: '#0B132B',
                    border: '1px solid #1E294B',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {attachedPreview && (
                      <img
                        src={attachedPreview}
                        alt="Preview"
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '8px',
                          objectFit: 'cover',
                          border: '1px solid #1E294B'
                        }}
                      />
                    )}
                    <div>
                      <div
                        style={{
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          color: '#FFFFFF',
                          maxWidth: '220px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {attachedFile.name}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                        {(attachedFile.size / 1024).toFixed(1)} KB
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRemoveAttachment}
                    style={{
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#F87171',
                      borderRadius: '8px',
                      padding: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Remove attachment"
                  >
                    <X size={15} />
                  </button>
                </div>
              )}
            </div>

            {/* Action Buttons Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
              <button
                type="button"
                onClick={handleReset}
                disabled={loading}
                style={{
                  padding: '11px 20px',
                  background: 'transparent',
                  border: '1px solid #1E294B',
                  borderRadius: '10px',
                  color: '#E2E8F0',
                  fontSize: '0.86rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <RotateCcw size={15} />
                <span>Reset</span>
              </button>

              <button
                type="submit"
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '11px 20px',
                  background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                  border: 'none',
                  borderRadius: '10px',
                  color: '#FFFFFF',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.75 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)'
                }}
              >
                <Send size={16} />
                <span>{loading ? 'Submitting...' : 'Submit Feedback'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* ==================================================== */}
        {/* RIGHT COLUMN: My Recent Feedback + FAQs */}
        {/* ==================================================== */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Card 1: My Recent Feedback */}
          <div
            style={{
              background: '#111C38',
              border: '1px solid #1E294B',
              borderRadius: '18px',
              padding: '24px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '18px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: '#1E294B',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#60A5FA'
                  }}
                >
                  <MessageSquare size={17} />
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                  My Recent Feedback
                </h3>
              </div>

              {feedbackList.length > 5 && (
                <button
                  type="button"
                  onClick={() => setShowAllRecent(!showAllRecent)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#3B82F6',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {showAllRecent ? 'Show Less' : 'View All'}
                </button>
              )}
            </div>

            {/* Table / List */}
            {dataLoading ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#94A3B8', fontSize: '0.86rem' }}>
                Loading your feedback records...
              </div>
            ) : feedbackList.length === 0 ? (
              /* Genuine Empty State (NO fabricated/placeholder data) */
              <div
                style={{
                  padding: '36px 20px',
                  textAlign: 'center',
                  background: '#0B132B',
                  borderRadius: '12px',
                  border: '1px dashed #1E294B'
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: '#1E294B',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px',
                    color: '#64748B'
                  }}
                >
                  <Inbox size={24} />
                </div>
                <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#E2E8F0', marginBottom: '4px' }}>
                  No feedback submitted yet
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748B', maxWidth: '300px', margin: '0 auto' }}>
                  Your submitted bug reports, suggestions, and feedback will be tracked here with real-time status updates.
                </div>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #1E294B', fontSize: '0.72rem', color: '#64748B', textTransform: 'uppercase' }}>
                      <th style={{ padding: '8px 6px' }}>#</th>
                      <th style={{ padding: '8px 8px' }}>Subject</th>
                      <th style={{ padding: '8px 8px' }}>Type</th>
                      <th style={{ padding: '8px 8px' }}>Status</th>
                      <th style={{ padding: '8px 8px' }}>Date</th>
                      <th style={{ padding: '8px 6px', textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedList.map((item, index) => {
                      const typeBadge = getTypeBadgeStyle(item.category);
                      const statusBadge = getStatusBadgeStyle(item.status);
                      return (
                        <tr
                          key={item.id}
                          style={{
                            borderBottom: '1px solid #1E294B',
                            fontSize: '0.8rem'
                          }}
                        >
                          <td style={{ padding: '12px 6px', color: '#64748B' }}>
                            {index + 1}
                          </td>
                          <td
                            style={{
                              padding: '12px 8px',
                              fontWeight: 600,
                              color: '#FFFFFF',
                              maxWidth: '140px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                            title={item.subject}
                          >
                            {item.subject}
                          </td>
                          <td style={{ padding: '12px 8px' }}>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                ...typeBadge
                              }}
                            >
                              {item.category}
                            </span>
                          </td>
                          <td style={{ padding: '12px 8px' }}>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                ...statusBadge
                              }}
                            >
                              {item.status || 'Pending'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 8px', color: '#94A3B8', fontSize: '0.74rem', whiteSpace: 'nowrap' }}>
                            {item.date || 'Recent'}
                          </td>
                          <td style={{ padding: '12px 6px', textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => setSelectedFeedback(item)}
                              style={{
                                background: '#1E294B',
                                border: '1px solid #334155',
                                borderRadius: '6px',
                                padding: '4px 8px',
                                color: '#93C5FD',
                                fontSize: '0.74rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <Eye size={12} />
                              <span>View</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Card 2: Frequently Asked Questions */}
          <div
            style={{
              background: '#111C38',
              border: '1px solid #1E294B',
              borderRadius: '18px',
              padding: '24px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: '#1E294B',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#38BDF8'
                  }}
                >
                  <HelpCircle size={18} />
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                  Frequently Asked Questions
                </h3>
              </div>

              <span style={{ fontSize: '0.78rem', color: '#64748B' }}>Help & Tips</span>
            </div>

            {/* Accordion list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {faqs.map((faq) => {
                const isExpanded = expandedFaq === faq.id;
                return (
                  <div
                    key={faq.id}
                    style={{
                      background: '#0B132B',
                      border: '1px solid #1E294B',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      transition: 'border-color 0.2s'
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedFaq(isExpanded ? null : faq.id)}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        background: 'transparent',
                        border: 'none',
                        color: '#FFFFFF',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Sparkles size={14} color="#60A5FA" />
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#E2E8F0' }}>
                          {faq.question}
                        </span>
                      </div>
                      {isExpanded ? (
                        <ChevronUp size={16} color="#94A3B8" />
                      ) : (
                        <ChevronDown size={16} color="#94A3B8" />
                      )}
                    </button>

                    {isExpanded && (
                      <div
                        style={{
                          padding: '0 14px 12px 36px',
                          fontSize: '0.78rem',
                          color: '#94A3B8',
                          lineHeight: 1.5
                        }}
                      >
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================== */}
      {/* VIEW DETAILS MODAL: Full Message, Status & Admin Response */}
      {/* ==================================================== */}
      {selectedFeedback && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(11, 19, 43, 0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setSelectedFeedback(null)}
        >
          <div
            style={{
              background: '#111C38',
              border: '1px solid #1E294B',
              borderRadius: '20px',
              padding: '28px',
              maxWidth: '560px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.6)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '12px',
                marginBottom: '18px'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span
                    style={{
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      ...getTypeBadgeStyle(selectedFeedback.category)
                    }}
                  >
                    {selectedFeedback.category}
                  </span>
                  <span
                    style={{
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      ...getStatusBadgeStyle(selectedFeedback.status)
                    }}
                  >
                    {selectedFeedback.status || 'Pending'}
                  </span>
                  <span style={{ fontSize: '0.74rem', color: '#64748B' }}>
                    {selectedFeedback.date}
                  </span>
                </div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                  {selectedFeedback.subject}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setSelectedFeedback(null)}
                style={{
                  background: '#1E294B',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Optional Rating */}
            {selectedFeedback.rating && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginBottom: '16px',
                  background: '#0B132B',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  width: 'fit-content'
                }}
              >
                <span style={{ fontSize: '0.78rem', color: '#94A3B8' }}>Rating:</span>
                <div style={{ display: 'flex', gap: '2px' }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={15}
                      fill={s <= selectedFeedback.rating ? '#F59E0B' : 'transparent'}
                      color={s <= selectedFeedback.rating ? '#F59E0B' : '#475569'}
                    />
                  ))}
                </div>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#F59E0B' }}>
                  {selectedFeedback.rating} / 5
                </span>
              </div>
            )}

            {/* Message Body */}
            <div style={{ marginBottom: '18px' }}>
              <div style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                Your Message
              </div>
              <div
                style={{
                  background: '#0B132B',
                  border: '1px solid #1E294B',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  fontSize: '0.86rem',
                  lineHeight: 1.6,
                  color: '#E2E8F0',
                  whiteSpace: 'pre-wrap'
                }}
              >
                {selectedFeedback.message || selectedFeedback.comment}
              </div>
            </div>

            {/* Attachment Preview (if any) */}
            {selectedFeedback.attachment_url && (
              <div style={{ marginBottom: '18px' }}>
                <div style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                  Attached Screenshot
                </div>
                <div
                  style={{
                    background: '#0B132B',
                    border: '1px solid #1E294B',
                    borderRadius: '12px',
                    padding: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}
                >
                  <img
                    src={selectedFeedback.attachment_url}
                    alt="Screenshot"
                    style={{
                      maxHeight: '140px',
                      maxWidth: '100%',
                      borderRadius: '8px',
                      objectFit: 'contain'
                    }}
                  />
                </div>
              </div>
            )}

            {/* Admin Response Section */}
            <div>
              <div style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                Typing Master Team Response
              </div>
              {selectedFeedback.admin_response ? (
                <div
                  style={{
                    background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.12), rgba(16, 185, 129, 0.12))',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    borderRadius: '12px',
                    padding: '14px 16px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <ShieldCheck size={16} color="#60A5FA" />
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#93C5FD' }}>
                      Official Admin Reply
                    </span>
                  </div>
                  <p style={{ fontSize: '0.84rem', color: '#F1F5F9', margin: 0, lineHeight: 1.5 }}>
                    {selectedFeedback.admin_response}
                  </p>
                </div>
              ) : (
                <div
                  style={{
                    background: '#0B132B',
                    border: '1px dashed #1E294B',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                >
                  <Clock size={16} color="#64748B" />
                  <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
                    Awaiting admin review. Our team checks submissions daily.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
