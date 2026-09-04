import { RouterEngine } from '../server/services/aiRouter';
import type { ChatRequestPayload } from '../server/services/aiRouter';

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const payload: ChatRequestPayload = await req.json();

    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    const writeChunk = async (event: string, data: any) => {
      try {
        const text = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        await writer.write(encoder.encode(text));
      } catch (e) {}
    };

    // Execute Multi-Model Router in background stream
    (async () => {
      try {
        await RouterEngine.execute(payload, writeChunk);
      } catch (err: any) {
        console.error('[Edge API] Router execution error:', err);
        await writeChunk('error', { error: err.message || 'Stream execution failed' });
      } finally {
        try {
          await writer.close();
        } catch (e) {}
      }
    })();

    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Bad Request' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
