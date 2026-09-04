/**
 * Rate limit and temporary unavailability manager.
 * Tracks models that fail with 429 (rate limit) or 503 (service unavailable)
 * and keeps them in cooldown to avoid repeated failures.
 */

interface CooldownEntry {
  modelId: string;
  until: number;
  reason: string;
}

class CooldownManager {
  private cooldowns: Map<string, CooldownEntry> = new Map();

  /**
   * Put a model into temporary cooldown (default: 60 seconds)
   */
  public recordFailure(modelId: string, reason: string = 'rate_limit', durationSeconds: number = 60): void {
    const until = Date.now() + durationSeconds * 1000;
    this.cooldowns.set(modelId, {
      modelId,
      until,
      reason
    });
    console.warn(`[AI Router] Model ${modelId} placed in cooldown for ${durationSeconds}s (${reason}).`);
  }

  /**
   * Check if a model is currently available (not in cooldown)
   */
  public isAvailable(modelId: string): boolean {
    const entry = this.cooldowns.get(modelId);
    if (!entry) return true;

    if (Date.now() >= entry.until) {
      this.cooldowns.delete(modelId);
      return true;
    }

    return false;
  }

  /**
   * Filter a list of model IDs to only those currently available
   */
  public filterAvailable(modelIds: string[]): string[] {
    const now = Date.now();
    return modelIds.filter((id) => {
      const entry = this.cooldowns.get(id);
      if (!entry) return true;
      if (now >= entry.until) {
        this.cooldowns.delete(id);
        return true;
      }
      return false;
    });
  }

  /**
   * Clear all active cooldowns
   */
  public reset(): void {
    this.cooldowns.clear();
  }
}

export const cooldownManager = new CooldownManager();
