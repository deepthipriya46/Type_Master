// ==========================================================
// TYPE MASTER - CLIENT GEMINI SERVICE
// Dynamic API Key Resolver & Content Generation Service
// ==========================================================

import { supabase } from '../supabaseClient';

/**
 * Fetch the active Gemini API key:
 * 1. Primary: Supabase system_config table (managed via Admin Settings)
 * 2. Secondary fallback: import.meta.env.VITE_GEMINI_API_KEY
 */
export const getActiveGeminiApiKey = async () => {
  try {
    const { data, error } = await supabase
      .from('system_config')
      .select('value')
      .eq('key', 'gemini_api_key')
      .single();

    if (!error && data?.value) return data.value;
  } catch (err) {
    console.warn('Falling back to .env Gemini API key');
  }
  return import.meta.env.VITE_GEMINI_API_KEY || '';
};

/**
 * Fetch the active Gemini Model name:
 * 1. Primary: Supabase system_config table ('gemini_model')
 * 2. Secondary fallback: 'gemini-3.5-flash'
 */
export const getActiveGeminiModel = async () => {
  try {
    const { data, error } = await supabase
      .from('system_config')
      .select('value')
      .eq('key', 'gemini_model')
      .single();

    if (!error && data?.value) return data.value;
  } catch (err) {
    // Fallback
  }
  return 'gemini-3.5-flash';
};

/**
 * Generate dynamic typing text passage
 * First tries backend proxy endpoint, then falls back to direct Gemini API with active key
 */
export const generateDynamicContent = async ({
  category = 'Random Text',
  difficulty = 'Medium',
  language = 'C',
  medicalSubcategory = 'Medical Billing & Claims',
  durationSeconds = 60,
  excludeText = ''
} = {}) => {
  const apiKey = await getActiveGeminiApiKey();
  const model = await getActiveGeminiModel();
  const durSec = Number(durationSeconds) || 60;

  // 1. Try local dev/production backend API route
  try {
    const response = await fetch('/api/typing/generate-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category,
        difficulty,
        language: category === 'Programming' ? language : undefined,
        medicalSubcategory: category === 'Medical' ? medicalSubcategory : undefined,
        durationSeconds: durSec,
        excludeText,
        apiKey,
        model
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data?.success && data?.text) {
        return data;
      }
    }
  } catch (err) {
    console.warn('Backend generate-text endpoint unavailable, trying direct API:', err);
  }

  // 2. Fallback to direct Google Gemini API if key is available
  if (apiKey && apiKey.length > 8) {
    try {
      const durMin = durSec / 60;
      const targetWords = durSec >= 300
        ? (difficulty === 'Easy' ? 525 : difficulty === 'Hard' ? 725 : 625)
        : durSec >= 180
          ? (difficulty === 'Easy' ? 320 : difficulty === 'Hard' ? 435 : 375)
          : durSec >= 120
            ? (difficulty === 'Easy' ? 210 : difficulty === 'Hard' ? 290 : 250)
            : (difficulty === 'Easy' ? 105 : difficulty === 'Hard' ? 145 : 125);

      const prompt = `Generate a high-quality typing practice passage for category "${category}"${category === 'Medical' ? ` (Subcategory: ${medicalSubcategory})` : ''}, difficulty "${difficulty}"${category === 'Programming' ? ` in ${language}` : ''}. Target word count is approximately ${targetWords} words (calibrated for a ${durSec}-second test). Provide only clean, continuous prose text without markdown formatting, lists, or quotation wrappers.`;
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.85,
            maxOutputTokens: 8192,
            thinkingConfig: {
              thinkingBudget: 0
            }
          }
        })
      });

      if (res.ok) {
        const json = await res.json();
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (text) {
          return {
            success: true,
            text,
            category,
            difficulty,
            language: category === 'Programming' ? language : undefined,
            medicalSubcategory: category === 'Medical' ? medicalSubcategory : undefined,
            source: 'gemini_direct_client',
            modelUsed: model
          };
        }
      }
    } catch (err) {
      console.error('Direct Gemini generation failed:', err);
    }
  }

  return {
    success: false,
    error: 'Failed to generate content with Gemini.'
  };
};

export default {
  getActiveGeminiApiKey,
  getActiveGeminiModel,
  generateDynamicContent
};
