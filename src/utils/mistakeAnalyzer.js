/**
 * Mistake Analyzer Engine for TypeMaster
 * Performs Levenshtein-based character & word sequence diffing between prompt text and typed input.
 * Calculates exact wrong, missed, and extra characters, confusion pairs, and word breakdown.
 * Uses sequence-aware word alignment to prevent extra/missing words from desynchronizing the diff.
 */

export function alignWord(targetWord, typedWord) {
  if (!targetWord && !typedWord) return [];

  // Pure extra word typed
  if (!targetWord && typedWord) {
    return typedWord.split('').map(ch => ({
      type: 'extra',
      typed: ch,
      char: ch
    }));
  }

  // Pure missed word from target
  if (targetWord && !typedWord) {
    return targetWord.split('').map(ch => ({
      type: 'missed',
      expected: ch,
      char: ch
    }));
  }

  const m = targetWord.length;
  const n = typedWord.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (targetWord[i - 1] === typedWord[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(
          dp[i - 1][j - 1], // substitution
          dp[i - 1][j],     // deletion from target (missed by user)
          dp[i][j - 1]      // insertion into target (extra by user)
        );
      }
    }
  }

  // Backtrack to find optimal operations
  let i = m, j = n;
  const ops = [];
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && targetWord[i - 1] === typedWord[j - 1]) {
      ops.unshift({ type: 'correct', char: targetWord[i - 1] });
      i--; j--;
    } else if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + 1) {
      ops.unshift({
        type: 'wrong',
        expected: targetWord[i - 1],
        typed: typedWord[j - 1],
        char: typedWord[j - 1]
      });
      i--; j--;
    } else if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) {
      ops.unshift({
        type: 'missed',
        expected: targetWord[i - 1],
        char: targetWord[i - 1]
      });
      i--;
    } else if (j > 0 && dp[i][j] === dp[i][j - 1] + 1) {
      ops.unshift({
        type: 'extra',
        typed: typedWord[j - 1],
        char: typedWord[j - 1]
      });
      j--;
    } else {
      if (i > 0 && j > 0) {
        ops.unshift({ type: 'wrong', expected: targetWord[i - 1], typed: typedWord[j - 1], char: typedWord[j - 1] });
        i--; j--;
      } else if (i > 0) {
        ops.unshift({ type: 'missed', expected: targetWord[i - 1], char: targetWord[i - 1] });
        i--;
      } else {
        ops.unshift({ type: 'extra', typed: typedWord[j - 1], char: typedWord[j - 1] });
        j--;
      }
    }
  }
  return ops;
}

/**
 * Align word sequences so an extra or missed word doesn't desynchronize the remainder of the passage.
 */
function alignWordSequences(targets, typeds) {
  const m = targets.length;
  const n = typeds.length;
  if (n === 0) {
    return { pairs: [], unreached: targets };
  }

  function similarity(w1, w2) {
    if (!w1 || !w2) return 0;
    if (w1 === w2) return 1.0;
    if (w1.toLowerCase() === w2.toLowerCase()) return 0.9;
    let common = 0;
    const len = Math.min(w1.length, w2.length);
    for (let k = 0; k < len; k++) {
      if (w1[k] === w2[k]) common++;
    }
    return common / Math.max(w1.length, w2.length);
  }

  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = -i * 0.4;
  for (let j = 0; j <= n; j++) dp[0][j] = -j * 0.4;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const sim = similarity(targets[i - 1], typeds[j - 1]);
      const matchScore = sim >= 0.35 ? (sim * 2.2) - 0.4 : -1.2;
      dp[i][j] = Math.max(
        dp[i - 1][j - 1] + matchScore,
        dp[i - 1][j] - 0.7, // target omitted
        dp[i][j - 1] - 0.7  // extra typed word
      );
    }
  }

  // Find optimal target cut-off for incomplete test passages (e.g. 1-minute time expired)
  let bestI = m;
  let maxScore = -Infinity;
  const lookahead = Math.min(m, n + 8);
  for (let candI = Math.max(0, n - 4); candI <= lookahead; candI++) {
    if (dp[candI][n] > maxScore) {
      maxScore = dp[candI][n];
      bestI = candI;
    }
  }

  let i = bestI, j = n;
  const unreached = targets.slice(bestI);
  const pairs = [];

  while (i > 0 || j > 0) {
    const sim = i > 0 && j > 0 ? similarity(targets[i - 1], typeds[j - 1]) : 0;
    const matchScore = sim >= 0.35 ? (sim * 2.2) - 0.4 : -1.2;

    if (i > 0 && j > 0 && Math.abs(dp[i][j] - (dp[i - 1][j - 1] + matchScore)) < 1e-4) {
      pairs.unshift({ target: targets[i - 1], typed: typeds[j - 1] });
      i--; j--;
    } else if (j > 0 && Math.abs(dp[i][j] - (dp[i][j - 1] - 0.7)) < 1e-4) {
      pairs.unshift({ target: '', typed: typeds[j - 1] });
      j--;
    } else if (i > 0) {
      pairs.unshift({ target: targets[i - 1], typed: '' });
      i--;
    } else {
      break;
    }
  }

  return { pairs, unreached };
}

