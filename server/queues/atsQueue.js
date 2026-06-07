// queues/atsQueue.js
const { Queue } = require('bullmq');
const IORedis = require('ioredis');

const connection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

const atsQueue = new Queue('ats', { connection });

module.exports = atsQueue;