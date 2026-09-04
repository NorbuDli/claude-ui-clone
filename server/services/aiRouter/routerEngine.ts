import { ChatRequestPayload, RouterDecision } from './types';
import { modelCatalog } from './modelCatalog';
import { TaskClassifier } from './taskClassifier';
import { ModelRanker } from './modelRanker';
import { cooldownManager } from './cooldownManager';

export class RouterEngine {
  /**
   * Main entrypoint for processing chat requests with automatic multi-model routing and fallbacks.
   */
  public static async execute(
    payload: ChatRequestPayload,
    writeChunk: (event: string, data: any) => void
  ): Promise<void> {
    const apiKey = (process.env.OPENROUTER_API_KEY || process.env.API_KEY || '').trim();
    const rawBaseUrl = (process.env.OPENROUTER_BASE_URL || process.env.API_BASE_URL || 'https://openrouter.ai/api/v1').trim();
    const routingMode = (process.env.AI_ROUTING_MODE || 'auto').toLowerCase().trim();
    const envModel = (process.env.OPENROUTER_MODEL || process.env.API_MODEL || '').trim();

    if (!apiKey) {
      await writeChunk('error', {
        error: 'OpenRouter API key is not configured. Please set OPENROUTER_API_KEY in your environment variables.'
      });
      return;
    }

    // 1. Task Classification
    const task = TaskClassifier.classify(payload.messages || [], payload.systemPrompt);

    // 2. Fetch Live Free Models Catalog
    const freeModels = await modelCatalog.getFreeModels(apiKey, rawBaseUrl);

    // 3. Model Decision
    let primaryModel = '';
    let fallbackModels: string[] = [];
    let reason = '';
    let isOverride = false;

    // Manual override if AI_ROUTING_MODE=manual or modelOverride specified (and not 'auto')
    const manualChoice = payload.modelOverride || (routingMode === 'manual' ? envModel : '');
    if (manualChoice && manualChoice !== 'auto' && !manualChoice.includes('Auto')) {
      primaryModel = manualChoice;
      fallbackModels = freeModels.map((m) => m.id).filter((id) => id !== primaryModel).slice(0, 3);
      reason = `Using manual model override: ${manualChoice}`;
      isOverride = true;
    } else {
      const ranked = ModelRanker.rank(task, freeModels);
      primaryModel = ranked.primaryModel;
      fallbackModels = ranked.fallbackModels;
      reason = ranked.reason;
    }

    const decision: RouterDecision = {
      task,
      primaryModel,
      fallbackModels,
      reason,
      isOverride
    };

    // Log Server Diagnostics (Dev & Diagnostic output)
    console.log(`\n================== [AI ROUTER DIAGNOSTICS] ==================
Task Detected   : ${decision.task}
Primary Model   : ${decision.primaryModel || 'None'}
Fallbacks       : ${decision.fallbackModels.join(', ') || 'None'}
Selection Reason: ${decision.reason}
Mode            : ${isOverride ? 'MANUAL_OVERRIDE' : 'AUTO_ROUTING'}
==============================================================\n`);

    // Handle capabilities with no free model available (e.g. image gen)
    if (!primaryModel) {
      await writeChunk('text', {
        delta: `I apologize, but ${reason}\n\nAll standard chat, deep reasoning, and full-stack coding capabilities remain completely free and operational.`
      });
      await writeChunk('done', {});
      return;
    }

    // 4. Format Messages for OpenRouter API
    const formattedMessages = this.buildFormattedMessages(payload);

    // Build API endpoint
    let cleanBase = rawBaseUrl.replace(/\/+$/, '');
    let endpoint = cleanBase.includes('/chat/completions') ? cleanBase : `${cleanBase}/chat/completions`;

    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://claude.ai',
      'X-Title': 'Claude UI'
    };

    // 5. Fallback Execution Loop
    const candidateChain = [primaryModel, ...fallbackModels];
    let lastError: string = '';
    let success = false;

