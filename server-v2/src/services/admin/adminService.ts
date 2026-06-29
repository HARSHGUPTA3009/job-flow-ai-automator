import { Request, Response } from 'express';
import { Queue, Job } from 'bullmq';
import { getATSQueue, getDeadLetterQueue, getNotificationQueue, getAnalyticsQueue, getLeaderboardQueue } from '../../queues';
import { getRedisClient } from '../../config/redis';
import { getMongoStatus } from '../../config/mongodb';
import { NotFoundError } from '../../errors/AppError';
import { logger } from '../../utils/logger';

// ─────────────────────────────────────────────────────────────────────────────
// Dead Letter Queue — failed job management
// ─────────────────────────────────────────────────────────────────────────────

/** GET /admin/jobs/failed — list all failed jobs across all queues */
export async function getFailedJobs(req: Request, res: Response): Promise<void> {
  const queues: [string, Queue][] = [
    ['ats-analysis', getATSQueue()],
    ['notifications', getNotificationQueue()],
    ['analytics', getAnalyticsQueue()],
  ];

  const results: unknown[] = [];

  for (const [queueName, queue] of queues) {
    const failed = await queue.getFailed(0, 100);
    for (const job of failed) {
      results.push({
        jobId: job.id,
        queue: queueName,
        payload: job.data,
        failureReason: job.failedReason,
        stackTrace: job.stacktrace?.[0] ?? null,
        retryCount: job.attemptsMade,
        maxRetries: job.opts.attempts,
        failedAt: job.finishedOn ? new Date(job.finishedOn).toISOString() : null,
        createdAt: new Date(job.timestamp).toISOString(),
      });
    }
  }

  // Also fetch from explicit dead letter queue
  const dlq = getDeadLetterQueue();
  const dlqJobs = await dlq.getJobs(['waiting'], 0, 100);
  for (const job of dlqJobs) {
    results.push({
      jobId: job.id,
      queue: 'dead-letter',
      payload: job.data.payload,
      failureReason: job.data.failureReason,
      stackTrace: job.data.stackTrace,
      retryCount: job.data.retryCount,
      originalQueue: job.data.queue,
      originalJobId: job.data.originalJobId,
      failedAt: job.data.failedAt,
    });
  }

  res.json({
    total: results.length,
    jobs: results,
    requestId: req.requestId,
  });
}

/** POST /admin/jobs/retry/:id — retry a failed job */
export async function retryJob(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { queue: queueName = 'ats-analysis' } = req.body;

  const queueMap: Record<string, Queue> = {
    'ats-analysis': getATSQueue(),
    'notifications': getNotificationQueue(),
    'analytics': getAnalyticsQueue(),
  };

  const queue = queueMap[queueName];
  if (!queue) throw new NotFoundError(`Queue "${queueName}"`);

  const job = await queue.getJob(id);
  if (!job) throw new NotFoundError(`Job "${id}"`);

  await job.retry();

  logger.info({ jobId: id, queue: queueName, adminUserId: req.user?.userId }, 'Admin: job retried');

  res.json({
    message: 'Job queued for retry',
    jobId: id,
    queue: queueName,
    requestId: req.requestId,
  });
}

/** DELETE /admin/jobs/:id — permanently remove a job */
export async function deleteJob(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { queue: queueName = 'ats-analysis' } = req.body;

  const queueMap: Record<string, Queue> = {
    'ats-analysis': getATSQueue(),
    'notifications': getNotificationQueue(),
    'analytics': getAnalyticsQueue(),
    'dead-letter': getDeadLetterQueue(),
  };

  const queue = queueMap[queueName];
  if (!queue) throw new NotFoundError(`Queue "${queueName}"`);

  const job = await queue.getJob(id);
  if (!job) throw new NotFoundError(`Job "${id}"`);

  await job.remove();

  logger.info({ jobId: id, queue: queueName, adminUserId: req.user?.userId }, 'Admin: job deleted');

  res.json({ message: 'Job deleted', jobId: id, requestId: req.requestId });
}

// ─────────────────────────────────────────────────────────────────────────────
// Queue Metrics
// ─────────────────────────────────────────────────────────────────────────────
async function getQueueMetrics(name: string, queue: Queue) {
  const [waiting, active, completed, failed, delayed, paused] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
    queue.getDelayedCount(),
    queue.getPausedCount(),
  ]);

  const workers = await queue.getWorkers();

  return {
    name,
    waiting,
    active,
    completed,
    failed,
    delayed,
    paused,
    workerCount: workers.length,
    workers: workers.map((w) => ({ id: w.id, addr: w.addr })),
  };
}

