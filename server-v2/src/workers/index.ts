import 'express-async-errors';
import { Worker } from 'bullmq';
import { connectMongoDB, closeMongoDB } from '../config/mongodb';
import { getRedisClient, closeRedis } from '../config/redis';
import { logger } from '../utils/logger';
import { startATSWorker } from './atsWorker';
import { startNotificationWorker, startAnalyticsWorker, startLeaderboardWorker } from './supportWorkers';

async function main(): Promise<void> {
  logger.info('Starting AutoJobFlow v2 Workers...');

  await connectMongoDB();
  getRedisClient(); // warm connection

  const workers: Worker[] = [
    startATSWorker(),
    startNotificationWorker(),
    startAnalyticsWorker(),
    startLeaderboardWorker(),
  ];

  logger.info(`${workers.length} workers running`);

  // ─────────────────────────────────────────────────────────────────────────
  // Graceful shutdown — Phase 3
  // Workers finish current job before shutting down. No job loss.
  // ─────────────────────────────────────────────────────────────────────────
  async function gracefulShutdown(signal: string): Promise<void> {
    logger.warn({ signal }, 'Shutdown signal received — draining workers...');

    // Close all workers — they will finish the current job first
    await Promise.all(
      workers.map((w) =>
        w.close().catch((err) => logger.error({ err }, `Failed to close worker`))
      )
    );

    logger.info('All workers drained. Closing connections...');
    await closeMongoDB();
    await closeRedis();

    logger.info('Graceful shutdown complete');
    process.exit(0);
  }

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT',  () => gracefulShutdown('SIGINT'));

  process.on('uncaughtException', (err) => {
    logger.fatal({ err }, 'Uncaught exception in worker process');
    process.exit(1);
  });

  process.on('unhandledRejection', (reason) => {
    logger.fatal({ reason }, 'Unhandled rejection in worker process');
    process.exit(1);
  });
}

main().catch((err) => {
  logger.fatal({ err }, 'Worker startup failed');
  process.exit(1);
});
