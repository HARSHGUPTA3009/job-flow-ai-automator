// server/routes/leaderboard.js
// Mount as: app.use('/api/leaderboard', leaderboardRoutes)

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Re-use existing models (they're already registered in server.js)
const CodingEntry     = mongoose.models.CodingEntry;
const PlatformProfile = mongoose.models.PlatformProfile;

// ─── Scoring weights (must match frontend SCORE_POLICY) ──────────────────────
const SCORE = { easy: 1, medium: 3, hard: 7, streakBonus: 2, starBonus: 1 };

// ─── Helper: compute streak from sorted date strings ─────────────────────────
function computeStreak(dates) {
  const set = new Set(dates);
  let streak = 0;
  const cur = new Date();
  while (set.has(cur.toISOString().split('T')[0])) {
    streak++;
    cur.setDate(cur.getDate() - 1);
  }
  return streak;
}

// ─── GET /api/leaderboard ─────────────────────────────────────────────────────
// Query params:
//   filter = 'all' | 'weekly'   (college filter needs Profile model - extend if needed)
router.get('/', async (req, res) => {
  try {
    const { filter = 'all' } = req.query;

    // Date boundary for weekly filter
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().split('T')[0];

    // Match stage
    const matchStage = filter === 'weekly'
      ? { solvedDate: { $gte: weekAgoStr } }
      : {};

    // Aggregate all entries grouped by userId
    const pipeline = [
      { $match: matchStage },
      {
        $group: {
          _id:           '$userId',
          easySolved:    { $sum: { $cond: [{ $eq: ['$difficulty', 'easy']   }, 1, 0] } },
          mediumSolved:  { $sum: { $cond: [{ $eq: ['$difficulty', 'medium'] }, 1, 0] } },
          hardSolved:    { $sum: { $cond: [{ $eq: ['$difficulty', 'hard']   }, 1, 0] } },
          starredCount:  { $sum: { $cond: ['$isStarred', 1, 0] } },
          totalSolved:   { $sum: 1 },
          lastActive:    { $max: '$solvedDate' },
          allDates:      { $addToSet: '$solvedDate' },
          recent:        {
            $push: {
              platform:     '$platform',
              questionName: '$questionName',
              solvedDate:   '$solvedDate',
            }
          },
        }
      },
    ];

    const grouped = await CodingEntry.aggregate(pipeline);

    // Fetch all platform profiles for name lookup (userId → username)
    // If you have a User/Profile model, replace this with a proper lookup
    const profiles = await PlatformProfile.find({
      userId: { $in: grouped.map(g => g._id) }
    });

    // Build a userId → display name map from platform usernames
    // (Falls back to userId if no profile exists)
    const nameMap = {};
    for (const p of profiles) {
      if (!nameMap[p.userId]) nameMap[p.userId] = p.username;
    }

    // If you have a User model, do a proper name lookup here:
    // const users = await User.find({ _id: { $in: grouped.map(g => g._id) } });
    // for (const u of users) nameMap[u._id.toString()] = u.name || u.email;

    // Compute scores and build entries
    const entries = grouped.map(g => {
      const streak = computeStreak(g.allDates);
      const score =
        g.easySolved   * SCORE.easy   +
        g.mediumSolved * SCORE.medium +
        g.hardSolved   * SCORE.hard   +
        Math.min(streak, 30) * SCORE.streakBonus +
        g.starredCount * SCORE.starBonus;

      return {
        userId:       g._id,
        name:         nameMap[g._id] || g._id,
        email:        '',                          // fill from User model if available
        totalScore:   score,
        totalSolved:  g.totalSolved,
        easySolved:   g.easySolved,
        mediumSolved: g.mediumSolved,
        hardSolved:   g.hardSolved,
        streak,
        starredCount: g.starredCount,
        lastActive:   g.lastActive,
        recentActivity: g.recent
          .sort((a, b) => b.solvedDate.localeCompare(a.solvedDate))
          .slice(0, 3),
      };
    });

    // Sort by score descending
    entries.sort((a, b) => b.totalScore - a.totalScore);

    // Assign ranks & badges
    const maxStreak = Math.max(...entries.map(e => e.streak), 0);
    const result = entries.map((e, i) => {
      let badge;
      if      (i === 0)               badge = 'gold';
      else if (i === 1)               badge = 'silver';
      else if (i === 2)               badge = 'bronze';
      else if (e.streak === maxStreak && e.streak > 0) badge = 'streak';

      return { ...e, rank: i + 1, badge };
    });

    // Mark "rising star" — biggest rank improver since last snapshot
    // (Simple approach: if any user has risen 5+ positions vs their score rank, tag them)
    // For a real implementation, store snapshots in a LeaderboardSnapshot collection.

    res.json(result);
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ error: 'Failed to compute leaderboard' });
  }
});

module.exports = router;