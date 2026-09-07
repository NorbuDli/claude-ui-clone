import { FreeModelInfo, TaskType } from './types';
import { cooldownManager } from './cooldownManager';

export interface RankedResult {
  primaryModel: string;
  fallbackModels: string[];
  reason: string;
}

export class ModelRanker {
  /**
   * Ranks free models for a given task, prioritizing user-requested specialized models
   * and providing resilient fallback candidates.
   */
  public static rank(task: TaskType, models: FreeModelInfo[]): RankedResult {
    if (!models || models.length === 0) {
      throw new Error('No free models available in catalog');
    }

    const findModel = (pattern: string): FreeModelInfo | undefined => {
      const lower = pattern.toLowerCase();
      return models.find((m) => m.id.toLowerCase().includes(lower));
    };

    // 1. VISION
    if (task === 'VISION') {
      // User preferred: thinkingmachines/inkling-small:free
      // Resilient fallbacks: dots-studio/dots-3-note-preview:free, minimax/minimax-m3:free
      const preferred = findModel('inkling-small');
      const fallbacks = [
        'dots-studio/dots-3-note-preview:free',
        'minimax/minimax-m3:free',
        'openrouter/free'
      ];

      const primaryId = preferred && cooldownManager.isAvailable(preferred.id)
        ? preferred.id
        : 'dots-studio/dots-3-note-preview:free';

      const activeFallbacks = fallbacks.filter((id) => id !== primaryId);

      return {
        primaryModel: primaryId,
        fallbackModels: activeFallbacks,
        reason: 'Vision analysis: Thinking Machines Inkling Small (with Dots-3-Note and MiniMax-M3 fallbacks)'
      };
    }

    // 2. IMAGE GENERATION
    if (task === 'IMAGE_GENERATION') {
      const imageGenModels = models.filter((m) => m.outputModalities.includes('image'));
      if (imageGenModels.length === 0) {
        return {
          primaryModel: '',
          fallbackModels: [],
          reason: 'OpenRouter does not currently provide a free text-to-image generation model.'
        };
      }
      return {
        primaryModel: imageGenModels[0].id,
        fallbackModels: imageGenModels.slice(1).map((m) => m.id),
        reason: `Selected ${imageGenModels[0].name} for image generation.`
      };
    }

    // 3. SPEECH TO TEXT
    if (task === 'SPEECH_TO_TEXT') {
      const audioInputModels = models.filter((m) => m.inputModalities.includes('audio'));
      if (audioInputModels.length === 0) {
        return {
          primaryModel: '',
          fallbackModels: [],
          reason: 'OpenRouter does not currently provide a free speech-to-text model.'
        };
      }
      return {
        primaryModel: audioInputModels[0].id,
        fallbackModels: audioInputModels.slice(1).map((m) => m.id),
        reason: `Selected ${audioInputModels[0].name} for audio transcription.`
      };
    }

    // 4. CODING
    if (task === 'CODING') {
      // User preferred: inclusionai/ling-3.0-flash-fin:free
      // Resilient fallbacks: cohere/north-mini-code:free, poolside/laguna-xs-2.1:free, minimax/minimax-m3:free
      const preferred = findModel('ling-3.0-flash-fin');
      const fallbacks = [
        'cohere/north-mini-code:free',
        'poolside/laguna-xs-2.1:free',
        'minimax/minimax-m3:free'
      ];

      const primaryId = preferred && cooldownManager.isAvailable(preferred.id)
        ? preferred.id
        : 'cohere/north-mini-code:free';

      const activeFallbacks = fallbacks.filter((id) => id !== primaryId);

      return {
        primaryModel: primaryId,
        fallbackModels: activeFallbacks,
        reason: 'Coding & engineering: Ling 3.0 Flash Fin (with Cohere North Mini Code and Laguna-XS fallbacks)'
      };
    }

    // 5. DEEP REASONING
    if (task === 'REASONING') {
      // User preferred: nvidia/nemotron-3-ultra-550b-a55b:free
      // Resilient fallbacks: nvidia/nemotron-3-super-120b-a12b:free, liquid/lfm-2.5-2.6b:free
      const preferred = findModel('nemotron-3-ultra-550b');
      const fallbacks = [
        'nvidia/nemotron-3-super-120b-a12b:free',
        'liquid/lfm-2.5-2.6b:free',
        'minimax/minimax-m3:free'
      ];

      const primaryId = preferred && cooldownManager.isAvailable(preferred.id)
        ? preferred.id
        : 'nvidia/nemotron-3-super-120b-a12b:free';

      const activeFallbacks = fallbacks.filter((id) => id !== primaryId);

      return {
        primaryModel: primaryId,
        fallbackModels: activeFallbacks,
        reason: 'Deep reasoning & logic: NVIDIA Nemotron 3 Ultra 550B (with 120B Super and Liquid fallbacks)'
      };
    }

    // 6. GENERAL CHAT, WRITING, SUMMARIZATION
    // User preferred: google/gemma-4-26b-a4b-it:free
    // Resilient fallbacks: nvidia/nemotron-3.5-lightning:free, minimax/minimax-m3:free, openrouter/free
    const preferred = findModel('gemma-4-26b-a4b-it');
    const fallbacks = [
      'nvidia/nemotron-3.5-lightning:free',
      'minimax/minimax-m3:free',
      'openrouter/free'
    ];

    const primaryId = preferred && cooldownManager.isAvailable(preferred.id)
      ? preferred.id
      : 'nvidia/nemotron-3.5-lightning:free';

    const activeFallbacks = fallbacks.filter((id) => id !== primaryId);

    return {
      primaryModel: primaryId,
      fallbackModels: activeFallbacks,
      reason: 'General chat & conversation: Google Gemma 4 26B (with Nemotron 3.5 Lightning and MiniMax-M3 fallbacks)'
    };
  }
}
