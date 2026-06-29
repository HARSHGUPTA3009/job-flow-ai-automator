import { Worker, Job } from 'bullmq';
import axios from 'axios';
import { createRedisConnection, getRedisClient } from '../config/redis';
import { getDeadLetterQueue } from '../queues';
import { groqPool } from '../config/groqPool';
import { IdempotencyService } from '../utils/idempotency';
import { eventBus, ResumeUploadedEvent } from '../events/eventBus';
import { logger } from '../utils/logger';

interface ATSResult {
  score: number;
  summary: string;
  suggestions: string[];
  detected_skills: string[];
}

function buildSystemPrompt(hasJD: boolean): string {
  if (hasJD) {
    return `You are a senior technical recruiter and ATS system evaluator at a top-tier tech company.
A candidate is applying to a SPECIFIC role. You have both the job description and their resume.

SCORING CRITERIA (100 points total):
- Keyword match with JD (25pts): required/preferred skills present in resume
- Quantified impact and metrics (20pts): numbers, percentages, scale
- Action verb strength (15pts): built, architected, optimized vs "helped", "assisted"
- Section structure (15pts): experience, education, skills, projects present
- Clarity and conciseness (15pts): no fluff, no walls of text
- ATS formatting compliance (10pts): no tables, no columns, no images

STRICT OUTPUT RULES:
- Return ONLY valid JSON. No markdown. No preamble.
- Schema: { "score": integer, "summary": "string", "suggestions": ["string"], "detected_skills": ["string"] }`;
  }

  return `You are a senior technical recruiter and ATS system evaluator at a top-tier tech company.

SCORING CRITERIA (100 points total):
- Quantified impact and metrics (20pts)
- Technical keyword density (20pts)
- Action verb strength (15pts)
- Section structure (15pts)
- Clarity and conciseness (15pts)
- ATS formatting compliance (15pts)

STRICT OUTPUT RULES:
- Return ONLY valid JSON. No markdown. No preamble.
- Schema: { "score": integer, "summary": "string", "suggestions": ["string"], "detected_skills": ["string"] }`;
}

async function callGroq(resumeText: string, jobDescription?: string): Promise<ATSResult> {
  const apiKey = groqPool.getKey();

  const userContent = jobDescription
    ? `Job Description:\n${jobDescription.slice(0, 1500)}\n\nResume:\n${resumeText.slice(0, 3000)}`
    : `Evaluate this resume:\n\n${resumeText.slice(0, 4000)}`;

  try {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: buildSystemPrompt(!!jobDescription) },
          { role: 'user', content: userContent },
        ],
        temperature: 0.1,
        max_tokens: 1000,
      },
      {
        headers: { Authorization: `Bearer ${apiKey}` },
        timeout: 30_000,
      }
    );

    let content = response.data.choices[0].message.content.trim();
    content = content.replace(/```json|```/g, '').trim();

    const parsed = JSON.parse(content) as ATSResult;
    if (typeof parsed.score !== 'number' || !Array.isArray(parsed.suggestions)) {
      throw new Error('Invalid ATS response structure from Groq');
    }

    return parsed;
  } catch (err: unknown) {
    if (axios.isAxiosError(err) && err.response?.status === 429) {
      groqPool.markExhausted(apiKey);
      throw new Error('Groq API rate limited — key marked exhausted, will retry with another key');
    }
    throw err;
  }
}

async function processATSJob(job: Job<ResumeUploadedEvent>): Promise<ATSResult> {
  const { resumeText, jobDescription, resumeHash, userId, correlationId } = job.data;

  const log = logger.child({
    jobId: job.id,
    attempt: job.attemptsMade + 1,
    userId,
    correlationId,
  });

  log.info('ATS job started');
  await job.updateProgress(10);

  // Check cache first — idempotency
  const cached = await IdempotencyService.getATSCache(resumeHash);
  if (cached) {
    log.info('ATS cache hit — returning cached result without re-processing');
    await job.updateProgress(100);
    return cached as ATSResult;
  }

  await job.updateProgress(25);
  log.info('Cache miss — calling Groq API');

  const result = await callGroq(resumeText, jobDescription);
  await job.updateProgress(75);

  // Cache result for idempotency
  await IdempotencyService.setATSCache(resumeHash, result);
  await job.updateProgress(90);

  // Emit downstream events (fire and forget — non-critical path)
  eventBus.emitATSCompleted({
    userId,
    email: job.data.email,
    resumeHash,
    score: result.score,
    summary: result.summary,
    suggestions: result.suggestions,
    detectedSkills: result.detected_skills,
    requestId: job.data.requestId,
    correlationId,
    timestamp: new Date().toISOString(),
  }).catch((e) => log.error({ err: e }, 'Failed to emit ats-completed event'));

  // Track usage in Redis for admin dashboard
  const redis = getRedisClient();
  const today = new Date().toISOString().slice(0, 10);
  await redis.incr(`stats:ats:daily:${today}`);
  await redis.expire(`stats:ats:daily:${today}`, 86400 * 7);

  await job.updateProgress(100);
  log.info({ score: result.score }, 'ATS job completed');

  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// Worker instantiation
// ─────────────────────────────────────────────────────────────────────────────
export function startATSWorker(): Worker {
  const worker = new Worker<ResumeUploadedEvent, ATSResult>(
    'ats-analysis',
    processATSJob,
    {
      connection: createRedisConnection(),
      concurrency: 3,
      limiter: { max: 10, duration: 1000 }, // max 10 jobs/sec globally
    }
  );

  worker.on('completed', (job, result) => {
    logger.info({ jobId: job.id, score: result.score }, 'ATS worker: job completed');
  });

  worker.on('failed', async (job, err) => {
    if (!job) return;
    const maxAttempts = job.opts.attempts ?? 5;
    const isFinal = job.attemptsMade >= maxAttempts;

    logger.error({
      jobId: job.id,
      attempt: job.attemptsMade,
      maxAttempts,
      err: err.message,
      isFinal,
    }, 'ATS worker: job failed');

    // Move to dead letter queue after final failure
    if (isFinal) {
      try {
        const dlq = getDeadLetterQueue();
        await dlq.add('failed-ats-job', {
          originalJobId: job.id,
          queue: 'ats-analysis',
          payload: job.data,
          failureReason: err.message,
          stackTrace: err.stack,
          retryCount: job.attemptsMade,
          failedAt: new Date().toISOString(),
        });
        logger.warn({ jobId: job.id }, 'Job moved to dead letter queue');
      } catch (dlqErr) {
        logger.error({ err: dlqErr }, 'Failed to move job to DLQ');
      }
    }
  });

  worker.on('error', (err) => {
    logger.error({ err }, 'ATS worker error');
  });

  worker.on('stalled', (jobId) => {
    logger.warn({ jobId }, 'ATS worker: job stalled — will be retried');
  });

  logger.info('ATS worker started (concurrency: 3)');
  return worker;
}
