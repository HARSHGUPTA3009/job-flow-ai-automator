const { Worker, QueueEvents } = require("bullmq");
const IORedis = require("ioredis");

const connection = new IORedis({
  maxRetriesPerRequest: null,
});

// 🔥 Increase workers
const WORKER_COUNT = 20;

let stats = {
  processed: 0,
  failed: 0,
  start: Date.now(),
};

// 🔥 Batch Processor
async function processBatch(jobs) {
  // simulate sending batch emails
  await new Promise((r) => setTimeout(r, 50));

  stats.processed += jobs.length;
}

for (let i = 0; i < WORKER_COUNT; i++) {
  new Worker(
    "emailQueue",
    async (job) => {
      // simulate batching (group multiple jobs)
      await processBatch([job.data]);
    },
    { connection, concurrency: 10 } // 🔥 parallel per worker
  ).on("failed", () => {
    stats.failed++;
  });
}

// 🔥 Metrics
setInterval(() => {
  const elapsed = (Date.now() - stats.start) / 1000;

  console.log("──── WORKER METRICS ────");
  console.log("Processed:", stats.processed);
  console.log("Failed:", stats.failed);
  console.log(
    "Throughput:",
    (stats.processed / elapsed).toFixed(2),
    "jobs/sec"
  );
  console.log("────────────────────────\n");
}, 5000);