import { FreeModelInfo, TaskType } from './types';
import { cooldownManager } from './cooldownManager';

export interface RankedResult {
  primaryModel: string;
  fallbackModels: string[];
  reason: string;
}

export class ModelRanker {
  /**
   * Ranks free models for a given task and returns the primary model + fallbacks.
   */
  public static rank(task: TaskType, models: FreeModelInfo[]): RankedResult {
    if (!models || models.length === 0) {
      throw new Error('No free models available in catalog');
    }

    // 1. VISION: Strictly require vision input capability
    if (task === 'VISION') {
      const visionModels = models.filter((m) => m.isVisionCapable);

      if (visionModels.length === 0) {
        return {
          primaryModel: '',
          fallbackModels: [],
          reason: 'No free models currently support image/vision input.'
        };
      }

      // Prioritize available (not in cooldown)
      const sorted = visionModels.sort((a, b) => {
        const aAvail = cooldownManager.isAvailable(a.id) ? 1 : 0;
        const bAvail = cooldownManager.isAvailable(b.id) ? 1 : 0;
        if (aAvail !== bAvail) return bAvail - aAvail;

        // Prefer larger context
        return b.contextLength - a.contextLength;
      });

      const selected = sorted[0];
      const fallbacks = sorted.slice(1, 4).map((m) => m.id);

      return {
        primaryModel: selected.id,
        fallbackModels: fallbacks,
        reason: `Selected ${selected.name} (${Math.round(selected.contextLength / 1024)}k context) for vision analysis.`
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

      const selected = imageGenModels[0];
      return {
        primaryModel: selected.id,
        fallbackModels: imageGenModels.slice(1).map((m) => m.id),
        reason: `Selected ${selected.name} for image generation.`
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

    // 4. SCORE GENERAL, CODING, REASONING, WRITING
    const scoredModels = models.map((model) => {
      let score = 0;
      const idLower = model.id.toLowerCase();
      const descLower = model.description.toLowerCase();

      // Base context score (up to 20 pts)
      score += Math.min(20, Math.round(model.contextLength / 50000));

      // Cooldown penalty
      if (!cooldownManager.isAvailable(model.id)) {
        score -= 50;
      }

      if (task === 'CODING') {
        // High priority to models specifically built for coding
        if (idLower.includes('code') || descLower.includes('coding') || descLower.includes('agent model from poolside')) {
          score += 50;
        }
        if (idLower.includes('laguna') || idLower.includes('north-mini')) {
          score += 30;
        }
        if (model.isToolCapable) {
          score += 15;
        }
        if (model.isReasoningCapable) {
          score += 15;
        }
      } else if (task === 'REASONING') {
        // High priority to models with frontier reasoning
        if (model.isReasoningCapable) {
          score += 40;
        }
        if (idLower.includes('reasoning') || descLower.includes('reasoning') || idLower.includes('ultra')) {
          score += 35;
        }
        if (idLower.includes('550b') || idLower.includes('120b') || idLower.includes('glm')) {
          score += 20;
        }
      } else if (task === 'WRITING' || task === 'SUMMARIZATION') {
        // High priority to balanced large-context fluent models
        if (idLower.includes('minimax') || idLower.includes('lightning') || idLower.includes('gemma')) {
          score += 30;
        }
        if (model.contextLength >= 250000) {
          score += 20;
        }
      } else {
        // GENERAL_CHAT
        if (idLower.includes('minimax-m3') || idLower.includes('lightning') || idLower.includes('gemma')) {
          score += 30;
        }
        if (model.contextLength >= 250000) {
          score += 20;
        }
        if (model.isReasoningCapable) {
          score += 10;
        }
      }

      return { model, score };
    });

    scoredModels.sort((a, b) => b.score - a.score);

    const primary = scoredModels[0].model;
    const fallbacks = scoredModels.slice(1, 4).map((s) => s.model.id);

    return {
      primaryModel: primary.id,
      fallbackModels: fallbacks,
      reason: `Best free candidate for ${task} (Score: ${scoredModels[0].score}, Context: ${Math.round(primary.contextLength / 1024)}k)`
    };
  }
}
