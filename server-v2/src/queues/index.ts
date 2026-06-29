import { Queue, QueueOptions } from 'bullmq';
import { createRedisConnection } from '../config/redis';
import { config } from '../config/env';
import { logger } from '../utils/logger';

// ─────────────────────────────────────────────────────────────────────────────
// Shared queue defaults — exponential backoff, dead letter behavior
// ─────────────────────────────────────────────────────────────────────────────
function makeQueueOptions(): QueueOptions {
  return {
    connection: createRedisConnection(),
    defaultJobOptions: {
      attempts: config.MAX_JOB_ATTEMPTS,
      backoff: {
        type: 'exponential',
        delay: config.JOB_BACKOFF_BASE_MS, // 1s → 2s → 4s → 8s → 16s
      },
      removeOnComplete: { count: 1000, age: 3600 * 24 }, // keep 1000 or 24h
      removeOnFail: false, // keep all failed — they go to dead letter
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Queue instances (singleton pattern)
// ─────────────────────────────────────────────────────────────────────────────
let _atsQueue: Queue | null = null;
let _notificationQueue: Queue | null = null;
let _analyticsQueue: Queue | null = null;
let _leaderboardQueue: Queue | null = null;
let _deadLetterQueue: Queue | null = null;

export function getATSQueue(): Queue {
  if (!_atsQueue) {
    _atsQueue = new Queue('ats-analysis', makeQueueOptions());
    logger.info('ATS queue initialized');
  }
  return _atsQueue;
}

export function getNotificationQueue(): Queue {
  if (!_notificationQueue) {
    _notificationQueue = new Queue('notifications', {
      ...makeQueueOptions(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: { count: 500 },
        removeOnFail: false,
      },
    });
    logger.info('Notification queue initialized');
  }
  return _notificationQueue;
}

export function getAnalyticsQueue(): Queue {
  if (!_analyticsQueue) {
    _analyticsQueue = new Queue('analytics', {
      ...makeQueueOptions(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 500 },
        removeOnComplete: { count: 2000 },
        removeOnFail: false,
      },
    });
    logger.info('Analytics queue initialized');
  }
  return _analyticsQueue;
}

export function getLeaderboardQueue(): Queue {
  if (!_leaderboardQueue) {
    _leaderboardQueue = new Queue('leaderboard-update', {
      ...makeQueueOptions(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 500 },
        removeOnComplete: { count: 200 },
        removeOnFail: false,
      },
    });
    logger.info('Leaderboard queue initialized');
  }
  return _leaderboardQueue;
}

export function getDeadLetterQueue(): Queue {
  if (!_deadLetterQueue) {
    _deadLetterQueue = new Queue('dead-letter', {
      connection: createRedisConnection(),
      defaultJobOptions: {
        removeOnComplete: false,
        removeOnFail: false,
      },
    });
    logger.info('Dead letter queue initialized');
  }
  return _deadLetterQueue;
}

export async function closeAllQueues(): Promise<void> {
  const queues = [_atsQueue, _notificationQueue, _analyticsQueue, _leaderboardQueue, _deadLetterQueue];
  await Promise.all(queues.filter(Boolean).map((q) => q!.close()));
  logger.info('All queues closed');
}
