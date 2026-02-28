
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// ─── Schemas ──────────────────────────────────────────────────────────────────

const CodingEntrySchema = new mongoose.Schema({
  userId:       { type: String, required: true, index: true },
  platform:     { type: String, enum: ['leetcode','codeforces','codechef','hackerrank','other'], required: true },
  questionName: { type: String, required: true },
  questionLink: { type: String },
  difficulty:   { type: String, enum: ['easy','medium','hard'], required: true },
  topic:        { type: String, required: true },
  solvedDate:   { type: String, required: true },   // YYYY-MM-DD
  timeTaken:    { type: Number },                   // minutes
  notes:        { type: String },
  isStarred:    { type: Boolean, default: false },
}, { timestamps: true });

const PlatformProfileSchema = new mongoose.Schema({
  userId:      { type: String, required: true },
  platform:    { type: String, enum: ['leetcode','codeforces','codechef','hackerrank','other'], required: true },
  username:    { type: String, required: true },
  totalSolved: { type: Number },
  rating:      { type: Number },
  lastUpdated: { type: Date, default: Date.now },
});
PlatformProfileSchema.index({ userId: 1, platform: 1 }, { unique: true });

const CodingEntry   = mongoose.models.CodingEntry   || mongoose.model('CodingEntry',   CodingEntrySchema);
const PlatformProfile = mongoose.models.PlatformProfile || mongoose.model('PlatformProfile', PlatformProfileSchema);

// ─── Middleware ───────────────────────────────────────────────────────────────

const requireAuth = (req, res, next) => {
  // Plug in your existing auth middleware here
  // e.g. if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  next();
};

// ─── ENTRIES CRUD ─────────────────────────────────────────────────────────────

// GET all entries for a user
router.get('/entries/:userId', requireAuth, async (req, res) => {
  try {
    const entries = await CodingEntry.find({ userId: req.params.userId }).sort({ solvedDate: 1 });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch entries' });
  }
});

// POST create entry
router.post('/entries', requireAuth, async (req, res) => {
  try {
    const { userId, platform, questionName, questionLink, difficulty, topic, solvedDate, timeTaken, notes, isStarred } = req.body;
    if (!userId || !questionName || !platform || !difficulty || !topic || !solvedDate) {
      return res.status(400).json({ error: 'Required fields missing' });
    }
    const entry = await CodingEntry.create({ userId, platform, questionName, questionLink, difficulty, topic, solvedDate, timeTaken, notes, isStarred: isStarred ?? false });
    res.status(201).json(entry);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create entry' });
  }
});

// PUT update entry (star toggle, notes, etc.)
router.put('/entries/:id', requireAuth, async (req, res) => {
  try {
    const allowed = ['isStarred', 'notes', 'difficulty', 'timeTaken', 'questionLink'];
    const update = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    }
    const entry = await CodingEntry.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!entry) return res.status(404).json({ error: 'Entry not found' });
    res.json(entry);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update entry' });
  }
});

// DELETE entry
router.delete('/entries/:id', requireAuth, async (req, res) => {
  try {
    await CodingEntry.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete entry' });
  }
});

// ─── PLATFORM PROFILES ────────────────────────────────────────────────────────

// GET all platform profiles for a user
router.get('/profiles/:userId', requireAuth, async (req, res) => {
  try {
    const profiles = await PlatformProfile.find({ userId: req.params.userId });
    res.json(profiles);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profiles' });
  }
});

// POST upsert a platform profile
router.post('/profile', requireAuth, async (req, res) => {
  try {
    const { userId, platform, username, totalSolved, rating } = req.body;
    if (!userId || !platform || !username) {
      return res.status(400).json({ error: 'userId, platform and username required' });
    }
    const profile = await PlatformProfile.findOneAndUpdate(
      { userId, platform },
      { username, totalSolved, rating, lastUpdated: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save profile' });
  }
});

// DELETE a platform profile
router.delete('/profile/:userId/:platform', requireAuth, async (req, res) => {
  try {
    await PlatformProfile.findOneAndDelete({ userId: req.params.userId, platform: req.params.platform });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete profile' });
  }
});

// ─── ANALYTICS ────────────────────────────────────────────────────────────────

// GET summary stats for a user
router.get('/stats/:userId', requireAuth, async (req, res) => {
  try {
    const entries = await CodingEntry.find({ userId: req.params.userId });

    const byPlatform = {};
    const byTopic    = {};
    const byDiff     = { easy: 0, medium: 0, hard: 0 };

    for (const e of entries) {
      byPlatform[e.platform] = (byPlatform[e.platform] || 0) + 1;
      byTopic[e.topic]       = (byTopic[e.topic]    || 0) + 1;
      byDiff[e.difficulty]++;
    }

    // Streak calc
    const dates = new Set(entries.map(e => e.solvedDate));
    let streak = 0;
    const cur = new Date();
    while (dates.has(cur.toISOString().split('T')[0])) {
      streak++;
      cur.setDate(cur.getDate() - 1);
    }

    res.json({
      total: entries.length,
      starred: entries.filter(e => e.isStarred).length,
      streak,
      byPlatform,
      byTopic,
      byDiff,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

module.exports = router;