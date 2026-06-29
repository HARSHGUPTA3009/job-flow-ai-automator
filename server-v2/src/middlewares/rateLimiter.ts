import { Request, Response, NextFunction } from 'express';
import { getRedisClient } from '../config/redis';
import { RateLimitError } from '../errors/AppError';
import { logger } from '../utils/logger';
import { JWTPayload } from './auth';

// ─────────────────────────────────────────────────────────────────────────────
// Lua script: Sliding Window Counter (atomic, distributed)
//   KEYS[1] = rate limit key
//   ARGV[1] = window size in seconds
//   ARGV[2] = max requests in window
//   ARGV[3] = current timestamp (ms)
//   Returns: [current_count, remaining, reset_at_ms]
// ─────────────────────────────────────────────────────────────────────────────
const SLIDING_WINDOW_LUA = `
local key       = KEYS[1]
local window    = tonumber(ARGV[1])
local max_req   = tonumber(ARGV[2])
local now_ms    = tonumber(ARGV[3])
local window_ms = window * 1000
local clear_before = now_ms - window_ms

redis.call('ZREMRANGEBYSCORE', key, '-inf', clear_before)
local count = redis.call('ZCARD', key)

if count >= max_req then
  local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
  local reset_at = tonumber(oldest[2]) + window_ms
  return {count, 0, reset_at}
end

redis.call('ZADD', key, now_ms, now_ms .. math.random(1, 999999))
redis.call('EXPIRE', key, window)
local remaining = max_req - count - 1
return {count + 1, remaining, now_ms + window_ms}
`;

// ─────────────────────────────────────────────────────────────────────────────
// Lua script: Token Bucket (burst control)
//   KEYS[1] = bucket key
//   ARGV[1] = max tokens (burst capacity)
//   ARGV[2] = refill rate tokens/second
//   ARGV[3] = current timestamp (ms)
//   Returns: [allowed, remaining_tokens]
// ─────────────────────────────────────────────────────────────────────────────
const TOKEN_BUCKET_LUA = `
local key         = KEYS[1]
local max_tokens  = tonumber(ARGV[1])
local refill_rate = tonumber(ARGV[2])
local now_ms      = tonumber(ARGV[3])

local data = redis.call('HMGET', key, 'tokens', 'last_refill')
local tokens     = tonumber(data[1]) or max_tokens
local last_refill = tonumber(data[2]) or now_ms

local elapsed_sec = (now_ms - last_refill) / 1000
local new_tokens = math.min(max_tokens, tokens + elapsed_sec * refill_rate)

if new_tokens < 1 then
  redis.call('HMSET', key, 'tokens', new_tokens, 'last_refill', now_ms)
  redis.call('EXPIRE', key, 3600)
  return {0, math.floor(new_tokens)}
end

new_tokens = new_tokens - 1
redis.call('HMSET', key, 'tokens', new_tokens, 'last_refill', now_ms)
redis.call('EXPIRE', key, 3600)
return {1, math.floor(new_tokens)}
`;

// ─────────────────────────────────────────────────────────────────────────────
// Dynamic blocking with escalating penalties
// ─────────────────────────────────────────────────────────────────────────────
const BLOCK_DURATIONS_SECONDS = [60, 300, 1800, 86400]; // 1m, 5m, 30m, 24h

async function checkBlocked(key: string): Promise<boolean> {
  const redis = getRedisClient();
  const blocked = await redis.get(`blocked:${key}`);
  return blocked !== null;
}

async function escalateBlock(key: string): Promise<number> {
  const redis = getRedisClient();
  const violationKey = `violations:${key}`;
  const violations = await redis.incr(violationKey);
  await redis.expire(violationKey, 86400 * 7); // track for 1 week

  const durationIdx = Math.min(violations - 1, BLOCK_DURATIONS_SECONDS.length - 1);
  const duration = BLOCK_DURATIONS_SECONDS[durationIdx];

  await redis.setex(`blocked:${key}`, duration, String(violations));
  logger.warn({ key, violations, duration }, 'Rate limit violation → block escalated');
  return duration;
}

// ─────────────────────────────────────────────────────────────────────────────
// Core rate limit factory
// ─────────────────────────────────────────────────────────────────────────────
interface RateLimitOptions {
  windowSeconds: number;
  maxRequests: number;
  keyPrefix: string;
  keyFn?: (req: Request) => string;
  skipBlocking?: boolean;
  burst?: { maxTokens: number; refillRate: number };
}

