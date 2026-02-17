// routes/jobs.js
const express = require('express');
const router = express.Router();
const Job = require('../models/job');
const { runJobPipeline } = require('../cron/jobScraper.cron');

// ── Middleware: simple admin guard ─────────────────────────────────────────────
// Replace with your real auth middleware if you have one.
// This checks for a shared secret in the Authorization header OR
// falls back to checking req.user.isAdmin (Passport session).
function adminOnly(req, res, next) {
  const token = req.headers['x-admin-token'];
  if (token && token === process.env.ADMIN_SECRET) return next();

  // Fallback: session-based Passport auth
  if (req.isAuthenticated && req.isAuthenticated() && req.user?.isAdmin) return next();

  return res.status(403).json({ error: 'Admin access required' });
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/jobs
// Returns latest scraped jobs with optional keyword filter & pagination.
//
// Query params:
//   keyword  - filter jobs whose title contains this string (case-insensitive)
//   limit    - max results (default 50, max 200)
//   page     - 1-based page number (default 1)
//   since    - ISO date string — only return jobs created after this date
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { keyword, since } = req.query;
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const page  = Math.max(parseInt(req.query.page)  || 1,  1);
    const skip  = (page - 1) * limit;

    const filter = {};

    if (keyword) {
      filter.title = { $regex: keyword, $options: 'i' };
    }

    if (since) {
      const sinceDate = new Date(since);
      if (!isNaN(sinceDate)) filter.createdAt = { $gte: sinceDate };
    }

    const [jobs, total] = await Promise.all([
      Job.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Job.countDocuments(filter),
    ]);

    res.json({
      jobs,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('[GET /api/jobs]', err.message);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/jobs/today
// Convenience route — returns jobs found in the last 24 hours.
// Used by the dashboard "new today" count.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/today', async (req, res) => {
  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const jobs  = await Job.find({ createdAt: { $gte: since } })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.json({ count: jobs.length, jobs });
  } catch (err) {
    console.error('[GET /api/jobs/today]', err.message);
    res.status(500).json({ error: 'Failed to fetch today\'s jobs' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/jobs/manual-run   [ADMIN ONLY]
// Manually trigger the full scrape + notify pipeline.
// Returns a summary of the run.
// ─────────────────────────────────────────────────────────────────────────────
router.post('/manual-run', adminOnly, async (req, res) => {
  console.log('[POST /api/jobs/manual-run] Manual pipeline trigger');
  try {
    // Fire and forget if caller passes ?async=true, else wait
    if (req.query.async === 'true') {
      res.json({ message: 'Pipeline started in background' });
      runJobPipeline().catch((e) => console.error('[manual-run async]', e.message));
    } else {
      const summary = await runJobPipeline();
      res.json({
        message: 'Pipeline complete',
        newJobs: summary.newJobs.length,
        errors: summary.errors.length,
        duration: `${((summary.finishedAt - summary.startedAt) / 1000).toFixed(1)}s`,
      });
    }
  } catch (err) {
    console.error('[POST /api/jobs/manual-run]', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;