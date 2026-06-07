const express = require('express');
const Progress = require('../models/Progress');

const router = express.Router();

// ─── Helper: today as YYYY-MM-DD ─────────────────────────────────────────────
const toDateStr = (d = new Date()) => d.toISOString().slice(0, 10);

// ─── Helper: compute streak for a userId ─────────────────────────────────────
async function computeStreak(userId) {
  // Get all distinct dates the user solved something, sorted desc
  const records = await Progress.find({ userId, solved: true, solvedAt: { $ne: null } })
    .select('solvedAt')
    .lean();

  const days = [...new Set(records.map(r => toDateStr(r.solvedAt)))].sort().reverse();
  if (!days.length) return 0;

  const today = toDateStr();
  const yesterday = toDateStr(new Date(Date.now() - 86_400_000));

  // Streak must include today or yesterday to be "active"
  if (days[0] !== today && days[0] !== yesterday) return 0;

  let streak = 1;
  for (let i = 1; i < days.length; i++) {
    const prev = new Date(days[i - 1]);
    const curr = new Date(days[i]);
    const diff = Math.round((prev - curr) / 86_400_000);
    if (diff === 1) streak++;
    else break;
  }
  return streak;
}

// ─── POST /api/progress/toggle ───────────────────────────────────────────────
// Toggle solved state for one question.
// Body: { questionId, questionName, topic, diff, lists, solved }
// Auth: req.user must be set by your auth middleware (id, email, name, picture, college)
router.post('/toggle', async (req, res) => {
  try {
    const { questionId, questionName, topic, diff, lists = [], solved } = req.body;
    const { id: userId, email, name = '', picture = '', college = '' } = req.user;

    if (!questionId || !topic || !diff) {
      return res.status(400).json({ error: 'questionId, topic, diff are required' });
    }

    const solvedAt = solved ? new Date() : null;

    const doc = await Progress.findOneAndUpdate(
      { userId, questionId },
      {
        $set: {
          userId, email, name, picture, college,
          questionId, questionName, topic, diff, lists,
          solved, solvedAt,
          lastActivityDate: solved ? toDateStr() : null,
        },
      },
      { upsert: true, new: true }
    );

    res.json({ success: true, doc });
  } catch (err) {
    console.error('progress/toggle error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── POST /api/progress/star ─────────────────────────────────────────────────
// Toggle starred state for one question.
router.post('/star', async (req, res) => {
  try {
    const { questionId, questionName, topic, diff, lists = [], starred } = req.body;
    const { id: userId, email, name = '', picture = '', college = '' } = req.user;

    const doc = await Progress.findOneAndUpdate(
      { userId, questionId },
      {
        $set: {
          userId, email, name, picture, college,
          questionId, questionName, topic, diff, lists,
          starred,
        },
      },
      { upsert: true, new: true }
    );

    res.json({ success: true, doc });
  } catch (err) {
    console.error('progress/star error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── GET /api/progress/me ─────────────────────────────────────────────────────
// Returns all progress records for the logged-in user.
router.get('/me', async (req, res) => {
  try {
    const { id: userId } = req.user;
    const records = await Progress.find({ userId }).lean();
    res.json(records);
  } catch (err) {
    console.error('progress/me error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── GET /api/leaderboard ─────────────────────────────────────────────────────
// Aggregates all users' progress into ranked leaderboard entries.
// Query params: filter (all|college|weekly), diff, topic
router.get('/leaderboard', async (req, res) => {
  try {
    const { filter = 'all', diff, topic } = req.query;

    const matchStage = { solved: true };
    if (diff && diff !== 'all')   matchStage.diff  = diff;
    if (topic && topic !== 'all') matchStage.topic = topic;

    // For weekly filter: only last 7 days
    if (filter === 'weekly') {
      matchStage.solvedAt = { $gte: new Date(Date.now() - 7 * 86_400_000) };
    }

    const pipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: '$userId',
          email:        { $first: '$email'   },
          name:         { $first: '$name'    },
          picture:      { $first: '$picture' },
          college:      { $first: '$college' },
          easySolved:   { $sum: { $cond: [{ $eq: ['$diff', 'easy']   }, 1, 0] } },
          mediumSolved: { $sum: { $cond: [{ $eq: ['$diff', 'medium'] }, 1, 0] } },
          hardSolved:   { $sum: { $cond: [{ $eq: ['$diff', 'hard']   }, 1, 0] } },
          starredCount: { $sum: { $cond: ['$starred', 1, 0] } },
          totalSolved:  { $sum: 1 },
          lastActive:   { $max: '$solvedAt' },
          // Topic breakdown
          topicProgress: {
            $push: {
              topic: '$topic',
              diff:  '$diff',
            },
          },
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
              // streak bonus added below after separate query
            ],
          },
        },
      },
      { $sort: { totalScore: -1, totalSolved: -1, lastActive: -1 } },
    ];

    const results = await Progress.aggregate(pipeline);

    // Build per-user topic progress map + add streak
    const entries = await Promise.all(
      results.map(async (u, idx) => {
        const streak = await computeStreak(u._id);
        const streakBonus = Math.min(streak, 30) * 2;

        // Build topicProgress: { [topic]: { easy, medium, hard } }
        const topicProgress = {};
        for (const { topic: t, diff: d } of u.topicProgress) {
          if (!topicProgress[t]) topicProgress[t] = { easy: 0, medium: 0, hard: 0 };
          topicProgress[t][d] = (topicProgress[t][d] || 0) + 1;
        }

        return {
          userId:       u._id,
          email:        u.email,
          name:         u.name || u.email.split('@')[0],
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

    // Re-sort after adding streak bonus (scores may have changed)
    entries.sort((a, b) => b.totalScore - a.totalScore || b.totalSolved - a.totalSolved);
    entries.forEach((e, i) => { e.rank = i + 1; });

    // Assign badges
    if (entries[0]) entries[0].badge = 'gold';
    if (entries[1]) entries[1].badge = 'silver';
    if (entries[2]) entries[2].badge = 'bronze';

    const maxStreak = Math.max(...entries.map(e => e.streak));
    const streakKing = entries.find(e => e.streak === maxStreak && maxStreak > 0);
    if (streakKing && !streakKing.badge) streakKing.badge = 'streak';

    res.json(entries);
  } catch (err) {
    console.error('leaderboard error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});
module.exports = router;