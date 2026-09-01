export type ModelProfileId =
  | 'fable-5'
  | 'opus-5'
  | 'sonnet-5'
  | 'haiku-4.5'
  | 'opus-4.8'
  | 'opus-4.7'
  | 'opus-4.6'
  | 'opus-3'
  | 'sonnet-4.5';

export type ThinkingEffort = 'low' | 'medium' | 'high' | 'extra' | 'max';

export interface ModelOption {
  id: ModelProfileId;
  name: string;
  shortName: string;
  description: string;
  isPro?: boolean;
  isFable?: boolean;
  requiresUpgrade?: boolean;
  supportsThinking?: boolean;
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl?: string;
  textContent?: string;
}

export type ArtifactType =
  | 'application/vnd.ant.react'
  | 'text/html'
  | 'image/svg+xml'
  | 'application/vnd.ant.markdown'
  | 'application/vnd.ant.code'
  | 'text/markdown';

export interface Artifact {
  id: string;
  identifier: string;
  type: ArtifactType;
  title: string;
  language?: string;
  content: string;
  version?: number;
  messageId?: string;
  createdAt: number;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  lastUpdated: string;
  author: string;
  isEnabled: boolean;
  instructions?: string;
}

export interface Connector {
  id: string;
  name: string;
  description: string;
  icon: string;
  isConnected: boolean;
  lastSynced?: string;
}

export interface MemoryItem {
  id: string;
  content: string;
  createdAt: number;
  category?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  thinkingContent?: string;
  isThinking?: boolean;
  thinkingStatus?: string;
  thinkingDurationSeconds?: number;
  attachments?: Attachment[];
  artifacts?: Artifact[];
  createdAt: number;
  isStreaming?: boolean;
  error?: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  model: ModelProfileId;
  projectId?: string;
  isStarred?: boolean;
  isArtifactPicker?: boolean;
  artifactCategory?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  customInstructions?: string;
  files?: Attachment[];
  createdAt: number;
  updatedAt: number;
  color?: string;
}

export interface UserSettings {
  // Profile
  fullName: string;
  userName: string;
  userEmail: string;
  userRole: string;
  avatarUrl?: string;
  customInstructions: string;

  // Preferences
  defaultModel: ModelProfileId;
  thinkingBudget: number;
  thinkingEffort: ThinkingEffort;
  thinkingEnabled?: boolean;
  theme: 'dark' | 'light' | 'system';
  chatFont: 'serif' | 'sans' | 'system';
  motion: 'system' | 'reduced';
  language: string;
  style: 'balanced' | 'professional' | 'friendly' | 'concise' | 'detailed' | 'creative';
  speed: 'fast' | 'normal' | 'deliberate';
  soundEffects: boolean;
  codeWrap: boolean;
  autoScroll: boolean;

  // Voice
  voiceInputEnabled: boolean;
  voiceOutputEnabled: boolean;
  voiceSelection: string;
  voiceSpeed: number;

  // Notifications
  notifications: {
    responseCompletions: boolean;
    mentions: boolean;
    projects: boolean;
    system: boolean;
  };

  // Privacy
  privacy: {
    locationMetadata: boolean;
    improveAiModels: boolean;
  };

  // Capabilities
  capabilities: {
    toolAccessMode: 'needed' | 'always' | 'disabled';
    connectorSearch: boolean;
    switchModelsFlagged: boolean;
    artifacts: boolean;
    aiArtifacts: boolean;
    inlineVisualizations: boolean;
    codeExecution: boolean;
    fileCreation: boolean;
    fileAnalysis: boolean;
  };

  // Time and Focus
  timeAndFocus: {
    breakReminders: boolean;
    breakInterval: string;
    snoozeDuration: string;
    quietHoursEnabled: boolean;
    quietHoursDays: number[];
    quietHoursStart: string;
    quietHoursEnd: string;
  };

  // Code / Developer
  codeSettings: {
    classifySessionStates: boolean;
    switchModelsFlagged: boolean;
    codeTheme: 'dark' | 'light' | 'monokai' | 'nord';
    codeFont: string;
    interfaceFont: 'application' | 'system';
    transcriptTextSize: 'small' | 'medium' | 'large';
    transcriptWidth: 'narrow' | 'medium' | 'wide';
    branchPrefix: string;
    createPullRequestsAuto: boolean;
    autofixPullRequests: boolean;
  };

  // Memory & Connectors
  memory: {
    enabled: boolean;
    items: MemoryItem[];
  };
  connectors: Connector[];
  skills: Skill[];
}

export type ActivePageView = 'chat' | 'projects' | 'artifacts' | 'code' | 'upgrade' | 'customize';

export interface ProjectFile {
  id: string;
  name: string;
  type: string;
  size: number;
  content?: string;
  dataUrl?: string;
  uploadedAt: number;
}

export interface Plugin {
  id: string;
  name: string;
  description: string;
  category: string;
  source: string;
  isEnabled: boolean;
  lastUpdated: string;
  icon?: string;
}

export type UserPlanTier = 'free' | 'pro' | 'max' | 'team' | 'enterprise';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  plan: UserPlanTier;
  role?: 'admin' | 'member';
  createdAt?: number;
  expiresAt?: number | null;
  durationLabel?: string;
  provider?: 'google' | 'email' | 'guest';
}

export interface AuthorizedAccount {
  id: string;
  name: string;
  email: string;
  password: string;
  plan: UserPlanTier;
  role: 'admin' | 'member';
  createdAt: number;
  expiresAt?: number | null;
  durationLabel?: string;
}


