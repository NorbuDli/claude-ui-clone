import { FreeModelInfo } from './types';

// Models that are known to be broken, decommissioned, or produce distributor errors / infinite stalls on OpenRouter
export const BLACKLISTED_MODEL_IDS = new Set([
  'openrouter/free', // 404: Does not exist (distributor)
  'poolside/laguna-s-2.1:free', // 404: Does not exist (distributor)
  'deepseek/deepseek-v4-flash:free', // 404: Decommissioned
  'thinkingmachines/inkling-small:free', // 403: Only available on agentic harnesses
  'thinkingmachines/inkling:free', // 403: Only available on agentic harnesses
  'google/gemma-4-26b-a4b-it:free', // 429: Upstream rate-limit pool exhausted
  'google/gemma-4-31b-it:free', // 429: Upstream rate-limit pool exhausted
  'nvidia/nemotron-3.5-lightning:free' // Stalls 30+ seconds with infinite processing chunks
]);

// Verified, high-speed, live 200 OK free models on OpenRouter
const STATIC_FREE_MODELS_FALLBACK: FreeModelInfo[] = [
  {
    id: 'inclusionai/ling-3.0-flash-fin:free',
    name: 'Ling 3.0 Flash Fin (free)',
    description: 'High-speed 262k context MoE model from InclusionAI for coding and general conversation.',
    contextLength: 262144,
    inputModalities: ['text'],
    outputModalities: ['text'],
    supportedParameters: ['tools', 'reasoning'],
    isVisionCapable: false,
    isReasoningCapable: true,
    isToolCapable: true
  },
  {
    id: 'poolside/laguna-xs-2.1:free',
    name: 'Laguna XS 2.1 (free)',
    description: 'Ultra-fast 1.5s coding agent model in the 33B category from Poolside.',
    contextLength: 262144,
    inputModalities: ['text'],
    outputModalities: ['text'],
    supportedParameters: ['tools'],
    isVisionCapable: false,
    isReasoningCapable: true,
    isToolCapable: true
  },
  {
    id: 'cohere/north-mini-code:free',
    name: 'North Mini Code (free)',
    description: 'Cohere agentic coding model for code analysis and generation.',
    contextLength: 256000,
    inputModalities: ['text'],
    outputModalities: ['text'],
    supportedParameters: ['tools'],
    isVisionCapable: false,
    isReasoningCapable: true,
    isToolCapable: true
  },
  {
    id: 'nvidia/nemotron-3-ultra-550b-a55b:free',
    name: 'NVIDIA Nemotron 3 Ultra 550B (free)',
    description: 'Massive 550B parameter frontier reasoning model with 1M context.',
    contextLength: 1000000,
    inputModalities: ['text'],
    outputModalities: ['text'],
    supportedParameters: ['tools'],
    isVisionCapable: false,
    isReasoningCapable: true,
    isToolCapable: true
  },
  {
    id: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
    name: 'NVIDIA Nemotron 3 Nano Omni 30B (free)',
    description: '30B reasoning model with high-speed generation from NVIDIA.',
    contextLength: 131072,
    inputModalities: ['text'],
    outputModalities: ['text'],
    supportedParameters: ['tools'],
    isVisionCapable: false,
    isReasoningCapable: true,
    isToolCapable: true
  },
  {
    id: 'liquid/lfm-2.5-2.6b:free',
    name: 'Liquid LFM 2.5 2.6B (free)',
    description: 'Compact ultra-fast reasoning model from Liquid AI (sub-second first token).',
    contextLength: 65536,
    inputModalities: ['text'],
    outputModalities: ['text'],
    supportedParameters: [],
    isVisionCapable: false,
    isReasoningCapable: true,
    isToolCapable: false
  },
  {
    id: 'dots-studio/dots-3-note-preview:free',
    name: 'Dots3-Note Preview (free)',
    description: 'Multimodal mixture-of-experts model with vision support and 512k context.',
    contextLength: 512000,
    inputModalities: ['text', 'image'],
    outputModalities: ['text'],
    supportedParameters: [],
    isVisionCapable: true,
    isReasoningCapable: true,
    isToolCapable: false
  },
  {
    id: 'minimax/minimax-m3:free',
    name: 'MiniMax M3 (free)',
    description: 'Multimodal foundation model with 1M context, vision and reasoning.',
    contextLength: 1048576,
    inputModalities: ['text', 'image', 'video'],
    outputModalities: ['text'],
    supportedParameters: ['tools', 'reasoning'],
    isVisionCapable: true,
    isReasoningCapable: true,
    isToolCapable: true
  }
];