export function createRateLimiter(opts: RateLimitOptions) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const redis = getRedisClient();
    const baseKey = opts.keyFn ? opts.keyFn(req) : (req.user?.userId ?? req.ip ?? 'unknown');
    const fullKey = `rl:${opts.keyPrefix}:${baseKey}`;
    const now = Date.now();

    try {
      // 1. Check if IP/user is blocked
      if (!opts.skipBlocking && await checkBlocked(baseKey)) {
        const ttl = await redis.ttl(`blocked:${baseKey}`);
        throw new RateLimitError('You have been temporarily blocked due to excessive requests', ttl);
      }

      // 2. Token bucket burst check (if configured)
      if (opts.burst) {
        const bucketKey = `${fullKey}:bucket`;
        const [allowed, remaining] = await redis.eval(
          TOKEN_BUCKET_LUA, 1, bucketKey,
          opts.burst.maxTokens, opts.burst.refillRate, now
        ) as [number, number];

        res.setHeader('x-burst-remaining', remaining);

        if (!allowed) {
          await escalateBlock(baseKey);
          throw new RateLimitError('Burst limit exceeded');
        }
      }

      // 3. Sliding window check
      const [count, remaining, resetAt] = await redis.eval(
        SLIDING_WINDOW_LUA, 1, fullKey,
        opts.windowSeconds, opts.maxRequests, now
      ) as [number, number, number];

      // Set standard rate limit headers
      res.setHeader('x-ratelimit-limit', opts.maxRequests);
      res.setHeader('x-ratelimit-remaining', Math.max(0, remaining));
      res.setHeader('x-ratelimit-reset', Math.ceil(resetAt / 1000));
      res.setHeader('x-ratelimit-window', opts.windowSeconds);

      if (remaining < 0) {
        const retryAfter = Math.ceil((resetAt - now) / 1000);
        res.setHeader('retry-after', retryAfter);

        if (!opts.skipBlocking) {
          await escalateBlock(baseKey);
        }

        throw new RateLimitError(
          `Rate limit exceeded. Retry after ${retryAfter}s`,
          retryAfter
        );
      }

      next();
    } catch (err) {
      if (err instanceof RateLimitError) throw err;
      // Redis failure — fail open (don't block legitimate traffic)
      logger.error({ err, key: fullKey }, 'Rate limiter Redis error — failing open');
      next();
    }
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Pre-built limiters
// ─────────────────────────────────────────────────────────────────────────────

/** 500 req/min per IP — global gateway protection */
export const globalRateLimiter = createRateLimiter({
  keyPrefix: 'global',
  keyFn: (req) => req.ip ?? 'unknown',
  windowSeconds: 60,
  maxRequests: 500,
  burst: { maxTokens: 20, refillRate: 1 },
});

/** 100 req/min per authenticated user */
export const userRateLimiter = createRateLimiter({
  keyPrefix: 'user',
  keyFn: (req) => req.user?.userId ?? req.ip ?? 'unknown',
  windowSeconds: 60,
  maxRequests: 100,
});

/** ATS endpoint: 10 req/hour — heavy endpoint */
export const atsRateLimiter = createRateLimiter({
  keyPrefix: 'ats',
  keyFn: (req) => req.user?.userId ?? req.ip ?? 'unknown',
  windowSeconds: 3600,
  maxRequests: 10,
});

/** Leaderboard: 100 req/min */
export const leaderboardRateLimiter = createRateLimiter({
  keyPrefix: 'leaderboard',
  keyFn: (req) => req.user?.userId ?? req.ip ?? 'unknown',
  windowSeconds: 60,
  maxRequests: 100,
  skipBlocking: true,
});

// ─────────────────────────────────────────────────────────────────────────────
// Role-based daily ATS limits
// ─────────────────────────────────────────────────────────────────────────────
export async function checkDailyATSQuota(user: JWTPayload): Promise<void> {
  if (user.role === 'admin') return; // admins unlimited

  const limits: Record<JWTPayload['role'], number> = {
    free: 10,
    premium: 100,
    admin: Infinity,
  };

  const dailyLimit = limits[user.role];
  const redis = getRedisClient();
  const today = new Date().toISOString().slice(0, 10);
  const key = `ats:daily:${user.userId}:${today}`;

  const count = await redis.incr(key);
  await redis.expire(key, 86400);

  if (count > dailyLimit) {
    throw new RateLimitError(
      `Daily ATS limit reached (${dailyLimit} for ${user.role} plan). Upgrade for more analyses.`
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Abuse detection middleware: spam resume uploads
// ─────────────────────────────────────────────────────────────────────────────
export async function trackResumeUpload(userId: string, ip: string): Promise<void> {
  const redis = getRedisClient();
  const key = `abuse:uploads:${userId}:${new Date().toISOString().slice(0, 10)}`;
  const count = await redis.incr(key);
  await redis.expire(key, 86400);

  if (count > 50) {
    await redis.setex(`blocked:${userId}`, 3600, '1');
    logger.warn({ userId, ip, count }, 'User blocked for excessive resume uploads');
    throw new RateLimitError('Suspicious upload activity detected. Account temporarily limited.');
  }
}
