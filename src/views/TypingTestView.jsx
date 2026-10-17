import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  ArrowRight,
  CalendarClock
} from 'lucide-react';
import confetti from 'canvas-confetti';
import VirtualKeyboard from '../components/VirtualKeyboard';
import { supabaseService } from '../services/supabaseService';
import { soundSynth } from '../services/soundSynthesizer';
import FirstTestFeedbackModal from '../components/FirstTestFeedbackModal';
import ReviewMistakesView from './ReviewMistakesView';
import { analyzeSessionMistakes } from '../utils/mistakeAnalyzer';

export default function TypingTestView({
  initialSettings = {},
  onTestCompleted,
  onNavigate
}) {
  const [duration, setDuration] = useState(initialSettings.duration || 60);
  const [customMinutes, setCustomMinutes] = useState(4);
  const [difficulty, setDifficulty] = useState(initialSettings.difficulty || 'Easy');
  const [category, setCategory] = useState(initialSettings.category || 'Random Text');
  const [language, setLanguage] = useState(initialSettings.language || 'C');
  const [medicalSubcategory, setMedicalSubcategory] = useState(initialSettings.medicalSubcategory || 'Medical Billing & Claims');

  const isCustomMode = duration === 'custom' || duration === 0;

  const [promptText, setPromptText] = useState('Loading typing prompt...');
  const [promptSource, setPromptSource] = useState('gemini_api');
  const [generatedCategory, setGeneratedCategory] = useState('');
  const [isLoadingPrompt, setIsLoadingPrompt] = useState(false);
  const [generationError, setGenerationError] = useState(null);

  const activeRequestIdRef = useRef(0);
  const abortControllerRef = useRef(null);

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

  // First-test feedback modal state
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  // Completed session review state
  const [completedSessionData, setCompletedSessionData] = useState(null);
  const [viewingMistakes, setViewingMistakes] = useState(false);

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
  const finishTestRef = useRef(null);
  const isFinishingRef = useRef(false);

  // Dynamic Gemini-powered passage generation with request-cancellation & error-handling
  const fetchDynamicPassage = useCallback(
    async (
      cat = category,
      diff = difficulty,
      lang = language,
      dur = duration,
      exclude = promptText,
      medSub = medicalSubcategory,
      customMin = customMinutes
    ) => {
      // Cancel previous in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const reqId = ++activeRequestIdRef.current;
      setIsLoadingPrompt(true);
      setGenerationError(null);

      let targetSec = 60;
      if (dur === 'custom' || dur === 0) {
        const m = typeof customMin === 'number' ? customMin : customMinutes;
        targetSec = Math.round(Math.max(0.5, Math.min(15, m)) * 60);
      } else if (typeof dur === 'number') {
        targetSec = dur;
      }

      try {
        const geminiConfig = await supabaseService.getGeminiConfig();

        const response = await fetch('/api/typing/generate-text', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            category: cat,
            difficulty: diff,
            language: cat === 'Programming' ? lang : undefined,
            medicalSubcategory: cat === 'Medical' ? (medSub || medicalSubcategory || 'Medical Billing & Claims') : undefined,
            durationSeconds: targetSec,
            excludeText: exclude || promptText || '',
            apiKey: geminiConfig?.apiKey || '',
            model: geminiConfig?.model || 'gemini-3.5-flash'
          }),
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error(`Generation failed with status ${response.status}`);
        }

        const data = await response.json();

        // Prevent stale responses if user clicked another control
        if (activeRequestIdRef.current !== reqId) return;

        if (data.success && data.text) {
          setPromptText(data.text);
          setPromptSource(data.source || 'gemini_api');
          if (data.generatedCategory) {
            setGeneratedCategory(data.generatedCategory);
          }
          setGenerationError(null);

          // Completely reset typing engine state for the new passage:
          if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
          setStatus('idle');
          setTimeLeft(isCustomMode ? 0 : targetSec);
          setElapsedSeconds(0);
          setTypedInput('');
          typedInputRef.current = '';
          startTimeRef.current = null;
          elapsedSecondsRef.current = 0;
          charCountRef.current = 0;
          errorCountRef.current = 0;

          // Reset visual highlights
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

          if (arenaRef.current) {
            arenaRef.current.scrollTop = 0;
          }
          if (inputRef.current) {
            inputRef.current.focus({ preventScroll: true });
          }
        } else {
          throw new Error(data.error || 'Unable to generate passage.');
        }
      } catch (err) {
        if (err.name === 'AbortError') return;
        console.warn('[TypingTestView] Generation failed, preserving previous passage:', err);
        if (activeRequestIdRef.current === reqId) {
          setPromptText(prev => {
            if (!prev || prev === 'Loading typing prompt...') {
              return 'The art of bookbinding begins with selecting high quality leather, carefully hand-pressed to achieve smooth, rich texture. Skilled artisans stitch the paper signatures together using durable linen threads.';
            }
            return prev;
          });
          setGenerationError(null);
        }
      } finally {
        if (activeRequestIdRef.current === reqId) {
          setIsLoadingPrompt(false);
        }
      }
    },
    [category, difficulty, language, duration, isCustomMode, promptText, medicalSubcategory, customMinutes]
  );

  // New Text button triggers dynamic category-aware generation
  const handleNewTextClick = useCallback(() => {
    fetchDynamicPassage(category, difficulty, language, duration, promptText, medicalSubcategory, customMinutes);
  }, [fetchDynamicPassage, category, difficulty, language, duration, promptText, medicalSubcategory, customMinutes]);

  // Auto-scroll the active cursor/word within the passage container to keep current typing line visible
  useEffect(() => {
    if (!arenaRef.current) return;
    const arena = arenaRef.current;

    if (typedInput.length === 0) {
      arena.scrollTop = 0;
      return;
    }

    const rafId = requestAnimationFrame(() => {
      if (!arenaRef.current) return;
      const activeElem =
        arena.querySelector('.typing-cursor') ||
        arena.querySelector('.active-word') ||
        arena.querySelector('.typing-char.pending');

      if (!activeElem) return;

      const arenaRect = arena.getBoundingClientRect();
      const elemRect = activeElem.getBoundingClientRect();

      const relativeTop = elemRect.top - arenaRect.top;
      const relativeBottom = elemRect.bottom - arenaRect.top;
      const arenaHeight = arena.clientHeight;

      // Keep active line within visible portion (middle/lower-middle) without scrolling entire page
      const bottomThreshold = arenaHeight - 65;
      const topThreshold = 45;

      if (relativeBottom > bottomThreshold) {
        const targetScroll = arena.scrollTop + (relativeTop - arenaHeight * 0.45);
        arena.scrollTo({ top: targetScroll, behavior: 'smooth' });
      } else if (relativeTop < topThreshold) {
        const targetScroll = Math.max(0, arena.scrollTop + (relativeTop - arenaHeight * 0.35));
        arena.scrollTo({ top: targetScroll, behavior: 'smooth' });
      }
    });

    return () => cancelAnimationFrame(rafId);
  }, [typedInput]);

  useEffect(() => {
    if (initialSettings.customPrompt || initialSettings.promptText || initialSettings.content) {
      const customP = initialSettings.customPrompt || initialSettings.promptText || initialSettings.content;
      setPromptText(customP);
      setPromptSource(initialSettings.scheduledTestId ? 'scheduled_test' : 'drill');
      if (initialSettings.category) setCategory(initialSettings.category);
      if (initialSettings.difficulty) setDifficulty(initialSettings.difficulty);
      if (initialSettings.duration) {
        const durVal = typeof initialSettings.duration === 'number' ? initialSettings.duration : 60;
        setDuration(durVal);
        setTimeLeft(durVal);
      }
    } else {
      fetchDynamicPassage(category, difficulty, language, duration);
    }
  }, []);


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
    isFinishingRef.current = false;
    setResultModalData(null);
    setCompletedSessionData(null);
    setViewingMistakes(false);

    if (arenaRef.current) {
      arenaRef.current.scrollTop = 0;
    }
    if (inputRef.current) {
      inputRef.current.focus({ preventScroll: true });
    }
  }, [duration, isCustomMode, handleNewTextClick]);

  useEffect(() => {
    resetTest(false);
  }, [duration, resetTest]);

  // Focus input automatically without scrolling
  const handleArenaClick = () => {
    if (inputRef.current) {
      inputRef.current.focus({ preventScroll: true });
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
            if (finishTestRef.current) {
              finishTestRef.current(undefined, undefined, undefined, undefined, nominalDur);
            }
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
    if (status === 'finished' || isFinishingRef.current) return;

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
    if (isFinishingRef.current) return;
    isFinishingRef.current = true;
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

    const mistakeAnalysis = analyzeSessionMistakes(promptText, currentInput);
    const totalMistakes = mistakeAnalysis.totalMistakesCount;
    const now = new Date();
    const sessionPayload = {
      wpm: finalWpm,
      rawWpm: Math.round((currentChars / 5) / (finalDuration / 60)),
      accuracy: finalAccuracy,
      duration: finalDuration,
      errors: totalMistakes,
      uncorrectedErrors: currentErrors,
      uncorrected_errors: currentErrors,
      totalMistakes: totalMistakes,
      total_mistakes: totalMistakes,
      characters: currentChars,
      correctCharacters: mistakeAnalysis.correctCharactersCount,
      correct_characters: mistakeAnalysis.correctCharactersCount,
      wrongCharacters: mistakeAnalysis.wrongCharactersCount,
      wrong_characters: mistakeAnalysis.wrongCharactersCount,
      missedCharacters: mistakeAnalysis.missedCharactersCount,
      missed_characters: mistakeAnalysis.missedCharactersCount,
      extraCharacters: mistakeAnalysis.extraCharactersCount,
      extra_characters: mistakeAnalysis.extraCharactersCount,
      elapsedSeconds: finalDuration,
      category,
      difficulty,
      scheduled_test_id: initialSettings.scheduledTestId || null,
      scheduled_test_title: initialSettings.scheduledTestTitle || null,
      started_at: startTimeRef.current ? new Date(startTimeRef.current).toISOString() : new Date(now.getTime() - finalDuration * 1000).toISOString(),
      completed_at: now.toISOString(),
      score: Math.round(finalWpm * (finalAccuracy / 100)),
      status: 'completed',
      promptText,
      prompt_text: promptText,
      typedInput: currentInput,
      typed_input: currentInput,
      mistakeDetails: mistakeAnalysis.mistakeWords,
      mistake_details: mistakeAnalysis.mistakeWords,
      mistakeStats: {
        wrongCount: mistakeAnalysis.wrongCharactersCount,
        missedCount: mistakeAnalysis.missedCharactersCount,
        extraCount: mistakeAnalysis.extraCharactersCount,
        confusionPair: mistakeAnalysis.mostCommonConfusion
      },
      mistake_stats: {
        wrongCount: mistakeAnalysis.wrongCharactersCount,
        missedCount: mistakeAnalysis.missedCharactersCount,
        extraCount: mistakeAnalysis.extraCharactersCount,
        confusionPair: mistakeAnalysis.mostCommonConfusion
      },
      timestamp: now.toISOString(),
      formattedDate: now.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      formattedTime: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };

    let submissionResult;
    try {
      submissionResult = await supabaseService.submitTest(sessionPayload);
    } catch (err) {
      console.warn('submitTest notice:', err);
    }

    const fullSessionData = {
      ...sessionPayload,
      ...(submissionResult || {}),
      user: submissionResult?.user || supabaseService.getCurrentUser()
    };

    setCompletedSessionData(fullSessionData);
    setViewingMistakes(true);
    setResultModalData(fullSessionData);

    // Check First-Test condition for Feedback Modal
    const activeUser = supabaseService.getCurrentUser();
    const activeUserId = activeUser?.id;
    const feedbackKey = activeUserId ? `typemaster_feedback_submitted_${activeUserId}` : 'typemaster_feedback_submitted_guest';
    const alreadySubmitted = localStorage.getItem(feedbackKey) === 'true';
    const testsCount = submissionResult?.user?.tests_completed ?? activeUser?.tests_completed ?? 1;

    if (testsCount <= 1 && !alreadySubmitted) {
      setTimeout(() => {
        setShowFeedbackModal(true);
      }, 1200);
    }

    if (onTestCompleted) {
      onTestCompleted();
    }
  };
  useEffect(() => {
    finishTestRef.current = finishTest;
  });

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
  const wordsWithIndices = useMemo(() => {
    const list = promptText.split(' ');
    const items = [];
    let cur = 0;
    for (let i = 0; i < list.length; i++) {
      const w = list[i];
      items.push({ word: w, start: cur, end: cur + w.length });
      cur += w.length + 1;
    }
    return items;
  }, [promptText]);

  // Render "Review Your Mistakes" View immediately after test finishes
  if (status === 'finished' && completedSessionData && viewingMistakes) {
    return (
      <div className="page-container" style={{ padding: '0 0 40px 0' }}>
        <ReviewMistakesView
          sessionData={completedSessionData}
          onNavigate={onNavigate}
          onRetryTest={() => {
            setViewingMistakes(false);
            setCompletedSessionData(null);
            resetTest(false);
          }}
          onPracticeMistakes={(missedWords) => {
            if (!missedWords || missedWords.length === 0) return;
            const drillPrompt = missedWords.slice(0, 15).join(' ') + ' ' + missedWords.slice(0, 15).join(' ');
            setPromptText(drillPrompt);
            setCategory('Mistake Drill');
            setDifficulty('Targeted Practice');
            setDuration(60);
            setViewingMistakes(false);
            setCompletedSessionData(null);
            resetTest(false);
          }}
        />

        {/* First-Test Feedback Popup Modal */}
        <FirstTestFeedbackModal
          isOpen={showFeedbackModal}
          onClose={() => setShowFeedbackModal(false)}
          userId={supabaseService.getCurrentUser()?.id}
          userName={supabaseService.getCurrentUser()?.username || supabaseService.getCurrentUser()?.display_name || 'Typist'}
          userEmail={supabaseService.getCurrentUser()?.email || ''}
        />
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="greeting-header">
        <div className="greeting-text">
          <h1>Typing Test</h1>
          <p>Test your typing speed and accuracy. Choose duration, difficulty and start typing!</p>
        </div>
      </div>

      {/* Sub-navigation Tabs: Speed Test | Scheduled Tests */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '16px',
          background: '#f1f5f9',
          padding: '4px',
          borderRadius: '12px',
          width: 'fit-content'
        }}
      >
        <button
          type="button"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '7px 16px',
            borderRadius: '9px',
            border: 'none',
            fontSize: '0.84rem',
            fontWeight: 700,
            cursor: 'pointer',
            background: '#ffffff',
            color: '#2563eb',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}
        >
          <KeyboardIcon size={15} />
          Speed Test
        </button>
        <button
          type="button"
          onClick={() => onNavigate && onNavigate('scheduled-tests')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '7px 16px',
            borderRadius: '9px',
            border: 'none',
            fontSize: '0.84rem',
            fontWeight: 700,
            cursor: 'pointer',
            background: 'transparent',
            color: '#64748b',
            transition: 'all 0.15s'
          }}
          title="Browse published scheduled typing challenges"
        >
          <CalendarClock size={15} />
          Scheduled Tests
        </button>
      </div>

      {/* If this is a scheduled challenge, display prominent banner */}
      {initialSettings.scheduledTestId && (
        <div
          style={{
            background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)',
            color: '#FFFFFF',
            padding: '12px 20px',
            borderRadius: '12px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 14px rgba(49, 46, 129, 0.25)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ background: '#10B981', color: '#FFFFFF', padding: '3px 8px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 800 }}>
              SCHEDULED CHALLENGE
            </span>
            <span style={{ fontWeight: 800, fontSize: '0.94rem' }}>
              {initialSettings.scheduledTestTitle || 'Official Typing Challenge'}
            </span>
          </div>
          <span style={{ fontSize: '0.78rem', color: '#C7D2FE' }}>
            Official Passage Loaded • Verified Attempt
          </span>
        </div>
      )}

      {/* If this is a targeted practice drill, display prominent banner */}
      {(initialSettings.drillTitle || initialSettings.focusKeys) && (
        <div
          style={{
            background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
            color: '#FFFFFF',
            padding: '12px 20px',
            borderRadius: '12px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
            boxShadow: '0 4px 14px rgba(15, 23, 42, 0.25)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ background: '#4F46E5', color: '#FFFFFF', padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800 }}>
              PRACTICE DRILL
            </span>
            <span style={{ fontWeight: 800, fontSize: '0.94rem' }}>
              {initialSettings.drillTitle || 'Targeted Practice'}
            </span>
            <span style={{ fontSize: '0.74rem', background: '#334155', color: '#CBD5E1', padding: '2px 8px', borderRadius: '4px' }}>
              {initialSettings.category} • {initialSettings.difficulty}
            </span>
          </div>
          {initialSettings.focusKeys && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}>
              <span style={{ color: '#94A3B8', fontWeight: 600 }}>Focus Keys:</span>
              <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#38BDF8', background: 'rgba(56, 189, 248, 0.1)', padding: '2px 8px', borderRadius: '6px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                {Array.isArray(initialSettings.focusKeys) ? initialSettings.focusKeys.join(' ') : initialSettings.focusKeys}
              </span>
            </div>
          )}
        </div>
      )}

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>Test Duration</span>
          {[
            { label: '1 min', val: 60 },
            { label: '2 min', val: 120 },
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
                fetchDynamicPassage(category, difficulty, language, item.val, '', medicalSubcategory, customMinutes);
                if (inputRef.current) inputRef.current.focus({ preventScroll: true });
              }}
              style={duration === item.val ? { background: '#2563eb', color: '#ffffff' } : {}}
            >
              {item.label}
            </button>
          ))}

          {/* Inline Custom Duration Input (0.5 to 15 minutes) */}
          {duration === 'custom' && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginLeft: '4px' }}>
              <input
                type="number"
                min="0.5"
                max="15"
                step="0.5"
                value={customMinutes}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  const validVal = isNaN(val) ? 1 : Math.max(0.5, Math.min(15, val));
                  setCustomMinutes(validVal);
                  fetchDynamicPassage(category, difficulty, language, 'custom', promptText, medicalSubcategory, validVal);
                }}
                style={{
                  width: '54px',
                  padding: '4px 6px',
                  borderRadius: '8px',
                  border: '1.5px solid #2563eb',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: '#1d4ed8',
                  background: '#eff6ff',
                  textAlign: 'center',
                  outline: 'none'
                }}
                title="Enter custom test duration in minutes (0.5 to 15 min)"
              />
              <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>min</span>
            </div>
          )}
        </div>

        {/* Difficulty Selectors */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>Difficulty Level</span>
          <button
            className={`pill-btn diff-easy ${difficulty === 'Easy' ? 'active' : ''}`}
            onClick={() => {
              setDifficulty('Easy');
              fetchDynamicPassage(category, 'Easy', language, duration, promptText, medicalSubcategory, customMinutes);
            }}
          >
            Easy
          </button>
          <button
            className={`pill-btn diff-med ${difficulty === 'Medium' ? 'active' : ''}`}
            onClick={() => {
              setDifficulty('Medium');
              fetchDynamicPassage(category, 'Medium', language, duration, promptText, medicalSubcategory, customMinutes);
            }}
          >
            Medium
          </button>
          <button
            className={`pill-btn diff-hard ${difficulty === 'Hard' ? 'active' : ''}`}
            onClick={() => {
              setDifficulty('Hard');
              fetchDynamicPassage(category, 'Hard', language, duration, promptText, medicalSubcategory, customMinutes);
            }}
          >
            Hard
          </button>
        </div>

        {/* Category & Subcategory Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>Text Category</span>
          <select
            value={category}
            onChange={(e) => {
              const newCat = e.target.value;
              setCategory(newCat);
              const targetMedSub = newCat === 'Medical' ? (medicalSubcategory || 'Medical Billing & Claims') : medicalSubcategory;
              if (newCat === 'Medical' && !medicalSubcategory) {
                setMedicalSubcategory('Medical Billing & Claims');
              }
              fetchDynamicPassage(newCat, difficulty, language, duration, promptText, targetMedSub, customMinutes);
            }}
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
            <option value="Medical">Medical</option>
          </select>

          {/* Medical Subcategory Selector - Only when category is Medical */}
          {category === 'Medical' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0284c7' }}>Subcategory</span>
              <select
                value={medicalSubcategory || 'Medical Billing & Claims'}
                onChange={(e) => {
                  const newSub = e.target.value;
                  setMedicalSubcategory(newSub);
                  fetchDynamicPassage('Medical', difficulty, language, duration, promptText, newSub, customMinutes);
                }}
                style={{
                  padding: '6px 14px',
                  borderRadius: '10px',
                  border: '1.5px solid #0284c7',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  background: '#f0f9ff',
                  color: '#0369a1',
                  cursor: 'pointer'
                }}
                title="Select Medical Subcategory for practice"
              >
                <option value="Medical Billing & Claims">Medical Billing & Claims</option>
                <option value="Medical Terminology">Medical Terminology</option>
                <option value="ICD-10-CM & CPT Coding">ICD-10-CM & CPT Coding</option>
                <option value="Insurance Verification">Insurance Verification</option>
                <option value="Patient Data Entry">Patient Data Entry</option>
                <option value="Payment Posting & Accounts Receivable">Payment Posting & Accounts Receivable</option>
                <option value="Medical Documentation">Medical Documentation</option>
                <option value="Numbers & Special Characters">Numbers & Special Characters</option>
              </select>
            </div>
          )}

          {/* Programming Language Selector - Only when category is Programming */}
          {category === 'Programming' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#3b82f6' }}>Language</span>
              <select
                value={language}
                onChange={(e) => {
                  const newLang = e.target.value;
                  setLanguage(newLang);
                  fetchDynamicPassage('Programming', difficulty, newLang, duration, promptText, medicalSubcategory, customMinutes);
                }}
                style={{
                  padding: '6px 14px',
                  borderRadius: '10px',
                  border: '1.5px solid #3b82f6',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  background: '#eff6ff',
                  color: '#1d4ed8',
                  cursor: 'pointer'
                }}
                title="Select Programming Language for practice"
              >
                <option value="C">C (Default)</option>
                <option value="Python">Python</option>
                <option value="Java">Java</option>
                <option value="JavaScript">JavaScript</option>
                <option value="C++">C++</option>
              </select>
            </div>
          )}

          <button
            onClick={handleNewTextClick}
            disabled={isLoadingPrompt}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '10px',
              background: isLoadingPrompt ? '#f1f5f9' : '#eff6ff',
              border: '1px solid #bfdbfe',
              color: isLoadingPrompt ? '#94a3b8' : '#2563eb',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: isLoadingPrompt ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s'
            }}
            title="Generate a new category-specific passage using Gemini AI"
          >
            <Sparkles size={14} />
            {isLoadingPrompt ? 'Generating...' : 'New Text'}
          </button>
        </div>
      </div>

      {/* Clear error notification with Retry button */}
      {generationError && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            padding: '10px 18px',
            borderRadius: '12px',
            fontSize: '0.86rem',
            fontWeight: 600,
            marginTop: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} />
            <span>{generationError}</span>
          </div>
          <button
            onClick={() => handleNewTextClick()}
            style={{
              background: '#ef4444',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '4px 12px',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      )}


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

          {/* Active Passage Info Banner */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 10px', marginBottom: '8px', fontSize: '0.8rem', color: '#64748b' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '3px 10px', borderRadius: '12px', fontWeight: 700, fontSize: '0.78rem' }}>
                <Sparkles size={12} color="#2563eb" />
                {category === 'Random Text' && generatedCategory
                  ? `${generatedCategory}`
                  : (category === 'Medical' ? `Medical: ${medicalSubcategory}` : category)}
              </span>
              <span style={{ background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0', padding: '3px 8px', borderRadius: '8px', fontWeight: 600, fontSize: '0.75rem' }}>
                {difficulty}
              </span>
              <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                {promptText && promptText !== 'Loading typing prompt...' ? `${promptText.trim().split(/\s+/).filter(Boolean).length} words` : ''}
              </span>
            </div>
            {promptSource && (
              <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                {promptSource === 'gemini_api' ? '✨ Gemini AI Generation' : '📚 Verified Practice Bank'}
              </span>
            )}
          </div>

          {/* Interactive Text Display Arena */}
          <div
            className={`typing-arena ${category === 'Programming' ? 'programming-mode' : ''}`}
            ref={arenaRef}
            onClick={handleArenaClick}
            style={
              category === 'Programming'
                ? {
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                    lineHeight: '1.7',
                    tabSize: 4
                  }
                : {}
            }
          >
            <textarea
              ref={inputRef}
              className="hidden-type-input"
              value={typedInput}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === 'Tab') {
                  e.preventDefault();
                  // Match indentation at current position or insert 4 spaces
                  const remainingPrompt = promptText.slice(typedInput.length);
                  const indentMatch = remainingPrompt.match(/^(\s{2,4})/);
                  const insertStr = indentMatch ? indentMatch[1] : '    ';
                  const nextVal = typedInput + insertStr;
                  handleInputChange({ target: { value: nextVal } });
                } else if (e.key === 'Backspace') {
                  soundSynth.playBackspaceSound();
                  setKeyFeedback({
                    key: 'Backspace',
                    isCorrect: true,
                    id: Date.now() + Math.random()
                  });
                }
              }}
              rows={1}
              disabled={status === 'paused' || status === 'finished'}
              autoFocus
            />

            {isLoadingPrompt ? (
              <div style={{ color: '#64748b', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={16} /> Generating dynamic passage using Google Gemini...
              </div>
            ) : category === 'Programming' ? (
              <div className="code-arena-container" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {promptText.split('\n').map((lineText, lineIdx, allLines) => {
                  const lineStartIndex = allLines.slice(0, lineIdx).reduce((acc, l) => acc + l.length + 1, 0);

                  return (
                    <div key={lineIdx} className="code-typing-line" style={{ display: 'flex', minHeight: '1.6em' }}>
                      <span
                        className="code-line-number"
                        style={{
                          width: '32px',
                          userSelect: 'none',
                          color: '#94a3b8',
                          fontSize: '0.84rem',
                          textAlign: 'right',
                          paddingRight: '12px',
                          fontFamily: 'monospace'
                        }}
                      >
                        {lineIdx + 1}
                      </span>
                      <span className="code-line-content" style={{ flex: 1, whiteSpace: 'pre-wrap' }}>
                        {lineText.split('').map((char, cIdx) => {
                          const globalCharIndex = lineStartIndex + cIdx;
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
                        {/* Newline indicator at end of line */}
                        {lineIdx < allLines.length - 1 && (() => {
                          const newlineIndex = lineStartIndex + lineText.length;
                          const isNewlineTyped = newlineIndex < typedInput.length;
                          const isNewlineCurrent = newlineIndex === typedInput.length;
                          const isNewlineCorrect = isNewlineTyped && typedInput[newlineIndex] === '\n';
                          const isNewlineWrong = isNewlineTyped && typedInput[newlineIndex] !== '\n';

                          let nlClass = 'pending';
                          if (isNewlineCorrect) nlClass = 'correct';
                          if (isNewlineWrong) nlClass = 'incorrect';

                          return (
                            <span
                              className={`typing-char newline-char ${nlClass}`}
                              style={{ opacity: 0.5, fontSize: '0.82em', marginLeft: '3px' }}
                              title="Press Enter"
                            >
                              {isNewlineCurrent && <span className="typing-cursor" />}
                              ↵
                            </span>
                          );
                        })()}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div>
                {wordsWithIndices.map(({ word, start: wordStartIndex, end: wordEndIndex }, wIdx) => {
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
                      {wIdx < wordsWithIndices.length - 1 && (
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

      {/* First-Test Feedback Popup Modal */}
      <FirstTestFeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        userId={supabaseService.getCurrentUser()?.id}
        userName={supabaseService.getCurrentUser()?.username || supabaseService.getCurrentUser()?.display_name || 'Typist'}
        userEmail={supabaseService.getCurrentUser()?.email || ''}
      />
    </div>
  );
}
