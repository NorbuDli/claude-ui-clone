import { Message, ModelProfileId } from '../types';

export interface StreamCallbacks {
  onTextChunk: (text: string) => void;
  onThinkingChunk?: (text: string) => void;
  onDone: () => void;
  onError: (error: Error) => void;
}

export class ChatApiClient {
  private abortController: AbortController | null = null;

  async streamChat(
    messages: Message[],
    profile: ModelProfileId,
    systemPrompt: string,
    callbacks: StreamCallbacks
  ): Promise<void> {
    this.abortController = new AbortController();

    try {
      // Map messages for backend request payload
      const formattedMessages = messages.map((m) => ({
        role: m.role,
        content: m.content,
        attachments: m.attachments?.map((a) => ({
          id: a.id,
          name: a.name,
          type: a.type,
          dataUrl: a.dataUrl,
          textContent: a.textContent
        }))
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          profile,
          messages: formattedMessages,
          systemPrompt
        }),
        signal: this.abortController.signal
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server returned ${response.status}: ${errorText || response.statusText}`);
      }

      if (!response.body) {
        throw new Error('ReadableStream not supported in this environment');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      let currentEvent = 'text';
      let hasError = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          if (trimmed.startsWith('event:')) {
            currentEvent = trimmed.replace(/^event:\s*/, '').trim();
            continue;
          }

          if (trimmed.startsWith('data:')) {
            const dataStr = trimmed.replace(/^data:\s*/, '');
            try {
              const data = JSON.parse(dataStr);
              if (currentEvent === 'thinking' && data.delta) {
                callbacks.onThinkingChunk?.(data.delta);
              } else if (currentEvent === 'text' && data.delta) {
                callbacks.onTextChunk(data.delta);
              } else if (currentEvent === 'error') {
                hasError = true;
                callbacks.onError(new Error(data.error || 'Unknown error from server'));
              } else if (currentEvent === 'done') {
                if (!hasError) callbacks.onDone();
              }
            } catch (e) {
              console.warn('Failed to parse SSE data:', dataStr);
            }
            currentEvent = 'text';
          }
        }
      }

      if (!hasError) {
        callbacks.onDone();
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        callbacks.onDone();
      } else {
        callbacks.onError(err);
      }
    } finally {
      this.abortController = null;
    }
  }

  cancel(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }
}

export const chatApiClient = new ChatApiClient();
