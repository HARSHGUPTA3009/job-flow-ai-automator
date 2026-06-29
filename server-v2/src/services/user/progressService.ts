import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { getRedisClient } from '../../config/redis';
import { eventBus } from '../../events/eventBus';
import { logger } from '../../utils/logger';
import { z } from 'zod';

// ─────────────────────────────────────────────────────────────────────────────
// Reuse Progress model — checks mongoose.models first to avoid re-registration
// (old server.cjs may have already registered it in the same Node process
//  if both servers share the same process, which they don't — but safe either way)
// ─────────────────────────────────────────────────────────────────────────────
const ProgressSchema = new mongoose.Schema(
  {
    userId:           { type: String, required: true, index: true },
    questionId:       { type: String, required: true },
    questionName:     { type: String, default: '' },
    topic:            { type: String, required: true },
    diff:             { type: String, enum: ['easy', 'medium', 'hard'], required: true },
    lists:            { type: [String], default: [] },
    solved:           { type: Boolean, default: false },
    starred:          { type: Boolean, default: false },
    solvedAt:         { type: Date, default: null },
    lastActivityDate: { type: String, default: null },
    email:            { type: String, default: '' },
    name:             { type: String, default: '' },
    picture:          { type: String, default: '' },
    college:          { type: String, default: '' },
  },
  { timestamps: true }
);

ProgressSchema.index({ userId: 1, questionId: 1 }, { unique: true });
ProgressSchema.index({ solved: 1, solvedAt: -1 });
ProgressSchema.index({ userId: 1, solved: 1 });
ProgressSchema.index({ userId: 1, topic: 1, solved: 1 });

export const Progress =
  mongoose.models['Progress'] ?? mongoose.model('Progress', ProgressSchema);

// ─────────────────────────────────────────────────────────────────────────────
// Validation schemas
// ─────────────────────────────────────────────────────────────────────────────
const ToggleSchema = z.object({
  questionId:   z.string().min(1),
  questionName: z.string().optional().default(''),
  topic:        z.string().min(1),
  diff:         z.enum(['easy', 'medium', 'hard']),
  lists:        z.array(z.string()).default([]),
  solved:       z.boolean(),
});

const StarSchema = z.object({
  questionId:   z.string().min(1),
  questionName: z.string().optional().default(''),
  topic:        z.string().min(1),
  diff:         z.enum(['easy', 'medium', 'hard']),
  lists:        z.array(z.string()).default([]),
  starred:      z.boolean(),
});

const toDateStr = (d: Date = new Date()) => d.toISOString().slice(0, 10);

async function computeStreak(userId: string): Promise<number> {
  const records = await Progress.find(
    { userId, solved: true, solvedAt: { $ne: null } },
    { solvedAt: 1 }
  ).lean<{ solvedAt: Date }[]>();

  const days = [...new Set(records.map((r) => toDateStr(r.solvedAt)))].sort().reverse();
  if (!days.length) return 0;

  const today     = toDateStr();
  const yesterday = toDateStr(new Date(Date.now() - 86_400_000));
  if (days[0] !== today && days[0] !== yesterday) return 0;

  let streak = 1;
  for (let i = 1; i < days.length; i++) {
    const diff = Math.round(
      (new Date(days[i - 1]).getTime() - new Date(days[i]).getTime()) / 86_400_000
    );
    if (diff === 1) streak++;
    else break;
  }
  return streak;
}

// ─────────────────────────────────────────────────────────────────────────────
// Handlers
// ─────────────────────────────────────────────────────────────────────────────
export async function toggleProgress(req: Request, res: Response): Promise<void> {
  const user = req.user!;
  const body = ToggleSchema.parse(req.body);

  const doc = await Progress.findOneAndUpdate(
    { userId: user.userId, questionId: body.questionId },
    {
      $set: {
        userId:   user.userId,
        email:    user.email,
        name:     user.name,
        college:  '',
        ...body,
        solvedAt:         body.solved ? new Date() : null,
        lastActivityDate: body.solved ? toDateStr() : null,
      },
    },
    { upsert: true, new: true }
  );

  if (body.solved) {
    eventBus.emitDSAProgressUpdated({
      userId:       user.userId,
      email:        user.email,
      questionId:   body.questionId,
      questionName: body.questionName ?? body.questionId,
      topic:        body.topic,
      diff:         body.diff,
      solved:       body.solved,
      timestamp:    new Date().toISOString(),
    }).catch((e) => logger.error({ err: e }, 'Failed to emit dsa-progress event'));
  }

  res.json({ success: true, doc, requestId: req.requestId });
}

