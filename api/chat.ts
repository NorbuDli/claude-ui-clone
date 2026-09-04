export const config = {
  runtime: 'edge',
};

interface IncomingMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments?: Array<{
    id: string;
    name: string;
    type: string;
    dataUrl?: string;
    textContent?: string;
  }>;
}

interface ChatRequestPayload {
  profile?: string;
  messages: IncomingMessage[];
  systemPrompt?: string;
}

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

    // AI Provider configuration (Supports Groq 100% Free 120B or OpenRouter; secret kept server-side only)
    const apiKey = (process.env.OPENROUTER_API_KEY || process.env.GROQ_API_KEY || process.env.API_KEY || '').trim();
    const isGroq = apiKey.startsWith('gsk_');
    const rawBaseUrl = (
      process.env.OPENROUTER_BASE_URL ||
      process.env.GROQ_BASE_URL ||
      process.env.API_BASE_URL ||
      (isGroq ? 'https://api.groq.com/openai/v1' : 'https://openrouter.ai/api/v1')
    ).trim();
    const backendModel = (
      process.env.OPENROUTER_MODEL ||
      process.env.GROQ_MODEL ||
      process.env.API_MODEL ||
      (isGroq ? 'openai/gpt-oss-120b' : 'deepseek/deepseek-v4-flash:free')
    ).trim();

    // Start background processing
    (async () => {
      try {
        if (!apiKey) {
          await writeChunk('error', {
            error: 'AI API key is not configured. Please set OPENROUTER_API_KEY or GROQ_API_KEY in your server environment variables.'
          });
          await writer.close();
          return;
        }

        const artifactSystemInstructions = `You are Claude, a helpful, harmless, and honest assistant created by Anthropic.
When generating complete interactive applications, games, HTML pages, React components, SVGs, or substantial standalone code files (>15 lines of code), ALWAYS wrap them in an artifact block:
<antArtifact identifier="unique-id" type="application/vnd.ant.react" title="Application Title">
[complete code here]
</antArtifact>

Supported types:
- application/vnd.ant.react (for interactive React components using Tailwind CSS and Lucide icons)
- text/html (for complete single-file HTML/CSS/JS games and applications)
- image/svg+xml (for SVG graphics)
- application/vnd.ant.code (for Python, TypeScript, algorithms, or standalone scripts)

Provide a brief, helpful explanation in your chat text, and put the full implementation inside the <antArtifact> tag. Never output the raw code outside of the artifact.`;

        const combinedSystemPrompt = payload.systemPrompt
          ? `${artifactSystemInstructions}\n\n${payload.systemPrompt}`
          : artifactSystemInstructions;

        const formattedMessages: any[] = [{ role: 'system', content: combinedSystemPrompt }];

        for (const msg of payload.messages || []) {
          if (msg.role === 'assistant' && !msg.content) continue;

          const hasMsgImages = msg.attachments && msg.attachments.some((a) => a.dataUrl && a.dataUrl.startsWith('data:image/'));

          if (hasMsgImages) {
            const contentParts: any[] = [];

            for (const att of msg.attachments || []) {
              if (att.dataUrl && att.dataUrl.startsWith('data:image/')) {
                contentParts.push({
                  type: 'image_url',
                  image_url: { url: att.dataUrl }
                });
              } else if (att.textContent) {
                contentParts.push({
                  type: 'text',
                  text: `[Attached File: ${att.name}]\n\`\`\`\n${att.textContent}\n\`\`\``
                });
              }
            }

            if (msg.content) {
              contentParts.push({
                type: 'text',
                text: msg.content
              });
            }

            formattedMessages.push({
              role: msg.role,
              content: contentParts
            });
          } else {
            let textContent = '';
            if (msg.attachments && msg.attachments.length > 0) {
              for (const att of msg.attachments) {
                if (att.textContent) {
                  textContent += `[Attached File: ${att.name}]\n\`\`\`\n${att.textContent}\n\`\`\`\n\n`;
                }
              }
            }

            if (msg.content) textContent += msg.content;
            if (!textContent.trim() && msg.role === 'assistant') continue;

            formattedMessages.push({
              role: msg.role,
              content: textContent.trim() || msg.content || ' '
            });
          }
        }

        let cleanBase = rawBaseUrl.replace(/\/+$/, '');
        let endpoint = cleanBase.includes('/chat/completions') ? cleanBase : `${cleanBase}/chat/completions`;

        const fetchHeaders: Record<string, string> = {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://claude.ai',
          'X-Title': 'Claude UI'
        };

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: fetchHeaders,
          body: JSON.stringify({
            model: backendModel,
            messages: formattedMessages,
            stream: true,
            temperature: 0.7
          })
        });

        if (!response.ok) {
          const errText = await response.text();
          let parsedMsg = errText;
          try {
            const json = JSON.parse(errText);
            parsedMsg = json.error?.message || json.message || errText;
          } catch {}

          let userFriendlyMsg = parsedMsg;
          if (response.status === 401) {
            userFriendlyMsg = 'Invalid OpenRouter API key. Please check your server environment variables.';
          } else if (response.status === 402 || parsedMsg.toLowerCase().includes('insufficient balance') || parsedMsg.toLowerCase().includes('balance=0')) {
            userFriendlyMsg = 'OpenRouter account balance is $0 (insufficient credits). To use models like DeepSeek, please add credits at https://openrouter.ai/credits, or set OPENROUTER_MODEL to an active free model (e.g. minimax/minimax-m3:free).';
          } else if (response.status === 429) {
            userFriendlyMsg = 'OpenRouter rate limit reached. Please try again shortly.';
          } else if (response.status === 404) {
            userFriendlyMsg = (parsedMsg && (parsedMsg.includes('unavailable') || parsedMsg.includes('slug') || parsedMsg.includes('model')))
              ? parsedMsg
              : 'The configured model could not be found.';
          } else if (response.status === 503 || response.status === 502) {
            userFriendlyMsg = 'The selected AI model is currently unavailable.';
          } else {
            userFriendlyMsg = `OpenRouter request failed (${response.status}): ${parsedMsg}`;
          }

          await writeChunk('error', { error: userFriendlyMsg });
          await writer.close();
          return;
        }

        if (response.body) {
          const reader = response.body.getReader();
          const decoder = new TextDecoder('utf-8');
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || !trimmed.startsWith('data:')) continue;
              const dataStr = trimmed.replace(/^data:\s*/, '');
              if (dataStr === '[DONE]') continue;

              try {
                const parsed = JSON.parse(dataStr);
                const choice = parsed.choices?.[0];
                const reasoningChunk = choice?.delta?.reasoning_content || choice?.delta?.reasoning || parsed?.reasoning;
                const textChunk = choice?.delta?.content || choice?.delta?.text || choice?.text || parsed?.response;

                if (reasoningChunk) {
                  await writeChunk('thinking', { delta: reasoningChunk });
                }
                if (textChunk) {
                  await writeChunk('text', { delta: textChunk });
                }
              } catch {}
            }
          }
          await writeChunk('done', {});
        }
      } catch (err: any) {
        console.error('OpenRouter streaming error:', err);
        await writeChunk('error', { error: err.message || 'Stream processing failed' });
      } finally {
        await writer.close();
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
