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
import { getPassageForDuration } from '../utils/pdfTextLoader.js';

export default function TypingTestView({
  initialSettings = {},
  onTestCompleted,
  onNavigate
}) {
  const [duration, setDuration] = useState(initialSettings.duration || 60);
  const [difficulty, setDifficulty] = useState(initialSettings.difficulty || 'Easy');
  const [category, setCategory] = useState(initialSettings.category || 'Random Text');

  const isCustomMode = duration === 'custom' || duration === 0;

  const [promptText, setPromptText] = useState('Loading typing prompt...');
  const [promptSource, setPromptSource] = useState('local');
  const [isLoadingPrompt, setIsLoadingPrompt] = useState(false);

  // Typing test runtime states
  const [status, setStatus] = useState('idle'); // 'idle', 'running', 'paused', 'finished'
  const [timeLeft, setTimeLeft] = useState(isCustomMode ? 0 : (typeof duration === 'number' ? duration : 60));
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Typing buffers
  const [typedInput, setTypedInput] = useState('');
  const [lastPressedKey, setLastPressedKey] = useState('');
  const [isLastError, setIsLastError] = useState(false);
  const [keyFeedback, setKeyFeedback] = useState(null);

  // Live calculated stats
  const [liveWpm, setLiveWpm] = useState(0);
  const [liveAccuracy, setLiveAccuracy] = useState(100);
  const [charCount, setCharCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);

  // Live chart history (recorded on 1-second debounce)
  const [liveWpmHistory, setLiveWpmHistory] = useState([0]);
  const [liveAccHistory, setLiveAccHistory] = useState([100]);

  // Audio settings synchronized with soundSynthesizer
  const [soundEnabled, setSoundEnabled] = useState(() => soundSynth.enabled);
  const [soundType, setSoundType] = useState(() => soundSynth.switchType || 'blue');

  // Result modal state
  const [resultModalData, setResultModalData] = useState(null);

  const inputRef = useRef(null);
  const arenaRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const keystrokesRef = useRef([]);
  const latestMetricsRef = useRef({ wpm: 0, accuracy: 100 });
  const typedInputRef = useRef('');
  const startTimeRef = useRef(null);
  const elapsedSecondsRef = useRef(0);
  const charCountRef = useRef(0);
  const errorCountRef = useRef(0);

  // Load Prompt from PDF Word Repository or specialized category
  const loadPrompt = useCallback(async (cat, diff, prevText = '', dur = duration) => {
    // If Random Text or default, instantly grab passage from PDF word repository
    if (!cat || cat === 'Random Text' || cat === 'All') {
      const passage = getPassageForDuration(dur, prevText);
      setPromptText(passage);
      setPromptSource('pdf_repository');
      return passage;
    }

    setIsLoadingPrompt(true);
    try {
      const res = await supabaseService.fetchPrompt(cat, diff, prevText, dur);
      if (res && res.prompt && res.prompt.text) {
        setPromptText(res.prompt.text);
        setPromptSource(res.source);
      } else {
        const passage = getPassageForDuration(dur, prevText);
        setPromptText(passage);
        setPromptSource('pdf_repository');
      }
    } catch (e) {
      console.warn('Prompt load error, using PDF word repository fallback:', e);
      const passage = getPassageForDuration(dur, prevText);
      setPromptText(passage);
      setPromptSource('pdf_repository');
    } finally {
      setIsLoadingPrompt(false);
    }
  }, [duration]);

  // Complete Fix for "New Text" Button & Dynamic Text Slicing:
  // Instantly slices a new random chunk from parsed PDF word bank according to active duration
  // and completely resets typing engine state
  const handleNewTextClick = useCallback(() => {
    // 1. Instantly select a new random slice of text from parsed PDF word bank according to duration
    const newPassage = getPassageForDuration(duration, promptText);
    setPromptText(newPassage);
    setPromptSource('pdf_repository');

    // 2. Reset typing engine state completely:
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setStatus('idle');
    setTimeLeft(isCustomMode ? 0 : (typeof duration === 'number' ? duration : 60));
    setElapsedSeconds(0);
    setTypedInput('');
    typedInputRef.current = '';
    startTimeRef.current = null;
    elapsedSecondsRef.current = 0;
    charCountRef.current = 0;
    errorCountRef.current = 0;

    // Reset visual highlights on keyboard and errors
    setLastPressedKey('');
    setIsLastError(false);
    setKeyFeedback(null);

    // Reset live WPM, Accuracy, Errors, and Characters counters to 0
    setLiveWpm(0);
    setLiveAccuracy(100);
    setCharCount(0);
    setErrorCount(0);
    latestMetricsRef.current = { wpm: 0, accuracy: 100 };
    setLiveWpmHistory([0]);
    setLiveAccHistory([100]);
    keystrokesRef.current = [];
    setResultModalData(null);

    // Focus typing arena
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [duration, isCustomMode, promptText]);

  useEffect(() => {
    if (initialSettings.customPrompt) {
      setPromptText(initialSettings.customPrompt);
      setPromptSource('drill');
      if (initialSettings.category) setCategory(initialSettings.category);
      if (initialSettings.difficulty) setDifficulty(initialSettings.difficulty);
    } else {
      // Slices random text passage from PDF word bank for active duration
      loadPrompt(category, difficulty, '', duration);
    }
  }, [category, difficulty, duration, initialSettings.customPrompt, loadPrompt]);

  // Reset test state
  const resetTest = useCallback((fetchNew = false) => {
    if (fetchNew) {
      handleNewTextClick();
      return;
    }

    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setStatus('idle');
    setTimeLeft(isCustomMode ? 0 : (typeof duration === 'number' ? duration : 60));
    setElapsedSeconds(0);
    setTypedInput('');
    typedInputRef.current = '';
    startTimeRef.current = null;
    elapsedSecondsRef.current = 0;
    charCountRef.current = 0;
    errorCountRef.current = 0;
    setLastPressedKey('');
    setIsLastError(false);
    setKeyFeedback(null);
    setLiveWpm(0);
    setLiveAccuracy(100);
    setCharCount(0);
    setErrorCount(0);
    latestMetricsRef.current = { wpm: 0, accuracy: 100 };
    setLiveWpmHistory([0]);
    setLiveAccHistory([100]);
    keystrokesRef.current = [];
    setResultModalData(null);

    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [duration, isCustomMode, handleNewTextClick]);

  useEffect(() => {
    resetTest(false);
  }, [duration, resetTest]);

  // Focus input automatically
  const handleArenaClick = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Dedicated 1-second timer tick & debounced live chart loop (decoupled from keystroke bursts)
  useEffect(() => {
    if (status !== 'running') {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      return;
    }

    timerIntervalRef.current = setInterval(() => {
      elapsedSecondsRef.current += 1;
      if (isCustomMode) {
        // Stopwatch / Count-Up Mode
        setElapsedSeconds((sec) => sec + 1);
      } else {
        // Countdown Mode
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current);
            const nominalDur = typeof duration === 'number' ? duration : 60;
            finishTest(undefined, undefined, undefined, undefined, nominalDur);
            return 0;
          }
          return prev - 1;
        });
        setElapsedSeconds((sec) => sec + 1);
      }

      // Record live chart history strictly on 1-second interval debounce
      const current = latestMetricsRef.current;
      setLiveWpmHistory((prev) => [...prev.slice(-14), current.wpm]);
      setLiveAccHistory((prev) => [...prev.slice(-14), current.accuracy]);
    }, 1000);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [status, isCustomMode, duration]);

  // Handle typing input
  const handleInputChange = (e) => {
    if (status === 'finished') return;

    if (status === 'idle') {
      setStatus('running');
      startTimeRef.current = Date.now();
      elapsedSecondsRef.current = 0;
    }

    const val = e.target.value;
    const prevLen = typedInput.length;
    const isAdding = val.length > prevLen;

    setTypedInput(val);
    typedInputRef.current = val;
    setCharCount(val.length);
    charCountRef.current = val.length;

    // Calculate errors & correct chars
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
    errorCountRef.current = errors;

    // Audio & Keyboard state
    if (isAdding) {
      const key = val.slice(-1);
      const isCurrentCharError = val[val.length - 1] !== promptText[val.length - 1];
      setIsLastError(isCurrentCharError);
      setLastPressedKey(key);
      setKeyFeedback({
        key,
        isCorrect: !isCurrentCharError,
        id: Date.now() + Math.random()
      });

      if (isCurrentCharError) {
        soundSynth.playErrorSound();
      } else {
        soundSynth.playKeySound(key === ' ');
      }
      keystrokesRef.current.push({ char: key, timestamp: Date.now() });
    } else if (val.length < prevLen) {
      // Backspace pressed
      soundSynth.playBackspaceSound();
      setIsLastError(false);
      setLastPressedKey('Backspace');
      setKeyFeedback({
        key: 'Backspace',
        isCorrect: true,
        id: Date.now() + Math.random()
      });
    }

    // Live Metrics calculation
    const currentElapsed = Math.max(elapsedSecondsRef.current || 1, 1);
    const minutes = currentElapsed / 60;
    const calculatedWpm = Math.max(0, Math.round((correctChars / 5) / minutes));
    const accuracyCalc = val.length > 0 ? Math.round((correctChars / val.length) * 100) : 100;

    latestMetricsRef.current = { wpm: calculatedWpm, accuracy: accuracyCalc };
    setLiveWpm(calculatedWpm);
    setLiveAccuracy(accuracyCalc);

    // Check if user completed the entire prompt text
    if (val.length >= promptText.length && promptText.length > 0) {
      finishTest(calculatedWpm, accuracyCalc, errors, val.length);
    }
  };

  // Submit test to backend
  const finishTest = async (overrideWpm, overrideAcc, overrideErr, overrideChars, overrideDuration) => {
    setStatus('finished');
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
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

    const currentInput = typedInputRef.current || typedInput;
    const currentChars = overrideChars !== undefined ? overrideChars : (charCountRef.current || currentInput.length);
    const currentErrors = overrideErr !== undefined ? overrideErr : errorCountRef.current;

    // Accurate duration calculation
    const nominalDuration = typeof duration === 'number' ? duration : 60;
    const computedElapsed = startTimeRef.current
      ? Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000))
      : (elapsedSecondsRef.current || 1);

    const finalDuration = overrideDuration !== undefined
      ? overrideDuration
      : (isCustomMode ? computedElapsed : (overrideWpm !== undefined ? computedElapsed : nominalDuration));

    let correctChars = 0;
    for (let i = 0; i < currentInput.length; i++) {
      if (currentInput[i] === promptText[i]) correctChars++;
    }

    const accurateWpm = Math.max(0, Math.round(((correctChars / 5) / (finalDuration / 60))));
    const finalAccuracy = overrideAcc !== undefined
      ? overrideAcc
      : (currentInput.length > 0 ? Math.round((correctChars / currentInput.length) * 100) : 100);

    const finalWpm = overrideWpm !== undefined
      ? overrideWpm
      : (latestMetricsRef.current.wpm > 0 ? latestMetricsRef.current.wpm : accurateWpm);

    const payload = {
      wpm: finalWpm,
      rawWpm: Math.round((currentChars / 5) / (finalDuration / 60)),
      accuracy: finalAccuracy,
      duration: finalDuration,
      errors: currentErrors,
      characters: currentChars,
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
            { label: '1 min', val: 60 },
            { label: '3 min', val: 180 },
            { label: '5 min', val: 300 },
            { label: 'Custom', val: 'custom' }
          ].map((item) => (
            <button
              key={item.label}
              className={`pill-btn ${duration === item.val ? 'active' : ''}`}
              onClick={() => {
                setDuration(item.val);
                const nextIsCustom = item.val === 'custom' || item.val === 0;
                setTimeLeft(nextIsCustom ? 0 : item.val);
                setStatus('idle');
                setElapsedSeconds(0);
                setTypedInput('');
                typedInputRef.current = '';
                startTimeRef.current = null;
                elapsedSecondsRef.current = 0;
                charCountRef.current = 0;
                errorCountRef.current = 0;
                setLastPressedKey('');
                setIsLastError(false);
                setKeyFeedback(null);
                setLiveWpm(0);
                setLiveAccuracy(100);
                const newPassage = getPassageForDuration(item.val, promptText);
                setPromptText(newPassage);
                setPromptSource('pdf_repository');
                if (inputRef.current) inputRef.current.focus();
              }}
              style={duration === item.val ? { background: '#2563eb', color: '#ffffff' } : {}}
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
            <option value="Science & Nature">Science & Nature</option>
          </select>

          <button
            onClick={handleNewTextClick}
            disabled={isLoadingPrompt}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '10px',
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              color: '#2563eb',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
            title="Load a new random text passage from the PDF word repository and reset test"
          >
            <Sparkles size={14} /> {isLoadingPrompt ? 'Loading...' : 'New Text'}
          </button>
        </div>
      </div>

      {/* Main Grid: Left Typing Area + Right Live Stats Panel */}
      <div className="typing-test-layout">
        <div className="typing-test-main">
          {/* Stats Ribbon matching Image 2 */}
          <div className="test-stats-ribbon">
            {/* Circular Timer (Countdown or Stopwatch Count-Up) */}
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
                    strokeDashoffset={
                      isCustomMode
                        ? 2 * Math.PI * 30 * (1 - (elapsedSeconds % 60) / 60)
                        : 2 * Math.PI * 30 * (1 - timeLeft / (typeof duration === 'number' ? duration : 60))
                    }
                  />
                </svg>
                <div className="timer-circle-text">
                  <div className="timer-seconds">
                    {isCustomMode ? (
                      `${Math.floor(elapsedSeconds / 60).toString().padStart(2, '0')}:${(elapsedSeconds % 60).toString().padStart(2, '0')}`
                    ) : (
                      `${Math.floor(timeLeft / 60).toString().padStart(2, '0')}:${(timeLeft % 60).toString().padStart(2, '0')}`
                    )}
                  </div>
                  <div className="timer-label">{isCustomMode ? 'Stopwatch' : 'Time Left'}</div>
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

            {/* Actions: Finish / Pause / Restart */}
            <div className="ribbon-actions">
              {isCustomMode && (
                <button
                  className="btn-control finish"
                  onClick={() => finishTest()}
                  style={{
                    background: '#10b981',
                    color: '#ffffff',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: '10px',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                  title="Finish open-ended test and submit score"
                >
                  <CheckCircle2 size={14} /> Finish Test
                </button>
              )}
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
              <button className="btn-control restart" onClick={() => resetTest(false)}>
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
              onKeyDown={(e) => {
                if (e.key === 'Backspace') {
                  soundSynth.playBackspaceSound();
                  setKeyFeedback({
                    key: 'Backspace',
                    isCorrect: true,
                    id: Date.now() + Math.random()
                  });
                }
              }}
              disabled={status === 'paused' || status === 'finished'}
              autoFocus
            />

            {isLoadingPrompt ? (
              <div style={{ color: '#94a3b8', fontStyle: 'italic' }}>Fetching text from database...</div>
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
            keyFeedback={keyFeedback}
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
                onClick={() => resetTest(true)}
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
