import { AntiCheatService } from './src/services/antiCheatService.js';

console.log('Testing Real-Time Submission & Metrics Recalculation...');

// Mock dynamic recalculation test
let user = { best_wpm: 0, avg_wpm: 0, accuracy: 0, tests_completed: 0 };
let logs = [];

function submitRealtimeTest(wpm, accuracy, duration) {
  const payload = { wpm, accuracy, duration, elapsedSeconds: duration, characters: wpm * 5, errors: 2 };
  const check = AntiCheatService.validateSubmission(payload);
  if (!check.isValid) throw new Error('Failed check');

  logs.push({ wpm, accuracy, duration });
  const allWpms = logs.map(l => l.wpm);
  const bestWpm = Math.max(...allWpms);
  const avgWpm = Math.round(allWpms.reduce((a, b) => a + b, 0) / allWpms.length);
  const avgAccuracy = Math.round(logs.reduce((a, b) => a + b.accuracy, 0) / logs.length);

  user = {
    best_wpm: bestWpm,
    avg_wpm: avgWpm,
    accuracy: avgAccuracy,
    tests_completed: logs.length
  };
  return user;
}

// Test 1: First test
const afterFirst = submitRealtimeTest(72, 97, 60);
console.log('After Test 1:', afterFirst);
if (afterFirst.best_wpm !== 72 || afterFirst.tests_completed !== 1) {
  throw new Error('Test 1 failed');
}

// Test 2: Second test higher WPM
const afterSecond = submitRealtimeTest(80, 95, 60);
console.log('After Test 2:', afterSecond);
if (afterSecond.best_wpm !== 80 || afterSecond.avg_wpm !== 76 || afterSecond.tests_completed !== 2) {
  throw new Error('Test 2 failed');
}

console.log('ALL REALTIME RECALCULATION TESTS PASSED! ✓');