class ModelCatalogService {
  private cache: FreeModelInfo[] | null = null;
  private lastFetchTime: number = 0;
  private readonly CACHE_TTL_MS: number = 15 * 60 * 1000; // 15 minutes

  /**
   * Discovers and retrieves all currently available FREE models from OpenRouter.
   * Uses an in-memory TTL cache and filters out blacklisted / broken models.
   */
  public async getFreeModels(apiKey?: string, baseUrl: string = 'https://openrouter.ai/api/v1'): Promise<FreeModelInfo[]> {
    const now = Date.now();
    if (this.cache && (now - this.lastFetchTime < this.CACHE_TTL_MS)) {
      return this.cache;
    }

    try {
      const cleanBase = baseUrl.replace(/\/+$/, '');
      const catalogUrl = `${cleanBase}/models`;

      const headers: Record<string, string> = {
        'HTTP-Referer': 'https://claude.ai',
        'X-Title': 'Claude UI Multi-Model Router'
      };
      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      const response = await fetch(catalogUrl, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        console.warn(`[AI Catalog] Failed to fetch live models (${response.status}). Using verified fallback catalog.`);
        return this.cache || STATIC_FREE_MODELS_FALLBACK;
      }

      const data = await response.json();
      const rawModels: any[] = data.data || [];

      // STRICT FILTER: Only models where pricing is explicitly 0 or ID ends in :free
      const discoveredFreeModels: FreeModelInfo[] = [];

      for (const m of rawModels) {
        const id: string = m.id || '';

        // Exclude blacklisted broken models
        if (BLACKLISTED_MODEL_IDS.has(id)) {
          continue;
        }

        const promptPrice = m.pricing?.prompt;
        const completionPrice = m.pricing?.completion;

        const isExplicitFreePricing = promptPrice === '0' && completionPrice === '0';
        const isFreeSlug = id.endsWith(':free');

        // Discard any model with non-zero costs
        if (!isExplicitFreePricing && !isFreeSlug) {
          continue;
        }

        const inputModalities: string[] = m.architecture?.input_modalities || ['text'];
        const outputModalities: string[] = m.architecture?.output_modalities || ['text'];
        const modalityStr = (m.architecture?.modality || '').toLowerCase();

        const hasImageInput = inputModalities.includes('image') || modalityStr.includes('+image');
        const desc = (m.description || '').toLowerCase();
        const supportedParams: string[] = m.supported_parameters || [];

        const isReasoning = Boolean(
          m.reasoning?.default_enabled ||
          desc.includes('reasoning') ||
          desc.includes('r1') ||
          desc.includes('math') ||
          supportedParams.includes('include_reasoning') ||
          supportedParams.includes('reasoning')
        );

        const isToolCapable = supportedParams.includes('tools');

        discoveredFreeModels.push({
          id,
          name: m.name || id,
          description: m.description || '',
          contextLength: m.context_length || 32768,
          inputModalities,
          outputModalities,
          supportedParameters: supportedParams,
          isVisionCapable: hasImageInput,
          isReasoningCapable: isReasoning,
          isToolCapable
        });
      }

      if (discoveredFreeModels.length > 0) {
        this.cache = discoveredFreeModels;
        this.lastFetchTime = now;
        console.log(`[AI Catalog] Discovered ${discoveredFreeModels.length} active verified FREE models.`);
        return discoveredFreeModels;
      }

      return this.cache || STATIC_FREE_MODELS_FALLBACK;
    } catch (err: any) {
      console.error('[AI Catalog] Error discovering models:', err.message);
      return this.cache || STATIC_FREE_MODELS_FALLBACK;
    }
  }

  public invalidateCache(): void {
    this.cache = null;
    this.lastFetchTime = 0;
  }
}

export const modelCatalog = new ModelCatalogService();
