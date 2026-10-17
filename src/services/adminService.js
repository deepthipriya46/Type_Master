import * as XLSX from 'xlsx';
import { supabaseService } from './supabaseService.js';

// Dedicated helper to trigger authentic, uncorrupted Excel (.xlsx) and CSV downloads
export function triggerFileDownload(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.style.display = 'none';
  link.href = url;
  link.download = filename;
  // NEVER use target="_blank" on blob downloads in Chromium, as it causes downloads to be named after the blob UUID!
  document.body.appendChild(link);
  link.click();

  setTimeout(() => {
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }, 2000);
}

export function exportWorkbookToExcel(workbook, filename = 'TypeMaster_Admin_Report.xlsx') {
  const cleanFilename = filename.toLowerCase().endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  try {
    // Official SheetJS browser download method - forces exact filename.xlsx
    if (typeof XLSX !== 'undefined' && typeof XLSX.writeFile === 'function') {
      XLSX.writeFile(workbook, cleanFilename, { bookType: 'xlsx', compression: true });
      return;
    }
  } catch (err) {
    console.warn('XLSX.writeFile notice, falling back to blob download:', err);
  }

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8'
  });
  triggerFileDownload(blob, cleanFilename);
}

export function exportDataToCsv(data, filename = 'TypeMaster_Admin_Report.csv') {
  const cleanFilename = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  const ws = Array.isArray(data) ? XLSX.utils.json_to_sheet(data) : data;
  const csv = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  triggerFileDownload(blob, cleanFilename);
}

const withTimeout = (promise, ms = 4000) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`Query timeout after ${ms}ms`)), ms))
  ]);
};

// Universal date filter helper for all Admin Portal views
export function isDateInPeriod(dateInput, period) {
  if (!period || period === 'All Time' || period === 'All') return true;
  if (!dateInput) return false;

  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const todayYMD = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim();
    if (trimmed.toLowerCase() === 'today' || trimmed.toLowerCase() === 'just now') {
      return period === 'Today' || period === 'Last 7 Days' || period.includes('30 Days') || period === 'This Quarter';
    }
  }

  let ymd = '';
  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      ymd = trimmed.substring(0, 10);
    } else {
      const parsed = new Date(trimmed);
      if (!isNaN(parsed.getTime())) {
        ymd = `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}`;
      }
    }
  } else if (dateInput instanceof Date && !isNaN(dateInput.getTime())) {
    ymd = `${dateInput.getFullYear()}-${pad(dateInput.getMonth() + 1)}-${pad(dateInput.getDate())}`;
  }

  if (!ymd) return false;

  if (period === 'Today') {
    return ymd === todayYMD;
  }

  if (typeof period === 'string' && period.includes(' - ')) {
    const [startStr, endStr] = period.split(' - ').map(s => s.trim());
    const startDate = new Date(startStr);
    const endDate = new Date(endStr);
    if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
      endDate.setHours(23, 59, 59, 999);
      startDate.setHours(0, 0, 0, 0);
      const targetTime = new Date(ymd + 'T12:00:00').getTime();
      return targetTime >= startDate.getTime() && targetTime <= endDate.getTime();
    }
  }

  const parsedTime = new Date(ymd + 'T00:00:00').getTime();
  const todayTime = new Date(todayYMD + 'T00:00:00').getTime();
  const diffDays = (todayTime - parsedTime) / (1000 * 60 * 60 * 24);

  if (period === 'Last 7 Days') {
    return diffDays >= 0 && diffDays <= 7;
  }
  if (period.includes('30 Days') || period === 'Last 30 Days') {
    return diffDays >= 0 && diffDays <= 30;
  }
  if (period === 'This Quarter') {
    return diffDays >= 0 && diffDays <= 90;
  }
  return true;
}

// Initial structured typing tests
const INITIAL_TYPING_TESTS = [
  {
    id: 'test_01',
    title: 'General Text (Easy)',
    difficulty: 'Easy',
    duration: '1 min',
    durationSeconds: 60,
    category: 'General',
    active: true,
    content: 'Learning to type with speed and precision is an empowering digital skill. Regular practice trains your fingers to navigate the keyboard instinctively while your mind stays focused on creative expression.'
  },
  {
    id: 'test_02',
    title: 'Programming Text',
    difficulty: 'Medium',
    duration: '2 min',
    durationSeconds: 120,
    category: 'Coding',
    active: true,
    content: 'const calculatePerformance = (totalKeys, errors, elapsedSeconds) => {\n  const netWords = (totalKeys - errors * 5) / 5;\n  const minutes = Math.max(0.1, elapsedSeconds / 60);\n  const wpm = Math.max(0, Math.round(netWords / minutes));\n  const accuracy = Math.round(((totalKeys - errors) / totalKeys) * 100);\n  return { wpm, accuracy };\n};'
  },
  {
    id: 'test_03',
    title: 'Paragraph Test',
    difficulty: 'Medium',
    duration: '3 min',
    durationSeconds: 180,
    category: 'General',
    active: true,
    content: 'The architecture of human habit formation demonstrates that sustainable progress stems from compounding incremental refinements rather than monumental bursts of exertion. When typists dedicate twenty minutes each day to deliberate technique, subconscious biomechanical efficiencies emerge.'
  },
  {
    id: 'test_04',
    title: 'Numbers & Symbols',
    difficulty: 'Hard',
    duration: '2 min',
    durationSeconds: 120,
    category: 'Mixed',
    active: true,
    content: 'System error 404: Port #8080 unreachable at 192.168.1.1! Memory usage spiked 84.7% (PID: 9821). Query cost: $1,250.00 / 3.14159 units [status: FAIL & RETRY @ 12:45:00 UTC].'
  },
  {
    id: 'test_05',
    title: 'Quotes Test',
    difficulty: 'Easy',
    duration: '1 min',
    durationSeconds: 60,
    category: 'Quotes',
    active: true,
    content: '"The only way to do great work is to love what you do. If you haven\'t found it yet, keep looking. Don\'t settle. As with all matters of the heart, you\'ll know when you find it." - Steve Jobs'
  }
];

