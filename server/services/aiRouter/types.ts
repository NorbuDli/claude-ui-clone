export type TaskType =
  | 'GENERAL_CHAT'
  | 'CODING'
  | 'REASONING'
  | 'VISION'
  | 'IMAGE_GENERATION'
  | 'SPEECH_TO_TEXT'
  | 'TEXT_TO_SPEECH'
  | 'WRITING'
  | 'SUMMARIZATION';

export interface FreeModelInfo {
  id: string;
  name: string;
  description: string;
  contextLength: number;
  inputModalities: string[];
  outputModalities: string[];
  supportedParameters: string[];
  isVisionCapable: boolean;
  isReasoningCapable: boolean;
  isToolCapable: boolean;
}

export interface RouterDecision {
  task: TaskType;
  primaryModel: string;
  fallbackModels: string[];
  reason: string;
  isOverride: boolean;
}

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
  modelOverride?: string;
}
