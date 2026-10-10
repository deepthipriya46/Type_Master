import React, { useState } from 'react';
import { Star, MessageSquare, Sparkles, Send, X, CheckCircle2 } from 'lucide-react';
import { supabaseService } from '../services/supabaseService';

export default function FirstTestFeedbackModal({
  isOpen,
  onClose,
  userId,
  userName = 'Typist',
  userEmail = ''
}) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const ratingDescriptions = {
    1: 'Needs Improvement 🙁',
    2: 'Below Average 😐',
    3: 'Good Experience 🙂',
    4: 'Very Smooth & Fast 😊',
    5: 'Outstanding! Loved It! 🌟'
  };

  const activeStar = hoverRating || rating;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await supabaseService.submitFeedback({
        userId,
        rating,
        comment,
        userName,
        userEmail
      });

      // Mark feedback as submitted so it never triggers again for this user
      if (userId) {
        localStorage.setItem(`typemaster_feedback_submitted_${userId}`, 'true');
      }
      localStorage.setItem('typemaster_feedback_submitted_global', 'true');

      setSubmitted(true);
      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err) {
      console.warn('Feedback submit note:', err);
      // Still close gracefully
      if (userId) {
        localStorage.setItem(`typemaster_feedback_submitted_${userId}`, 'true');
      }
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDismiss = () => {
    if (userId) {
      localStorage.setItem(`typemaster_feedback_submitted_${userId}`, 'true');
    }
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '20px'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          background: '#FFFFFF',
          borderRadius: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid #E2E8F0',
          position: 'relative',
          overflow: 'hidden',
          animation: 'fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Decorative Top Accent Bar */}
        <div
          style={{
            height: '6px',
            background: 'linear-gradient(90deg, #4F46E5, #3B82F6, #10B981, #F59E0B)'
          }}
        />

        {/* Close button */}
        <button
          onClick={handleDismiss}
          style={{
            position: 'absolute',
            top: '18px',
            right: '18px',
            background: '#F1F5F9',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#64748B',
            transition: 'all 0.2s'
          }}
          title="Dismiss"
        >
          <X size={16} />
        </button>

        {submitted ? (
          <div style={{ padding: '44px 32px', textAlign: 'center' }}>
            <div
              style={{
                width: '68px',
                height: '68px',
                background: '#ECFDF5',
                borderRadius: '50%',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10B981',
                marginBottom: '16px',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.25)'
              }}
            >
              <CheckCircle2 size={38} />
            </div>
            <h3 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
              Thank You for Your Feedback!
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#64748B', maxWidth: '380px', margin: '0 auto' }}>
              Your response has been synchronized with the platform telemetry. Keep typing and achieving new milestones!
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ padding: '32px 32px 28px' }}>
            {/* Header Badge & Title */}
            <div style={{ textAlign: 'center', marginBottom: '22px' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'linear-gradient(135deg, #EEF2FF, #E0E7FF)',
                  color: '#4F46E5',
                  padding: '5px 12px',
                  borderRadius: '20px',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  marginBottom: '10px'
                }}
              >
                <Sparkles size={14} color="#6366F1" />
                <span>First Test Milestone Completed</span>
              </div>

              <h2
                style={{
                  fontSize: '1.35rem',
                  fontWeight: 800,
                  color: '#0F172A',
                  lineHeight: 1.35,
                  margin: '0 0 8px 0'
                }}
              >
                Congratulations on completing your first test! How was your experience?
              </h2>

              <p style={{ fontSize: '0.84rem', color: '#64748B', margin: 0 }}>
                Help us tune TypeMaster to your personal typing speed goals.
              </p>
            </div>

            {/* Interactive 1-to-5 Star Rating Selector */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                padding: '16px',
                background: '#F8FAFC',
                borderRadius: '16px',
                border: '1px solid #E2E8F0',
                marginBottom: '20px'
              }}
            >
              <div style={{ display: 'flex', gap: '8px' }}>
                {[1, 2, 3, 4, 5].map((starValue) => {
                  const isFilled = starValue <= activeStar;
                  return (
                    <button
                      key={starValue}
                      type="button"
                      onClick={() => setRating(starValue)}
                      onMouseEnter={() => setHoverRating(starValue)}
                      onMouseLeave={() => setHoverRating(0)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        transform: activeStar === starValue ? 'scale(1.18)' : 'scale(1)',
                        transition: 'transform 0.15s ease'
                      }}
                      title={`${starValue} Stars`}
                    >
                      <Star
                        size={32}
                        color={isFilled ? '#F59E0B' : '#CBD5E1'}
                        fill={isFilled ? '#F59E0B' : 'none'}
                        style={{ filter: isFilled ? 'drop-shadow(0 2px 4px rgba(245, 158, 11, 0.35))' : 'none' }}
                      />
                    </button>
                  );
                })}
              </div>

              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>
                {ratingDescriptions[activeStar] || 'Select your rating'}
              </div>
            </div>

            {/* Feedback Comment Textarea */}
            <div style={{ marginBottom: '22px' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: '#334155',
                  marginBottom: '8px'
                }}
              >
                <MessageSquare size={15} color="#64748B" />
                <span>Your Suggestions & Feedback (Optional)</span>
              </label>

              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="What did you like? Anything we can improve in keystroke feel, accuracy, or themes?"
                rows={3}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.86rem',
                  color: '#1E293B',
                  resize: 'none',
                  outline: 'none',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                  background: '#FFFFFF'
                }}
                onFocus={(e) => (e.target.style.borderColor = '#4F46E5')}
                onBlur={(e) => (e.target.style.borderColor = '#CBD5E1')}
              />
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button
                type="button"
                onClick={handleDismiss}
                style={{
                  padding: '12px 18px',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  background: '#FFFFFF',
                  color: '#64748B',
                  fontSize: '0.86rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 0.15s'
                }}
              >
                Maybe Later
              </button>

              <button
                type="submit"
                disabled={submitting}
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #4F46E5, #3B82F6)',
                  color: '#FFFFFF',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'transform 0.15s'
                }}
              >
                <Send size={15} />
                <span>{submitting ? 'Submitting...' : 'Submit Feedback'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
