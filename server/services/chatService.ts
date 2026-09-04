import * as dotenv from 'dotenv';

dotenv.config();

export interface IncomingMessage {
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

export interface ChatRequestPayload {
  profile?: string;
  messages: IncomingMessage[];
  systemPrompt?: string;
}

export async function handleStreamingChat(
  payload: ChatRequestPayload,
  writeChunk: (event: string, data: any) => void
): Promise<void> {
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

  if (!apiKey) {
    writeChunk('error', {
      error: 'AI API key is not configured. Please set OPENROUTER_API_KEY or GROQ_API_KEY in your .env file.'
    });
    return;
  }

  // Format messages for API
  const formattedMessages: any[] = [];

  // Standard Claude-style Artifact system instructions
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

  formattedMessages.push({
    role: 'system',
    content: combinedSystemPrompt
  });

  for (const msg of payload.messages) {
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

  // Build correct endpoint URL
  let cleanBase = rawBaseUrl.replace(/\/+$/, '');
  let endpoint = cleanBase.includes('/chat/completions') ? cleanBase : `${cleanBase}/chat/completions`;

  const requestPayload: any = {
    model: backendModel,
    messages: formattedMessages,
    stream: true,
    temperature: 0.7
  };

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
    'HTTP-Referer': 'https://claude.ai',
    'X-Title': 'Claude UI'
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: requestHeaders,
      body: JSON.stringify(requestPayload)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`OpenRouter API Error (${response.status}):`, errText);

      let parsedMsg = errText;
      try {
        const json = JSON.parse(errText);
        parsedMsg = json.error?.message || json.message || errText;
      } catch {
        parsedMsg = errText;
      }

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

      writeChunk('error', { error: userFriendlyMsg });
      return;
    }

    if (!response.body) {
      throw new Error('No response body received from OpenRouter');
    }

    await streamResponse(response.body as any, writeChunk);
  } catch (err: any) {
    console.error('Streaming request failed:', err.message);
    writeChunk('error', { error: err.message || 'API request failed' });
  }
}

async function streamResponse(
  body: ReadableStream<Uint8Array>,
  writeChunk: (event: string, data: any) => void
) {
  const reader = body.getReader();
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

        const reasoningChunk =
          choice?.delta?.reasoning_content ||
          choice?.delta?.reasoning ||
          parsed?.reasoning;

        const textChunk =
          choice?.delta?.content ||
          choice?.delta?.text ||
          choice?.text ||
          parsed?.response ||
          (typeof parsed?.content === 'string' ? parsed.content : null);

        if (reasoningChunk) {
          writeChunk('thinking', { delta: reasoningChunk });
        }
        if (textChunk) {
          writeChunk('text', { delta: textChunk });
        }
      } catch {
        // ignore partial JSON parse errors
      }
    }
  }

  writeChunk('done', {});
}
