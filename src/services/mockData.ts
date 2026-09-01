import { ModelOption } from '../types';

export const PRIMARY_MODELS: ModelOption[] = [
  {
    id: 'fable-5',
    name: 'Fable 5',
    shortName: 'Fable 5',
    description: 'For your toughest challenges',
    isPro: true,
    isFable: true,
    requiresUpgrade: true,
    supportsThinking: true
  },
  {
    id: 'opus-5',
    name: 'Opus 5',
    shortName: 'Opus 5',
    description: 'For complex tasks',
    isPro: true,
    requiresUpgrade: false, // Pro is ACTIVE
    supportsThinking: true
  },
  {
    id: 'sonnet-5',
    name: 'Sonnet 5',
    shortName: 'Sonnet 5',
    description: 'Most efficient for everyday tasks',
    supportsThinking: true
  },
  {
    id: 'haiku-4.5',
    name: 'Haiku 4.5',
    shortName: 'Haiku 4.5',
    description: 'Fastest for quick answers',
    supportsThinking: false
  }
];

export const MORE_MODELS: ModelOption[] = [
  {
    id: 'opus-4.8',
    name: 'Opus 4.8',
    shortName: 'Opus 4.8',
    description: 'Legacy high-capacity reasoning',
    isPro: true,
    requiresUpgrade: false,
    supportsThinking: true
  },
  {
    id: 'opus-4.7',
    name: 'Opus 4.7',
    shortName: 'Opus 4.7',
    description: 'Legacy analytical model',
    isPro: true,
    requiresUpgrade: false,
    supportsThinking: true
  },
  {
    id: 'opus-4.6',
    name: 'Opus 4.6',
    shortName: 'Opus 4.6',
    description: 'High context reasoning',
    isPro: true,
    requiresUpgrade: false,
    supportsThinking: true
  },
  {
    id: 'opus-3',
    name: 'Opus 3',
    shortName: 'Opus 3',
    description: 'Deep creative and writing engine',
    isPro: true,
    requiresUpgrade: false,
    supportsThinking: true
  },
  {
    id: 'sonnet-4.5',
    name: 'Sonnet 4.5',
    shortName: 'Sonnet 4.5',
    description: 'Fast versatile balance',
    supportsThinking: true
  }
];

export const ALL_MODELS = [...PRIMARY_MODELS, ...MORE_MODELS];

export const PROMPT_STARTERS = [
  {
    category: 'learn',
    title: 'Explain Quantum Computing',
    description: 'Break down qubits, superposition, and entanglement with intuitive analogies',
    prompt: 'Explain how quantum computing works, specifically qubits and superposition, using clear analogies suitable for a curious software engineer.'
  },
  {
    category: 'learn',
    title: 'Distributed Systems Consensus',
    description: 'Understand Raft vs Paxos consensus protocols with comparative visual diagrams',
    prompt: 'Can you compare Raft and Paxos consensus algorithms? Include state transition diagrams and key trade-offs.'
  },
  {
    category: 'write',
    title: 'Product Launch Email',
    description: 'Draft a compelling launch announcement for a new developer tool',
    prompt: 'Write an engaging product launch email for our new developer collaboration tool. Emphasize speed, simplicity, and zero configuration.'
  },
  {
    category: 'write',
    title: 'Technical Blog Post',
    description: 'Structure an in-depth tutorial on building event-driven microservices',
    prompt: 'Draft an outline and introduction for a high-impact technical blog post on building resilient event-driven microservices.'
  },
  {
    category: 'code',
    title: 'React Interactive Artifact',
    description: 'Build a fully interactive focus timer with clean animations and stats',
    prompt: 'Create a complete interactive Pomodoro timer component in React with sound toggles, focus statistics, and clean Tailwind styling inside an artifact.'
  },
  {
    category: 'code',
    title: 'Full-Stack Model Router',
    description: 'Design a clean TypeScript API model router with client-safe profiles',
    prompt: 'Show me an idiomatic TypeScript architecture for a backend model router that securely maps frontend profile aliases to backend endpoints.'
  },
  {
    category: 'life',
    title: 'Weekly Meal Plan & Prep',
    description: 'Generate a healthy high-protein vegetarian meal prep plan with grocery list',
    prompt: 'Create a structured 7-day high-protein vegetarian meal plan with an itemized grocery list and Sunday meal-prep guide.'
  },
  {
    category: 'choice',
    title: 'System Architecture Review',
    description: 'Analyze trade-offs between monolithic and microservice architectures',
    prompt: 'Conduct a thorough architectural assessment comparing modular monoliths vs microservices for a fast-growing startup.'
  }
];
