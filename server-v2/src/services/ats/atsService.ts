import multer from 'multer';
import pdfParse from 'pdf-parse';
import { Request, Response } from 'express';
import { IdempotencyService } from '../../utils/idempotency';
import { eventBus } from '../../events/eventBus';
import { checkDailyATSQuota, trackResumeUpload } from '../../middlewares/rateLimiter';
import { getATSQueue } from '../../queues';
import { ValidationError } from '../../errors/AppError';
import { logger } from '../../utils/logger';
import { z } from 'zod';

export const resumeUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files are accepted'));
  },
});

const ATSRequestSchema = z.object({
  jobDescription: z.string().max(3000).optional(),
});

function cleanText(text: string): string {
  return text
    .replace(/[^\x00-\x7F]/g, ' ')
    .replace(/\r\n/g, '\n')
    .replace(/\n{2,}/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function analyzeResume(req: Request, res: Response): Promise<void> {
  const user = req.user!;

  await checkDailyATSQuota(user);

  const { jobDescription } = ATSRequestSchema.parse(req.body);

  if (!req.file) throw new ValidationError('PDF file is required');

  let resumeText: string;
  try {
    const parsed = await pdfParse(req.file.buffer);
    resumeText = cleanText(parsed.text);
  } catch {
    throw new ValidationError('Failed to parse PDF. Ensure it is a text-based (not scanned) PDF.');
  }

  if (resumeText.length < 200) {
    throw new ValidationError('Resume text too short. Use a clearer, text-based PDF.');
  }

  await trackResumeUpload(user.userId, req.ip ?? 'unknown');

  const fingerprint = IdempotencyService.buildATSFingerprint(resumeText, jobDescription);

  const cached = await IdempotencyService.getATSCache(fingerprint);
  if (cached) {
    logger.info({ userId: user.userId }, 'ATS: returning cached result');
    res.json({ status: 'completed', cached: true, data: cached, requestId: req.requestId });
    return;
  }

  const jobId = await eventBus.emitResumeUploaded({
    userId:        user.userId,
    email:         user.email,
    resumeHash:    fingerprint,
    resumeText,
    jobDescription,
    requestId:     req.requestId,
    correlationId: req.correlationId,
    timestamp:     new Date().toISOString(),
  });

  await IdempotencyService.trackPendingJob(fingerprint, jobId, user.userId);

  logger.info({ userId: user.userId, jobId, requestId: req.requestId }, 'ATS: job dispatched');

  res.status(202).json({
    status: 'queued',
    jobId,
    fingerprint,
    message: 'Resume queued for analysis. Poll /api/v1/ats/status/:jobId for result.',
    estimatedWaitMs: 5000,
    requestId: req.requestId,
  });
}

export async function getATSStatus(req: Request, res: Response): Promise<void> {
  const { jobId } = req.params;
  const queue = getATSQueue();

  const job = await queue.getJob(jobId);
  if (!job) {
    res.status(404).json({ error: 'Job not found', jobId, requestId: req.requestId });
    return;
  }

  const state    = await job.getState();
  const progress = job.progress;

  const response: Record<string, unknown> = {
    jobId, state, progress,
    attempts:  job.attemptsMade,
    createdAt: new Date(job.timestamp).toISOString(),
    requestId: req.requestId,
  };

  if (state === 'completed') response.data = job.returnvalue;
  if (state === 'failed')    response.error = job.failedReason;
  if (state === 'delayed')   response.nextAttemptAt = job.opts.delay
    ? new Date(job.timestamp + job.opts.delay).toISOString()
    : null;

  res.json(response);
}