/** GET /admin/metrics/queues */
export async function getQueueMetricsAll(req: Request, res: Response): Promise<void> {
  const [ats, notif, analytics, leaderboard, dlq] = await Promise.all([
    getQueueMetrics('ats-analysis', getATSQueue()),
    getQueueMetrics('notifications', getNotificationQueue()),
    getQueueMetrics('analytics', getAnalyticsQueue()),
    getQueueMetrics('leaderboard-update', getLeaderboardQueue()),
    getQueueMetrics('dead-letter', getDeadLetterQueue()),
  ]);

  res.json({ queues: [ats, notif, analytics, leaderboard, dlq], requestId: req.requestId });
}

// ─────────────────────────────────────────────────────────────────────────────
// Redis Metrics
// ─────────────────────────────────────────────────────────────────────────────
/** GET /admin/metrics/redis */
export async function getRedisMetrics(req: Request, res: Response): Promise<void> {
  const redis = getRedisClient();
  const info = await redis.info();

  const parse = (key: string): string => {
    const match = info.match(new RegExp(`${key}:(.*?)\\r?\\n`));
    return match ? match[1].trim() : 'N/A';
  };

  const today = new Date().toISOString().slice(0, 10);
  const [atsTotal, atsToday] = await Promise.all([
    redis.get('analytics:ats:total'),
    redis.get(`analytics:ats:daily:${today}`),
  ]);

  // Cache hit rate: keyspace_hits / (keyspace_hits + keyspace_misses)
  const hits   = parseInt(parse('keyspace_hits')   || '0');
  const misses = parseInt(parse('keyspace_misses') || '0');
  const hitRate = hits + misses > 0 ? ((hits / (hits + misses)) * 100).toFixed(2) : 'N/A';

  res.json({
    memoryUsedMB: (parseInt(parse('used_memory')) / 1024 / 1024).toFixed(2),
    memoryPeakMB: (parseInt(parse('used_memory_peak')) / 1024 / 1024).toFixed(2),
    connectedClients: parse('connected_clients'),
    totalCommands: parse('total_commands_processed'),
    uptimeSeconds: parse('uptime_in_seconds'),
    cacheHitRate: `${hitRate}%`,
    keyspaceHits: hits,
    keyspaceMisses: misses,
    analytics: {
      atsTotalAllTime: parseInt(atsTotal ?? '0'),
      atsTodayCount: parseInt(atsToday ?? '0'),
    },
    requestId: req.requestId,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// System Health — Phase 5
// ─────────────────────────────────────────────────────────────────────────────
/** GET /admin/health */
export async function getSystemHealth(req: Request, res: Response): Promise<void> {
  const redis = getRedisClient();

  const checks = await Promise.allSettled([
    redis.ping().then(() => ({ service: 'redis', status: 'healthy' })),
    Promise.resolve({ service: 'mongodb', status: getMongoStatus() === 'connected' ? 'healthy' : 'degraded' }),
    getATSQueue().getWaitingCount().then(() => ({ service: 'ats-queue', status: 'healthy' })),
    getNotificationQueue().getWaitingCount().then(() => ({ service: 'notification-queue', status: 'healthy' })),
  ]);

  const services = checks.map((result, i) => {
    const names = ['redis', 'mongodb', 'ats-queue', 'notification-queue'];
    if (result.status === 'fulfilled') return result.value;
    return { service: names[i], status: 'unhealthy', error: String(result.reason) };
  });

  const allHealthy = services.every((s) => s.status === 'healthy');

  res.status(allHealthy ? 200 : 207).json({
    status: allHealthy ? 'healthy' : 'degraded',
    services,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    requestId: req.requestId,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Rate Limiter Stats for Admin Dashboard
// ─────────────────────────────────────────────────────────────────────────────
/** GET /admin/metrics/rate-limits */
export async function getRateLimitStats(req: Request, res: Response): Promise<void> {
  const redis = getRedisClient();

  const [blockedKeys, violationKeys] = await Promise.all([
    redis.keys('blocked:*'),
    redis.keys('violations:*'),
  ]);

  const blockedDetails = await Promise.all(
    blockedKeys.slice(0, 50).map(async (key) => {
      const [ttl, violations] = await Promise.all([
        redis.ttl(key),
        redis.get(key),
      ]);
      return { identifier: key.replace('blocked:', ''), ttlSeconds: ttl, violations: parseInt(violations ?? '0') };
    })
  );

  res.json({
    currentlyBlocked: blockedKeys.length,
    totalViolationTrackers: violationKeys.length,
    blocked: blockedDetails,
    requestId: req.requestId,
  });
}