// Initial practice passages supporting domain categories and Easy/Medium/Hard difficulties
const INITIAL_PRACTICE_ITEMS = [
  // --- MATHEMATICS ---
  {
    id: 'math_01',
    category: 'Mathematics',
    title: 'Basic Arithmetic Operations',
    difficulty: 'Easy',
    tags: ['#Math', '#Arithmetic', '#Operators', '#Beginner'],
    focus_keys: ['+', '-', '*', '/', '=', '(', ')'],
    content: '5 + 3 = 8; 12 - 4 = 8; 10 * 2 = 20; 100 / 5 = 20; (15 + 5) * 2 = 40.',
    text: '5 + 3 = 8; 12 - 4 = 8; 10 * 2 = 20; 100 / 5 = 20; (15 + 5) * 2 = 40.',
    publication_status: 'published',
    is_active: true,
    wordCount: 22,
    created_at: '2026-10-10T10:00:00.000Z'
  },
  {
    id: 'math_02',
    category: 'Mathematics',
    title: 'Algebraic Equations & Polynomials',
    difficulty: 'Medium',
    tags: ['#Math', '#Algebra', '#Polynomials', '#Formulas'],
    focus_keys: ['^', '±', '√', '(', ')', '/', '=', '+', '-'],
    content: 'f(x) = 2x^2 + 5x - 3; a^2 + b^2 = c^2; x = (-b ± √(b^2 - 4ac)) / (2a).',
    text: 'f(x) = 2x^2 + 5x - 3; a^2 + b^2 = c^2; x = (-b ± √(b^2 - 4ac)) / (2a).',
    publication_status: 'published',
    is_active: true,
    wordCount: 18,
    created_at: '2026-10-10T10:00:00.000Z'
  },
  {
    id: 'math_03',
    category: 'Mathematics',
    title: 'Advanced Calculus & Sigma Notation',
    difficulty: 'Hard',
    tags: ['#Math', '#Calculus', '#Notation', '#Advanced'],
    focus_keys: ['∫', '∑', '{', '}', '^', '_', '/', '=', '(', ')'],
    content: 'lim_{x->0} (sin x)/x = 1; ∫(3x^2 + 2x - 7) dx = x^3 + x^2 - 7x + C; ∑_{i=1}^{n} i^2 = n(n+1)(2n+1)/6.',
    text: 'lim_{x->0} (sin x)/x = 1; ∫(3x^2 + 2x - 7) dx = x^3 + x^2 - 7x + C; ∑_{i=1}^{n} i^2 = n(n+1)(2n+1)/6.',
    publication_status: 'published',
    is_active: true,
    wordCount: 20,
    created_at: '2026-10-10T10:00:00.000Z'
  },

  // --- SCIENCE & NATURE ---
  {
    id: 'sci_01',
    category: 'Science & Nature',
    title: 'Photosynthesis & Terrestrial Ecology',
    difficulty: 'Easy',
    tags: ['#Science', '#Biology', '#Nature', '#Ecology'],
    focus_keys: ['P', 'l', 'a', 'n', 't', 's', 'o', 'x', 'y'],
    content: 'Plants convert sunlight, water, and carbon dioxide into oxygen and glucose through photosynthesis, sustaining terrestrial ecosystems worldwide.',
    text: 'Plants convert sunlight, water, and carbon dioxide into oxygen and glucose through photosynthesis, sustaining terrestrial ecosystems worldwide.',
    publication_status: 'published',
    is_active: true,
    wordCount: 20,
    created_at: '2026-10-10T10:00:00.000Z'
  },
  {
    id: 'sci_02',
    category: 'Science & Nature',
    title: 'Chemical Reactions & Energy Conversion',
    difficulty: 'Medium',
    tags: ['#Chemistry', '#Physics', '#Equations', '#Atoms'],
    focus_keys: ['->', '2', '6', '=', '^', '+'],
    content: '2H2 + O2 -> 2H2O; photosynthesis: 6CO2 + 6H2O + light -> C6H12O6 + 6O2; Einstein relation: E = mc^2.',
    text: '2H2 + O2 -> 2H2O; photosynthesis: 6CO2 + 6H2O + light -> C6H12O6 + 6O2; Einstein relation: E = mc^2.',
    publication_status: 'published',
    is_active: true,
    wordCount: 19,
    created_at: '2026-10-10T10:00:00.000Z'
  },
  {
    id: 'sci_03',
    category: 'Science & Nature',
    title: 'Quantum Mechanics & Thermodynamics',
    difficulty: 'Hard',
    tags: ['#Quantum', '#Physics', '#Thermodynamics', '#Formulas'],
    focus_keys: ['Delta', 'hbar', 'psi', '>=', '*', '/', '_'],
    content: 'Delta S >= 0; Schrödinger wave equation: i*hbar * d(psi)/dt = H_hat(psi); Heisenberg uncertainty: Delta x * Delta p >= hbar / 2.',
    text: 'Delta S >= 0; Schrödinger wave equation: i*hbar * d(psi)/dt = H_hat(psi); Heisenberg uncertainty: Delta x * Delta p >= hbar / 2.',
    publication_status: 'published',
    is_active: true,
    wordCount: 22,
    created_at: '2026-10-10T10:00:00.000Z'
  },

  // --- TECHNOLOGY ---
  {
    id: 'tech_01',
    category: 'Technology',
    title: 'Cloud Infrastructure & Networks',
    difficulty: 'Easy',
    tags: ['#Tech', '#Cloud', '#Internet', '#Networks'],
    focus_keys: ['C', 'l', 'o', 'u', 'd', '9', '%'],
    content: 'Cloud computing delivers scalable server storage, databases, and software over high speed fiber optic networks with 99.9% uptime.',
    text: 'Cloud computing delivers scalable server storage, databases, and software over high speed fiber optic networks with 99.9% uptime.',
    publication_status: 'published',
    is_active: true,
    wordCount: 19,
    created_at: '2026-10-10T10:00:00.000Z'
  },
  {
    id: 'tech_02',
    category: 'Technology',
    title: 'Network Protocols & TLS Handshake',
    difficulty: 'Medium',
    tags: ['#Cybersecurity', '#TLS', '#Protocols', '#AES'],
    focus_keys: ['-', ':', '.', '1', '3', '2', '5', '6'],
    content: 'HTTPS encrypts transport payloads via TLS 1.3 handshake using AES-256-GCM cipher suites across TCP port 443.',
    text: 'HTTPS encrypts transport payloads via TLS 1.3 handshake using AES-256-GCM cipher suites across TCP port 443.',
    publication_status: 'published',
    is_active: true,
    wordCount: 16,
    created_at: '2026-10-10T10:00:00.000Z'
  },
  {
    id: 'tech_03',
    category: 'Technology',
    title: 'Distributed Consensus & Neural Layers',
    difficulty: 'Hard',
    tags: ['#DistributedSystems', '#Consensus', '#AI', '#Neural'],
    focus_keys: ['[', ']', ':', '_', '*', '=', '(', ')'],
    content: 'Raft consensus maintains replicated state machines: term_index = 42; commit_log.append(block_hash[:16]); loss = -sum(y * log(y_hat)).',
    text: 'Raft consensus maintains replicated state machines: term_index = 42; commit_log.append(block_hash[:16]); loss = -sum(y * log(y_hat)).',
    publication_status: 'published',
    is_active: true,
    wordCount: 17,
    created_at: '2026-10-10T10:00:00.000Z'
  },

  // --- CODE PASSAGES ---
  {
    id: 'prac_04_easy',
    category: 'Code Passages',
    title: 'JavaScript Array Filter',
    difficulty: 'Easy',
    tags: ['#JavaScript', '#Arrays', '#Frontend'],
    focus_keys: ['=', '>', '(', ')', '.', '&'],
    content: 'const activeUsers = users.filter(user => user.isActive && user.age >= 18);',
    text: 'const activeUsers = users.filter(user => user.isActive && user.age >= 18);',
    publication_status: 'published',
    is_active: true,
    wordCount: 11,
    created_at: '2026-10-10T10:00:00.000Z'
  },
  {
    id: 'code_02',
    category: 'Code Passages',
    title: 'Python Async Request Handler',
    difficulty: 'Medium',
    tags: ['#Python', '#Async', '#API', '#Backend'],
    focus_keys: [':', '->', '(', ')', '"', '/', '{', '}'],
    content: 'async def fetch_user(user_id: str) -> dict:\n    async with aiohttp.ClientSession() as s:\n        res = await s.get(f"/api/users/{user_id}")\n        return await res.json()',
    text: 'async def fetch_user(user_id: str) -> dict:\n    async with aiohttp.ClientSession() as s:\n        res = await s.get(f"/api/users/{user_id}")\n        return await res.json()',
    publication_status: 'published',
    is_active: true,
    wordCount: 26,
    created_at: '2026-10-10T10:00:00.000Z'
  },
  {
    id: 'prac_04',
    category: 'Code Passages',
    title: 'React Functional Hook',
    difficulty: 'Hard',
    tags: ['#JavaScript', '#React', '#Frontend'],
    focus_keys: ['{', '}', '(', ')', '=>', '=', ';'],
    content: 'const useDebounce = (value, delay = 300) => {\n  const [debouncedValue, setDebouncedValue] = useState(value);\n  useEffect(() => {\n    const handler = setTimeout(() => setDebouncedValue(value), delay);\n    return () => clearTimeout(handler);\n  }, [value, delay]);\n  return debouncedValue;\n};',
    text: 'const useDebounce = (value, delay = 300) => {\n  const [debouncedValue, setDebouncedValue] = useState(value);\n  useEffect(() => {\n    const handler = setTimeout(() => setDebouncedValue(value), delay);\n    return () => clearTimeout(handler);\n  }, [value, delay]);\n  return debouncedValue;\n};',
    publication_status: 'published',
    is_active: true,
    wordCount: 42,
    created_at: '2026-10-10T10:00:00.000Z'
  },

  // --- PARAGRAPHS ---
  {
    id: 'prac_01',
    category: 'Paragraphs',
    title: 'Ergonomics and Flow State',
    difficulty: 'Easy',
    tags: ['#Ergonomics', '#Focus', '#Posture'],
    focus_keys: ['E', 'r', 'g', 'o', 'n', 'o', 'm', 'i', 'c', 's'],
    content: 'Maintaining proper posture and relaxed wrists while typing significantly reduces fatigue and increases long-term endurance. Keep your monitor at eye level and breathe rhythmically.',
    text: 'Maintaining proper posture and relaxed wrists while typing significantly reduces fatigue and increases long-term endurance. Keep your monitor at eye level and breathe rhythmically.',
    publication_status: 'published',
    is_active: true,
    wordCount: 25,
    created_at: '2026-10-10T10:00:00.000Z'
  },
  {
    id: 'para_02',
    category: 'Paragraphs',
    title: 'Habit Formation & Compounding Refinements',
    difficulty: 'Medium',
    tags: ['#Habits', '#Compounding', '#Discipline'],
    focus_keys: ['h', 'a', 'b', 'i', 't', 's', 'f', 'o', 'c', 'u', 's'],
    content: 'The architecture of human habit formation demonstrates that sustainable progress stems from compounding incremental refinements rather than monumental bursts of exertion. Daily deliberate technique creates automaticity.',
    text: 'The architecture of human habit formation demonstrates that sustainable progress stems from compounding incremental refinements rather than monumental bursts of exertion. Daily deliberate technique creates automaticity.',
    publication_status: 'published',
    is_active: true,
    wordCount: 28,
    created_at: '2026-10-10T10:00:00.000Z'
  },
  {
    id: 'para_03',
    category: 'Paragraphs',
    title: 'Deep Cognitive Immersion & Proprioception',
    difficulty: 'Hard',
    tags: ['#Neuroscience', '#Biomechanics', '#Cognition'],
    focus_keys: ['p', 'r', 'o', 'p', 'r', 'i', 'o', 'c', 'e', 'p'],
    content: 'Cortical mapping reorganizes through repetitive proprioceptive feedback loops. When motor dexterity synchronizes with tactile sensory processing, keystroke latency drops below neuromuscular thresholds.',
    text: 'Cortical mapping reorganizes through repetitive proprioceptive feedback loops. When motor dexterity synchronizes with tactile sensory processing, keystroke latency drops below neuromuscular thresholds.',
    publication_status: 'published',
    is_active: true,
    wordCount: 23,
    created_at: '2026-10-10T10:00:00.000Z'
  },

  // --- QUOTES ---
  {
    id: 'prac_03',
    category: 'Quotes',
    title: 'Perseverance & Mastery',
    difficulty: 'Easy',
    tags: ['#Inspiration', '#Philosophy', '#Excellence'],
    focus_keys: ['"', '.', ',', '-', 'W', 'E'],
    content: '"We are what we repeatedly do. Excellence, then, is not an act, but a habit." - Will Durant',
    text: '"We are what we repeatedly do. Excellence, then, is not an act, but a habit." - Will Durant',
    publication_status: 'published',
    is_active: true,
    wordCount: 18,
    created_at: '2026-10-10T10:00:00.000Z'
  },
  {
    id: 'quote_02',
    category: 'Quotes',
    title: 'Love Your Craft',
    difficulty: 'Medium',
    tags: ['#Quotes', '#Inspiration', '#Craftsmanship'],
    focus_keys: ['\'', '"', '.', ',', 'S', 'J'],
    content: '"The only way to do great work is to love what you do. If you haven\'t found it yet, keep looking. Don\'t settle." - Steve Jobs',
    text: '"The only way to do great work is to love what you do. If you haven\'t found it yet, keep looking. Don\'t settle." - Steve Jobs',
    publication_status: 'published',
    is_active: true,
    wordCount: 26,
    created_at: '2026-10-10T10:00:00.000Z'
  },
  {
    id: 'quote_03',
    category: 'Quotes',
    title: 'Stoic Resilience & Mindset',
    difficulty: 'Hard',
    tags: ['#Stoicism', '#Philosophy', '#Resilience'],
    focus_keys: ['-', '"', '.', ',', 'M', 'A'],
    content: '"You have power over your mind - not outside events. Realize this, and you will find strength. The impediment to action advances action." - Marcus Aurelius',
    text: '"You have power over your mind - not outside events. Realize this, and you will find strength. The impediment to action advances action." - Marcus Aurelius',
    publication_status: 'published',
    is_active: true,
    wordCount: 26,
    created_at: '2026-10-10T10:00:00.000Z'
  },

  // --- WORDS ---
  {
    id: 'prac_02',
    category: 'Words',
    title: 'High-Frequency Homerow Words',
    difficulty: 'Easy',
    tags: ['#Vocabulary', '#Drill', '#Beginner'],
    focus_keys: ['t', 'h', 'e', 'a', 'n', 'd', 'o', 'f'],
    content: 'the of and to a in is that for it as was with on be at by this from they we say her she or an will my one all would there their what',
    text: 'the of and to a in is that for it as was with on be at by this from they we say her she or an will my one all would there their what',
    publication_status: 'published',
    is_active: true,
    wordCount: 35,
    created_at: '2026-10-10T10:00:00.000Z'
  },
  {
    id: 'word_02',
    category: 'Words',
    title: 'Technical & Computing Vocabulary',
    difficulty: 'Medium',
    tags: ['#TechWords', '#Vocabulary', '#MediumDrill'],
    focus_keys: ['q', 'z', 'x', 'k', 'w'],
    content: 'algorithm bandwidth compiler database encryption firewall gateway heuristic iteration junction kernel latency metadata network optimizer protocol quantum redundant schema telemetry',
    text: 'algorithm bandwidth compiler database encryption firewall gateway heuristic iteration junction kernel latency metadata network optimizer protocol quantum redundant schema telemetry',
    publication_status: 'published',
    is_active: true,
    wordCount: 20,
    created_at: '2026-10-10T10:00:00.000Z'
  },
  {
    id: 'word_03',
    category: 'Words',
    title: 'Complex Polysyllabic Sequences',
    difficulty: 'Hard',
    tags: ['#AdvancedWords', '#Dexterity', '#FingerShifts'],
    focus_keys: ['q', 'u', 'x', 'z', 'j', 'p'],
    content: 'anachronistic quintessential idiosyncrasy juxtaposed magnanimous pulchritudinous sesquipedalian ubiquitous verisimilitude zenith labyrinthine obfuscation panacea recalcitrant vicarious',
    text: 'anachronistic quintessential idiosyncrasy juxtaposed magnanimous pulchritudinous sesquipedalian ubiquitous verisimilitude zenith labyrinthine obfuscation panacea recalcitrant vicarious',
    publication_status: 'published',
    is_active: true,
    wordCount: 15,
    created_at: '2026-10-10T10:00:00.000Z'
  }
];