export async function starQuestion(req: Request, res: Response): Promise<void> {
  const user = req.user!;
  const body = StarSchema.parse(req.body);

  const doc = await Progress.findOneAndUpdate(
    { userId: user.userId, questionId: body.questionId },
    { $set: { userId: user.userId, email: user.email, name: user.name, ...body } },
    { upsert: true, new: true }
  );

  res.json({ success: true, doc, requestId: req.requestId });
}

export async function getMyProgress(req: Request, res: Response): Promise<void> {
  const records = await Progress.find({ userId: req.user!.userId }).lean();
  res.json(records);
}

export async function getLeaderboard(req: Request, res: Response): Promise<void> {
  const { filter = 'all', diff, topic } = req.query as Record<string, string>;
  const redis = getRedisClient();

  const cacheKey = `cache:leaderboard:${filter}:${diff ?? 'all'}:${topic ?? 'all'}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    res.setHeader('x-cache', 'HIT');
    res.json(JSON.parse(cached));
    return;
  }

  const matchStage: Record<string, unknown> = { solved: true };
  if (diff  && diff  !== 'all') matchStage.diff  = diff;
  if (topic && topic !== 'all') matchStage.topic = topic;
  if (filter === 'weekly') {
    matchStage.solvedAt = { $gte: new Date(Date.now() - 7 * 86_400_000) };
  }

  const pipeline = [
    { $match: matchStage },
    {
      $group: {
        _id:           '$userId',
        email:         { $first: '$email'   },
        name:          { $first: '$name'    },
        picture:       { $first: '$picture' },
        college:       { $first: '$college' },
        easySolved:    { $sum: { $cond: [{ $eq: ['$diff', 'easy']   }, 1, 0] } },
        mediumSolved:  { $sum: { $cond: [{ $eq: ['$diff', 'medium'] }, 1, 0] } },
        hardSolved:    { $sum: { $cond: [{ $eq: ['$diff', 'hard']   }, 1, 0] } },
        starredCount:  { $sum: { $cond: ['$starred', 1, 0] } },
        totalSolved:   { $sum: 1 },
        lastActive:    { $max: '$solvedAt' },
        topicProgress: { $push: { topic: '$topic', diff: '$diff' } },
      },
    },
    {
      $addFields: {
        totalScore: {
          $add: [
            { $multiply: ['$easySolved',   1] },
            { $multiply: ['$mediumSolved', 3] },
            { $multiply: ['$hardSolved',   7] },
            { $multiply: ['$starredCount', 1] },
          ],
        },
      },
    },
    { $sort: { totalScore: -1, totalSolved: -1, lastActive: -1 } },
  ];

  const results = await Progress.aggregate(pipeline);

  type Entry = {
    userId: string; email: string; name: string; picture: string; college: string;
    rank: number; totalScore: number; totalSolved: number;
    easySolved: number; mediumSolved: number; hardSolved: number;
    starredCount: number; streak: number; lastActive: Date;
    topicProgress: Record<string, { easy: number; medium: number; hard: number }>;
    badge?: string;
  };

  const entries: Entry[] = await Promise.all(
    results.map(async (u, idx) => {
      const streak      = await computeStreak(u._id);
      const streakBonus = Math.min(streak, 30) * 2;

      const topicProgress: Record<string, { easy: number; medium: number; hard: number }> = {};
      for (const { topic: t, diff: d } of u.topicProgress) {
        if (!topicProgress[t]) topicProgress[t] = { easy: 0, medium: 0, hard: 0 };
        topicProgress[t][d as 'easy' | 'medium' | 'hard']++;
      }

      return {
        userId:       u._id,
        email:        u.email,
        name:         u.name || u.email?.split('@')[0] || 'Unknown',
        picture:      u.picture,
        college:      u.college,
        rank:         idx + 1,
        totalScore:   u.totalScore + streakBonus,
        totalSolved:  u.totalSolved,
        easySolved:   u.easySolved,
        mediumSolved: u.mediumSolved,
        hardSolved:   u.hardSolved,
        starredCount: u.starredCount,
        streak,
        lastActive:   u.lastActive,
        topicProgress,
      };
    })
  );

  entries.sort((a, b) => b.totalScore - a.totalScore || b.totalSolved - a.totalSolved);
  entries.forEach((e, i) => { e.rank = i + 1; });

  if (entries[0]) entries[0].badge = 'gold';
  if (entries[1]) entries[1].badge = 'silver';
  if (entries[2]) entries[2].badge = 'bronze';

  const maxStreak = Math.max(...entries.map((e) => e.streak), 0);
  const streakKing = entries.find((e) => e.streak === maxStreak && maxStreak > 0);
  if (streakKing && !streakKing.badge) streakKing.badge = 'streak';

  await redis.setex(cacheKey, 30, JSON.stringify(entries));
  res.setHeader('x-cache', 'MISS');
  res.json(entries);
}
