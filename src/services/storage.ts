import { Conversation, UserSettings, Skill, Artifact, Connector, MemoryItem, Project } from '../types';

export const STORAGE_KEYS = {
  CONVERSATIONS: 'claude_conversations_v3',
  SETTINGS: 'claude_settings_v3',
  ARTIFACTS: 'claude_artifacts_v3',
  PROJECTS: 'claude_projects_v3'
};

export const DEFAULT_SKILLS: Skill[] = [
  {
    id: 'skill-1',
    name: 'algorithmic-art',
    description: 'Generates algorithmic, geometric, mathematical, and generative 2D/3D visual art using SVG and Canvas.',
    lastUpdated: '8/26/26',
    author: 'Claude Core',
    isEnabled: true,
    instructions: 'When requested for creative or algorithmic drawings, use pure SVG or high performance HTML5 Canvas math.'
  },
  {
    id: 'skill-2',
    name: 'docx-power-tools',
    description: 'Expert docx creation, conversion, structured formatting, and comprehensive document inspection.',
    lastUpdated: '8/26/26',
    author: 'Claude Core',
    isEnabled: true,
    instructions: 'Focus on clean typography, accessible document layout, and semantic styling.'
  },
  {
    id: 'skill-3',
    name: 'skill-creator',
    description: 'Builds, validates, and packages custom tool specifications and agent prompts.',
    lastUpdated: '8/26/26',
    author: 'Claude Core',
    isEnabled: true,
    instructions: 'Assist in drafting and refining custom capability definitions for the assistant.'
  }
];

export const DEFAULT_CONNECTORS: Connector[] = [
  {
    id: 'conn-github',
    name: 'GitHub',
    description: 'Repository inspection, issue tracking, and PR context search',
    icon: 'github',
    isConnected: true,
    lastSynced: 'Just now'
  },
  {
    id: 'conn-gdrive',
    name: 'Google Drive',
    description: 'Search documents, sheets, and presentations across personal workspace',
    icon: 'gdrive',
    isConnected: false
  },
  {
    id: 'conn-notion',
    name: 'Notion Workspace',
    description: 'Index documentation notes, knowledge bases, and product wikis',
    icon: 'notion',
    isConnected: true,
    lastSynced: '10m ago'
  },
  {
    id: 'conn-slack',
    name: 'Slack',
    description: 'Thread summaries and channel context retrieval',
    icon: 'slack',
    isConnected: false
  }
];

export const DEFAULT_MEMORIES: MemoryItem[] = [
  {
    id: 'mem-1',
    content: 'Prefers TypeScript with strict typing and modern functional React patterns.',
    createdAt: Date.now() - 86400000 * 5,
    category: 'Coding'
  },
  {
    id: 'mem-2',
    content: 'Prefers dark theme with compact typography and minimal padding.',
    createdAt: Date.now() - 86400000 * 2,
    category: 'UI/UX'
  }
];