export function analyzeSessionMistakes(promptText = '', typedInput = '') {
  const cleanPrompt = (promptText || '').trim();
  const cleanTyped = (typedInput || '').trim();

  // If no input was typed at all, return genuine zeros without fabricating errors
  if (!cleanTyped) {
    const targetWords = cleanPrompt ? cleanPrompt.split(/\s+/) : [];
    return {
      correctCharactersCount: 0,
      wrongCharactersCount: 0,
      missedCharactersCount: 0,
      extraCharactersCount: 0,
      totalMistakesCount: 0,
      mostCommonConfusion: 'None (0 Typos)',
      wordDiffs: [],
      mistakeWords: [],
      targetWords,
      unreachedWords: targetWords,
      tips: ['Type during the countdown to record your live typing speed and accuracy analysis.']
    };
  }

  const targetWords = cleanPrompt ? cleanPrompt.split(/\s+/) : [];
  const typedWords = cleanTyped ? cleanTyped.split(/\s+/) : [];

  const { pairs, unreached } = alignWordSequences(targetWords, typedWords);

  let correctCount = 0;
  let wrongCount = 0;
  let missedCount = 0;
  let extraCount = 0;

  const confusionMap = {};
  const wordDiffs = [];
  const mistakeWords = [];

  pairs.forEach((pair, idx) => {
    const target = pair.target || '';
    const typed = pair.typed || '';

    if (!target && !typed) return;

    const ops = alignWord(target, typed);
    let hasMistake = false;
    const errorBadges = [];

    ops.forEach(op => {
      if (op.type === 'correct') {
        correctCount++;
      } else if (op.type === 'wrong') {
        wrongCount++;
        hasMistake = true;
        const pairKey = `${op.expected}/${op.typed}`;
        confusionMap[pairKey] = (confusionMap[pairKey] || 0) + 1;
        errorBadges.push(`Wrong character (${op.expected} -> ${op.typed})`);
      } else if (op.type === 'missed') {
        missedCount++;
        hasMistake = true;
        errorBadges.push(`Missed character (${op.expected})`);
      } else if (op.type === 'extra') {
        extraCount++;
        hasMistake = true;
        errorBadges.push(`Extra character (${op.typed})`);
      }
    });

    const wordDiffObj = {
      index: idx + 1,
      target,
      typed,
      ops,
      hasMistake,
      errorBadges: [...new Set(errorBadges)]
    };

    wordDiffs.push(wordDiffObj);

    if (hasMistake) {
      mistakeWords.push({
        id: `err_${idx}_${Date.now()}`,
        index: mistakeWords.length + 1,
        word: target || typed,
        youTyped: typed || '(omitted)',
        correctText: target || '(unneeded)',
        ops,
        errorTypes: [...new Set(errorBadges)],
        primaryErrorType: errorBadges[0] || 'Typing error'
      });
    }
  });

  // Calculate most common confusion pair
  let mostCommonConfusion = 'None (0 Typos)';
  let maxConfusionCount = 0;
  Object.entries(confusionMap).forEach(([pair, count]) => {
    if (count > maxConfusionCount) {
      maxConfusionCount = count;
      mostCommonConfusion = `${pair} (${count}x)`;
    }
  });

  // Calculate dynamic tips based on observed patterns
  const tips = [];
  if (mostCommonConfusion !== 'None (0 Typos)') {
    tips.push(`Focus on commonly confused keys (${mostCommonConfusion.split(' ')[0]}). Place fingers lightly on their home-row anchors before striking.`);
  }
  if (missedCount > extraCount && missedCount > 0) {
    tips.push('You tend to omit characters within longer words. Try slowing down slightly to let keystroke rhythm fully complete every syllable.');
  } else if (extraCount > missedCount && extraCount > 0) {
    tips.push('You frequently register extra letters. Ensure your key switches aren’t bouncing or fingers aren’t lightly brushing adjacent keycaps.');
  } else {
    tips.push('Maintain a steady, metronome-like keystroke rhythm. Smooth cadence prevents sudden speed-burst error spikes.');
  }

  if (wrongCount > 0 && wrongCount > missedCount + extraCount) {
    tips.push('Prioritize 96%+ accuracy as your baseline before chasing raw WPM. Speed naturally compounds once precision is locked in.');
  } else {
    tips.push('Keep breathing evenly and relax your wrists to sustain higher stamina throughout longer endurance tests.');
  }

  const totalMistakes = wrongCount + missedCount + extraCount;

  return {
    correctCharactersCount: correctCount,
    wrongCharactersCount: wrongCount,
    missedCharactersCount: missedCount,
    extraCharactersCount: extraCount,
    totalMistakesCount: totalMistakes,
    mostCommonConfusion,
    wordDiffs,
    mistakeWords,
    targetWords,
    unreachedWords: unreached,
    tips
  };
}
