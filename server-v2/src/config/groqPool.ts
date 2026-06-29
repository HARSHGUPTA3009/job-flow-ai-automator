import { config } from './env';
import { logger } from '../utils/logger';

class GroqKeyPool {
  private keys: string[];
  private index = 0;
  private exhausted = new Set<string>();
  private resetTimers = new Map<string, ReturnType<typeof setTimeout>>();

  constructor(rawKeys: string) {
    this.keys = rawKeys.split(',').map((k) => k.trim()).filter(Boolean);
    if (this.keys.length === 0) {
      throw new Error('No Groq API keys available. Set GROQ_KEY_1 or GROQ_API_KEYS in your .env');
    }
    logger.info(`Groq key pool initialized with ${this.keys.length} key(s)`);
  }

  getKey(): string {
    const available = this.keys.filter((k) => !this.exhausted.has(k));
    if (available.length === 0) {
      throw new Error('All Groq API keys are rate-limited. Try again later.');
    }
    const key = available[this.index % available.length];
    this.index = (this.index + 1) % available.length;
    return key;
  }

  markExhausted(key: string, resetAfterMs = 60_000): void {
    this.exhausted.add(key);
    logger.warn({ key: key.slice(0, 8) + '...' }, 'Groq key marked exhausted');
    const existing = this.resetTimers.get(key);
    if (existing) clearTimeout(existing);
    const timer = setTimeout(() => {
      this.exhausted.delete(key);
      this.resetTimers.delete(key);
      logger.info({ key: key.slice(0, 8) + '...' }, 'Groq key restored');
    }, resetAfterMs);
    this.resetTimers.set(key, timer);
  }

  get availableCount(): number {
    return this.keys.filter((k) => !this.exhausted.has(k)).length;
  }

  get totalCount(): number {
    return this.keys.length;
  }
}

export const groqPool = new GroqKeyPool(config.GROQ_API_KEYS);
