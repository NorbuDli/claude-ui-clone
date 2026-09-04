import { FreeModelInfo } from './types';

// Fallback list of known verified free models on OpenRouter (used if catalog API is unreachable)
const STATIC_FREE_MODELS_FALLBACK: FreeModelInfo[] = [
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
  },
  {
    id: 'poolside/laguna-s-2.1:free',
    name: 'Laguna S 2.1 (free)',
    description: 'Coding agent model from Poolside designed for software engineering.',
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
    id: 'google/gemma-4-31b-it:free',
    name: 'Google Gemma 4 31B (free)',
    description: 'Google DeepMind multimodal instruction model with vision support.',
    contextLength: 262144,
    inputModalities: ['text', 'image', 'video'],
    outputModalities: ['text'],
    supportedParameters: ['tools'],
    isVisionCapable: true,
    isReasoningCapable: true,
    isToolCapable: true
  },
  {
    id: 'nvidia/nemotron-3.5-lightning:free',
    name: 'NVIDIA Nemotron 3.5 Lightning (free)',
    description: '1M context open mixture-of-experts model for knowledge and reasoning.',
    contextLength: 1000000,
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
    description: 'Compact high-speed reasoning model.',
    contextLength: 65536,
    inputModalities: ['text'],
    outputModalities: ['text'],
    supportedParameters: [],
    isVisionCapable: false,
    isReasoningCapable: true,
    isToolCapable: false
  },
  {
    id: 'openrouter/free',
    name: 'OpenRouter Free Auto-Router',
    description: 'General free auto-routing endpoint.',
    contextLength: 200000,
    inputModalities: ['text', 'image'],
    outputModalities: ['text'],
    supportedParameters: [],
    isVisionCapable: true,
    isReasoningCapable: false,
    isToolCapable: false
  }
];

class ModelCatalogService {
  private cache: FreeModelInfo[] | null = null;
  private lastFetchTime: number = 0;
  private readonly CACHE_TTL_MS: number = 30 * 60 * 1000; // 30 minutes

  /**
   * Discovers and retrieves all currently available FREE models from OpenRouter.
   * Uses an in-memory TTL cache to minimize API calls.
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
        console.warn(`[AI Catalog] Failed to fetch live models (${response.status}). Using fallback catalog.`);
        return this.cache || STATIC_FREE_MODELS_FALLBACK;
      }

      const data = await response.json();
      const rawModels: any[] = data.data || [];

      // STRICT FILTER: Only models where pricing is explicitly 0 or ID ends in :free
      const discoveredFreeModels: FreeModelInfo[] = [];

      for (const m of rawModels) {
        const id: string = m.id || '';
        const promptPrice = m.pricing?.prompt;
        const completionPrice = m.pricing?.completion;

        const isExplicitFreePricing = promptPrice === '0' && completionPrice === '0';
        const isFreeSlug = id.endsWith(':free') || id === 'openrouter/free';

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
        console.log(`[AI Catalog] Discovered ${discoveredFreeModels.length} active FREE OpenRouter models.`);
        return discoveredFreeModels;
      }

      console.warn('[AI Catalog] No free models found in OpenRouter response. Using static fallback catalog.');
      return this.cache || STATIC_FREE_MODELS_FALLBACK;
    } catch (err: any) {
      console.error('[AI Catalog] Error discovering models:', err.message);
      return this.cache || STATIC_FREE_MODELS_FALLBACK;
    }
  }

  /**
   * Force refresh the catalog cache
   */
  public invalidateCache(): void {
    this.cache = null;
    this.lastFetchTime = 0;
  }
}

export const modelCatalog = new ModelCatalogService();
