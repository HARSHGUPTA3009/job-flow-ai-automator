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
  
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  const todayStr = today.toISOString().split('T')[0];
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  // Start checking from today. If not active today, give a 1-day grace period (yesterday).
  let cur = null;
  if (set.has(todayStr)) {
    cur = today;
  } else if (set.has(yesterdayStr)) {
    cur = yesterday;
  }
  
  if (!cur) return 0; // No active streak

  while (set.has(cur.toISOString().split('T')[0])) {
    streak++;
    cur.setDate(cur.getDate() - 1);
  }
  return streak;
}

// ─── GET /api/leaderboard ─────────────────────────────────────────────────────
// Query params:
//   filter = 'all' | 'weekly'   (college filter needs Profile model - extend if needed)
//   diff   = 'all' | 'easy' | 'medium' | 'hard'
//   topic  = 'all' | specific topic string
router.get('/', async (req, res) => {
  try {
    const { filter = 'all', diff, topic } = req.query;

    // Build Match Stage based on incoming query params
    const matchStage = {};

    // 1. Time Filter
    if (filter === 'weekly') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      matchStage.solvedDate = { $gte: weekAgo.toISOString().split('T')[0] };
    }

    // 2. Difficulty Filter
    if (diff && diff !== 'all') {
      matchStage.difficulty = diff;
    }

    // 3. Topic Filter
    if (topic && topic !== 'all') {
      matchStage.topic = topic;
    }

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
          // Capture topic and diff for the expandable rows on frontend
          allProblems:   { 
            $push: { 
              difficulty: '$difficulty', 
              topic: '$topic' 
            } 
          },
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

    // Compute scores, topic breakdowns, and build entries
    const entries = grouped.map(g => {
      const streak = computeStreak(g.allDates);
      const score =
        g.easySolved   * SCORE.easy   +
        g.mediumSolved * SCORE.medium +
        g.hardSolved   * SCORE.hard   +
        Math.min(streak, 30) * SCORE.streakBonus +
        g.starredCount * SCORE.starBonus;

      // Group topics for the expandable row UI
      const topicProgress = {};
      g.allProblems.forEach(prob => {
        if (!prob.topic) return;
        if (!topicProgress[prob.topic]) {
          topicProgress[prob.topic] = { easy: 0, medium: 0, hard: 0 };
        }
        if (prob.difficulty === 'easy') topicProgress[prob.topic].easy++;
        else if (prob.difficulty === 'medium') topicProgress[prob.topic].medium++;
        else if (prob.difficulty === 'hard') topicProgress[prob.topic].hard++;
      });

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
        topicProgress, // Handed off to frontend for the progress bars
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