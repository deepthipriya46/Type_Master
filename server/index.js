// ==========================================================
// STANDALONE HTTP BACKEND SERVER
// Serves /api/typing/generate-text with full security and validation
// ==========================================================

import http from 'node:http';
import {
  ALLOWED_CATEGORIES,
  ALLOWED_DIFFICULTIES,
  ALLOWED_LANGUAGES,
  checkRateLimit,
  generateTextWithGemini
} from './geminiService.js';

const PORT = process.env.PORT || 3001;

// Load server-side environment variables if present
if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile();
  } catch {
    // Ignore if already loaded or missing
  }
}

const server = http.createServer(async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  const url = req.url?.split('?')[0];

  if (url === '/api/health') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ status: 'ok', service: 'TypingMaster Gemini Service' }));
    return;
  }

  if (url === '/api/typing/generate-text') {
    if (req.method !== 'POST') {
      res.statusCode = 405;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: false, error: 'Method Not Allowed' }));
      return;
    }

    const clientIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'localhost';
    if (!checkRateLimit(clientIp)) {
      res.statusCode = 429;
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          success: false,
          error: 'Rate limit exceeded. Please wait a moment before requesting another passage.'
        })
      );
      return;
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
          excludeText = ''
        } = body;

        // Validation against allowed white-lists
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
          apiKey: (body.apiKey || '').trim() || req.headers['x-gemini-api-key'] || '',
          model: body.model || 'gemini-2.5-flash'
        });

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(result));
      } catch (err) {
        console.error('[Server] Endpoint processing error:', err.message);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(
          JSON.stringify({
            success: false,
            error: 'Unable to generate passage. Please try again.'
          })
        );
      }
    });

    return;
  }

  res.statusCode = 404;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ error: 'Not Found' }));
});

if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`[TypingMaster Server] Running at http://localhost:${PORT}`);
  });
}

export default server;
