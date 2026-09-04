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

const MODEL_MAP: Record<string, string> = {
  'fable-5': 'deepseek-v4-flash',
  'opus-5': 'deepseek-v4-flash',
  'sonnet-5': 'deepseek-v4-flash',
  'haiku-4.5': 'deepseek-v4-flash',
  'opus-4.8': 'deepseek-v4-flash',
  'opus-4.7': 'deepseek-v4-flash',
  'opus-4.6': 'deepseek-v4-flash',
  'opus-3': 'deepseek-v4-flash',
  'sonnet-4.5': 'deepseek-v4-flash',
  'haiku-3.5': 'deepseek-v4-flash',
  'claude-3-5-sonnet': 'deepseek-v4-flash',
  'claude-3-opus': 'deepseek-v4-flash',
  'standard': 'deepseek-v4-flash'
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

    // Support OpenRouter as primary provider, plus custom fallbacks
    const apiKey = (
      process.env.OPENROUTER_API_KEY ||
      process.env.API_KEY ||
      process.env.AI_API_KEY ||
      process.env.DEEPSEEK_API_KEY ||
      process.env.OPENAI_API_KEY ||
      ''
    ).trim();

    const rawBaseUrl = (
      process.env.OPENROUTER_BASE_URL ||
      process.env.API_BASE_URL ||
      process.env.AI_BASE_URL ||
      process.env.DEEPSEEK_BASE_URL ||
      process.env.OPENAI_BASE_URL ||
      (process.env.OPENROUTER_API_KEY || apiKey.startsWith('sk-or-') ? 'https://openrouter.ai/api/v1' : 'https://api.deepseek.com/v1')
    ).trim();

    const isOpenRouter = rawBaseUrl.includes('openrouter.ai') || apiKey.startsWith('sk-or-');

    const OPENROUTER_MODEL_MAP: Record<string, string> = {
      'fable-5': 'anthropic/claude-3.5-sonnet',
      'opus-5': 'anthropic/claude-3-opus',
      'sonnet-5': 'anthropic/claude-3.5-sonnet',
      'haiku-4.5': 'anthropic/claude-3.5-haiku',
      'opus-4.8': 'anthropic/claude-3-opus',
      'opus-4.7': 'anthropic/claude-3-opus',
      'opus-4.6': 'anthropic/claude-3-opus',
      'opus-3': 'anthropic/claude-3-opus',
      'sonnet-4.5': 'anthropic/claude-3.5-sonnet',
      'haiku-3.5': 'anthropic/claude-3.5-haiku',
      'claude-3-5-sonnet': 'anthropic/claude-3.5-sonnet',
      'claude-3-opus': 'anthropic/claude-3-opus',
      'standard': 'anthropic/claude-3.5-sonnet'
    };

    const requestedProfile = payload.profile || 'standard';

    // Check if any message contains image attachments
    const hasImages = (payload.messages || []).some(
      (m) => m.attachments && m.attachments.some((a) => a.dataUrl && a.dataUrl.startsWith('data:image/'))
    );

    const backendModel = isOpenRouter
      ? (process.env.OPENROUTER_MODEL || OPENROUTER_MODEL_MAP[requestedProfile] || 'anthropic/claude-3.5-sonnet')
      : (hasImages
          ? (process.env.API_VISION_MODEL || process.env.DEEPSEEK_VISION_MODEL || process.env.API_MODEL || 'deepseek-v4-flash-vision-exp')
          : (process.env.API_MODEL || process.env.DEEPSEEK_MODEL || MODEL_MAP[requestedProfile] || 'deepseek-v4-flash'));

    // Start background processing
    (async () => {
      try {
        if (apiKey) {
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
            Authorization: `Bearer ${apiKey}`
          };

          if (isOpenRouter) {
            fetchHeaders['HTTP-Referer'] = 'https://claude.ai';
            fetchHeaders['X-Title'] = 'Claude UI';
          }

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
            throw new Error(`API Error (${response.status}): ${parsedMsg}`);
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
        } else {
          // Fallback demo response if no API key is configured yet
          const lastMsg = payload.messages?.[payload.messages.length - 1];
          const prompt = lastMsg?.content || 'Hello';
          const attachedImage = lastMsg?.attachments?.find((a) => a.dataUrl && a.dataUrl.startsWith('data:image/'));

          if (attachedImage) {
            await writeChunk('thinking', { delta: `Processing attached image: "${attachedImage.name}"...\nInspecting pixel dimensions and visual elements...\n` });

            const demoResponse = `I have received your uploaded image **"${attachedImage.name}"**!\n\nTo enable full real-time visual analysis of the image, please add your vision API credentials in **Vercel Project Settings $\\rightarrow$ Environment Variables**:\n- \`API_KEY\` = your API key\n- \`API_BASE_URL\` = your endpoint (e.g. \`https://api.b.ai/v1\`)\n- \`API_VISION_MODEL\` = \`deepseek-v4-flash-vision-exp\` (or \`gpt-4o\`)`;

            const words = demoResponse.split(' ');
            for (let i = 0; i < words.length; i++) {
              const chunk = (i === 0 ? '' : ' ') + words[i];
              await writeChunk('text', { delta: chunk });
              await new Promise((r) => setTimeout(r, 18));
            }
          } else {
            await writeChunk('thinking', { delta: `Analyzing prompt: "${prompt}"...\nSynthesizing response with Claude editorial precision...\n` });

            const demoResponse = `I received your message: **"${prompt}"**.\n\nI am Claude, running on the **${requestedProfile}** model profile.\n\nTo connect live AI models, add \`API_KEY\` in your **Vercel Project Settings $\\rightarrow$ Environment Variables**.`;

            const words = demoResponse.split(' ');
            for (let i = 0; i < words.length; i++) {
              const chunk = (i === 0 ? '' : ' ') + words[i];
              await writeChunk('text', { delta: chunk });
              await new Promise((r) => setTimeout(r, 18));
            }
          }
          await writeChunk('done', {});
        }
      } catch (err: any) {
        console.error('Edge handler streaming error:', err);
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
