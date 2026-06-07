// middleware/rateLimiter.js
const { RateLimiterRedis } = require('rate-limiter-flexible');
const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
});
const limiter = new RateLimiterRedis({
  storeClient: redis,
  points: 100,
  duration: 30000
});

module.exports = async (req, res, next) => {
  try {
    const key = req.user?.id || req.ip;
    await limiter.consume(key);
    next();
  } catch {
    res.status(429).json({ error: "Too many ATS requests" });
  }
};
