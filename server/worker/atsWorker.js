// workers/atsWorker.js
const { Worker } = require('bullmq');
const IORedis = require('ioredis');
const axios = require('axios');
const { getKey } = require('../config/groqPool');

const connection = new IORedis(process.env.REDIS_URL);

new Worker('ats', async (job) => {
  const { resumeText } = job.data;

  const response = await axios.post(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: 'Return JSON only' },
        { role: 'user', content: resumeText.slice(0, 4000) }
      ]
    },
    {
      headers: {
        Authorization: `Bearer ${getKey()}`
      }
    }
  );

  let content = response.data.choices[0].message.content.trim();
  content = content.replace(/```json|```/g, '').trim();

  return JSON.parse(content);

}, { connection });