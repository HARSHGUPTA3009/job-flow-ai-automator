const cluster = require("cluster");
const os = require("os");

const numCPUs = os.cpus().length;

if (cluster.isPrimary) {
  console.log(`🚀 Master running on ${numCPUs} cores`);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker) => {
    console.log(`Worker ${worker.process.pid} died, restarting...`);
    cluster.fork();
  });

} else {
  const express = require("express");
  const { Queue } = require("bullmq");
  const IORedis = require("ioredis");

  const redis = new IORedis({ maxRetriesPerRequest: null });
  const queue = new Queue("emailQueue", { connection: redis });

  const app = express();
  app.use(express.json());

  // 🔥 Rate Limiter (100 req/sec per user)
  const LIMIT = 100;
  const WINDOW = 1; // second

  app.post("/send-email", async (req, res) => {
    const userId = req.body.userId || "anon";

    const key = `rate:${userId}`;
    const count = await redis.incr(key);

    if (count === 1) {
      await redis.expire(key, WINDOW);
    }

    if (count > LIMIT) {
      return res.status(429).json({ error: "Rate limit exceeded" });
    }

    await queue.add("emailBatch", req.body, {
      attempts: 3,
      backoff: { type: "exponential", delay: 1000 },
      removeOnComplete: true,
    });

    res.json({ status: "queued" });
  });

  app.listen(3000, () => {
    console.log(`API running on PID ${process.pid}`);
  });
}