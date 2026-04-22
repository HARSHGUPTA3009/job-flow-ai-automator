const express = require("express");
const { Queue, Worker } = require("bullmq");
const IORedis = require("ioredis");
const connection = new IORedis({
  maxRetriesPerRequest: null,
});

const queue = new Queue("emailQueue", { connection });

let stats = {
  received: 0,
  processed: 0,
  failed: 0,
  startTime: Date.now(),
};

// ─── API ─────────────────────────────────────────────
const app = express();
app.use(express.json());

app.post("/send-email", async (req, res) => {
  stats.received++;

  await queue.add("sendEmail", req.body, {
    attempts: 3,
    backoff: { type: "exponential", delay: 1000 },
    removeOnComplete: true,
  });

  res.json({ status: "queued" });
});

// ─── WORKERS (3–5 workers) ───────────────────────────
const WORKER_COUNT = 5;

for (let i = 0; i < WORKER_COUNT; i++) {
  new Worker(
    "emailQueue",
    async (job) => {
      // simulate email send (random delay)
      await new Promise((r) =>
        setTimeout(r, Math.random() * 50)
      );

      // simulate occasional failure
      if (Math.random() < 0.02) {
        throw new Error("Random failure");
      }

      stats.processed++;
    },
    { connection }
  ).on("failed", () => {
    stats.failed++;
  });
}

// ─── METRICS LOGGER ──────────────────────────────────
setInterval(() => {
  const elapsed = (Date.now() - stats.startTime) / 1000;

  console.log("──── SYSTEM METRICS ────");
  console.log("Requests received:", stats.received);
  console.log("Jobs processed:", stats.processed);
  console.log("Failures:", stats.failed);
  console.log(
    "Throughput:",
    (stats.processed / elapsed).toFixed(2),
    "jobs/sec"
  );
  console.log("────────────────────────\n");
}, 5000);

// ─── START SERVER ────────────────────────────────────
app.listen(3000, () => {
  console.log("🚀 Server running on http://localhost:3000");
});