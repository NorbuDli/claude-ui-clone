export type CodeModelTier = 'fable' | 'opus' | 'sonnet' | 'auto';

export interface CodeModelTierInfo {
  id: CodeModelTier;
  displayName: string;
  tagline: string;
  description: string;
  badge?: string;
  backendDefault?: string;
}

export const CODE_MODEL_TIERS: CodeModelTierInfo[] = [
  {
    id: 'fable',
    displayName: 'Fable',
    tagline: 'Maximum reasoning and autonomy',
    description: 'Best for complex architecture, difficult debugging, large projects and long-running coding tasks.',
    backendDefault: 'NVIDIA Nemotron 3 Ultra 550B (1M context)'
  },
  {
    id: 'opus',
    displayName: 'Opus',
    tagline: 'Advanced coding and complex projects',
    description: 'Best balance for large applications, architecture, refactoring and sophisticated coding tasks.',
    backendDefault: 'Ling 3.0 Flash Fin (262k context)'
  },
  {
    id: 'sonnet',
    displayName: 'Sonnet',
    tagline: 'Fast and capable coding',
    description: 'Best for everyday coding, smaller features, quick fixes and rapid iteration.',
    backendDefault: 'Cohere North Mini Code'
  },
  {
    id: 'auto',
    displayName: 'Auto',
    tagline: 'Dynamic task complexity routing',
    description: 'Automatically selects Fable, Opus, or Sonnet based on code complexity and scope.',
    badge: 'Smart'
  }
];
