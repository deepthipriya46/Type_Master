// PDF Text Parser & Local Word Bank Integration
// Extracts, cleans, and slices passages from words_repository.pdf
import { pdfSentences } from '../data/pdfPassages.js';

// In-memory cache for instant 0ms access
let cachedSentences = (pdfSentences && pdfSentences.length > 0)
  ? [...pdfSentences]
  : [];

let isPdfLoading = false;
let isPdfLoaded = cachedSentences.length > 0;

/**
 * Clean and normalize text extracted from PDF
 */
function cleanRawPdfText(rawText) {
  if (!rawText) return '';
  return rawText
    .replace(/Website:\s*shivbabas\.org\s*,?\s*shivbabas\.org\/books/gi, '')
    .replace(/Main Website:[^\n]+/gi, '')
    .replace(/BK Google:[^\n]+/gi, '')
    .replace(/Get more PDF books:[^\n]+/gi, '')
    .replace(/Explore more such eBOOKS:[^\n]+/gi, '')
    .replace(/The Secret\s+\d+/g, '')
    .replace(/\d+\s+The Secret/g, '')
    .replace(/The Secret Revealed\s*\d*/gi, '')
    .replace(/The Secret Made Simple\s*\d*/gi, '')
    .replace(/The Secret to (Money|Relationships|Health|the World|You|Life)\s*\d*/gi, '')
    .replace(/How to Use the Secret\s*\d*/gi, '')
    .replace(/Powerful Processes\s*\d*/gi, '')
    .replace(/burn-\s*ing/gi, 'burning')
    .replace(/informa-\s*tion/gi, 'information')
    .replace(/re-\s*sponding/gi, 'responding')
    .replace(/over-\s*weight/gi, 'overweight')
    .replace(/trans-\s*formation/gi, 'transformation')
    .replace(/compe-\s*tition/gi, 'competition')
    .replace(/['']/g, "'")
    .replace(/[""]/g, '"')
    .replace(/—/g, ' - ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Split text into coherent, punctuation-bounded sentences
 */
function splitIntoSentences(text) {
  const parts = text.split(/(?<=[.!?])\s+/);
  return parts.filter(s => {
    const trimmed = s.trim();
    return trimmed.length > 25 &&
      !trimmed.includes('http') &&
      !trimmed.includes('www.') &&
      !trimmed.includes('ISBN') &&
      !trimmed.includes('QR code');
  });
}

/**
 * Asynchronously load and parse words_repository.pdf from public/ directory
 */
export async function loadPdfFromRepository(pdfUrl = '/words_repository.pdf') {
  if (isPdfLoading) return cachedSentences;
  isPdfLoading = true;

  try {
    const response = await fetch(pdfUrl);
    if (!response.ok) {
      console.warn(`PDF fetch status ${response.status}, utilizing pre-cached word bank.`);
      isPdfLoading = false;
      return cachedSentences;
    }

    const arrayBuffer = await response.arrayBuffer();
    
    // Dynamic import to keep Vite bundle lightweight and resilient
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
    if (pdfjs.GlobalWorkerOptions && !pdfjs.GlobalWorkerOptions.workerSrc) {
      pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version || '4.10.38'}/legacy/build/pdf.worker.min.mjs`;
    }

    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(arrayBuffer),
      useSystemFonts: true,
      disableFontFace: true
    });

    const pdfDoc = await loadingTask.promise;
    const pagePromises = [];
    const maxPages = Math.min(pdfDoc.numPages, 100);

    for (let i = 1; i <= maxPages; i++) {
      pagePromises.push(
        pdfDoc.getPage(i).then(page => page.getTextContent()).then(content => {
          return content.items.map(item => item.str).join(' ');
        }).catch(() => '')
      );
    }

    const pageTexts = await Promise.all(pagePromises);
    const combinedRaw = pageTexts.join('\n\n');
    const cleaned = cleanRawPdfText(combinedRaw);
    const extractedSentences = splitIntoSentences(cleaned);

    if (extractedSentences.length > 50) {
      cachedSentences = extractedSentences;
      isPdfLoaded = true;
    }
  } catch (error) {
    console.warn('PDF dynamic parser notice (falling back to cached word bank):', error);
  } finally {
    isPdfLoading = false;
  }

  return cachedSentences;
}

/**
 * Counts words in a string
 */
function countWords(str) {
  return str.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Select a random slice of text from the parsed PDF word bank according to test duration:
 * - 1 min: ~50–80 words
 * - 3 min: ~180–250 words
 * - 5 min: ~350–500 words
 * - Custom: ~600+ words
 * 
 * @param {number|string} duration Test duration (seconds, minutes string, or 'custom')
 * @param {string} excludeText Previous prompt text to guarantee a fresh selection
 * @returns {string} Clean, punctuation-complete typing test passage
 */
export function getPassageForDuration(duration = 60, excludeText = '') {
  const sentences = cachedSentences.length > 0 ? cachedSentences : (preExtractedData.sentences || []);
  if (!sentences || sentences.length === 0) {
    return 'The law of attraction is the greatest secret of life. Everything you want is an inside job, and you can create your world through purposeful thoughts and practice.';
  }

  // Determine target word range based on duration
  let minWords = 55;
  let maxWords = 75;

  const durStr = String(duration).toLowerCase();
  if (durStr === 'custom' || durStr === '0' || duration === 0) {
    minWords = 600;
    maxWords = 720;
  } else {
    const durSec = typeof duration === 'number' ? duration : (parseInt(duration, 10) || 60);
    if (durSec >= 300 || durStr.includes('5')) {
      minWords = 360;
      maxWords = 480;
    } else if (durSec >= 180 || durStr.includes('3')) {
      minWords = 190;
      maxWords = 240;
    } else {
      // 1 minute default
      minWords = 55;
      maxWords = 75;
    }
  }

  let attempts = 0;
  let chosenPassage = '';

  while (attempts < 15) {
    attempts++;
    const startIndex = Math.floor(Math.random() * (sentences.length - 10));
    const passageParts = [];
    let currentWords = 0;

    for (let i = startIndex; i < sentences.length; i++) {
      const sentence = sentences[i].trim();
      if (!sentence) continue;

      passageParts.push(sentence);
      currentWords += countWords(sentence);

      if (currentWords >= minWords) {
        break;
      }
    }

    const candidate = passageParts.join(' ').trim();
    const candidateWordCount = countWords(candidate);

    // Accept candidate if word count is in acceptable bounds and is distinct from previous
    if (candidateWordCount >= Math.floor(minWords * 0.85) && candidate !== excludeText) {
      chosenPassage = candidate;
      break;
    }
  }

  if (!chosenPassage) {
    // Fallback selection if attempts loop exceeded
    const fallbackStart = Math.floor(Math.random() * (sentences.length - 20));
    chosenPassage = sentences.slice(fallbackStart, fallbackStart + 6).join(' ').trim();
  }

  return chosenPassage;
}

/**
 * Initializes the PDF word bank in application memory
 */
export function initPdfTextLoader() {
  if (typeof window !== 'undefined') {
    // Pre-cache sentences from PDF asynchronously in background
    setTimeout(() => {
      loadPdfFromRepository('/words_repository.pdf');
    }, 500);
  }
}

export const pdfTextLoader = {
  getPassageForDuration,
  loadPdfFromRepository,
  initPdfTextLoader,
  getCachedSentencesCount: () => cachedSentences.length
};
