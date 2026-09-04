import { resolveBackendModel } from '../config/models';
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
  // Support OpenRouter as primary provider, plus custom fallbacks
  const apiKey = (
    process.env.OPENROUTER_API_KEY ||
    process.env.API_KEY ||
    process.env.AI_API_KEY ||
    process.env.DEEPSEEK_API_KEY ||
    process.env.OPENAI_API_KEY ||
    ''
  ).trim();

  // Support any custom API Base URL
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
  const hasImages = payload.messages.some(
    (m) => m.attachments && m.attachments.some((a) => a.dataUrl && a.dataUrl.startsWith('data:image/'))
  );

  // Model resolution: use environment variable override or map profile
  let backendModel = isOpenRouter
    ? (process.env.OPENROUTER_MODEL || OPENROUTER_MODEL_MAP[requestedProfile] || 'anthropic/claude-3.5-sonnet')
    : resolveBackendModel(requestedProfile, hasImages);

  if (apiKey) {
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

        if (msg.content) {
          textContent += msg.content;
        }

        if (!textContent.trim() && msg.role === 'assistant') continue;

        formattedMessages.push({
          role: msg.role,
          content: textContent.trim() || msg.content || ' '
        });
      }
    }

    // Build correct endpoint URL
    let cleanBase = rawBaseUrl.replace(/\/+$/, '');
    let endpoint = cleanBase;
    if (!endpoint.includes('/chat/completions')) {
      endpoint = `${cleanBase}/chat/completions`;
    }

    const requestPayload: any = {
      model: backendModel,
      messages: formattedMessages,
      stream: true,
      temperature: 0.7
    };

    if (process.env.AI_MAX_TOKENS) {
      requestPayload.max_tokens = parseInt(process.env.AI_MAX_TOKENS, 10);
    }

    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    };

    if (isOpenRouter) {
      requestHeaders['HTTP-Referer'] = 'https://claude.ai';
      requestHeaders['X-Title'] = 'Claude UI';
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: requestHeaders,
        body: JSON.stringify(requestPayload)
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error(`Provider API Error (${response.status}):`, errText);

        let parsedMsg = errText;
        try {
          const json = JSON.parse(errText);
          parsedMsg = json.error?.message || json.message || errText;
        } catch {
          parsedMsg = errText;
        }

        // If deepseek-reasoner was rejected with 400, try automatic fallback to deepseek-chat
        if (backendModel === 'deepseek-reasoner' && response.status === 400) {
          console.warn('Retrying with deepseek-chat...');
          const retryResponse = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`
            },
            body: JSON.stringify({
              ...requestPayload,
              model: 'deepseek-chat'
            })
          });

          if (retryResponse.ok && retryResponse.body) {
            await streamResponse(retryResponse.body, writeChunk);
            return;
          }
        }

        if (response.status === 401) {
          throw new Error(`Authentication Failed (401): ${parsedMsg}. Please check that API_KEY in your .env file is correct.`);
        } else if (response.status === 402) {
          throw new Error(`Insufficient Balance (402): ${parsedMsg}. Please verify your API account credit/balance.`);
        } else {
          throw new Error(`API Error (${response.status}): ${parsedMsg}`);
        }
      }

      if (!response.body) {
        throw new Error('No response body received from provider');
      }

      await streamResponse(response.body, writeChunk);
    } catch (err: any) {
      console.error('Streaming request failed:', err.message);
      writeChunk('error', { error: err.message || 'API request failed' });
    }
  } else {
    // Intelligent local fallback streaming engine when API Key is not configured
    await runFallbackSimulator(payload, writeChunk, requestedProfile, hasImages);
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

async function runFallbackSimulator(
  payload: ChatRequestPayload,
  writeChunk: (event: string, data: any) => void,
  profile: string,
  hasImages: boolean
) {
  const lastMsg = payload.messages[payload.messages.length - 1];
  const query = lastMsg?.content.toLowerCase() || '';

  const reasoningSteps = [
    'Analyzing user request and context requirements...',
    'Evaluating optimal architectural structure...',
    'Synthesizing step-by-step response with clean code and insights...'
  ];

  for (const step of reasoningSteps) {
    writeChunk('thinking', { delta: step + '\n' });
    await new Promise((r) => setTimeout(r, 80));
  }

  let fullResponse = `Hello! I am your AI assistant running on the **${profile.charAt(0).toUpperCase() + profile.slice(1)}** profile.

### Core Capabilities:
- 🚀 **Full-Stack Engineering & Code Generation**: High-performance TypeScript, React, Python, and Go code with live interactive **Artifacts**.
- 📐 **Mathematics & Deep Analysis**: Formatted LaTeX equations, proofs, and algorithmic architectures.
- 🎨 **Creative Design & Strategy**: Copywriting, product launch plans, and executive briefs.
- 👁️ **Visual Multimodal Analysis**: Upload screenshots, diagrams, and photos for instant analysis.

> [!TIP]
> **API Key Setup**: Add your custom API key and Base URL in the \`.env\` file:
> \`\`\`env
> API_KEY=your_key_here
> API_BASE_URL=https://api.b.ai/v1
> API_MODEL=gpt-5.2
> \`\`\`

How can I assist you with your project today?`;

  const words = fullResponse.split(' ');
  for (let i = 0; i < words.length; i++) {
    const chunk = (i === 0 ? '' : ' ') + words[i];
    writeChunk('text', { delta: chunk });
    await new Promise((r) => setTimeout(r, 16));
  }

  writeChunk('done', {});
}
