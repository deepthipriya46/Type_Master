import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  X,
  Send,
  Sparkles,
  RotateCcw,
  Minimize2,
  Maximize2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  User,
  Zap
} from 'lucide-react';
import aiChatService from '../services/aiChatService';

const QUICK_ACTIONS = [
  'How can I improve my typing speed?',
  'How is WPM calculated?',
  'How can I improve my accuracy?',
  'How do I attempt a scheduled test?',
  'Generate a typing practice passage.',
  'Help with my account.'
];

const INITIAL_WELCOME_MESSAGE = {
  id: 'welcome',
  role: 'assistant',
  text: "Hi! Welcome to TypeMaster. I’m your AI typing assistant. I can help you improve your typing speed, accuracy, practice routine, and understanding of the platform. What would you like help with today?",
  timestamp: new Date()
};

export default function TypeMasterChatbot({
  portal = 'user',
  user = null
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([INITIAL_WELCOME_MESSAGE]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [lastFailedMessage, setLastFailedMessage] = useState(null);
  const [hasUnread, setHasUnread] = useState(true);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom of conversation
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setHasUnread(false);
      // Focus input when opened
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [isOpen, messages, isLoading]);

  // Send a user message to the AI
  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isLoading) return;

    setErrorMessage('');
    setLastFailedMessage(null);

    const userMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      text,
      timestamp: new Date()
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputValue('');
    setIsLoading(true);

    try {
      // Prepare conversation payload excluding IDs/timestamps
      const payloadMessages = updatedMessages.map(m => ({
        role: m.role,
        text: m.text
      }));

      const res = await aiChatService.sendMessage({
        messages: payloadMessages,
        userRole: user?.role || (portal === 'admin' ? 'admin' : 'user'),
        portal,
        userProfile: user
      });

      if (res.success && res.reply) {
        setMessages(prev => [
          ...prev,
          {
            id: `assistant_${Date.now()}`,
            role: 'assistant',
            text: res.reply,
            modelUsed: res.modelUsed,
            timestamp: new Date()
          }
        ]);
      } else {
        setErrorMessage(res.error || 'Unable to generate response.');
        setLastFailedMessage(text);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Network error communicating with TypeMaster AI.');
      setLastFailedMessage(text);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearConversation = () => {
    setMessages([
      {
        ...INITIAL_WELCOME_MESSAGE,
        timestamp: new Date()
      }
    ]);
    setErrorMessage('');
    setLastFailedMessage(null);
  };

  const handleRetry = () => {
    if (lastFailedMessage) {
      handleSendMessage(lastFailedMessage);
    }
  };

  // Helper to format basic markdown-style text (bold, lists, paragraphs)
  const renderFormattedText = (rawText) => {
    if (!rawText) return null;
    const lines = rawText.split('\n');

    return (
      <div style={{ lineHeight: 1.55 }}>
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) {
            return <div key={idx} style={{ height: '6px' }} />;
          }

          // Bullet points
          if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
            const content = trimmed.slice(2);
            return (
              <div key={idx} style={{ display: 'flex', gap: '6px', margin: '3px 0' }}>
                <span style={{ color: '#4F46E5', fontWeight: 'bold' }}>•</span>
                <span>{renderInlineBold(content)}</span>
              </div>
            );
          }

          // Numbered list
          const numMatch = trimmed.match(/^(\d+)[\.\)]\s+(.*)/);
          if (numMatch) {
            return (
              <div key={idx} style={{ display: 'flex', gap: '6px', margin: '3px 0' }}>
                <span style={{ color: '#4F46E5', fontWeight: 600, minWidth: '16px' }}>{numMatch[1]}.</span>
                <span>{renderInlineBold(numMatch[2])}</span>
              </div>
            );
          }

          return (
            <div key={idx} style={{ margin: '2px 0' }}>
              {renderInlineBold(trimmed)}
            </div>
          );
        })}
      </div>
    );
  };

  const renderInlineBold = (str) => {
    const parts = str.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} style={{ color: '#0F172A', fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <>
      {/* ========================================================= */}
      {/* 1. FLOATING LAUNCHER BUTTON (Bottom-Right Corner) */}
      {/* ========================================================= */}
      <div
        id="typemaster-ai-launcher"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9998,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Open TypeMaster AI Assistant"
          title="TypeMaster AI Assistant"
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #2563EB 0%, #4F46E5 50%, #7C3AED 100%)',
            color: '#FFFFFF',
            border: '2px solid rgba(255, 255, 255, 0.25)',
            boxShadow: '0 8px 24px rgba(79, 70, 229, 0.45), 0 2px 8px rgba(0,0,0,0.15)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: isOpen ? 'rotate(90deg) scale(0.95)' : 'scale(1)'
          }}
          onMouseEnter={(e) => {
            if (!isOpen) e.currentTarget.style.transform = 'translateY(-3px) scale(1.06)';
          }}
          onMouseLeave={(e) => {
            if (!isOpen) e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          {isOpen ? <X size={24} /> : <Bot size={28} />}

          {/* Active Status Badge Pulse */}
          {!isOpen && (
            <span
              style={{
                position: 'absolute',
                top: '0px',
                right: '0px',
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                background: '#10B981',
                border: '2.5px solid #FFFFFF',
                boxShadow: '0 0 8px rgba(16, 185, 129, 0.8)'
              }}
            />
          )}

          {/* Unread "AI" Pill */}
          {hasUnread && !isOpen && (
            <span
              style={{
                position: 'absolute',
                bottom: '-4px',
                right: '-4px',
                background: '#EC4899',
                color: '#FFFFFF',
                fontSize: '0.62rem',
                fontWeight: 800,
                padding: '2px 5px',
                borderRadius: '999px',
                border: '1.5px solid #FFFFFF',
                letterSpacing: '0.5px'
              }}
            >
              AI
            </span>
          )}
        </button>
      </div>

      {/* ========================================================= */}
      {/* 2. EXPANDABLE CHAT WINDOW (Anchored to Bottom-Right) */}
      {/* ========================================================= */}
      {isOpen && (
        <div
          id="typemaster-ai-chat-window"
          style={{
            position: 'fixed',
            bottom: '92px',
            right: '24px',
            width: '400px',
            maxWidth: 'calc(100vw - 32px)',
            height: '560px',
            maxHeight: 'calc(100vh - 120px)',
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            boxShadow: '0 20px 48px -8px rgba(15, 23, 42, 0.28), 0 0 0 1px rgba(15, 23, 42, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: 9998,
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
            animation: 'aiModalPop 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          {/* Header */}
          <div
            style={{
              background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
              padding: '14px 18px',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)',
                  color: '#FFFFFF'
                }}
              >
                <Bot size={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.92rem', fontWeight: 800, letterSpacing: '-0.2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>TypeMaster AI Assistant</span>
                </div>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: '#10B981',
                      display: 'inline-block'
                    }}
                  />
                  <span>Powered by Gemini</span>
                  {portal === 'admin' && (
                    <span style={{ color: '#F59E0B', fontWeight: 600 }}>• Admin Console</span>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {/* Clear conversation button */}
              <button
                type="button"
                onClick={handleClearConversation}
                title="Start new conversation"
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#CBD5E1',
                  cursor: 'pointer',
                  padding: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.15s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'; }}
              >
                <RotateCcw size={15} />
              </button>

              {/* Close button */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Close chat"
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#CBD5E1',
                  cursor: 'pointer',
                  padding: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.15s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'; }}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Message History Container */}
          <div
            style={{
              flex: 1,
              padding: '16px',
              overflowY: 'auto',
              background: '#F8FAFC',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isUser ? 'flex-end' : 'flex-start',
                    gap: '4px'
                  }}
                >
                  <div
                    style={{
                      maxWidth: '85%',
                      padding: '12px 14px',
                      borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      background: isUser
                        ? 'linear-gradient(135deg, #2563EB, #1D4ED8)'
                        : '#FFFFFF',
                      color: isUser ? '#FFFFFF' : '#1E293B',
                      fontSize: '0.86rem',
                      boxShadow: isUser
                        ? '0 3px 10px rgba(37, 99, 235, 0.25)'
                        : '0 2px 8px rgba(0, 0, 0, 0.05)',
                      border: isUser ? 'none' : '1px solid #E2E8F0',
                      wordBreak: 'break-word'
                    }}
                  >
                    {isUser ? (
                      <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.45 }}>{msg.text}</div>
                    ) : (
                      renderFormattedText(msg.text)
                    )}
                  </div>

                  {/* Timestamp & Metadata */}
                  <div
                    style={{
                      fontSize: '0.65rem',
                      color: '#94A3B8',
                      padding: '0 4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {msg.timestamp && (
                      <span>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                    {msg.modelUsed && (
                      <span style={{ color: '#6366F1' }}>• {msg.modelUsed}</span>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Typing Indicator */}
            {isLoading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
                <div
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '16px 16px 16px 4px',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
                  }}
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: '#4F46E5',
                      animation: 'pulseDot 1.4s infinite ease-in-out',
                      animationDelay: '0s'
                    }}
                  />
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: '#4F46E5',
                      animation: 'pulseDot 1.4s infinite ease-in-out',
                      animationDelay: '0.2s'
                    }}
                  />
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: '#4F46E5',
                      animation: 'pulseDot 1.4s infinite ease-in-out',
                      animationDelay: '0.4s'
                    }}
                  />
                  <span style={{ fontSize: '0.74rem', color: '#64748B', marginLeft: '6px', fontWeight: 500 }}>
                    TypeMaster AI is thinking...
                  </span>
                </div>
              </div>
            )}

            {/* Error Message with Retry */}
            {errorMessage && (
              <div
                style={{
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: '12px',
                  padding: '10px 12px',
                  fontSize: '0.8rem',
                  color: '#DC2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertCircle size={15} color="#DC2626" />
                  <span>{errorMessage}</span>
                </div>
                {lastFailedMessage && (
                  <button
                    type="button"
                    onClick={handleRetry}
                    style={{
                      background: '#DC2626',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Retry
                  </button>
                )}
              </div>
            )}

            {/* Quick Action Suggestion Chips (Shown on initial welcome or empty conversation) */}
            {messages.length <= 1 && !isLoading && (
              <div style={{ marginTop: '8px' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Suggested Questions:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {QUICK_ACTIONS.map((action, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSendMessage(action)}
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        borderRadius: '10px',
                        padding: '8px 12px',
                        textAlign: 'left',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        color: '#334155',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '6px',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#EFF6FF';
                        e.currentTarget.style.borderColor = '#BFDBFE';
                        e.currentTarget.style.color = '#1D4ED8';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#FFFFFF';
                        e.currentTarget.style.borderColor = '#E2E8F0';
                        e.currentTarget.style.color = '#334155';
                      }}
                    >
                      <span>{action}</span>
                      <ArrowRight size={13} color="#94A3B8" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Field */}
          <div
            style={{
              padding: '12px 14px',
              backgroundColor: '#FFFFFF',
              borderTop: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about typing speed, accuracy, tests..."
              disabled={isLoading}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '12px',
                border: '1px solid #CBD5E1',
                fontSize: '0.86rem',
                color: '#0F172A',
                outline: 'none',
                background: '#F8FAFC',
                transition: 'border-color 0.15s'
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#4F46E5'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#CBD5E1'; }}
            />

            <button
              type="button"
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim() || isLoading}
              aria-label="Send message"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: inputValue.trim() && !isLoading
                  ? 'linear-gradient(135deg, #2563EB, #4F46E5)'
                  : '#E2E8F0',
                color: inputValue.trim() && !isLoading ? '#FFFFFF' : '#94A3B8',
                border: 'none',
                cursor: inputValue.trim() && !isLoading ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease'
              }}
            >
              <Send size={17} />
            </button>
          </div>
        </div>
      )}

      {/* Global CSS for Dot pulse and pop animation */}
      <style>{`
        @keyframes pulseDot {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1.1); opacity: 1; }
        }
        @keyframes aiModalPop {
          0% { transform: translateY(16px) scale(0.96); opacity: 0; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
      `}</style>
    </>
  );
}