// Initial Badges
const INITIAL_BADGES = [
  { id: 'badge_01', title: 'First Keystroke', description: 'Complete your first official typing test', category: 'Milestone', icon: 'zap', threshold: '1 Test Completed', unlockedCount: 1 },
  { id: 'badge_02', title: 'Speed Master', description: 'Reach 75+ WPM in any verified test', category: 'Speed', icon: 'trophy', threshold: '>= 75 WPM', unlockedCount: 1 },
  { id: 'badge_03', title: 'Accuracy King', description: 'Achieve 98%+ accuracy across a full test', category: 'Accuracy', icon: 'target', threshold: '>= 98% Accuracy', unlockedCount: 1 },
  { id: 'badge_04', title: 'Lightning Fast', description: 'Surpass 100+ WPM benchmark', category: 'Speed', icon: 'zap', threshold: '>= 100 WPM', unlockedCount: 0 },
  { id: 'badge_05', title: '10-Day Streak', description: 'Maintain practice discipline for 10 consecutive days', category: 'Streak', icon: 'flame', threshold: '10 Days Consecutive', unlockedCount: 0 },
  { id: 'badge_06', title: 'Flawless 100%', description: 'Complete any test with zero mistakes', category: 'Accuracy', icon: 'award', threshold: '100% Accuracy', unlockedCount: 0 }
];

// Initial announcements
const INITIAL_ANNOUNCEMENTS = [
  {
    id: 'ann_01',
    title: 'TypeMaster Dual-Portal Live',
    type: 'Feature Update',
    audience: 'All Typists',
    message: 'Welcome to TypeMaster Dual-Portal system! Switch seamlessly between User practice and Admin management.',
    date: '2026-10-10',
    status: 'Published'
  }
];

class AdminService {
  constructor() {
    this._initStorage();
  }

  _initStorage() {
    if (typeof window === 'undefined') return;
    if (!localStorage.getItem('admin_typing_tests')) {
      localStorage.setItem('admin_typing_tests', JSON.stringify(INITIAL_TYPING_TESTS));
    }
    if (!localStorage.getItem('admin_practice_content')) {
      localStorage.setItem('admin_practice_content', JSON.stringify(INITIAL_PRACTICE_ITEMS));
    }
    if (!localStorage.getItem('admin_badges')) {
      localStorage.setItem('admin_badges', JSON.stringify(INITIAL_BADGES));
    }
    if (!localStorage.getItem('admin_announcements')) {
      localStorage.setItem('admin_announcements', JSON.stringify(INITIAL_ANNOUNCEMENTS));
    }
  }

