import IORedis, { Redis } from 'ioredis';
import { config } from './env';
import { logger } from '../utils/logger';

let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (redisClient) return redisClient;

  const isTLS = config.REDIS_URL.startsWith('rediss://');

  redisClient = new IORedis(config.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    connectTimeout: 10_000,
    lazyConnect: false,
    ...(isTLS ? { tls: {} } : {}),
  });

  redisClient.on('connect', () => logger.info('Redis connected'));
  redisClient.on('ready',   () => logger.info('Redis ready'));
  redisClient.on('error',   (err) => logger.error({ err }, 'Redis error'));
  redisClient.on('close',   () => logger.warn('Redis connection closed'));
  redisClient.on('reconnecting', () => logger.warn('Redis reconnecting'));

  return redisClient;
}

// BullMQ requires a separate connection per queue/worker
export function createRedisConnection(): Redis {
  const isTLS = config.REDIS_URL.startsWith('rediss://');
  return new IORedis(config.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    ...(isTLS ? { tls: {} } : {}),
  });
}

export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}
