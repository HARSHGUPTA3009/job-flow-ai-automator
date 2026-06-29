import crypto from 'crypto';
import { getRedisClient } from '../config/redis';
import { logger } from '../utils/logger';

const IDEMPOTENCY_TTL_SECONDS = 3600 * 24; // 24 hours

export class IdempotencyService {
  /**
   * Generate a SHA256 fingerprint for ATS analysis deduplication.
   * Uses resumeText + jobDescription so same resume + different JD = different job.
   */
  static buildATSFingerprint(resumeText: string, jobDescription?: string): string {
    const input = jobDescription
      ? `${resumeText.trim()}||${jobDescription.trim()}`
      : resumeText.trim();
    return crypto.createHash('sha256').update(input).digest('hex');
  }

  /**
   * Check if an identical ATS request was already processed.
   * Returns the cached result if found, null otherwise.
   */
  static async getATSCache(fingerprint: string): Promise<unknown | null> {
    const redis = getRedisClient();
    const cached = await redis.get(`ats:result:${fingerprint}`);
    if (!cached) return null;

    logger.info({ fingerprint: fingerprint.slice(0, 12) + '...' }, '⚡ ATS cache HIT');
    return JSON.parse(cached);
  }

  /**
   * Store ATS result in cache. Called by the worker after processing.
   */
  static async setATSCache(fingerprint: string, result: unknown): Promise<void> {
    const redis = getRedisClient();
    await redis.setex(
      `ats:result:${fingerprint}`,
      IDEMPOTENCY_TTL_SECONDS,
      JSON.stringify(result)
    );
    logger.debug({ fingerprint: fingerprint.slice(0, 12) + '...' }, 'ATS result cached');
  }

  /**
   * Check if a BullMQ job already exists for this fingerprint.
   * BullMQ's jobId deduplication handles this at the queue level,
   * but we expose this for explicit checks.
   */
  static async isJobPending(fingerprint: string): Promise<boolean> {
    const redis = getRedisClient();
    const exists = await redis.exists(`bull:ats-analysis:${fingerprint}`);
    return exists === 1;
  }

  /**
   * Store a pending job reference so we can track status.
   */
  static async trackPendingJob(fingerprint: string, jobId: string, userId: string): Promise<void> {
    const redis = getRedisClient();
    await redis.setex(
      `ats:pending:${fingerprint}`,
      3600, // 1 hour max for processing
      JSON.stringify({ jobId, userId, startedAt: new Date().toISOString() })
    );
  }

  /**
   * Generic idempotency key check for other endpoints.
   * Used in admin retry operations to prevent duplicate retries.
   */
  static async checkAndSet(
    key: string,
    ttlSeconds: number,
    value = '1'
  ): Promise<boolean> {
    const redis = getRedisClient();
    const result = await redis.set(
      `idempotency:${key}`,
      value,
      'EX', ttlSeconds,
      'NX' // Only set if not exists
    );
    return result === 'OK'; // true = first time, false = duplicate
  }
}
