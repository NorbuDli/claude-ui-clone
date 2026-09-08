import { FreeModelInfo, TaskType } from './types';
import { cooldownManager } from './cooldownManager';
import { BLACKLISTED_MODEL_IDS } from './modelCatalog';

export interface RankedResult {
  primaryModel: string;
  fallbackModels: string[];
  reason: string;
}

export class ModelRanker {
  /**
   * Ranks free models for a given task, prioritizing verified live 200 OK models.
   */
  public static rank(task: TaskType, models: FreeModelInfo[]): RankedResult {
    // Filter out any blacklisted model
    const safeModels = (models || []).filter((m) => !BLACKLISTED_MODEL_IDS.has(m.id));

    if (safeModels.length === 0) {
      throw new Error('No verified free models available in catalog');
    }

    const findModel = (pattern: string): FreeModelInfo | undefined => {
      const lower = pattern.toLowerCase();
      return safeModels.find((m) => m.id.toLowerCase().includes(lower));
    };

    // 1. VISION
    if (task === 'VISION') {
      const preferred = findModel('dots-3-note') || findModel('minimax-m3');
      const fallbacks = [
        'dots-studio/dots-3-note-preview:free',
        'minimax/minimax-m3:free'
      ];

      const primaryId = preferred && cooldownManager.isAvailable(preferred.id)
        ? preferred.id
        : 'dots-studio/dots-3-note-preview:free';

      const activeFallbacks = fallbacks.filter((id) => id !== primaryId);

      return {
        primaryModel: primaryId,
        fallbackModels: activeFallbacks,
        reason: 'Vision analysis: Dots-3-Note Preview (512k context, multimodal)'
      };
    }

    // 2. IMAGE GENERATION
    if (task === 'IMAGE_GENERATION') {
      const imageGenModels = safeModels.filter((m) => m.outputModalities.includes('image'));
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
      const audioInputModels = safeModels.filter((m) => m.inputModalities.includes('audio'));
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
      const preferred = findModel('nemotron-3-ultra-550b') || findModel('nemotron');
      const fallbacks = [
        'inclusionai/ling-3.0-flash-fin:free',
        'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
        'poolside/laguna-xs-2.1:free',
        'cohere/north-mini-code:free'
      ];

      const primaryId = preferred && cooldownManager.isAvailable(preferred.id)
        ? preferred.id
        : 'inclusionai/ling-3.0-flash-fin:free';

      const activeFallbacks = fallbacks.filter((id) => id !== primaryId);

      return {
        primaryModel: primaryId,
        fallbackModels: activeFallbacks,
        reason: 'Coding & engineering: NVIDIA Nemotron 3 Ultra 550B (with Ling 3.0 Flash Fin and Nemotron 30B fallbacks)'
      };
    }

    // 5. DEEP REASONING
    if (task === 'REASONING') {
      const preferred = findModel('nemotron-3-ultra-550b');
      const fallbacks = [
        'liquid/lfm-2.5-2.6b:free',
        'inclusionai/ling-3.0-flash-fin:free',
        'minimax/minimax-m3:free'
      ];

      const primaryId = preferred && cooldownManager.isAvailable(preferred.id)
        ? preferred.id
        : 'liquid/lfm-2.5-2.6b:free';

      const activeFallbacks = fallbacks.filter((id) => id !== primaryId);

      return {
        primaryModel: primaryId,
        fallbackModels: activeFallbacks,
        reason: 'Deep reasoning & logic: NVIDIA Nemotron 3 Ultra 550B (with Liquid LFM and Ling 3.0 fallbacks)'
      };
    }

    // 6. GENERAL CHAT, WRITING, SUMMARIZATION
    // Primary: inclusionai/ling-3.0-flash-fin:free (tested 200 OK in 2.1s)
    // Fallbacks: liquid/lfm-2.5-2.6b:free, poolside/laguna-xs-2.1:free, minimax/minimax-m3:free
    const preferred = findModel('ling-3.0-flash-fin');
    const fallbacks = [
      'liquid/lfm-2.5-2.6b:free',
      'poolside/laguna-xs-2.1:free',
      'minimax/minimax-m3:free'
    ];

    const primaryId = preferred && cooldownManager.isAvailable(preferred.id)
      ? preferred.id
      : 'liquid/lfm-2.5-2.6b:free';

    const activeFallbacks = fallbacks.filter((id) => id !== primaryId);

    return {
      primaryModel: primaryId,
      fallbackModels: activeFallbacks,
      reason: 'General conversation: Ling 3.0 Flash Fin (with Liquid LFM and Laguna-XS fallbacks)'
    };
  }
}
