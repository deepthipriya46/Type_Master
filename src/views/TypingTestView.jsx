import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Gauge,
  Target,
  FileText,
  AlertCircle,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  TrendingUp,
  Lightbulb,
  Keyboard as KeyboardIcon,
  CheckCircle2,
  Trophy,
  Award,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import VirtualKeyboard from '../components/VirtualKeyboard';
import { supabaseService } from '../services/supabaseService';
import { soundSynth } from '../services/soundSynthesizer';

export default function TypingTestView({
  initialSettings = {},
  onTestCompleted,
  onNavigate
}) {
  const [duration, setDuration] = useState(initialSettings.duration || 60);
  const [difficulty, setDifficulty] = useState(initialSettings.difficulty || 'Easy');
  const [category, setCategory] = useState(initialSettings.category || 'Random Text');

  const [promptText, setPromptText] = useState('Loading typing prompt...');
  const [promptSource, setPromptSource] = useState('local');
  const [isLoadingPrompt, setIsLoadingPrompt] = useState(false);

  // Typing test runtime states
  const [status, setStatus] = useState('idle'); // 'idle', 'running', 'paused', 'finished'
  const [timeLeft, setTimeLeft] = useState(duration);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Typing buffers
  const [typedInput, setTypedInput] = useState('');
  const [lastPressedKey, setLastPressedKey] = useState('');
  const [isLastError, setIsLastError] = useState(false);

  // Live calculated stats
  const [liveWpm, setLiveWpm] = useState(0);
  const [liveAccuracy, setLiveAccuracy] = useState(100);
  const [charCount, setCharCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);

  // Live chart history (recorded every second)
  const [liveWpmHistory, setLiveWpmHistory] = useState([0]);
  const [liveAccHistory, setLiveAccHistory] = useState([100]);

  // Audio settings
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [soundType, setSoundType] = useState('blue');

  // Result modal state
  const [resultModalData, setResultModalData] = useState(null);

  const inputRef = useRef(null);
  const arenaRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const keystrokesRef = useRef([]);

  // Load Prompt from Backend (Step 1 & 2 in Architecture)
  const loadPrompt = useCallback(async (cat, diff) => {
    setIsLoadingPrompt(true);
    try {
      const res = await supabaseService.fetchPrompt(cat, diff);
      if (res && res.prompt) {
        setPromptText(res.prompt.text);
        setPromptSource(res.source);
      }
    } catch (e) {
      console.warn('Prompt load error:', e);
    } finally {
      setIsLoadingPrompt(false);
    }
  }, []);

  useEffect(() => {
    loadPrompt(category, difficulty);
  }, [category, difficulty, loadPrompt]);

  // Reset test state
  const resetTest = useCallback(() => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setStatus('idle');
    setTimeLeft(duration);
    setElapsedSeconds(0);
    setTypedInput('');
    setLastPressedKey('');
    setIsLastError(false);
    setLiveWpm(0);
    setLiveAccuracy(100);
    setCharCount(0);
    setErrorCount(0);
    setLiveWpmHistory([0]);
    setLiveAccHistory([100]);
    keystrokesRef.current = [];
    setResultModalData(null);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [duration]);

  useEffect(() => {
    resetTest();
  }, [duration, resetTest]);

  // Focus input automatically
  const handleArenaClick = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Timer Tick Loop
  useEffect(() => {
    if (status === 'running') {
      timerIntervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current);
            finishTest();
            return 0;
          }
          return prev - 1;
        });

        setElapsedSeconds((sec) => {
          const nextSec = sec + 1;
          // Record live history
          setLiveWpmHistory((prev) => [...prev.slice(-14), liveWpm]);
          setLiveAccHistory((prev) => [...prev.slice(-14), liveAccuracy]);
          return nextSec;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [status, liveWpm, liveAccuracy]);

  // Handle typing input
  const handleInputChange = (e) => {
    if (status === 'finished') return;

    if (status === 'idle') {
      setStatus('running');
    }

    const val = e.target.value;
    const key = val.slice(-1);
    const prevLen = typedInput.length;
    const isAdding = val.length > prevLen;

    setTypedInput(val);
    setCharCount(val.length);

    const now = Date.now();
    keystrokesRef.current.push({ char: key, timestamp: now });

    // Calculate errors
    let errors = 0;
    let correctChars = 0;
    for (let i = 0; i < val.length; i++) {
      if (val[i] === promptText[i]) {
        correctChars++;
      } else {
        errors++;
      }
    }
    setErrorCount(errors);

    // Audio & Keyboard state
    if (isAdding) {
      const isCurrentCharError = val[val.length - 1] !== promptText[val.length - 1];
      setIsLastError(isCurrentCharError);
      setLastPressedKey(key);

      if (isCurrentCharError) {
        soundSynth.playErrorSound();
      } else {
        soundSynth.playKeySound(key === ' ');
      }
    }

    // Live Metrics calculation
    const currentElapsed = Math.max(elapsedSeconds, 1);
    const minutes = currentElapsed / 60;
    const calculatedWpm = Math.max(0, Math.round((correctChars / 5) / minutes));
    const accuracyCalc = val.length > 0 ? Math.round((correctChars / val.length) * 100) : 100;

    setLiveWpm(calculatedWpm);
    setLiveAccuracy(accuracyCalc);

    // Check if user completed the entire prompt text
    if (val.length >= promptText.length && promptText.length > 0) {
      finishTest(calculatedWpm, accuracyCalc, errors, val.length);
    }
  };

  // Submit test to backend (Step 4 & 5 in Architecture)
  const finishTest = async (overrideWpm, overrideAcc, overrideErr, overrideChars) => {
    setStatus('finished');
    soundSynth.playCompleteChime();

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {
      // confetti fallback
    }

    const finalWpm = overrideWpm !== undefined ? overrideWpm : liveWpm;
    const finalAccuracy = overrideAcc !== undefined ? overrideAcc : liveAccuracy;
    const finalErrors = overrideErr !== undefined ? overrideErr : errorCount;
    const finalChars = overrideChars !== undefined ? overrideChars : charCount;
    const finalDuration = Math.max(elapsedSeconds, 1);

    const payload = {
      wpm: finalWpm,
      rawWpm: Math.round((finalChars / 5) / (finalDuration / 60)),
      accuracy: finalAccuracy,
      duration: finalDuration,
      errors: finalErrors,
      characters: finalChars,
      elapsedSeconds: finalDuration,
      category,
      difficulty
    };

    const submissionResult = await supabaseService.submitTest(payload);
    setResultModalData({
      ...payload,
      ...submissionResult
    });

    if (onTestCompleted) {
      onTestCompleted();
    }
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Space to start/pause when arena has focus and not typing words
      if (e.key === 'Escape') {
        resetTest();
      } else if (e.ctrlKey && e.key === 'Enter') {
        if (status === 'running') {
          finishTest();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status, resetTest]);

  // Current target character for keyboard highlight
  const targetChar = promptText[typedInput.length] || '';

  // Render Prompt Text with active words and characters
  const words = promptText.split(' ');
  let charTracker = 0;

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="greeting-header">
        <div className="greeting-text">
          <h1>Typing Test</h1>
          <p>Test your typing speed and accuracy. Choose duration, difficulty and start typing!</p>
        </div>
      </div>

      {/* Top Test Controls matching Image 2 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          background: '#ffffff',
          padding: '16px 24px',
          borderRadius: '16px',
          border: '1px solid var(--card-border)',
          boxShadow: 'var(--card-shadow)'
        }}
      >
        {/* Duration Selectors */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>Test Duration</span>
          {[
            { label: '1 min', sec: 60 },
            { label: '3 min', sec: 180 },
            { label: '5 min', sec: 300 },
            { label: 'Custom', sec: 120 }
          ].map((item) => (
            <button
              key={item.label}
              className={`pill-btn ${duration === item.sec ? 'active' : ''}`}
              onClick={() => setDuration(item.sec)}
              style={duration === item.sec ? { background: '#2563eb', color: '#ffffff' } : {}}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Difficulty Selectors */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>Difficulty Level</span>
          <button
            className={`pill-btn diff-easy ${difficulty === 'Easy' ? 'active' : ''}`}
            onClick={() => setDifficulty('Easy')}
          >
            Easy
          </button>
          <button
            className={`pill-btn diff-med ${difficulty === 'Medium' ? 'active' : ''}`}
            onClick={() => setDifficulty('Medium')}
          >
            Medium
          </button>
          <button
            className={`pill-btn diff-hard ${difficulty === 'Hard' ? 'active' : ''}`}
            onClick={() => setDifficulty('Hard')}
          >
            Hard
          </button>
        </div>

        {/* Category Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>Text Category</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{
              padding: '6px 14px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              fontSize: '0.84rem',
              fontWeight: 600,
              background: '#f8fafc',
              color: '#1e293b',
              cursor: 'pointer'
            }}
          >
            <option value="Random Text">Random Text</option>
            <option value="Technology">Technology</option>
            <option value="Quotes">Quotes</option>
            <option value="Literature">Literature</option>
            <option value="Programming">Programming</option>
          </select>
        </div>
      </div>

      {/* Main Grid: Left Typing Area + Right Live Stats Panel */}
      <div className="typing-test-layout">
        <div className="typing-test-main">
          {/* Stats Ribbon matching Image 2 */}
          <div className="test-stats-ribbon">
            {/* Circular Timer */}
            <div className="circular-timer-container">
              <div className="timer-circle-svg">
                <svg width="74" height="74" viewBox="0 0 74 74">
                  <circle className="timer-circle-bg" cx="37" cy="37" r="30" />
                  <circle
                    className="timer-circle-bar"
                    cx="37"
                    cy="37"
                    r="30"
                    strokeDasharray={2 * Math.PI * 30}
                    strokeDashoffset={2 * Math.PI * 30 * (1 - timeLeft / duration)}
                  />
                </svg>
                <div className="timer-circle-text">
                  <div className="timer-seconds">
                    {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:
                    {(timeLeft % 60).toString().padStart(2, '0')}
                  </div>
                  <div className="timer-label">Time Left</div>
                </div>
              </div>
            </div>

            {/* WPM Metric */}
            <div className="ribbon-metric-card wpm">
              <div className="metric-icon">
                <Gauge size={18} />
              </div>
              <div className="metric-details">
                <span className="m-label">WPM</span>
                <span className="m-val">{liveWpm}</span>
              </div>
            </div>

            {/* Accuracy Metric */}
            <div className="ribbon-metric-card accuracy">
              <div className="metric-icon">
                <Target size={18} />
              </div>
              <div className="metric-details">
                <span className="m-label">Accuracy</span>
                <span className="m-val">{liveAccuracy}%</span>
              </div>
            </div>

            {/* Characters Metric */}
            <div className="ribbon-metric-card chars">
              <div className="metric-icon">
                <FileText size={18} />
              </div>
              <div className="metric-details">
                <span className="m-label">Characters</span>
                <span className="m-val">{charCount}</span>
              </div>
            </div>

            {/* Errors Metric */}
            <div className="ribbon-metric-card errors">
              <div className="metric-icon">
                <AlertCircle size={18} />
              </div>
              <div className="metric-details">
                <span className="m-label">Errors</span>
                <span className="m-val" style={{ color: errorCount > 0 ? '#ef4444' : '#1e293b' }}>
                  {errorCount}
                </span>
              </div>
            </div>

            {/* Actions: Pause / Restart */}
            <div className="ribbon-actions">
              <button
                className="btn-control pause"
                onClick={() => {
                  if (status === 'running') setStatus('paused');
                  else if (status === 'paused') setStatus('running');
                }}
              >
                {status === 'paused' ? <Play size={14} /> : <Pause size={14} />}
                {status === 'paused' ? 'Resume' : 'Pause'}
              </button>
              <button className="btn-control restart" onClick={resetTest}>
                <RotateCcw size={14} />
                Restart
              </button>
            </div>
          </div>

          {/* Interactive Text Display Arena */}
          <div
            className="typing-arena"
            ref={arenaRef}
            onClick={handleArenaClick}
          >
            <input
              type="text"
              ref={inputRef}
              className="hidden-type-input"
              value={typedInput}
              onChange={handleInputChange}
              disabled={status === 'paused' || status === 'finished'}
              autoFocus
            />

            {isLoadingPrompt ? (
              <div style={{ color: '#94a3b8', fontStyle: 'italic' }}>Fetching text from Supabase database...</div>
            ) : (
              <div>
                {words.map((word, wIdx) => {
                  const wordStartIndex = charTracker;
                  const wordEndIndex = charTracker + word.length;
                  charTracker += word.length + 1; // +1 for the space

                  const isWordActive = typedInput.length >= wordStartIndex && typedInput.length <= wordEndIndex;

                  return (
                    <span
                      key={wIdx}
                      className={`typing-word ${isWordActive ? 'active-word' : ''}`}
                    >
                      {word.split('').map((char, cIdx) => {
                        const globalCharIndex = wordStartIndex + cIdx;
                        const isTyped = globalCharIndex < typedInput.length;
                        const isCurrent = globalCharIndex === typedInput.length;
                        const isCorrect = isTyped && typedInput[globalCharIndex] === char;
                        const isWrong = isTyped && typedInput[globalCharIndex] !== char;

                        let charClass = 'pending';
                        if (isCorrect) charClass = 'correct';
                        if (isWrong) charClass = 'incorrect';

                        return (
                          <span key={cIdx} className={`typing-char ${charClass}`}>
                            {isCurrent && <span className="typing-cursor" />}
                            {char}
                          </span>
                        );
                      })}
                      {/* Space character after word */}
                      {wIdx < words.length - 1 && (
                        <span
                          className={`typing-char ${
                            wordEndIndex < typedInput.length
                              ? typedInput[wordEndIndex] === ' '
                                ? 'correct'
                                : 'incorrect'
                              : 'pending'
                          }`}
                        >
                          {wordEndIndex === typedInput.length && <span className="typing-cursor" />}
                          {' '}
                        </span>
                      )}
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Interactive Virtual Keyboard */}
          <VirtualKeyboard
            targetChar={targetChar}
            lastPressedKey={lastPressedKey}
            isLastError={isLastError}
            soundEnabled={soundEnabled}
            setSoundEnabled={setSoundEnabled}
            soundType={soundType}
            setSoundType={setSoundType}
          />
        </div>

        {/* Right Panel: Live Stats & Tips matching Image 2 */}
        <div className="live-stats-panel">
          {/* Live Stats Card */}
          <div className="live-chart-card">
            <div className="live-chart-header">
              <span className="live-chart-title">
                <TrendingUp size={16} color="#2563eb" />
                Live Stats
              </span>
            </div>

            {/* WPM Live */}
            <div style={{ marginTop: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700 }}>
                <span style={{ color: '#475569' }}>WPM (Live)</span>
                <span className="live-chart-val" style={{ color: '#2563eb' }}>{liveWpm}</span>
              </div>
              <div style={{ height: '54px', marginTop: '4px' }}>
                <svg viewBox="0 0 200 48" style={{ width: '100%', height: '100%' }}>
                  <path
                    d={`M 0 48 ${liveWpmHistory.map((val, idx) => `L ${(idx / Math.max(liveWpmHistory.length - 1, 1)) * 200} ${48 - Math.min((val / 120) * 44, 44)}`).join(' ')}`}
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="2.5"
                  />
                </svg>
              </div>
            </div>

            {/* Accuracy Live */}
            <div style={{ marginTop: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700 }}>
                <span style={{ color: '#475569' }}>Accuracy (Live)</span>
                <span className="live-chart-val" style={{ color: '#10b981' }}>{liveAccuracy}%</span>
              </div>
              <div style={{ height: '54px', marginTop: '4px' }}>
                <svg viewBox="0 0 200 48" style={{ width: '100%', height: '100%' }}>
                  <path
                    d={`M 0 48 ${liveAccHistory.map((val, idx) => `L ${(idx / Math.max(liveAccHistory.length - 1, 1)) * 200} ${48 - Math.min((val / 100) * 44, 44)}`).join(' ')}`}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2.5"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Typing Tips Card matching Image 2 */}
          <div className="tips-card">
            <div className="tips-header">
              <h4>
                <Lightbulb size={16} color="#f59e0b" />
                Typing Tips
              </h4>
              <span style={{ fontSize: '0.74rem', color: '#2563eb', fontWeight: 600, cursor: 'pointer' }}>View All</span>
            </div>
            <ul className="tips-list">
              <li><CheckCircle2 size={14} /> Keep your fingers on the home row</li>
              <li><CheckCircle2 size={14} /> Don't look at the keyboard</li>
              <li><CheckCircle2 size={14} /> Maintain a good posture</li>
              <li><CheckCircle2 size={14} /> Practice regularly</li>
              <li><CheckCircle2 size={14} /> Focus on accuracy first</li>
            </ul>
          </div>

          {/* Test Shortcuts Card matching Image 2 */}
          <div className="shortcuts-card">
            <div className="tips-header">
              <h4>
                <KeyboardIcon size={16} color="#7c3aed" />
                Test Shortcuts
              </h4>
            </div>
            <div>
              <div className="shortcut-row">
                <span className="shortcut-key-badge">Space</span>
                <span className="shortcut-desc">Start / Pause</span>
              </div>
              <div className="shortcut-row">
                <span className="shortcut-key-badge">Esc</span>
                <span className="shortcut-desc">Reset Test</span>
              </div>
              <div className="shortcut-row">
                <span className="shortcut-key-badge">Ctrl + Enter</span>
                <span className="shortcut-desc">Submit (in some modes)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Result Submission Modal (Architecture Step 4, 5, 6) */}
      {resultModalData && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  background: '#ecfdf5',
                  color: '#059669',
                  borderRadius: '50%',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '12px'
                }}
              >
                <Trophy size={32} />
              </div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1e293b' }}>
                Test Completed!
              </h2>
              <p style={{ color: '#64748b', fontSize: '0.88rem' }}>
                {resultModalData.valid ? 'Verified by Anti-Cheat Service ✓' : 'Notice: Unverified score'}
              </p>
            </div>

            {/* Score Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '12px',
                marginBottom: '24px'
              }}
            >
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>WPM</span>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#2563eb' }}>{resultModalData.wpm}</div>
              </div>
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Accuracy</span>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981' }}>{resultModalData.accuracy}%</div>
              </div>
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Errors</span>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ef4444' }}>{resultModalData.errors}</div>
              </div>
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Duration</span>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#7c3aed' }}>{resultModalData.duration}s</div>
              </div>
            </div>

            {/* Newly unlocked achievements notification */}
            {resultModalData.newlyUnlocked && resultModalData.newlyUnlocked.length > 0 && (
              <div
                style={{
                  background: '#fef3c7',
                  border: '1px solid #fde68a',
                  borderRadius: '12px',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '20px'
                }}
              >
                <Sparkles size={20} color="#d97706" />
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#92400e' }}>
                    New Milestone Unlocked!
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#b45309' }}>
                    {resultModalData.newlyUnlocked.join(', ')}
                  </div>
                </div>
              </div>
            )}

            {/* Modal actions */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={resetTest}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                Try Again
              </button>
              <button
                onClick={() => {
                  setResultModalData(null);
                  onNavigate('dashboard');
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '12px',
                  border: 'none',
                  background: '#2563eb',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                View Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
