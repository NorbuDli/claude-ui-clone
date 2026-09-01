import type { Connect } from 'vite';
import { getClientModelProfiles } from './config/models';
import { handleStreamingChat, ChatRequestPayload } from './services/chatService';
import * as dotenv from 'dotenv';

dotenv.config();

export function createApiMiddleware(): Connect.NextHandleFunction {
  return async (req, res, next) => {
    const url = req.url || '';

    // 1. GET /api/health
    if (req.method === 'GET' && url.startsWith('/api/health')) {
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 200;
      res.end(JSON.stringify({ status: 'healthy', timestamp: Date.now() }));
      return;
    }

    // 2. GET /api/models - Returns client-safe model profiles only!
    if (req.method === 'GET' && url.startsWith('/api/models')) {
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 200;
      res.end(JSON.stringify({ profiles: getClientModelProfiles() }));
      return;
    }

    // 3. POST /api/chat - Streaming SSE endpoint
    if (req.method === 'POST' && url.startsWith('/api/chat')) {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      });

      req.on('end', async () => {
        try {
          const payload: ChatRequestPayload = JSON.parse(body || '{}');

          res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
            'Access-Control-Allow-Origin': '*'
          });

          await handleStreamingChat(payload, (event, data) => {
            res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
          });

          res.end();
        } catch (err: any) {
          console.error('Server /api/chat error:', err);
          if (!res.headersSent) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message || 'Internal Server Error' }));
          } else {
            res.write(`event: error\ndata: ${JSON.stringify({ error: err.message })}\n\n`);
            res.end();
          }
        }
      });
      return;
    }

    next();
  };
}
