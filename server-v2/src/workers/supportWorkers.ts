import { Worker, Job } from 'bullmq';
import { createRedisConnection, getRedisClient } from '../config/redis';
import { logger } from '../utils/logger';
import { ATSAnalysisCompletedEvent, DSAProgressUpdatedEvent } from '../events/eventBus';

// ─────────────────────────────────────────────────────────────────────────────
// Notification Worker
// Handles: ATS completion emails, streak alerts, etc.
// In production: integrate with SendGrid / Resend
// ─────────────────────────────────────────────────────────────────────────────
export function startNotificationWorker(): Worker {
  const worker = new Worker(
    'notifications',
    async (job: Job) => {
      const { name, data } = job;

      switch (name) {
        case 'ats-complete-notification': {
          const event = data as ATSAnalysisCompletedEvent;
          // TODO: integrate with email provider (SendGrid/Resend)
          // For now: store in Redis as pending notification
          const redis = getRedisClient();
          const notification = {
            userId: event.userId,
            type: 'ats-complete',
            title: 'ATS Analysis Ready',
            body: `Your resume scored ${event.score}/100. ${event.suggestions.length} improvements found.`,
            score: event.score,
            createdAt: new Date().toISOString(),
            read: false,
          };
          await redis.lpush(`notifications:${event.userId}`, JSON.stringify(notification));
          await redis.ltrim(`notifications:${event.userId}`, 0, 99); // keep last 100
          logger.info({ userId: event.userId, score: event.score }, 'Notification stored');
          break;
        }
        default:
          logger.warn({ jobName: name }, 'Unknown notification job type');
      }
    },
    {
      connection: createRedisConnection(),
      concurrency: 10,
    }
  );

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err: err.message }, 'Notification worker: job failed');
  });

  logger.info('Notification worker started');
  return worker;
}

// ─────────────────────────────────────────────────────────────────────────────
// Analytics Worker
// Tracks: ATS usage, DSA progress stats, aggregate metrics
// ─────────────────────────────────────────────────────────────────────────────
export function startAnalyticsWorker(): Worker {
  const worker = new Worker(
    'analytics',
    async (job: Job) => {
      const redis = getRedisClient();
      const { name, data } = job;
      const today = new Date().toISOString().slice(0, 10);

      switch (name) {
        case 'track-ats-analysis': {
          const event = data as ATSAnalysisCompletedEvent;
          await Promise.all([
            redis.incr(`analytics:ats:total`),
            redis.incr(`analytics:ats:daily:${today}`),
            redis.incr(`analytics:ats:user:${event.userId}:total`),
            redis.zadd('analytics:ats:scores', event.score, `${event.userId}:${Date.now()}`),
          ]);
          await redis.expire(`analytics:ats:daily:${today}`, 86400 * 30);
          break;
        }
        case 'track-dsa-progress': {
          const event = data as DSAProgressUpdatedEvent;
          await Promise.all([
            redis.incr(`analytics:dsa:total`),
            redis.incr(`analytics:dsa:daily:${today}`),
            redis.hincrby(`analytics:dsa:topics`, event.topic, 1),
            redis.hincrby(`analytics:dsa:difficulty`, event.diff, 1),
          ]);
          break;
        }
        default:
          logger.warn({ jobName: name }, 'Unknown analytics job type');
      }
    },
    {
      connection: createRedisConnection(),
      concurrency: 20, // analytics is lightweight
    }
  );

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err: err.message }, 'Analytics worker: job failed');
  });

  logger.info('Analytics worker started');
  return worker;
}

// ─────────────────────────────────────────────────────────────────────────────
// Leaderboard Worker
// Handles leaderboard cache invalidation after DSA progress updates
// ─────────────────────────────────────────────────────────────────────────────
export function startLeaderboardWorker(): Worker {
  const worker = new Worker(
    'leaderboard-update',
    async (job: Job<DSAProgressUpdatedEvent>) => {
      const redis = getRedisClient();
      // Invalidate leaderboard caches — they'll be rebuilt on next request
      await redis.del('cache:leaderboard:all', 'cache:leaderboard:weekly');
      logger.debug({ userId: job.data.userId }, 'Leaderboard cache invalidated');
    },
    {
      connection: createRedisConnection(),
      concurrency: 5,
    }
  );

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err: err.message }, 'Leaderboard worker: job failed');
  });

  logger.info('Leaderboard worker started');
  return worker;
}
