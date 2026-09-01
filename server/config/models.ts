export interface ModelProfileConfig {
  id: string;
  displayName: string;
  description: string;
  backendModel: string;
  speed: string;
  reasoning: string;
  isPro?: boolean;
  isFable?: boolean;
  requiresUpgrade?: boolean;
  supportsThinking?: boolean;
}

export const MODEL_ROUTER: Record<string, ModelProfileConfig> = {
  'fable-5': {
    id: 'fable-5',
    displayName: 'Fable 5',
    description: 'For your toughest challenges',
    backendModel: 'deepseek-v4-flash',
    speed: 'Deep',
    reasoning: 'Maximum',
    isPro: true,
    isFable: true,
    requiresUpgrade: true,
    supportsThinking: true
  },
  'opus-5': {
    id: 'opus-5',
    displayName: 'Opus 5',
    description: 'For complex tasks',
    backendModel: 'deepseek-v4-flash',
    speed: 'Deep',
    reasoning: 'Advanced',
    isPro: true,
    requiresUpgrade: false,
    supportsThinking: true
  },
  'sonnet-5': {
    id: 'sonnet-5',
    displayName: 'Sonnet 5',
    description: 'Most efficient for everyday tasks',
    backendModel: 'deepseek-v4-flash',
    speed: 'Fast',
    reasoning: 'Balanced',
    supportsThinking: true
  },
  'haiku-4.5': {
    id: 'haiku-4.5',
    displayName: 'Haiku 4.5',
    description: 'Fastest for quick answers',
    backendModel: 'deepseek-v4-flash',
    speed: 'Ultra-Fast',
    reasoning: 'Light',
    supportsThinking: false
  },
  'opus-4.8': {
    id: 'opus-4.8',
    displayName: 'Opus 4.8',
    description: 'Legacy high-capacity reasoning',
    backendModel: 'deepseek-v4-flash',
    speed: 'Deep',
    reasoning: 'Advanced',
    isPro: true,
    supportsThinking: true
  },
  'opus-4.7': {
    id: 'opus-4.7',
    displayName: 'Opus 4.7',
    description: 'Legacy analytical model',
    backendModel: 'deepseek-v4-flash',
    speed: 'Moderate',
    reasoning: 'Advanced',
    isPro: true,
    supportsThinking: true
  },
  'opus-4.6': {
    id: 'opus-4.6',
    displayName: 'Opus 4.6',
    description: 'High context reasoning',
    backendModel: 'deepseek-v4-flash',
    speed: 'Moderate',
    reasoning: 'Advanced',
    isPro: true,
    supportsThinking: true
  },
  'opus-3': {
    id: 'opus-3',
    displayName: 'Opus 3',
    description: 'Deep creative and writing engine',
    backendModel: 'deepseek-v4-flash',
    speed: 'Moderate',
    reasoning: 'Standard',
    isPro: true,
    supportsThinking: true
  },
  'sonnet-4.5': {
    id: 'sonnet-4.5',
    displayName: 'Sonnet 4.5',
    description: 'Fast versatile balance',
    backendModel: 'deepseek-v4-flash',
    speed: 'Fast',
    reasoning: 'Balanced',
    supportsThinking: true
  }
};

/**
 * Resolves the appropriate backend model.
 * If image attachments exist, automatically routes to deepseek-v4-flash-vision-exp.
 * Otherwise strictly routes to deepseek-v4-flash.
 */
export function resolveBackendModel(profileId: string, hasImages: boolean = false): string {
  if (hasImages) {
    return process.env.API_VISION_MODEL || process.env.DEEPSEEK_VISION_MODEL || 'deepseek-v4-flash-vision-exp';
  }

  const envModel = process.env.API_MODEL || process.env.DEEPSEEK_MODEL || process.env.AI_MODEL || process.env.MODEL;
  if (envModel) {
    return envModel.trim();
  }

  return 'deepseek-v4-flash';
}

/**
 * Returns safe model profiles for client consumption.
 * Crucial Security Rule: NEVER expose backendModel strings or provider details to the frontend.
 */
export function getClientModelProfiles() {
  return Object.values(MODEL_ROUTER).map((m) => ({
    id: m.id,
    name: m.displayName,
    shortName: m.displayName,
    description: m.description,
    speed: m.speed,
    reasoning: m.reasoning,
    isPro: Boolean(m.isPro),
    requiresUpgrade: Boolean(m.requiresUpgrade),
    supportsThinking: Boolean(m.supportsThinking)
  }));
}
