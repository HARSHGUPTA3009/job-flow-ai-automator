// queues/atsQueue.js
const { Queue } = require('bullmq');
const IORedis = require('ioredis');

const connection = new IORedis(process.env.REDIS_URL, {
  tls: {},
  maxRetriesPerRequest: null,
});

const atsQueue = new Queue('ats', { connection });

module.exports = atsQueue;