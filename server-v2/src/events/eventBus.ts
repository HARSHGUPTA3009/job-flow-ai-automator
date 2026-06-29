import { getATSQueue, getAnalyticsQueue, getLeaderboardQueue, getNotificationQueue } from '../queues';
import { logger } from '../utils/logger';

// ─────────────────────────────────────────────────────────────────────────────
// Event type registry — all system events with typed payloads
// ─────────────────────────────────────────────────────────────────────────────
export interface ResumeUploadedEvent {
  userId: string;
  email: string;
  resumeHash: string;
  resumeText: string;
  jobDescription?: string;
  requestId: string;
  correlationId: string;
  timestamp: string;
}

export interface ATSAnalysisCompletedEvent {
  userId: string;
  email: string;
  resumeHash: string;
  score: number;
  summary: string;
  suggestions: string[];
  detectedSkills: string[];
  requestId: string;
  correlationId: string;
  timestamp: string;
}

export interface DSAProgressUpdatedEvent {
  userId: string;
  email: string;
  questionId: string;
  questionName: string;
  topic: string;
  diff: 'easy' | 'medium' | 'hard';
  solved: boolean;
  timestamp: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// EventBus — centralizes all event dispatching
// All service-to-service communication MUST go through here
// ─────────────────────────────────────────────────────────────────────────────
class EventBus {
  /**
   * Emit: resume uploaded → ATS analysis queue
   */
  async emitResumeUploaded(event: ResumeUploadedEvent): Promise<string> {
    const queue = getATSQueue();
    const job = await queue.add('analyze-resume', event, {
      jobId: `ats:${event.resumeHash}`, // idempotency: same hash = same job ID
      priority: 1,
    });
    logger.info({ jobId: job.id, userId: event.userId, correlationId: event.correlationId }, 'Event: resume-uploaded dispatched');
    return job.id!;
  }

  /**
   * Emit: ATS analysis completed → notification + analytics + leaderboard queues
   */
  async emitATSCompleted(event: ATSAnalysisCompletedEvent): Promise<void> {
    const [notif, analytics] = await Promise.all([
      getNotificationQueue().add('ats-complete-notification', event),
      getAnalyticsQueue().add('track-ats-analysis', event),
    ]);
    logger.info({
      userId: event.userId,
      score: event.score,
      notifJobId: notif.id,
      analyticsJobId: analytics.id,
    }, 'Event: ats-completed dispatched to notification + analytics');
  }

  /**
   * Emit: DSA progress updated → leaderboard queue
   */
  async emitDSAProgressUpdated(event: DSAProgressUpdatedEvent): Promise<void> {
    const job = await getLeaderboardQueue().add('update-leaderboard', event, {
      // Debounce: one leaderboard update per user per 5s
      jobId: `lb:${event.userId}:${Math.floor(Date.now() / 5000)}`,
    });
    logger.debug({ jobId: job.id, userId: event.userId }, 'Event: dsa-progress dispatched');
  }
}

export const eventBus = new EventBus();