export const DEFAULT_SETTINGS: UserSettings = {
  // Profile
  fullName: 'Tenzin Norbu',
  userName: 'Norbu',
  userEmail: 'tenzinrey@gmail.com',
  userRole: 'developer',
  avatarUrl: '',
  customInstructions: `You are Claude, a helpful, harmless, and honest assistant created by Anthropic.
When providing code, make it clean, modular, and production-ready with modern TypeScript/React.
When generating complete interactive components or applications, wrap them in proper artifact blocks (<antArtifact identifier="..." type="..." title="...">...</antArtifact>) so the interactive sandbox can execute them.`,

  // Preferences
  defaultModel: 'sonnet-5',
  thinkingBudget: 4000,
  thinkingEffort: 'medium',
  thinkingEnabled: true,
  theme: 'dark',
  chatFont: 'sans',
  motion: 'system',
  language: 'English',
  style: 'balanced',
  speed: 'normal',
  soundEffects: true,
  codeWrap: true,
  autoScroll: true,

  // Voice
  voiceInputEnabled: true,
  voiceOutputEnabled: false,
  voiceSelection: 'Claude Natural (Neutral)',
  voiceSpeed: 1.0,

  // Notifications
  notifications: {
    responseCompletions: true,
    mentions: true,
    projects: true,
    system: false
  },

  // Privacy
  privacy: {
    locationMetadata: false,
    improveAiModels: true
  },

  // Capabilities
  capabilities: {
    toolAccessMode: 'needed',
    connectorSearch: true,
    switchModelsFlagged: true,
    artifacts: true,
    aiArtifacts: true,
    inlineVisualizations: true,
    codeExecution: true,
    fileCreation: true,
    fileAnalysis: true
  },

  // Time and Focus
  timeAndFocus: {
    breakReminders: true,
    breakInterval: '1 hour',
    snoozeDuration: '10 minutes',
    quietHoursEnabled: false,
    quietHoursDays: [0, 6], // Sun, Sat
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00'
  },

  // Code / Developer
  codeSettings: {
    classifySessionStates: true,
    switchModelsFlagged: true,
    codeTheme: 'dark',
    codeFont: 'JetBrains Mono',
    interfaceFont: 'application',
    transcriptTextSize: 'medium',
    transcriptWidth: 'medium',
    branchPrefix: 'norbu',
    createPullRequestsAuto: false,
    autofixPullRequests: false
  },

  // Memory & Connectors
  memory: {
    enabled: true,
    items: DEFAULT_MEMORIES
  },
  connectors: DEFAULT_CONNECTORS,
  skills: DEFAULT_SKILLS
};

export const loadSettings = (): UserSettings => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS) || localStorage.getItem('aether_settings_v3');
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    if (parsed.customInstructions && parsed.customInstructions.includes('Aether')) {
      parsed.customInstructions = parsed.customInstructions.replace(/Aether/g, 'Claude');
    }
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      notifications: { ...DEFAULT_SETTINGS.notifications, ...(parsed.notifications || {}) },
      privacy: { ...DEFAULT_SETTINGS.privacy, ...(parsed.privacy || {}) },
      capabilities: { ...DEFAULT_SETTINGS.capabilities, ...(parsed.capabilities || {}) },
      timeAndFocus: { ...DEFAULT_SETTINGS.timeAndFocus, ...(parsed.timeAndFocus || {}) },
      codeSettings: { ...DEFAULT_SETTINGS.codeSettings, ...(parsed.codeSettings || {}) },
      memory: { ...DEFAULT_SETTINGS.memory, ...(parsed.memory || {}) },
      connectors: parsed.connectors || DEFAULT_CONNECTORS,
      skills: parsed.skills || DEFAULT_SKILLS
    };
  } catch (e) {
    console.error('Error reading settings from localStorage:', e);
    return DEFAULT_SETTINGS;
  }
};

export const saveSettings = (settings: UserSettings): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving settings to localStorage:', e);
  }
};

export const loadConversations = (): Conversation[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS) || localStorage.getItem('aether_conversations_v3');
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading conversations from localStorage:', e);
    return [];
  }
};

export const saveConversations = (conversations: Conversation[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversations));
  } catch (e) {
    console.error('Error saving conversations to localStorage:', e);
  }
};

export const loadAllArtifacts = (): Artifact[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ARTIFACTS) || localStorage.getItem('aether_artifacts_v3');
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading artifacts from localStorage:', e);
    return [];
  }
};

export const saveAllArtifacts = (artifacts: Artifact[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.ARTIFACTS, JSON.stringify(artifacts));
  } catch (e) {
    console.error('Error saving artifacts to localStorage:', e);
  }
};

export const loadProjects = (): Project[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROJECTS) || localStorage.getItem('aether_projects_v3');
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading projects from localStorage:', e);
    return [];
  }
};

export const saveProjects = (projects: Project[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  } catch (e) {
    console.error('Error saving projects to localStorage:', e);
  }
};
