export type CodeModelTier = 'fable' | 'opus' | 'sonnet' | 'auto';

export interface CodeTierDefinition {
  id: CodeModelTier;
  displayName: string;
  tagline: string;
  description: string;
  capability: 'maximum' | 'high' | 'fast';
  speed: 'deliberate' | 'balanced' | 'fast';
  priority: number;
}

export const CODE_TIER_DEFINITIONS: Record<CodeModelTier, CodeTierDefinition> = {
  fable: {
    id: 'fable',
    displayName: 'Fable',
    tagline: 'Maximum reasoning and autonomy',
    description: 'Best for complex architecture, difficult debugging, large projects and long-running coding tasks.',
    capability: 'maximum',
    speed: 'deliberate',
    priority: 1
  },
  opus: {
    id: 'opus',
    displayName: 'Opus',
    tagline: 'Advanced coding and complex projects',
    description: 'Best balance for large applications, architecture, refactoring and sophisticated coding tasks.',
    capability: 'high',
    speed: 'balanced',
    priority: 2
  },
  sonnet: {
    id: 'sonnet',
    displayName: 'Sonnet',
    tagline: 'Fast and capable coding',
    description: 'Best for everyday coding, smaller features, quick fixes and rapid iteration.',
    capability: 'fast',
    speed: 'fast',
    priority: 3
  },
  auto: {
    id: 'auto',
    displayName: 'Auto',
    tagline: 'Dynamic task complexity routing',
    description: 'Automatically selects Fable, Opus, or Sonnet based on code complexity and scope.',
    capability: 'high',
    speed: 'balanced',
    priority: 0
  }
};

export interface ResolvedTierMapping {
  tierId: CodeModelTier;
  displayName: string;
  primaryModel: string;
  fallbackModels: string[];
  reason: string;
}

/**
 * Resolves a tier alias (fable, opus, sonnet, auto) to its actual backend model chain.
 * Respects environment variable overrides (FABLE_MODEL, OPUS_MODEL, SONNET_MODEL).
 */
export function resolveCodeTier(
  tierInput: string,
  userPromptText: string = ''
): ResolvedTierMapping {
  const normalized = (tierInput || 'opus').toLowerCase().trim();

  // 1. AUTO TIER: Dynamic complexity classifier
  if (normalized === 'auto') {
    const text = userPromptText.toLowerCase();

    // High complexity indicators -> Route to Fable
    const highComplexityPatterns = [
      /\b(architecture|from scratch|game engine|full stack|entire project|algorithm|physics|3d|webgl|compiler|parser)\b/,
      /\b(memory leak|hard bug|race condition|deadlock|concurrency|complex logic|deep debugging)\b/,
      /\b(autonomous|multi-file system|complete game|large application)\b/
    ];

    // Low complexity indicators -> Route to Sonnet
    const lowComplexityPatterns = [
      /\b(css|style|color|padding|margin|font|align|typo|text|label|tooltip)\b/,
      /\b(small fix|simple fix|quick fix|one liner|small tweak|rename|comment)\b/,
      /\b(what does this|explain this|simple function|add a button)\b/
    ];

    if (highComplexityPatterns.some((p) => p.test(text))) {
      const resolved = resolveCodeTier('fable', userPromptText);
      return {
        ...resolved,
        tierId: 'auto',
        displayName: 'Auto (Fable)',
        reason: 'Auto routing: High complexity task routed to Fable tier (maximum reasoning)'
      };
    }

    if (lowComplexityPatterns.some((p) => p.test(text))) {
      const resolved = resolveCodeTier('sonnet', userPromptText);
      return {
        ...resolved,
        tierId: 'auto',
        displayName: 'Auto (Sonnet)',
        reason: 'Auto routing: Low complexity task routed to Sonnet tier (rapid execution)'
      };
    }

    // Default to Opus for standard coding tasks
    const resolved = resolveCodeTier('opus', userPromptText);
    return {
      ...resolved,
      tierId: 'auto',
      displayName: 'Auto (Opus)',
      reason: 'Auto routing: Balanced feature coding routed to Opus tier'
    };
  }

  // 2. FABLE TIER: Maximum reasoning & autonomy
  if (normalized === 'fable') {
    const primary = (process.env.FABLE_MODEL || 'nvidia/nemotron-3-ultra-550b-a55b:free').trim();
    const fallbacks = [
      'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
      'inclusionai/ling-3.0-flash-fin:free',
      'poolside/laguna-xs-2.1:free'
    ].filter((id) => id !== primary);

    return {
      tierId: 'fable',
      displayName: 'Fable',
      primaryModel: primary,
      fallbackModels: fallbacks,
      reason: `Fable tier: Maximum reasoning and autonomous architecture (${primary})`
    };
  }

  // 3. OPUS TIER: Advanced coding & complex projects
  if (normalized === 'opus') {
    const primary = (process.env.OPUS_MODEL || 'inclusionai/ling-3.0-flash-fin:free').trim();
    const fallbacks = [
      'nvidia/nemotron-3-ultra-550b-a55b:free',
      'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
      'poolside/laguna-xs-2.1:free'
    ].filter((id) => id !== primary);

    return {
      tierId: 'opus',
      displayName: 'Opus',
      primaryModel: primary,
      fallbackModels: fallbacks,
      reason: `Opus tier: Advanced coding and multi-file project implementation (${primary})`
    };
  }

  // 4. SONNET TIER: Fast and capable coding
  if (normalized === 'sonnet') {
    const primary = (process.env.SONNET_MODEL || 'cohere/north-mini-code:free').trim();
    const fallbacks = [
      'poolside/laguna-xs-2.1:free',
      'inclusionai/ling-3.0-flash-fin:free',
      'nvidia/nemotron-3-ultra-550b-a55b:free'
    ].filter((id) => id !== primary);

    return {
      tierId: 'sonnet',
      displayName: 'Sonnet',
      primaryModel: primary,
      fallbackModels: fallbacks,
      reason: `Sonnet tier: Fast, capable coding and rapid iteration (${primary})`
    };
  }

  // 5. Fallback: If caller passed a raw model ID, treat as manual override
  return {
    tierId: 'opus',
    displayName: 'Custom Override',
    primaryModel: tierInput,
    fallbackModels: [
      'inclusionai/ling-3.0-flash-fin:free',
      'nvidia/nemotron-3-ultra-550b-a55b:free'
    ].filter((id) => id !== tierInput),
    reason: `Direct provider model override: ${tierInput}`
  };
}