  _get(key, fallback) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : fallback;
    } catch {
      return fallback;
    }
  }

  _set(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      console.warn('Admin storage set error:', e);
    }
  }

  logAudit(action, target, details) {
    const logs = this._get('admin_audit_logs', []);
    const now = new Date();
    const formatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    const newEntry = {
      id: `log_${Date.now()}`,
      timestamp: formatted,
      admin: 'Admin Administrator',
      action,
      target,
      details,
      client: 'Admin Console'
    };
    logs.unshift(newEntry);
    this._set('admin_audit_logs', logs.slice(0, 100));
  }

  // ==========================================================
  // LIVE DATABASE QUERIES: ZERO MOCK DATA
  // Queries live Supabase PostgreSQL (or local registry in offline mode)
  // ==========================================================

  isUserDeleted(id) {
    if (!id) return false;
    const deletedList = this._get('typemaster_deleted_user_ids', []);
    return deletedList.includes(String(id));
  }

  async fetchAllUsersLive() {
    // 1. Gather all registered users from local registries first
    const reg1 = this._get('users_registry', []);
    const reg2 = this._get('typemaster_users_registry', []);
    const userMap = new Map();

    const registerCandidate = (r) => {
      if (!r || !r.id || String(r.id).startsWith('guest_') || String(r.id) === 'user_active' || r.role === 'deleted' || this.isUserDeleted(r.id)) return;
      const idKey = String(r.id);
      const existing = userMap.get(idKey) || {};
      userMap.set(idKey, {
        ...existing,
        ...r,
        tests_completed: Math.max(Number(existing.tests_completed) || 0, Number(r.tests_completed) || 0, Number(existing.testsTaken) || 0, Number(r.testsTaken) || 0),
        best_wpm: Math.max(Number(existing.best_wpm) || 0, Number(r.best_wpm) || 0, Number(existing.highestWpm) || 0, Number(r.highestWpm) || 0),
        avg_wpm: Number(r.avg_wpm) || Number(r.avgWpm) || Number(existing.avg_wpm) || 0,
        accuracy: Number(r.accuracy) || Number(existing.accuracy) || 0
      });
    };

    [...reg1, ...reg2].forEach(registerCandidate);

    // Also check current active user session
    const cu = this._get('typemaster_current_user', null) || this._get('current_user', null);
    if (cu) registerCandidate(cu);

    // Also scan localStorage for keys matching user_*
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('user_') && !key.startsWith('user_active')) {
            const raw = localStorage.getItem(key);
            if (raw) {
              const parsed = JSON.parse(raw);
              if (parsed && typeof parsed === 'object') {
                registerCandidate(parsed);
              }
            }
          }
        }
      } catch {
        // ignore
      }
    }

    // 2. Query live Supabase users table (authoritative cloud state)
    if (supabaseService.isConfigured()) {
      try {
        const { data: dbUsers, error } = await withTimeout(
          Promise.resolve(supabaseService.supabase.from('users').select('*').order('created_at', { ascending: false })),
          4000
        );

        if (!error && Array.isArray(dbUsers)) {
          dbUsers.forEach(u => {
            if (u && u.id && !String(u.id).startsWith('guest_') && u.role !== 'deleted' && !this.isUserDeleted(u.id)) {
              // Match existing local record by ID or email or username
              let matchedKey = String(u.id);
              if (!userMap.has(matchedKey)) {
                for (const [k, v] of userMap.entries()) {
                  if (
                    (u.email && v.email && u.email.toLowerCase().trim() === v.email.toLowerCase().trim()) ||
                    (u.username && v.username && u.username.toLowerCase().trim() === v.username.toLowerCase().trim())
                  ) {
                    matchedKey = k;
                    break;
                  }
                }
              }
              const existing = userMap.get(matchedKey) || {};
              userMap.set(String(u.id), {
                ...existing,
                ...u,
                tests_completed: Math.max(Number(existing.tests_completed) || 0, Number(existing.testsTaken) || 0, Number(u.tests_completed) || 0),
                best_wpm: Math.max(Number(existing.best_wpm) || 0, Number(existing.highestWpm) || 0, Number(u.best_wpm) || 0),
                avg_wpm: Number(existing.avg_wpm) || Number(u.avg_wpm) || 0,
                accuracy: Number(existing.accuracy) > 0 ? Number(existing.accuracy) : Number(u.accuracy) || 0
              });
            }
          });
        }
      } catch (err) {
        console.warn('Live Supabase users query notice:', err);
      }
    }

    const registered = Array.from(userMap.values());
    return registered.map(r => {
      const displayName = r.displayName || r.display_name || r.username || (r.email ? r.email.split('@')[0] : 'Typist');
      const formattedJoined = r.created_at
        ? new Date(r.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
        : (r.joinedOn || 'Recent');

      // Fetch any local logs for this user to ensure testsTaken and speed are never understated
      const localLogs = this._get(`test_logs_${r.id}`, []);
      const testsCount = Math.max(
        Array.isArray(localLogs) ? localLogs.length : 0,
        Number(r.tests_completed) || 0,
        Number(r.testsTaken) || 0
      );
      const bestSpeed = Math.max(
        Number(r.best_wpm) || 0,
        Number(r.highestWpm) || 0,
        ...(Array.isArray(localLogs) ? localLogs.map(l => Number(l.wpm) || 0) : [])
      );
      const avgSpeed = Number(r.avg_wpm) || Number(r.avgWpm) || bestSpeed;
      const acc = Number(r.accuracy) || 0;

      return {
        id: r.id,
        name: displayName,
        displayName: displayName,
        display_name: displayName,
        username: r.username || displayName,
        email: r.email || `${r.username || 'user'}@typemaster.local`,
        role: r.role || (r.email === 'admin@typemaster.com' ? 'admin' : 'user'),
        status: r.status || 'Active',
        created_at: r.created_at,
        joinedOn: formattedJoined,
        testsTaken: testsCount,
        avgWpm: avgSpeed,
        highestWpm: bestSpeed,
        accuracy: acc,
        totalPracticeTimeHours: Number((testsCount * 0.05).toFixed(1)),
        is_premium: Boolean(r.is_premium),
        lastActive: r.updated_at ? new Date(r.updated_at).toLocaleDateString() : 'Active'
      };
    });
  }

  async fetchAllTestLogsLive() {
    // 1. Gather all local test attempts across all users and registries
    const reg1 = this._get('users_registry', []);
    const reg2 = this._get('typemaster_users_registry', []);
    const localUserIds = new Set([...reg1, ...reg2].map(u => u?.id).filter(Boolean));

    const localLogs = [];
    localUserIds.forEach(uid => {
      const uLogs = this._get(`test_logs_${uid}`, []);
      if (Array.isArray(uLogs)) localLogs.push(...uLogs);
    });

    const genericLogs = this._get('typemaster_test_logs', []);
    if (Array.isArray(genericLogs)) localLogs.push(...genericLogs);

    // Scan browser localStorage keys for any user test attempts
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('test_logs_')) {
            const raw = localStorage.getItem(key);
            if (raw) {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed)) localLogs.push(...parsed);
            }
          }
        }
      } catch {
        // Ignore localStorage scan errors
      }
    }

    // 2. Query Supabase test_logs table
    let dbLogs = [];
    if (supabaseService.isConfigured()) {
      try {
        const { data, error } = await withTimeout(
          Promise.resolve(supabaseService.supabase.from('test_logs').select('*').order('created_at', { ascending: false }).limit(500)),
          4000
        );
        if (!error && Array.isArray(data)) {
          dbLogs = data;
        }
      } catch (err) {
        console.warn('Live Supabase test logs notice:', err);
      }
    }

    // 3. Merge both sources and deduplicate by unique attempt ID
    const mergedMap = new Map();
    [...dbLogs, ...localLogs].forEach(item => {
      if (!item) return;
      const key = item.id ? String(item.id) : `${item.user_id}_${item.wpm}_${item.created_at || item.date}`;
      if (!mergedMap.has(key)) {
        mergedMap.set(key, item);
      }
    });

    const combinedList = Array.from(mergedMap.values());
    combinedList.sort((a, b) => new Date(b.created_at || b.date || 0) - new Date(a.created_at || a.date || 0));
    return combinedList;
  }

  // Get live aggregated dashboard metrics from real database rows
  async getLiveDashboardMetrics(timeframe = 'All Time') {
    const allUsers = await this.fetchAllUsersLive();
    const allTestLogs = await this.fetchAllTestLogsLive();

    const isFiltered = timeframe && timeframe !== 'All Time' && timeframe !== 'All';
    const users = isFiltered
      ? allUsers.filter(u => isDateInPeriod(u.created_at || u.joinedOn, timeframe))
      : allUsers;
    const testLogs = isFiltered
      ? allTestLogs.filter(l => isDateInPeriod(l.created_at || l.date, timeframe))
      : allTestLogs;

    // Filter strictly for registered accounts (exclude temporary anonymous guest IDs and deleted users)
    const registeredUsers = allUsers.filter(u => u && u.id && !String(u.id).startsWith('guest_') && u.role !== 'deleted' && !this.isUserDeleted(u.id));
    // Total Registered Users reflects real-time total registered typists from the beginning
    const totalUsers = registeredUsers.length;

    // Active Users (30d): registered typists who took tests in the last 30 days OR have completed tests recorded
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const activeUserIds = new Set();
    allTestLogs.forEach(l => {
      if (!l || !l.user_id) return;
      const uid = String(l.user_id);
      if (uid.startsWith('guest_')) return;
      const logDate = new Date(l.created_at || l.date || 0);
      if (isNaN(logDate.getTime()) || logDate >= thirtyDaysAgo) {
        activeUserIds.add(uid);
      }
    });
    registeredUsers.forEach(u => {
      if (Number(u.testsTaken) > 0 || Number(u.tests_completed) > 0) {
        activeUserIds.add(String(u.id));
      }
    });
    const activeUsers = Math.min(totalUsers, Math.max(activeUserIds.size, registeredUsers.length > 0 ? 1 : 0));
    const testsCompleted = testLogs.length;

    // Platform Avg WPM (Valid non-zero attempts)
    const validWpms = testLogs
      .filter(l => l && l.is_valid !== false && Number(l.wpm) > 0)
      .map(l => Number(l.wpm));
    const avgWpm = validWpms.length > 0
      ? Math.round(validWpms.reduce((a, b) => a + b, 0) / validWpms.length)
      : (registeredUsers.length > 0 ? Math.round(registeredUsers.reduce((a, u) => a + (u.avgWpm || u.highestWpm || 0), 0) / registeredUsers.length) : 0);

    // Achievements unlocked across system
    const badges = this.getBadges();
    const achievementsEarned = badges.reduce((acc, b) => acc + (b.unlockedCount || 0), 0);

    // ==========================================================
    // SECTION 1: RECENT USERS (Newest registered accounts first)
    // ==========================================================
    const sortedRecentUsers = [...registeredUsers].sort((a, b) => {
      const timeA = new Date(a.created_at || a.joinedOn || 0).getTime();
      const timeB = new Date(b.created_at || b.joinedOn || 0).getTime();
      return timeB - timeA;
    });

    const recentUsers = sortedRecentUsers.slice(0, 5).map(u => ({
      ...u,
      joinedOn: u.created_at
        ? new Date(u.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
        : (u.joinedOn || 'Recent'),
      user: u
    }));

    // ==========================================================
    // SECTION 2: TOP PERFORMING USERS (Matches User Portal Leaderboard)
    // ==========================================================
    // Group all valid, eligible test logs by user_id
    const userValidLogsMap = new Map();
    allTestLogs.forEach(l => {
      if (!l || !l.user_id) return;
      const uid = String(l.user_id);
      if (uid.startsWith('guest_')) return;
      if (l.is_valid === false) return; // Exclude flagged/invalid test results
      const wpmVal = Number(l.wpm) || 0;
      if (wpmVal <= 0) return; // Exclude incomplete 0 WPM tests

      if (!userValidLogsMap.has(uid)) {
        userValidLogsMap.set(uid, []);
      }
      userValidLogsMap.get(uid).push(l);
    });

    const candidatePerformers = registeredUsers.map(u => {
      const uid = String(u.id);
      const logs = userValidLogsMap.get(uid) || [];
      const localLogs = this._get(`test_logs_${uid}`, []);
      const combinedUserLogs = [...logs];
      if (Array.isArray(localLogs)) {
        localLogs.forEach(ll => {
          if (ll && !combinedUserLogs.some(cl => cl.id === ll.id || (cl.created_at === ll.created_at && cl.wpm === ll.wpm))) {
            combinedUserLogs.push(ll);
          }
        });
      }

      let testsCount = Math.max(combinedUserLogs.length, Number(u.testsTaken) || 0, Number(u.tests_completed) || 0);
      let userBestWpm = Math.max(Number(u.highestWpm) || 0, Number(u.best_wpm) || 0, ...(combinedUserLogs.map(l => Number(l.wpm) || 0)));
      let userAvgWpm = Number(u.avgWpm) || Number(u.avg_wpm) || 0;
      let userAvgAccuracy = Number(u.accuracy) || 0;

      if (combinedUserLogs.length > 0) {
        if (!userAvgWpm) {
          userAvgWpm = Math.round(combinedUserLogs.reduce((sum, l) => sum + (Number(l.wpm) || 0), 0) / combinedUserLogs.length);
        }
        if (!userAvgAccuracy) {
          userAvgAccuracy = Number((combinedUserLogs.reduce((sum, l) => sum + (Number(l.accuracy) || 0), 0) / combinedUserLogs.length).toFixed(1));
        }
      }

      return {
        id: u.id,
        name: u.name || u.displayName || u.username || 'Typist',
        email: u.email,
        wpm: userBestWpm,
        highestWpm: userBestWpm,
        avgWpm: userAvgWpm,
        accuracy: userAvgAccuracy,
        tests: testsCount,
        testsCompleted: testsCount,
        user: u
      };
    });

    // Only include users who have completed at least 1 valid test
    const eligiblePerformers = candidatePerformers.filter(p => p.tests > 0 && p.wpm > 0);

    // Strictly match Leaderboard ranking: best WPM (desc), accuracy (desc), tests completed (desc)
    eligiblePerformers.sort((a, b) => {
      if (b.wpm !== a.wpm) return b.wpm - a.wpm;
      if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
      return b.tests - a.tests;
    });

    const topPerformers = eligiblePerformers.slice(0, 5).map((p, idx) => ({
      ...p,
      rank: idx + 1
    }));

    // ==========================================================
    // SECTION 3: LATEST TEST ATTEMPTS (Newest telemetry submissions)
    // ==========================================================
    const sortedTestLogs = [...allTestLogs]
      .filter(l => l && (l.id || l.user_id))
      .sort((a, b) => new Date(b.created_at || b.date || 0) - new Date(a.created_at || a.date || 0));

    // Deduplicate attempts by unique ID
    const seenAttemptIds = new Set();
    const uniqueAttempts = [];
    for (const l of sortedTestLogs) {
      const idStr = String(l.id || `${l.user_id}_${l.wpm}_${l.created_at || l.date}`);
      if (!seenAttemptIds.has(idStr)) {
        seenAttemptIds.add(idStr);
        uniqueAttempts.push(l);
      }
    }

    const latestTestAttempts = uniqueAttempts.slice(0, 10).map((l, i) => {
      const rawUserId = l.user_id || l.userId;
      const matchedUser = allUsers.find(u =>
        (rawUserId && String(u.id) === String(rawUserId)) ||
        (u.email && l.userEmail && u.email.toLowerCase() === l.userEmail.toLowerCase()) ||
        (u.username && l.userName && u.username.toLowerCase() === l.userName.toLowerCase())
      );

      let durationStr = '60s';
      if (typeof l.duration === 'number') {
        if (l.duration >= 60) {
          durationStr = `${Math.round(l.duration / 60)} min`;
        } else {
          durationStr = `${l.duration}s`;
        }
      } else if (l.duration) {
        durationStr = String(l.duration);
      }

      let attemptStatus = 'Completed';
      if (l.is_valid === false) {
        attemptStatus = 'Flagged';
      } else if (l.result_badge) {
        attemptStatus = l.result_badge;
      } else if (l.status) {
        attemptStatus = l.status;
      }

      const rawDate = l.created_at || l.date || l.timestamp;
      const formattedDate = rawDate
        ? new Date(rawDate).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
        : 'Just now';

      let resolvedUserName = l.userName || l.user || matchedUser?.displayName || matchedUser?.display_name || matchedUser?.username || matchedUser?.name;
      if (!resolvedUserName || resolvedUserName === 'Typist' || resolvedUserName === 'Registered Typist') {
        if (rawUserId) {
          const directUser = this.getUserById(rawUserId);
          if (directUser) resolvedUserName = directUser.displayName || directUser.name || directUser.username;
        }
      }
      if (!resolvedUserName) {
        resolvedUserName = (rawUserId && String(rawUserId).startsWith('guest_')) ? 'Guest Typist' : 'Registered Typist';
      }

      return {
        id: l.id || `att_${i + 1}`,
        user_id: l.user_id,
        user: resolvedUserName,
        userName: resolvedUserName,
        type: l.category || 'General',
        wpm: Number(l.wpm) || 0,
        accuracy: `${Number(l.accuracy) || 0}%`,
        errors: Number(l.errors) || 0,
        time: durationStr,
        rawDuration: l.duration,
        date: formattedDate,
        rawDate: rawDate,
        status: attemptStatus,
        is_valid: l.is_valid !== false,
        userObj: matchedUser
      };
    });

    // Dynamic Speed Distribution Histogram from real test logs
    const brackets = [
      { label: '< 20', min: 0, max: 20, count: 0, color: '#F43F5E' },
      { label: '20-40', min: 20, max: 40, count: 0, color: '#F59E0B' },
      { label: '40-60', min: 40, max: 60, count: 0, color: '#10B981' },
      { label: '60-80', min: 60, max: 80, count: 0, color: '#3B82F6' },
      { label: '80-100', min: 80, max: 100, count: 0, color: '#8B5CF6' },
      { label: '> 100', min: 100, max: 999, count: 0, color: '#EC4899' }
    ];

    const allWpms = allTestLogs.map(l => Number(l.wpm) || 0).filter(w => w > 0);
    if (allWpms.length > 0) {
      allWpms.forEach(w => {
        const found = brackets.find(b => w >= b.min && (b.max === 999 ? w >= b.min : w < b.max));
        if (found) found.count++;
      });
    } else {
      registeredUsers.forEach(u => {
        const w = u.highestWpm || u.avgWpm || 0;
        const found = brackets.find(b => w >= b.min && (b.max === 999 ? w >= b.min : w < b.max));
        if (found) found.count++;
      });
    }

    const maxCount = Math.max(1, ...brackets.map(b => b.count));
    const speedDistribution = brackets.map(b => ({
      label: b.label,
      count: b.count,
      heightPercent: Math.max(12, Math.round((b.count / maxCount) * 100)),
      color: b.color
    }));

    // Dynamic Category percentage from real logs
    const catCounts = { Words: 0, Sentences: 0, Paragraphs: 0, 'Timed Test': 0, 'Custom Test': 0 };
    allTestLogs.forEach(l => {
      const c = l.category || 'Paragraphs';
      if (c.toLowerCase().includes('word')) catCounts.Words++;
      else if (c.toLowerCase().includes('sentence')) catCounts.Sentences++;
      else if (c.toLowerCase().includes('time')) catCounts['Timed Test']++;
      else if (c.toLowerCase().includes('custom')) catCounts['Custom Test']++;
      else catCounts.Paragraphs++;
    });

    const totalCatCount = Math.max(1, Object.values(catCounts).reduce((a, b) => a + b, 0));
    const testCategories = [
      { name: 'Words', percent: Math.round((catCounts.Words / totalCatCount) * 100) || 30, color: '#3B82F6' },
      { name: 'Sentences', percent: Math.round((catCounts.Sentences / totalCatCount) * 100) || 25, color: '#06B6D4' },
      { name: 'Paragraphs', percent: Math.round((catCounts.Paragraphs / totalCatCount) * 100) || 25, color: '#10B981' },
      { name: 'Timed Test', percent: Math.round((catCounts['Timed Test'] / totalCatCount) * 100) || 15, color: '#F59E0B' },
      { name: 'Custom Test', percent: Math.round((catCounts['Custom Test'] / totalCatCount) * 100) || 5, color: '#EC4899' }
    ];

    // Dynamic 7-day activity metrics strictly from real test logs & user records
    const dayLabels = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      dayLabels.push({
        label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        isoDate: d.toISOString().split('T')[0]
      });
    }

    const activityDays = dayLabels.map(dl => dl.label);
    const activeUsersPoints = dayLabels.map(dl => {
      const dayLogs = allTestLogs.filter(l => {
        if (!l || !l.user_id) return false;
        const uid = String(l.user_id);
        if (uid.startsWith('guest_')) return false;
        const dStr = (l.created_at || l.date || '').substring(0, 10);
        return dStr === dl.isoDate;
      });
      const dayActive = new Set(dayLogs.map(l => String(l.user_id))).size;
      return Math.min(totalUsers, dayActive);
    });

    const newUsersPoints = dayLabels.map(dl => {
      const usersUpToDay = registeredUsers.filter(u => {
        const dStr = (u.joinedOn || u.created_at || '').substring(0, 10);
        return dStr && dStr <= dl.isoDate;
      });
      return Math.min(totalUsers, Math.max(1, usersUpToDay.length));
    });

    return {
      totalUsers,
      activeUsers,
      testsCompleted: allTestLogs.length,
      avgWpm,
      achievementsEarned,
      activityDays,
      newUsersPoints,
      activeUsersPoints,
      speedDistribution,
      testCategories,
      recentUsers,
      topPerformers,
      latestTestAttempts,
      recentFeedback: await this.fetchFeedbackLive()
    };
  }

  // Synchronous users list (used by table views)
  getUsers() {
    const reg1 = this._get('users_registry', []);
    const reg2 = this._get('typemaster_users_registry', []);
    const mergedMap = new Map();

    const registerCandidate = (r) => {
      if (!r || !r.id || String(r.id).startsWith('guest_') || String(r.id) === 'user_active' || r.role === 'deleted' || this.isUserDeleted(r.id)) return;
      const idKey = String(r.id);
      const existing = mergedMap.get(idKey) || {};
      mergedMap.set(idKey, {
        ...existing,
        ...r,
        tests_completed: Math.max(Number(existing.tests_completed) || 0, Number(r.tests_completed) || 0, Number(existing.testsTaken) || 0, Number(r.testsTaken) || 0),
        best_wpm: Math.max(Number(existing.best_wpm) || 0, Number(r.best_wpm) || 0, Number(existing.highestWpm) || 0, Number(r.highestWpm) || 0),
        avg_wpm: Number(r.avg_wpm) || Number(r.avgWpm) || Number(existing.avg_wpm) || 0,
        accuracy: Number(r.accuracy) || Number(existing.accuracy) || 0
      });
    };

    [...reg1, ...reg2].forEach(registerCandidate);

    const cu = this._get('typemaster_current_user', null) || this._get('current_user', null);
    if (cu) registerCandidate(cu);

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('user_') && !key.startsWith('user_active')) {
            const raw = localStorage.getItem(key);
            if (raw) {
              const parsed = JSON.parse(raw);
              if (parsed && typeof parsed === 'object') {
                registerCandidate(parsed);
              }
            }
          }
        }
      } catch {
        // ignore
      }
    }

    const registered = Array.from(mergedMap.values());
    return registered.map(r => {
      const localLogs = this._get(`test_logs_${r.id}`, []);
      const testsCount = Math.max(
        Array.isArray(localLogs) ? localLogs.length : 0,
        Number(r.tests_completed) || 0,
        Number(r.testsTaken) || 0
      );
      const bestSpeed = Math.max(
        Number(r.best_wpm) || 0,
        Number(r.highestWpm) || 0,
        ...(Array.isArray(localLogs) ? localLogs.map(l => Number(l.wpm) || 0) : [])
      );
      const avgSpeed = Number(r.avg_wpm) || Number(r.avgWpm) || bestSpeed;
      const acc = Number(r.accuracy) || 0;

      return {
        id: r.id,
        name: r.displayName || r.display_name || r.username || 'Typist',
        email: r.email || `${r.username || 'user'}@typemaster.local`,
        role: r.role || (r.email === 'admin@typemaster.com' ? 'admin' : 'user'),
        status: r.status || 'Active',
        joinedOn: r.created_at ? r.created_at.split('T')[0] : '2026-10-09',
        testsTaken: testsCount,
        avgWpm: avgSpeed,
        highestWpm: bestSpeed,
        accuracy: acc,
        totalPracticeTimeHours: Number((testsCount * 0.05).toFixed(1)),
        is_premium: Boolean(r.is_premium),
        lastActive: 'Active'
      };
    });
  }

  getUserById(id) {
    const users = this.getUsers();
    return users.find(u => u.id === id) || null;
  }

  addUser(userData) {
    const registered = this._get('typemaster_users_registry', []);
    const newUser = {
      id: `usr_${Date.now()}`,
      username: userData.name || 'New Typist',
      email: userData.email,
      role: userData.role || 'user',
      status: userData.status || 'Active',
      created_at: new Date().toISOString(),
      best_wpm: 0,
      avg_wpm: 0,
      accuracy: 0,
      tests_completed: 0,
      password: userData.password || 'Password@123'
    };
    registered.unshift(newUser);
    this._set('typemaster_users_registry', registered);
    this.logAudit('User Account Created', newUser.username, `New ${newUser.role} user created (${newUser.email})`);
    return newUser;
  }

  updateUser(id, updates) {
    const registered = this._get('typemaster_users_registry', []);
    const index = registered.findIndex(u => u.id === id);
    if (index >= 0) {
      registered[index] = { ...registered[index], ...updates };
      this._set('typemaster_users_registry', registered);
      this.logAudit('User Profile Updated', registered[index].username, `Updated fields: ${Object.keys(updates).join(', ')}`);
      return registered[index];
    }
    return null;
  }

  toggleUserStatus(id) {
    const registered = this._get('typemaster_users_registry', []);
    const user = registered.find(u => u.id === id);
    if (user) {
      const nextStatus = user.status === 'Active' ? 'Inactive' : 'Active';
      user.status = nextStatus;
      this._set('typemaster_users_registry', registered);
      this.logAudit('User Status Changed', user.username, `Status switched to ${nextStatus}`);
      return nextStatus;
    }
    return null;
  }

  resetUserPassword(id, newPassword = 'Password@123') {
    const registered = this._get('typemaster_users_registry', []);
    const user = registered.find(u => u.id === id);
    if (user) {
      user.password = newPassword;
      this._set('typemaster_users_registry', registered);
      this.logAudit('Password Reset', user.username, `Admin reset password for ${user.email}`);
      return { success: true, message: `Password reset to ${newPassword} for ${user.username}` };
    }
    return { success: false, message: 'User not found.' };
  }

  deleteUser(id, email = null, username = null) {
    const idStr = String(id || '');
    const cleanEmail = String(email || '').toLowerCase().trim();
    const cleanUser = String(username || '').toLowerCase().trim();

    const isMatch = (u) => {
      if (!u) return false;
      if (idStr && String(u.id) === idStr) return true;
      if (cleanEmail && u.email && String(u.email).toLowerCase().trim() === cleanEmail) return true;
      if (cleanUser && (u.username || u.name) && String(u.username || u.name).toLowerCase().trim() === cleanUser) return true;
      return false;
    };

    // 0. Persist to typemaster_deleted_user_ids tombstone list
    if (idStr) {
      const deletedList = this._get('typemaster_deleted_user_ids', []);
      if (!deletedList.includes(idStr)) {
        deletedList.push(idStr);
        this._set('typemaster_deleted_user_ids', deletedList);
      }
    }

    // 1. Remove from typemaster_users_registry
    let reg1 = this._get('typemaster_users_registry', []);
    const userFound = reg1.find(isMatch);
    reg1 = reg1.filter(u => !isMatch(u));
    this._set('typemaster_users_registry', reg1);

    // 2. Remove from users_registry
    let reg2 = this._get('users_registry', []);
    reg2 = reg2.filter(u => !isMatch(u));
    this._set('users_registry', reg2);

    // 3. Remove from admin_users
    let adminUsers = this._get('admin_users', []);
    adminUsers = adminUsers.filter(u => !isMatch(u));
    this._set('admin_users', adminUsers);

    // 4. Remove all local storage user keys
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.removeItem(`user_${idStr}`);
        localStorage.removeItem(`test_logs_${idStr}`);
        localStorage.removeItem(`streak_${idStr}`);
        localStorage.removeItem(`achievements_${idStr}`);

        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (!key) continue;
          if (
            key === `user_${idStr}` ||
            key === `test_logs_${idStr}` ||
            key === `streak_${idStr}` ||
            key === `achievements_${idStr}`
          ) {
            localStorage.removeItem(key);
          }
        }
      } catch (err) {
        console.warn('LocalStorage cleanup notice:', err);
      }
    }

    // 5. Broadcast deletion to all open tabs and windows
    try {
      window.dispatchEvent(new CustomEvent('typemaster-admin-feed', {
        detail: { type: 'USER_DELETED', payload: { id: idStr, email: cleanEmail, username: cleanUser } }
      }));
      const bc1 = new BroadcastChannel('admin-live-feed');
      bc1.postMessage({ type: 'USER_DELETED', payload: { id: idStr, email: cleanEmail, username: cleanUser } });
      bc1.close();
      const bc2 = new BroadcastChannel('typemaster_admin_feed');
      bc2.postMessage({ type: 'USER_DELETED', payload: { id: idStr, email: cleanEmail, username: cleanUser } });
      bc2.close();
    } catch {
      // fallback
    }

    const logIdentifier = cleanUser || userFound?.username || idStr;
    this.logAudit('User Deleted', logIdentifier, `Deleted account ${cleanEmail || idStr}`);
    return true;
  }

  // ==========================================================
  // EXCEL & CSV EXPORTS: NATIVE BLOB DOWNLOAD & EXPLICIT FILENAMES
  // ==========================================================

  exportUsersToExcel(format = 'xlsx', customUsers = null) {
    const users = customUsers || this.getUsers();
    const exportData = users.map(u => ({
      'User ID': u.id,
      'Full Name': u.name,
      'Email Address': u.email,
      'Role': u.role || 'user',
      'Account Status': u.status,
      'Date Joined': u.joinedOn,
      'Total Tests Taken': u.testsTaken,
      'Average WPM': u.avgWpm,
      'Highest WPM': u.highestWpm,
      'Average Accuracy (%)': `${u.accuracy}%`,
      'Total Practice Time (Hours)': u.totalPracticeTimeHours,
      'Last Active': u.lastActive
    }));

    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `TypeMaster_Users_Directory_${dateStr}.${format}`;

    if (format === 'csv') {
      exportDataToCsv(exportData, fileName);
    } else {
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Users');
      exportWorkbookToExcel(wb, fileName);
    }
    this.logAudit('Data Exported', 'User Directory', `Exported ${users.length} live user records to ${fileName}`);
  }

  exportPerformanceReport(timeframe = 'Last 30 Days', format = 'xlsx') {
    const users = this.getUsers();
    const fileName = format === 'csv' ? 'TypeMaster_Admin_Report.csv' : 'TypeMaster_Admin_Report.xlsx';

    const summaryData = [
      { 'Metric': 'Total Platform Users', 'Value': users.length },
      { 'Metric': 'Active Platform Users', 'Value': users.filter(u => u.status === 'Active').length },
      { 'Metric': 'Tests Conducted', 'Value': users.reduce((a, u) => a + (u.testsTaken || 0), 0) },
      { 'Metric': 'Platform Average WPM', 'Value': users.length ? Math.round(users.reduce((a, u) => a + (u.avgWpm || 0), 0) / users.length) : 0 }
    ];

    if (format === 'csv') {
      exportDataToCsv(summaryData, fileName);
    } else {
      const wb = XLSX.utils.book_new();
      const wsSummary = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

      const wsUsers = XLSX.utils.json_to_sheet(users.map(u => ({
        'User': u.name,
        'Email': u.email,
        'Avg WPM': u.avgWpm,
        'Peak WPM': u.highestWpm,
        'Accuracy': `${u.accuracy}%`,
        'Tests Taken': u.testsTaken
      })));
      XLSX.utils.book_append_sheet(wb, wsUsers, 'Typist Metrics');
      exportWorkbookToExcel(wb, fileName);
    }
    this.logAudit('Data Exported', 'Platform Report', `Exported full ${timeframe} report to ${fileName}`);
  }

  exportUserDetailToExcel(user, format = 'xlsx') {
    if (!user) return;
    const cleanName = (user.name || 'User').replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `TypeMaster_Performance_${cleanName}.${format}`;

    const overview = [
      { 'Field': 'User ID', 'Value': user.id },
      { 'Field': 'Full Name', 'Value': user.name },
      { 'Field': 'Email Address', 'Value': user.email },
      { 'Field': 'Status', 'Value': user.status },
      { 'Field': 'Joined Date', 'Value': user.joinedOn },
      { 'Field': 'Average Speed', 'Value': `${user.avgWpm} WPM` },
      { 'Field': 'Highest Speed', 'Value': `${user.highestWpm} WPM` },
      { 'Field': 'Average Accuracy', 'Value': `${user.accuracy}%` },
      { 'Field': 'Tests Completed', 'Value': user.testsTaken }
    ];

    if (format === 'csv') {
      exportDataToCsv(overview, fileName);
    } else {
      const wb = XLSX.utils.book_new();
      const wsOverview = XLSX.utils.json_to_sheet(overview);
      XLSX.utils.book_append_sheet(wb, wsOverview, 'User Summary');
      exportWorkbookToExcel(wb, fileName);
    }
    this.logAudit('Data Exported', `User ${user.name}`, `Exported performance history for ${user.email}`);
  }

  exportAuditLogsToExcel(format = 'xlsx') {
    const logs = this.getAuditLogs();
    const fileName = `TypeMaster_Audit_Logs_${new Date().toISOString().split('T')[0]}.${format}`;
    const exportData = logs.map(l => ({
      'Log ID': l.id,
      'Timestamp': l.timestamp,
      'Administrator': l.admin,
      'Action': l.action,
      'Target Entity': l.target,
      'Details': l.details,
      'Client': l.client
    }));

    if (format === 'csv') {
      exportDataToCsv(exportData, fileName);
    } else {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);
      XLSX.utils.book_append_sheet(wb, ws, 'Audit_Trail');
      exportWorkbookToExcel(wb, fileName);
    }
  }

  exportDashboardToExcel(metrics = {}) {
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `TypeMaster_Dashboard_${dateStr}.xlsx`;
    const wb = XLSX.utils.book_new();

    // Sheet 1: KPIs
    const kpiData = [
      { 'Metric': 'Total Platform Users', 'Value': metrics.totalUsers || 0 },
      { 'Metric': 'Active Daily Typists', 'Value': metrics.activeUsers || 0 },
      { 'Metric': 'Total Tests Completed', 'Value': metrics.testsCompleted || 0 },
      { 'Metric': 'Global Average Speed', 'Value': `${metrics.avgWpm || 0} WPM` },
      { 'Metric': 'Milestone Badges Earned', 'Value': metrics.achievementsEarned || 0 },
      { 'Metric': 'Telemetry Status', 'Value': 'Live Synchronized' },
      { 'Metric': 'Report Generated At', 'Value': new Date().toLocaleString() }
    ];
    const wsKpi = XLSX.utils.json_to_sheet(kpiData);
    XLSX.utils.book_append_sheet(wb, wsKpi, 'KPI_Overview');

    // Sheet 2: Recent Test Activity
    if (metrics.latestTestAttempts && metrics.latestTestAttempts.length > 0) {
      const attemptsData = metrics.latestTestAttempts.map(a => ({
        'Typist': a.user,
        'Test Category': a.type,
        'Speed (WPM)': a.wpm,
        'Accuracy': a.accuracy,
        'Duration': a.time,
        'Timestamp': a.date
      }));
      const wsAttempts = XLSX.utils.json_to_sheet(attemptsData);
      XLSX.utils.book_append_sheet(wb, wsAttempts, 'Recent_Test_Activity');
    }

    // Sheet 3: Speed Brackets Distribution
    if (metrics.speedDistribution && metrics.speedDistribution.length > 0) {
      const distData = metrics.speedDistribution.map(s => ({
        'WPM Bracket': s.bracket,
        'Percentage': `${s.pct}%`
      }));
      const wsDist = XLSX.utils.json_to_sheet(distData);
      XLSX.utils.book_append_sheet(wb, wsDist, 'Speed_Distribution');
    }

    exportWorkbookToExcel(wb, fileName);
    this.logAudit('Data Exported', 'Admin Dashboard', `Exported live dashboard metrics to ${fileName}`);
  }

  exportFeedbackToExcel(feedbackList = []) {
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `TypeMaster_User_Feedback_${dateStr}.xlsx`;
    const wb = XLSX.utils.book_new();

    const exportRows = (feedbackList || []).map((f, idx) => ({
      'Record #': idx + 1,
      'User Name': f.userName || f.username || 'Typist',
      'User Email': f.userEmail || f.email || 'N/A',
      'Category': f.category || 'General Feedback',
      'Rating (Stars)': f.rating ? `${f.rating} ★` : 'Not Rated',
      'Subject': f.subject || 'N/A',
      'Feedback Message': f.message || f.comment || '',
      'Status': f.status || 'Received',
      'Administrator Response': f.admin_response || f.adminReply || 'Pending Response',
      'Submitted At': f.created_at || f.createdAt || f.date || 'Recent'
    }));

    const ws = XLSX.utils.json_to_sheet(exportRows.length > 0 ? exportRows : [{ 'Notice': 'No feedback records submitted yet' }]);
    XLSX.utils.book_append_sheet(wb, ws, 'User_Feedback');
    exportWorkbookToExcel(wb, fileName);
    this.logAudit('Data Exported', 'Feedback Management', `Exported ${exportRows.length} feedback records to ${fileName}`);
  }

  exportAchievementsToExcel(badges = [], rankings = []) {
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `TypeMaster_Achievements_${dateStr}.xlsx`;
    const wb = XLSX.utils.book_new();

    // Sheet 1: Global Typist Leaderboard
    const ranks = rankings && rankings.length > 0 ? rankings : this.getLeaderboardRankings('All-Time');
    const rankRows = ranks.map((r, idx) => ({
      'Rank': r.rank || idx + 1,
      'Typist Name': r.user || r.name || 'Typist',
      'Email': r.email || 'N/A',
      'Speed (WPM)': r.wpm || r.avgWpm || 0,
      'Accuracy': typeof r.accuracy === 'number' ? `${r.accuracy}%` : (r.accuracy || '98%'),
      'Tests Completed': r.testsCompleted || r.testsTaken || 0,
      'Tier': r.tier || 'Master',
      'Status': r.status || 'Active'
    }));
    const wsRank = XLSX.utils.json_to_sheet(rankRows);
    XLSX.utils.book_append_sheet(wb, wsRank, 'Leaderboard_Rankings');

    // Sheet 2: Achievement Badges Catalog
    const badgeList = badges && badges.length > 0 ? badges : this.getBadges();
    const badgeRows = badgeList.map(b => ({
      'Badge ID': b.id,
      'Title': b.title,
      'Description': b.description,
      'Category': b.category,
      'Unlock Criteria': b.threshold,
      'Unlocked Count': b.unlockedCount || 0
    }));
    const wsBadges = XLSX.utils.json_to_sheet(badgeRows);
    XLSX.utils.book_append_sheet(wb, wsBadges, 'Milestone_Badges');

    exportWorkbookToExcel(wb, fileName);
    this.logAudit('Data Exported', 'Achievements & Leaderboards', `Exported rankings and badges catalog to ${fileName}`);
    return true;
  }

  exportSettingsToExcel(settings = {}) {
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `TypeMaster_Settings_Config_${dateStr}.xlsx`;
    const wb = XLSX.utils.book_new();

    // Sheet 1: System Security & AI Config
    const configRows = [
      { 'Configuration Parameter': 'Two-Factor Authentication', 'Status / Value': settings.twoFactor ? 'Enabled' : 'Disabled' },
      { 'Configuration Parameter': 'Admin Session Inactivity Timeout', 'Status / Value': `${settings.sessionTimeout || 60} Minutes` },
      { 'Configuration Parameter': 'RBAC Policy', 'Status / Value': 'Strict (Admin Role Enforced)' },
      { 'Configuration Parameter': 'Gemini AI Integration', 'Status / Value': settings.geminiActive ? 'Active & Configured' : 'Local Fallback' },
      { 'Configuration Parameter': 'Selected Gemini AI Model', 'Status / Value': settings.geminiModel || 'gemini-2.5-flash' },
      { 'Configuration Parameter': 'Export Timestamp', 'Status / Value': new Date().toLocaleString() }
    ];
    const wsConfig = XLSX.utils.json_to_sheet(configRows);
    XLSX.utils.book_append_sheet(wb, wsConfig, 'System_Config');

    // Sheet 2: Provisioned Administrators
    const admins = this.getActiveAdmins();
    const adminRows = admins.map(a => ({
      'ID': a.id,
      'Administrator Name': a.name || a.username,
      'Email Address': a.email,
      'Role': a.role,
      'Status': a.status,
      'Provisioned On': a.joinedOn
    }));
    const wsAdmins = XLSX.utils.json_to_sheet(adminRows);
    XLSX.utils.book_append_sheet(wb, wsAdmins, 'Active_Administrators');

    // Sheet 3: Audit Trail
    const logs = this.getAuditLogs();
    const logRows = logs.map(l => ({
      'Timestamp': l.timestamp,
      'Action': l.action,
      'Target': l.target,
      'Details': l.details,
      'Administrator': l.admin || 'Admin'
    }));
    const wsLogs = XLSX.utils.json_to_sheet(logRows);
    XLSX.utils.book_append_sheet(wb, wsLogs, 'Audit_Trail');

    exportWorkbookToExcel(wb, fileName);
    this.logAudit('Data Exported', 'Admin Settings', `Exported configuration, admins and audit trail to ${fileName}`);
    return true;
  }

  exportScheduledTestsToExcel(tests = [], format = 'xlsx') {
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `TypeMaster_Scheduled_Tests_${dateStr}.${format}`;
    const rows = (tests || []).map((t, idx) => ({
      '#': idx + 1,
      'Test ID': t.id,
      'Test Title': t.title,
      'Description': t.description || '',
      'Category': t.category,
      'Difficulty': t.difficulty,
      'Duration (Minutes)': t.duration_minutes || Math.round((t.duration || 60) / 60),
      'Start Date & Time': t.starts_at ? new Date(t.starts_at).toLocaleString() : '',
      'End Date & Time': t.ends_at ? new Date(t.ends_at).toLocaleString() : '',
      'Publication Status': t.publication_status,
      'Schedule Status': t.computedStatus || t.status,
      'Participants': `${t.participants_count || 0}${t.max_participants ? ' / ' + t.max_participants : ''}`,
      'Created By': t.created_by || 'Admin',
      'Created At': t.created_at ? new Date(t.created_at).toLocaleString() : ''
    }));

    if (format === 'csv') {
      exportDataToCsv(rows, fileName);
    } else {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'Scheduled_Tests');
      exportWorkbookToExcel(wb, fileName);
    }
    this.logAudit('Data Exported', 'Scheduled Tests', `Exported ${tests.length} scheduled test records to ${fileName}`);
    return true;
  }

  exportScheduledTestResultsToExcel(testTitle, attempts = [], format = 'xlsx') {
    const cleanTitle = (testTitle || 'Scheduled_Test').replace(/[^a-zA-Z0-9_-]/g, '_');
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `TypeMaster_Results_${cleanTitle}_${dateStr}.${format}`;
    const rows = (attempts || []).map((a, idx) => ({
      'Rank': a.rank || idx + 1,
      'User Name': a.user_name || 'Typist',
      'User Email': a.user_email || 'N/A',
      'Test Title': a.scheduled_test_title || testTitle || '',
      'Speed (WPM)': a.wpm,
      'Raw WPM': a.raw_wpm || a.wpm,
      'Accuracy (%)': a.accuracy,
      'Errors': a.errors || 0,
      'Correct Characters': a.correct_characters || a.characters || 0,
      'Total Characters': a.characters || 0,
      'Duration (sec)': a.duration,
      'Final Score': a.score ?? Math.round((a.wpm || 0) * ((a.accuracy || 100) / 100)),
      'Status': a.status || 'completed',
      'Attempt Date': a.created_at ? new Date(a.created_at).toLocaleString() : ''
    }));

    if (format === 'csv') {
      exportDataToCsv(rows, fileName);
    } else {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'Results');
      exportWorkbookToExcel(wb, fileName);
    }
    this.logAudit('Data Exported', 'Scheduled Test Results', `Exported ${attempts.length} attempts for "${testTitle}" to ${fileName}`);
    return true;
  }

  // ==========================================================
  // TYPING TESTS CRUD
  // ==========================================================
  getTypingTests() {
    return this._get('admin_typing_tests', INITIAL_TYPING_TESTS);
  }

  createTypingTest(testData) {
    const tests = this.getTypingTests();
    const durationNum = parseInt(testData.duration) || 1;
    const newTest = {
      id: `test_${Date.now()}`,
      title: testData.title,
      difficulty: testData.difficulty || 'Medium',
      duration: testData.duration.includes('min') ? testData.duration : `${durationNum} min`,
      durationSeconds: durationNum * 60,
      category: testData.category || 'General',
      active: testData.active !== undefined ? testData.active : true,
      content: testData.content
    };
    tests.unshift(newTest);
    this._set('admin_typing_tests', tests);
    this.logAudit('Typing Test Created', newTest.title, `Difficulty: ${newTest.difficulty}, Category: ${newTest.category}`);
    return newTest;
  }

  updateTypingTest(id, updates) {
    const tests = this.getTypingTests();
    const index = tests.findIndex(t => t.id === id);
    if (index >= 0) {
      tests[index] = { ...tests[index], ...updates };
      this._set('admin_typing_tests', tests);
      this.logAudit('Typing Test Updated', tests[index].title, `Updated test parameters`);
      return tests[index];
    }
    return null;
  }

  toggleTestActive(id) {
    const tests = this.getTypingTests();
    const test = tests.find(t => t.id === id);
    if (test) {
      test.active = !test.active;
      this._set('admin_typing_tests', tests);
      this.logAudit('Test Status Toggled', test.title, `Active state set to ${test.active}`);
      return test.active;
    }
    return false;
  }

  deleteTypingTest(id) {
    let tests = this.getTypingTests();
    const test = tests.find(t => t.id === id);
    if (test) {
      tests = tests.filter(t => t.id !== id);
      this._set('admin_typing_tests', tests);
      this.logAudit('Typing Test Deleted', test.title, `Removed test from library`);
      return true;
    }
    return false;
  }

  // ==========================================================
  // PRACTICE CONTENT
  // ==========================================================
  getPracticeContent() {
    const stored = this._get('admin_practice_content', INITIAL_PRACTICE_ITEMS);
    // Ensure all predefined domain items (including Mathematics Easy, Medium, Hard) exist in the pool
    const itemsMap = new Map();
    INITIAL_PRACTICE_ITEMS.forEach(init => itemsMap.set(init.id, init));
    (Array.isArray(stored) ? stored : []).forEach(item => {
      if (item && item.id) {
        itemsMap.set(item.id, { ...itemsMap.get(item.id), ...item });
      }
    });
    const merged = Array.from(itemsMap.values());
    if (!stored || stored.length !== merged.length) {
      this._set('admin_practice_content', merged);
    }
    return merged;
  }

  createPracticeContent(itemData) {
    const items = this.getPracticeContent();
    const contentText = itemData.content || itemData.text || '';
    const newItem = {
      id: itemData.id || `prac_${Date.now()}`,
      title: itemData.title || 'Untitled Practice Drill',
      category: itemData.category || 'Paragraphs',
      difficulty: itemData.difficulty || 'Medium',
      content: contentText,
      text: contentText,
      focus_keys: Array.isArray(itemData.focus_keys) ? itemData.focus_keys : (itemData.focusKeys || []),
      tags: Array.isArray(itemData.tags) ? itemData.tags : (typeof itemData.tags === 'string' ? itemData.tags.split(',').map(t => t.trim()).filter(Boolean) : ['Practice']),
      publication_status: itemData.publication_status || 'published', // MANDATORY for User Portal filtering
      is_active: itemData.is_active !== undefined ? itemData.is_active : true,
      wordCount: contentText.trim().split(/\s+/).filter(Boolean).length,
      created_at: itemData.created_at || new Date().toISOString()
    };
    items.unshift(newItem);
    this._set('admin_practice_content', items);
    this.logAudit('Practice Content Added', newItem.title, `Category: ${newItem.category}`);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('practice-content-sync', { detail: { action: 'create', item: newItem, items } }));
      try {
        const bc = new BroadcastChannel('typemaster_practice_sync');
        bc.postMessage({ action: 'create', item: newItem, items });
        bc.close();
      } catch (e) {}
    }
    return newItem;
  }

  updatePracticeContent(id, updates) {
    const items = this.getPracticeContent();
    const index = items.findIndex(i => i.id === id);
    if (index >= 0) {
      const contentText = updates.content || updates.text || items[index].content;
      const updatedItem = {
        ...items[index],
        ...updates,
        content: contentText,
        text: contentText,
        wordCount: contentText.trim().split(/\s+/).filter(Boolean).length,
        publication_status: updates.publication_status || items[index].publication_status || 'published',
        is_active: updates.is_active !== undefined ? updates.is_active : items[index].is_active,
        updated_at: new Date().toISOString()
      };
      items[index] = updatedItem;
      this._set('admin_practice_content', items);
      this.logAudit('Practice Content Updated', items[index].title, 'Updated passage');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('practice-content-sync', { detail: { action: 'update', item: updatedItem, items } }));
        try {
          const bc = new BroadcastChannel('typemaster_practice_sync');
          bc.postMessage({ action: 'update', item: updatedItem, items });
          bc.close();
        } catch (e) {}
      }
      return items[index];
    }
    return null;
  }

  deletePracticeContent(id) {
    let items = this.getPracticeContent();
    const item = items.find(i => i.id === id);
    if (item) {
      items = items.filter(i => i.id !== id);
      this._set('admin_practice_content', items);
      this.logAudit('Practice Content Removed', item.title, 'Deleted passage');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('practice-content-sync', { detail: { action: 'delete', id, items } }));
        try {
          const bc = new BroadcastChannel('typemaster_practice_sync');
          bc.postMessage({ action: 'delete', id, items });
          bc.close();
        } catch (e) {}
      }
      return true;
    }
    return false;
  }

  // ==========================================================
  // ACHIEVEMENTS & LEADERBOARDS
  // ==========================================================
  getBadges() {
    return this._get('admin_badges', INITIAL_BADGES);
  }

  updateBadge(id, updates) {
    const badges = this.getBadges();
    const index = badges.findIndex(b => b.id === id);
    if (index >= 0) {
      badges[index] = { ...badges[index], ...updates };
      this._set('admin_badges', badges);
      this.logAudit('Achievement Badge Updated', badges[index].title, `Criteria: ${badges[index].threshold}`);
      return badges[index];
    }
    return null;
  }

  createBadge(badgeData) {
    const badges = this.getBadges();
    const newBadge = {
      id: `badge_${Date.now()}`,
      title: badgeData.title,
      description: badgeData.description,
      category: badgeData.category || 'Special',
      icon: badgeData.icon || 'star',
      threshold: badgeData.threshold,
      unlockedCount: 0
    };
    badges.push(newBadge);
    this._set('admin_badges', badges);
    this.logAudit('New Badge Created', newBadge.title, `Threshold: ${newBadge.threshold}`);
    return newBadge;
  }

  getLeaderboardRankings(timeframe = 'All-Time') {
    const users = this.getUsers();
    const computedLeaderboard = users.map((u) => {
      const testsCompleted = u.testsTaken || 0;
      if (testsCompleted === 0) {
        return {
          id: u.id,
          user: u.name || 'Typist',
          name: u.name || 'Typist',
          email: u.email || 'N/A',
          wpm: 0,
          accuracy: 0, // Set accuracy to 0% (not default 98%) when no tests taken
          testsCompleted: 0,
          tier: 'Unranked',
          status: u.status || 'Active'
        };
      }

      const wpm = u.highestWpm || u.avgWpm || 0;
      let tier = 'Bronze';
      if (wpm >= 80) tier = 'Master';
      else if (wpm >= 50) tier = 'Gold';
      else if (wpm >= 30) tier = 'Silver';

      return {
        id: u.id,
        user: u.name || 'Typist',
        name: u.name || 'Typist',
        email: u.email || 'N/A',
        wpm,
        accuracy: typeof u.accuracy === 'number' ? u.accuracy : parseFloat(u.accuracy || 0),
        testsCompleted,
        tier,
        status: u.status || 'Active'
      };
    });

    // Sort: Active users first, then by WPM (desc), then Accuracy (desc), then Tests (desc)
    const sortedLeaderboard = computedLeaderboard.sort((a, b) => {
      if (a.testsCompleted === 0 && b.testsCompleted > 0) return 1;
      if (a.testsCompleted > 0 && b.testsCompleted === 0) return -1;
      if (b.wpm !== a.wpm) return b.wpm - a.wpm;
      if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
      return b.testsCompleted - a.testsCompleted;
    });

    return sortedLeaderboard.map((item, idx) => ({ ...item, rank: idx + 1 }));
  }

  async fetchGlobalLeaderboard(timeframe = 'All-Time') {
    return supabaseService.fetchGlobalLeaderboard(timeframe);
  }


  _isSampleFeedback(fb) {
    if (!fb) return true;
    const sampleIds = ['fb_001', 'fb_002', 'fb_003', 'fb_004', 'fb_005'];
    const sampleEmails = ['priya@gmail.com', 'rahulv@gmail.com', 'sneha@gmail.com', 'arjun@gmail.com', 'neha@gmail.com'];
    const sampleNames = ['Priya Sharma', 'Rahul Verma', 'Sneha Reddy', 'Arjun Kumar', 'Neha Patel'];
    if (sampleIds.includes(fb.id)) return true;
    const email = (fb.userEmail || fb.user_email || '').toLowerCase();
    if (sampleEmails.includes(email)) return true;
    const name = fb.userName || fb.user_name || '';
    if (sampleNames.includes(name)) return true;
    return false;
  }

  // ==========================================================
  // FEEDBACK & REAL-TIME TELEMETRY
  // ==========================================================
  getFeedback() {
    const list = this._get('admin_feedback', []);
    const cleanList = list.filter(fb => !this._isSampleFeedback(fb));
    if (cleanList.length !== list.length) {
      this._set('admin_feedback', cleanList);
    }
    return cleanList;
  }

  async fetchFeedbackLive() {
    try {
      const liveList = await supabaseService.fetchFeedbackLive();
      const cleanList = (liveList || []).filter(fb => !this._isSampleFeedback(fb));
      this._set('admin_feedback', cleanList);
      return cleanList;
    } catch (err) {
      console.warn('Feedback live fetch error, falling back to local:', err);
      return this.getFeedback();
    }
  }

  addFeedback(fb) {
    if (this._isSampleFeedback(fb)) return fb;
    const list = this.getFeedback();
    list.unshift(fb);
    this._set('admin_feedback', list);
    return fb;
  }

  async respondToFeedback(id, replyNote = '', status = 'Resolved') {
    const res = await supabaseService.respondToFeedback(id, { adminResponse: replyNote, status });
    const targetUser = res?.item?.userName || 'User';
    this.logAudit('Feedback Responded', targetUser, `Status: ${status} | Note: ${replyNote || 'None'}`);
    return res?.item;
  }

  async resolveFeedback(id, replyNote = '') {
    return this.respondToFeedback(id, replyNote, 'Resolved');
  }

  async deleteFeedback(id) {
    await supabaseService.deleteFeedback(id);
    this.logAudit('Feedback Deleted', id, 'Deleted by administrator');
    return true;
  }


  // ==========================================================
  // MULTI-ADMIN CREATION & RBAC MANAGEMENT
  // ==========================================================
  async createAdministrator({ email, displayName, password }) {
    const res = await supabaseService.createAdminUser(email, password, displayName);
    if (res.success) {
      this.logAudit('Administrator Created', displayName, `New administrator account created (${email})`);
    }
    return res;
  }

  getActiveAdmins() {
    const authorizedEmails = supabaseService.getAuthorizedAdminEmails().map(e => e.toLowerCase().trim());
    const accounts = supabaseService._getLocal('users_registry', []);
    const adminMap = new Map();

    // Default primary admin
    adminMap.set('admin@typemaster.com', {
      id: 'admin_master_01',
      name: 'Admin Administrator',
      username: 'Admin Administrator',
      email: 'admin@typemaster.com',
      role: 'admin',
      status: 'Active',
      joinedOn: '2026-10-09'
    });

    // Built-in PAR Academy admin
    adminMap.set('paracademy@typemaster.com', {
      id: 'admin_paracademy_01',
      name: 'PAR Academy Admin',
      username: 'PAR Academy Admin',
      email: 'paracademy@typemaster.com',
      role: 'admin',
      status: 'Active',
      joinedOn: '2026-10-10'
    });

    accounts.forEach(acc => {
      const email = (acc.email || '').toLowerCase().trim();
      if (acc.role === 'admin' || authorizedEmails.includes(email) || email === 'admin@typemaster.com') {
        adminMap.set(email || acc.id, {
          id: acc.id,
          name: acc.displayName || acc.display_name || acc.username || 'Admin',
          username: acc.username || 'Admin',
          email: acc.email,
          role: 'admin',
          status: acc.status || 'Active',
          joinedOn: acc.created_at ? acc.created_at.split('T')[0] : '2026-10-10'
        });
      }
    });

    authorizedEmails.forEach(em => {
      if (!adminMap.has(em)) {
        adminMap.set(em, {
          id: `admin_${em.replace(/[^a-zA-Z0-9]/g, '_')}`,
          name: em.split('@')[0],
          username: em.split('@')[0],
          email: em,
          role: 'admin',
          status: 'Active',
          joinedOn: '2026-10-10'
        });
      }
    });

    return Array.from(adminMap.values());
  }

  async revokeAdministrator(email) {
    if (!email || email.toLowerCase() === 'admin@typemaster.com') {
      return { success: false, message: 'Primary Master Admin cannot be revoked.' };
    }
    const res = await supabaseService.revokeAdminUser(email);
    this.logAudit('Administrator Revoked', email, `Admin access revoked for ${email}`);
    return res;
  }

  async updateUserTier(userId, isPremium) {
    const res = await supabaseService.setUserTier(isPremium, userId);
    const user = this.getUserById(userId);
    this.logAudit('User Tier Updated', user?.name || userId, `Tier set to ${isPremium ? 'Premium' : 'Free'}`);
    return res;
  }

  // ==========================================================
  // REAL-TIME REPORTS ENGINE: ZERO MOCK DATA
  // ==========================================================
  async getLiveReportsData(timeframe = 'Last 30 Days') {
    const allUsers = await this.fetchAllUsersLive();
    const allTestLogs = await this.fetchAllTestLogsLive();

    const isFiltered = timeframe && timeframe !== 'All Time' && timeframe !== 'All';
    const users = isFiltered
      ? allUsers.filter(u => isDateInPeriod(u.joinedOn || u.created_at, timeframe))
      : allUsers;
    const testLogs = isFiltered
      ? allTestLogs.filter(l => isDateInPeriod(l.created_at || l.date, timeframe))
      : allTestLogs;

    const totalTestsConducted = testLogs.length;
    const totalUsers = isFiltered ? users.length : allUsers.length;

    // Strategy A: Strict Registered User Activity (join with users, exclude guest_* temporary IDs)
    const registeredUserIds = new Set(
      allUsers
        .map(u => String(u.id))
        .filter(id => id && !id.startsWith('guest_'))
    );
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const activeLogsInPeriod = (isFiltered ? testLogs : allTestLogs).filter(l => {
      if (!l || !l.user_id) return false;
      const uid = String(l.user_id);
      if (uid.startsWith('guest_') || !registeredUserIds.has(uid)) return false;
      if (!isFiltered) {
        const logDate = new Date(l.created_at || l.date || 0);
        return !isNaN(logDate.getTime()) && logDate >= thirtyDaysAgo;
      }
      return true;
    });

    const activeUsersCount = Math.min(totalUsers, new Set(activeLogsInPeriod.map(l => String(l.user_id))).size);

    // Platform Avg WPM strictly from real test logs
    const validWpms = testLogs.map(l => Number(l.wpm) || 0).filter(w => w > 0);
    const globalAvgWpm = validWpms.length > 0
      ? (validWpms.reduce((a, b) => a + b, 0) / validWpms.length).toFixed(1)
      : (users.length > 0 && users.some(u => u.avgWpm > 0)
          ? (users.reduce((a, u) => a + (u.avgWpm || 0), 0) / users.length).toFixed(1)
          : '0.0');

    // Avg Session Duration strictly from real logs
    const durations = testLogs.map(l => {
      const d = l.duration;
      if (typeof d === 'number') return d;
      if (typeof d === 'string' && d.includes('min')) return parseInt(d) * 60;
      return 60;
    });
    const avgSessionMinutes = durations.length > 0
      ? ((durations.reduce((a, b) => a + b, 0) / durations.length) / 60).toFixed(1)
      : '0.0';

    // Performance Distribution Donut Brackets from real test scores
    const bracketCounts = [
      { label: '0 - 20 WPM', min: 0, max: 20, count: 0, color: '#8B5CF6' },
      { label: '21 - 40 WPM', min: 21, max: 40, count: 0, color: '#F43F5E' },
      { label: '41 - 60 WPM', min: 41, max: 60, count: 0, color: '#F59E0B' },
      { label: '61 - 80 WPM', min: 61, max: 80, count: 0, color: '#10B981' },
      { label: '81 - 100 WPM', min: 81, max: 100, count: 0, color: '#06B6D4' },
      { label: '> 100 WPM', min: 101, max: 9999, count: 0, color: '#3B82F6' }
    ];

    const wpmDataSource = validWpms.length > 0 ? validWpms : users.map(u => u.avgWpm || u.highestWpm || 0).filter(w => w > 0);
    if (wpmDataSource.length > 0) {
      wpmDataSource.forEach(w => {
        const b = bracketCounts.find(br => w >= br.min && w <= br.max);
        if (b) b.count++;
      });
    }
    const totalCounted = wpmDataSource.length || 1;
    const brackets = bracketCounts.map(b => ({
      label: b.label,
      percent: wpmDataSource.length > 0 ? Math.round((b.count / totalCounted) * 100) : 0,
      count: b.count,
      color: b.color
    }));

    // User Activity Bar Chart (Last 7 Days) from real timestamps
    const dayLabels = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      dayLabels.push({
        day: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        isoDate: d.toISOString().split('T')[0]
      });
    }

    const userActivityData = dayLabels.map(({ day, isoDate }) => {
      const newUsers = users.filter(u => u.joinedOn && u.joinedOn.startsWith(isoDate)).length;
      const dayLogs = allTestLogs.filter(l => {
        if (!l || !l.user_id) return false;
        const uid = String(l.user_id);
        if (uid.startsWith('guest_') || !registeredUserIds.has(uid)) return false;
        return (l.created_at || l.date || '').startsWith(isoDate);
      });
      const dayActiveUsers = new Set(dayLogs.map(l => String(l.user_id))).size;
      return {
        day,
        newUsers,
        activeUsers: Math.min(totalUsers, Math.max(dayActiveUsers, newUsers))
      };
    });

    return {
      totalTestsConducted,
      activeDailyTypists: activeUsersCount,
      globalAvgWpm: `${globalAvgWpm} WPM`,
      avgSessionDuration: `${avgSessionMinutes} min`,
      totalUsers,
      brackets,
      userActivityData
    };
  }

  getAnnouncements() {
    return this._get('admin_announcements', INITIAL_ANNOUNCEMENTS);
  }

  createAnnouncement(annData) {
    const list = this.getAnnouncements();
    const newAnn = {
      id: `ann_${Date.now()}`,
      title: annData.title,
      type: annData.type || 'Notice',
      audience: annData.audience || 'All Typists',
      message: annData.message,
      date: new Date().toISOString().split('T')[0],
      status: annData.status || 'Published'
    };
    list.unshift(newAnn);
    this._set('admin_announcements', list);
    this.logAudit('Announcement Published', newAnn.title, `Target: ${newAnn.audience}`);
    return newAnn;
  }

  toggleAnnouncementStatus(id) {
    const list = this.getAnnouncements();
    const ann = list.find(a => a.id === id);
    if (ann) {
      ann.status = ann.status === 'Published' ? 'Draft' : 'Published';
      this._set('admin_announcements', list);
      this.logAudit('Announcement Status Toggled', ann.title, `Status: ${ann.status}`);
      return ann.status;
    }
    return null;
  }

  deleteAnnouncement(id) {
    let list = this.getAnnouncements();
    list = list.filter(a => a.id !== id);
    this._set('admin_announcements', list);
    return true;
  }

  getAuditLogs() {
    return this._get('admin_audit_logs', [
      {
        id: 'log_init',
        timestamp: '2026-10-10 00:00:00',
        admin: 'Admin Administrator',
        action: 'System Initialized',
        target: 'Platform Core',
        details: 'Live database synchronization active',
        client: 'Admin Console'
      }
    ]);
  }
}

export const adminService = new AdminService();
