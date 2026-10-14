import fs from 'node:fs';
import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import {
  ALLOWED_CATEGORIES,
  ALLOWED_DIFFICULTIES,
  ALLOWED_LANGUAGES,
  checkRateLimit,
  generateTextWithGemini,
  chatWithGemini,
  getActiveGeminiConfig,
  getInternalGeminiConfig,
  updateActiveGeminiConfig
} from './server/geminiService.js';

// Custom server middleware plugin for Google Gemini text generation and AI chat
function geminiApiPlugin() {
  const handler = async (req, res) => {
    const url = req.url?.split('?')[0];

    // Status endpoint (Safe: returns mask, never raw key)
    if (url === '/api/typing/gemini-status' || url === '/api/gemini/status') {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: true, ...getActiveGeminiConfig() }));
      return true;
    }

    // Admin endpoint: Update Gemini API Configuration securely
    if (url === '/api/admin/gemini-config') {
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
          const apiKey = (body.apiKey || '').trim();
          const model = (body.model || 'gemini-3.5-flash').trim();

          // Update runtime configuration immediately
          updateActiveGeminiConfig({ apiKey, model });

          // Persist to .env file on server
          try {
            const envPath = path.resolve(process.cwd(), '.env');
            if (fs.existsSync(envPath)) {
              let envContent = fs.readFileSync(envPath, 'utf8');
              if (envContent.includes('GEMINI_API_KEY=')) {
                envContent = envContent.replace(/GEMINI_API_KEY=.*/, `GEMINI_API_KEY=${apiKey}`);
              } else {
                envContent += `\nGEMINI_API_KEY=${apiKey}`;
              }
              if (envContent.includes('GEMINI_MODEL=')) {
                envContent = envContent.replace(/GEMINI_MODEL=.*/, `GEMINI_MODEL=${model}`);
              } else {
                envContent += `\nGEMINI_MODEL=${model}`;
              }
              fs.writeFileSync(envPath, envContent, 'utf8');
            }
          } catch (envErr) {
            console.warn('[GeminiApiPlugin] Note writing .env:', envErr.message);
          }

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            success: true,
            message: 'Gemini configuration successfully saved and activated.',
            ...getActiveGeminiConfig()
          }));
        } catch (err) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: false, message: err.message || 'Failed to update configuration.' }));
        }
      });
      return true;
    }

    // Handle test connection endpoint
    if (url === '/api/typing/test-gemini' || url === '/api/gemini/test') {
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
          const { apiKey: internalKey, model: internalModel } = getInternalGeminiConfig();
          const apiKey = (body.apiKey || '').trim() || internalKey || '';
          const model = (body.model || internalModel || 'gemini-3.5-flash').trim();

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
            signal: AbortSignal.timeout(12000)
          });

          if (response.ok) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              success: true,
              message: `Connection Successful! API key is valid and connected to ${model}.`,
              model
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

    // Handle Real-Time AI Chatbot Messages
    if (url === '/api/chat' || url === '/api/typing/chat') {
      if (req.method !== 'POST') {
        res.statusCode = 405;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: false, message: 'Method Not Allowed' }));
        return true;
      }

      let rawBody = '';
      req.on('data', (chunk) => {
        rawBody += chunk;
        if (rawBody.length > 100000) {
          req.destroy();
        }
      });

      req.on('end', async () => {
        try {
          const body = rawBody ? JSON.parse(rawBody) : {};
          const { messages = [], userRole = 'user', portal = 'user', userProfile = null } = body;
          const clientIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'localhost';

          const result = await chatWithGemini({
            messages,
            userRole,
            portal,
            userProfile,
            clientIp
          });

          res.statusCode = result.success ? 200 : 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(result));
        } catch (err) {
          console.error('[GeminiApiPlugin] Chat processing error:', err.message);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            success: false,
            error: 'Unable to process chat request at this time.'
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
          model: model || getActiveGeminiConfig().model || 'gemini-3.5-flash'
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
