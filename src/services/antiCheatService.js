// Validation & Anti-Cheat Service
// Corresponds to Step 4 & 5 in the Backend Architecture

export const AntiCheatService = {
  /**
   * Validates a submitted test to prevent botting, pasted text, or tampered stats
   * @param {Object} payload { wpm, rawWpm, accuracy, duration, errors, characters, elapsedSeconds }
   * @returns {Object} { isValid: boolean, reason: string | null, badge: string }
   */
  validateSubmission(payload) {
    const { wpm, accuracy, duration, errors, characters, elapsedSeconds } = payload;

    // 1. Minimum duration threshold
    if (!elapsedSeconds || elapsedSeconds < 3) {
      return {
        isValid: false,
        reason: 'Test duration too short (< 3 seconds)',
        badge: 'Invalid'
      };
    }

    // 2. Maximum human typing speed sanity check (World record ~216 WPM sustained)
    if (wpm > 250) {
      return {
        isValid: false,
        reason: 'Typing speed exceeds human threshold (> 250 WPM)',
        badge: 'Flagged'
      };
    }

    // 3. Characters to duration math sanity
    // WPM = (chars / 5) / (seconds / 60)
    const calculatedMinutes = elapsedSeconds / 60;
    const approximateCharsExpected = (wpm * 5) * calculatedMinutes;
    if (characters > 0 && Math.abs(characters - approximateCharsExpected) > (characters * 0.7) && wpm > 120) {
      return {
        isValid: false,
        reason: 'Character count and reported WPM mismatch anomaly',
        badge: 'Flagged'
      };
    }

    // 4. Accuracy bounds
    if (accuracy < 0 || accuracy > 100) {
      return {
        isValid: false,
        reason: 'Accuracy percentage out of bounds',
        badge: 'Invalid'
      };
    }

    // Calculate quality result badge
    let badge = 'Good';
    if (accuracy >= 96 && wpm >= 70) {
      badge = 'Excellent';
    } else if (accuracy >= 92 && wpm >= 60) {
      badge = 'Great';
    } else if (accuracy >= 85) {
      badge = 'Good';
    } else {
      badge = 'Needs Practice';
    }

    return {
      isValid: true,
      reason: null,
      badge
    };
  }
};