    for (let i = 0; i < candidateChain.length; i++) {
      const candidate = candidateChain[i];
      if (!candidate) continue;

      try {
        console.log(`[AI Router] Attempting execution with model: ${candidate} (attempt ${i + 1}/${candidateChain.length})`);

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: requestHeaders,
          body: JSON.stringify({
            model: candidate,
            messages: formattedMessages,
            stream: true,
            temperature: 0.7
          })
        });

        if (!response.ok) {
          const errText = await response.text();
          console.error(`[AI Router] Model ${candidate} failed (${response.status}):`, errText);

          let parsedMsg = errText;
          try {
            const json = JSON.parse(errText);
            parsedMsg = json.error?.message || json.message || errText;
          } catch {}

          lastError = parsedMsg;

          // If rate limited or unavailable, put in cooldown and try next fallback model
          if (response.status === 429 || response.status === 503 || response.status === 502) {
            cooldownManager.recordFailure(candidate, `HTTP_${response.status}`, 60);
            if (i < candidateChain.length - 1) {
              console.warn(`[AI Router] Rate limit / unavailable for ${candidate}. Falling back to ${candidateChain[i + 1]}...`);
              continue;
            }
          }

          // If 404 (model decommissioned on OpenRouter), try next fallback
          if (response.status === 404) {
            cooldownManager.recordFailure(candidate, 'HTTP_404_NOT_FOUND', 3600);
            if (i < candidateChain.length - 1) {
              console.warn(`[AI Router] Model ${candidate} not found (404). Falling back to ${candidateChain[i + 1]}...`);
              continue;
            }
          }

          // If authentication or credit issues, abort immediately with clear guidance
          if (response.status === 401) {
            await writeChunk('error', {
              error: 'Invalid OpenRouter API key. Please verify OPENROUTER_API_KEY in your environment variables.'
            });
            return;
          }

          if (response.status === 402 || parsedMsg.toLowerCase().includes('insufficient balance') || parsedMsg.toLowerCase().includes('balance=0')) {
            await writeChunk('error', {
              error: 'OpenRouter account balance is $0. Please ensure you are routing to a free model (:free) or add credits at openrouter.ai/credits.'
            });
            return;
          }

          // Other errors, try next model if available
          if (i < candidateChain.length - 1) {
            continue;
          }

          await writeChunk('error', {
            error: `OpenRouter request failed (${response.status}): ${parsedMsg}`
          });
          return;
        }

        if (!response.body) {
          throw new Error('No response body received from provider');
        }

        // Stream the successful response
        await this.streamSSE(response.body as any, writeChunk);
        success = true;
        break;
      } catch (err: any) {
        console.error(`[AI Router] Exception executing model ${candidate}:`, err.message);
        lastError = err.message;
        cooldownManager.recordFailure(candidate, 'EXCEPTION', 60);

        if (i < candidateChain.length - 1) {
          console.warn(`[AI Router] Exception encountered. Trying next fallback candidate...`);
          continue;
        }
      }
    }

    if (!success) {
      await writeChunk('error', {
        error: `All suitable free models were temporarily unavailable. (Last error: ${lastError || 'Network timeout'}). Please try again shortly.`
      });
    }
  }

  /**
   * Builds the formatted message array with Claude Artifact instructions and multimodal attachments.
   */
  private static buildFormattedMessages(payload: ChatRequestPayload): any[] {
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

    return formattedMessages;
  }

  /**
   * Consumes SSE stream from OpenRouter and dispatches thinking & text chunks.
   */
  private static async streamSSE(
    bodyStream: ReadableStream<Uint8Array>,
    writeChunk: (event: string, data: any) => void
  ): Promise<void> {
    const reader = bodyStream.getReader();
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
            parsed?.response;

          if (reasoningChunk) {
            await writeChunk('thinking', { delta: reasoningChunk });
          }
          if (textChunk) {
            await writeChunk('text', { delta: textChunk });
          }
        } catch (err) {}
      }
    }

    await writeChunk('done', {});
  }
}
