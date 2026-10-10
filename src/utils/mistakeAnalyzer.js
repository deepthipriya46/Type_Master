/**
 * Mistake Analyzer Engine for TypeMaster
 * Performs Levenshtein-based character & word diffing between prompt text and typed input.
 * Calculates exact wrong, missed, and extra characters, confusion pairs, and word breakdown.
 */

export function alignWord(targetWord, typedWord) {
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

export function analyzeSessionMistakes(promptText = '', typedInput = '') {
  const cleanPrompt = (promptText || '').trim();
  const cleanTyped = (typedInput || '').trim();

  const targetWords = cleanPrompt ? cleanPrompt.split(/\s+/) : [];
  const typedWords = cleanTyped ? cleanTyped.split(/\s+/) : [];

  let correctCount = 0;
  let wrongCount = 0;
  let missedCount = 0;
  let extraCount = 0;

  const confusionMap = {};
  const wordDiffs = [];
  const mistakeWords = [];

  const maxWords = Math.max(typedWords.length, 1);

  for (let idx = 0; idx < maxWords; idx++) {
    const target = targetWords[idx] || '';
    const typed = typedWords[idx] || '';

    if (!target && !typed) continue;

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
  }

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

  return {
    correctCharactersCount: correctCount,
    wrongCharactersCount: wrongCount,
    missedCharactersCount: missedCount,
    extraCharactersCount: extraCount,
    totalMistakesCount: wrongCount + missedCount + extraCount,
    mostCommonConfusion,
    wordDiffs,
    mistakeWords,
    targetWords,
    unreachedWords: targetWords.slice(maxWords),
    tips
  };
}
