const keys = [
  process.env.GROQ_API_KEY1,
  process.env.GROQ_API_KEY2,
  process.env.GROQ_API_KEY3,
].filter(Boolean);

// Groq free tier: 30 req/min per key — adjust as needed
const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_KEY = 28; // leave 2 as buffer

async function getKey() {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;

  for (const key of keys) {
    const redisKey = `groq:sw:${key.slice(-6)}`; // use last 6 chars as identifier

    // Remove timestamps outside the sliding window
    await redis.zremrangebyscore(redisKey, '-inf', windowStart);

    // Count requests in current window
    const count = await redis.zcard(redisKey);

    if (count < MAX_REQUESTS_PER_KEY) {
      // Reserve this slot
      await redis.zadd(redisKey, now, `${now}-${Math.random()}`);
      await redis.pexpire(redisKey, WINDOW_MS * 2);
      return key;
    }
  }

  // All keys exhausted — return least-loaded key as fallback
  // (caller should handle 429 gracefully)
  throw new Error('All Groq API keys rate-limited. Retry after window resets.');
}

module.exports = { getKey };