// routes/companies.js
const express = require('express');
const router  = express.Router();
const Company = require('../models/company');
const User    = require('../models/User');

// ── Middleware: require authenticated session (Passport) ──────────────────────
function requireAuth(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) return next();
  return res.status(401).json({ error: 'Authentication required' });
}

// ── Admin guard ───────────────────────────────────────────────────────────────
function adminOnly(req, res, next) {
  const token = req.headers['x-admin-token'];
  if (token && token === process.env.ADMIN_SECRET) return next();
  if (req.isAuthenticated?.() && req.user?.isAdmin) return next();
  return res.status(403).json({ error: 'Admin access required' });
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/companies
// List all monitored companies (active + inactive).
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.active !== undefined) filter.active = req.query.active === 'true';

    const companies = await Company.find(filter)
      .sort({ name: 1 })
      .lean();

    res.json({ companies });
  } catch (err) {
    console.error('[GET /api/companies]', err.message);
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/companies   [ADMIN ONLY]
// Add a new company to monitor.
//
// Body: { name, careersUrl, keywords?, active? }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', adminOnly, async (req, res) => {
  try {
    const { name, careersUrl, keywords, active } = req.body;

    if (!name || !careersUrl) {
      return res.status(400).json({ error: 'name and careersUrl are required' });
    }

    // Validate URL
    try { new URL(careersUrl); } catch {
      return res.status(400).json({ error: 'careersUrl must be a valid URL' });
    }

    const company = await Company.create({
      name: name.trim(),
      careersUrl: careersUrl.trim(),
      keywords: Array.isArray(keywords) ? keywords : undefined,
      active: active !== undefined ? Boolean(active) : true,
    });

    console.log(`[POST /api/companies] Added: ${company.name}`);
    res.status(201).json({ company });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'A company with this careersUrl already exists' });
    }
    console.error('[POST /api/companies]', err.message);
    res.status(500).json({ error: 'Failed to add company' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/companies/:id   [ADMIN ONLY]
// Toggle active state or update keywords.
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/:id', adminOnly, async (req, res) => {
  try {
    const allowed = ['active', 'keywords', 'name', 'careersUrl'];
    const updates = {};
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    });

    const company = await Company.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!company) return res.status(404).json({ error: 'Company not found' });

    res.json({ company });
  } catch (err) {
    console.error('[PATCH /api/companies/:id]', err.message);
    res.status(500).json({ error: 'Failed to update company' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/companies/preferences   [AUTH REQUIRED]
// Get current user's job notification preferences.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/preferences', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('jobKeywords emailNotifications')
      .lean();

    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('[GET /api/companies/preferences]', err.message);
    res.status(500).json({ error: 'Failed to fetch preferences' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/companies/preferences   [AUTH REQUIRED]
// Update current user's job notification preferences.
//
// Body: { jobKeywords?: string[], emailNotifications?: boolean }
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/preferences', requireAuth, async (req, res) => {
  try {
    const { jobKeywords, emailNotifications } = req.body;
    const updates = {};

    if (Array.isArray(jobKeywords)) {
      updates.jobKeywords = jobKeywords.map((k) => k.trim().toLowerCase()).filter(Boolean);
    }
    if (emailNotifications !== undefined) {
      updates.emailNotifications = Boolean(emailNotifications);
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true })
      .select('jobKeywords emailNotifications');

    res.json(user);
  } catch (err) {
    console.error('[PATCH /api/companies/preferences]', err.message);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

module.exports = router;