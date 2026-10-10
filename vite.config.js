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
    // Only handle exact API endpoint
    const url = req.url?.split('?')[0];
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
      // Prevent payload flooding
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
          excludeText = ''
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
          excludeText
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
