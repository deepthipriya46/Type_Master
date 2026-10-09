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

    // 1. Zero-keystroke submissions are strictly Invalid
    if (!characters || characters === 0) {
      return {
        isValid: false,
        reason: 'Zero keystrokes recorded in test session',
        badge: 'Invalid'
      };
    }

    // 2. Minimum duration threshold for sessions with negligible input (< 5 characters in < 3s)
    if (elapsedSeconds && elapsedSeconds < 3 && characters < 5) {
      return {
        isValid: false,
        reason: 'Test duration too short with negligible input (< 3 seconds)',
        badge: 'Invalid'
      };
    }

    // 3. Maximum human typing speed sanity check (World record ~216 WPM sustained)
    if (wpm > 250) {
      return {
        isValid: false,
        reason: 'Typing speed exceeds human threshold (> 250 WPM)',
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

    // 5. Blatant botting anomaly check (high WPM (>140) with mismatched char count)
    const effectiveSeconds = Math.max(elapsedSeconds || duration || 60, 1);
    const calculatedMinutes = effectiveSeconds / 60;
    const approximateCharsExpected = (wpm * 5) * calculatedMinutes;
    if (characters > 0 && Math.abs(characters - approximateCharsExpected) > (characters * 0.7) && wpm > 140) {
      return {
        isValid: false,
        reason: 'Character count and reported WPM mismatch anomaly',
        badge: 'Flagged'
      };
    }

    // Calculate quality result badge for legitimate completed test submissions:
    // Speeds < 15 WPM with good accuracy are categorized as 'Fair' / 'Completed' rather than 'Invalid'
    let badge = 'Good';
    if (accuracy >= 96 && wpm >= 70) {
      badge = 'Excellent';
    } else if (accuracy >= 92 && wpm >= 50) {
      badge = 'Great';
    } else if (accuracy >= 80 && wpm >= 25) {
      badge = 'Good';
    } else if (wpm < 15 && accuracy >= 80) {
      badge = 'Fair';
    } else if (accuracy >= 75) {
      badge = 'Fair';
    } else if (wpm < 25 && accuracy >= 60) {
      badge = 'Completed';
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
