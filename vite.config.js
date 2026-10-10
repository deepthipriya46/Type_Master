import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import {
  ALLOWED_CATEGORIES,
  ALLOWED_DIFFICULTIES,
  ALLOWED_LANGUAGES,
  checkRateLimit,
  generateTextWithGemini
} from './server/geminiService.js';

// Custom server middleware plugin for Google Gemini text generation
function geminiApiPlugin() {
  const handler = async (req, res) => {
    const url = req.url?.split('?')[0];

    // Handle test connection endpoint
    if (url === '/api/typing/test-gemini') {
      if (req.method !== 'POST') {
        res.statusCode = 405;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: false, message: 'Method Not Allowed' }));
        return true;
      }

      let rawBody = '';
      req.on('data', (chunk) => { rawBody += chunk; });
      req.on('end', async () => {
        try {
          const body = rawBody ? JSON.parse(rawBody) : {};
          const apiKey = (body.apiKey || '').trim() || process.env.GEMINI_API_KEY || '';
          const model = body.model || 'gemini-2.5-flash';

          if (!apiKey) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, message: 'API key is required.' }));
            return;
          }

          const testUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
          const response = await fetch(testUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: 'Respond with "OK".' }] }],
              generationConfig: { maxOutputTokens: 5 }
            }),
            signal: AbortSignal.timeout(6000)
          });

          if (response.ok) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              success: true,
              message: `Connection Successful! API key is valid and connected to ${model}.`
            }));
          } else {
            const err = await response.json().catch(() => ({}));
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              success: false,
              message: err.error?.message || `HTTP ${response.status}: Failed to connect to Gemini API.`
            }));
          }
        } catch (err) {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            success: false,
            message: err.message || 'Connection test timed out.'
          }));
        }
      });
      return true;
    }

    // Only handle exact API endpoint
    if (url !== '/api/typing/generate-text') {
      return false;
    }

    if (req.method !== 'POST') {
      res.statusCode = 405;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: false, error: 'Method Not Allowed' }));
      return true;
    }

    // Rate limiting per client IP
    const clientIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'localhost';
    if (!checkRateLimit(clientIp)) {
      res.statusCode = 429;
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          success: false,
          error: 'Generation rate limit reached. Please wait a moment before requesting another passage.'
        })
      );
      return true;
    }

    let rawBody = '';
    req.on('data', (chunk) => {
      rawBody += chunk;
      if (rawBody.length > 50000) {
        req.destroy();
      }
    });

    req.on('end', async () => {
      try {
        const body = rawBody ? JSON.parse(rawBody) : {};
        const {
          category = 'Random Text',
          difficulty = 'Medium',
          language = 'C',
          durationSeconds = 60,
          excludeText = '',
          apiKey = '',
          model = ''
        } = body;

        // Validation
        if (!ALLOWED_CATEGORIES.includes(category)) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: false, error: 'Invalid text category requested.' }));
          return;
        }

        if (!ALLOWED_DIFFICULTIES.includes(difficulty)) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: false, error: 'Invalid difficulty requested.' }));
          return;
        }

        const cleanLang = ALLOWED_LANGUAGES.includes(language) ? language : 'C';

        const result = await generateTextWithGemini({
          category,
          difficulty,
          language: cleanLang,
          durationSeconds: Number(durationSeconds) || 60,
          excludeText,
          apiKey: (apiKey || '').trim() || req.headers['x-gemini-api-key'] || '',
          model: model || 'gemini-2.5-flash'
        });

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(result));
      } catch (err) {
        console.error('[GeminiApiPlugin] Endpoint processing error:', err.message);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(
          JSON.stringify({
            success: false,
            error: 'Unable to generate a new passage. Please try again.'
          })
        );
      }
    });

    return true;
  };

  return {
    name: 'gemini-api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const handled = await handler(req, res);
        if (!handled) next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const handled = await handler(req, res);
        if (!handled) next();
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Ensure server-side env variables are loaded in Node environment
  const env = loadEnv(mode, process.cwd(), '');
  if (env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY) {
    process.env.GEMINI_API_KEY = env.GEMINI_API_KEY;
  }
  if (env.GEMINI_MODEL && !process.env.GEMINI_MODEL) {
    process.env.GEMINI_MODEL = env.GEMINI_MODEL;
  }

  return {
    plugins: [react(), geminiApiPlugin()]
  };
});
