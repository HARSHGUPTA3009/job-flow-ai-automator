const express = require('express');
const multer = require('multer');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const Profile = require('../models/Profile');

// ===============================
// FILE STORAGE SETUP
// ===============================

// Create uploads directory if doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + '-' + file.originalname);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    allowed.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error('Invalid file type. Only PDF and Word files allowed.'));
  }
});

// ===============================
// AUTH MIDDLEWARE
// ===============================

const requireAuth = (req, res, next) => {
  if (req.isAuthenticated && req.isAuthenticated()) return next();
  console.log('Auth bypassed (dev mode)');
  next();
};

// ===============================
// PROFILE ROUTES
// ===============================

// GET PROFILE
router.get('/profile/:userId', requireAuth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ userId: req.params.userId });
    res.json(profile || null);
  } catch (error) {
    console.error('Profile Fetch Error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// CREATE/UPDATE PROFILE
router.post('/profile', requireAuth, async (req, res) => {
  try {
    const {
      userId,
      name,
      email,
      phone,
      college,
      branch,
      year,
    } = req.body;

    // validation
    if (!userId || !name || !email || !phone || !college || !branch || !year) {
      return res.status(400).json({ error: "All fields are required" });
    }

    let profile = await Profile.findOne({ userId });

    if (!profile) {
      profile = new Profile({
        userId,
        name, email, phone,
        college, branch, year,
        resumes: []
      });
    } else {
      profile.set({
        name, email, phone,
        college, branch, year
      });
    }

    await profile.save();

    res.json({ success: true, profile });

  } catch (error) {
    console.error('Profile Save Error:', error);
    res.status(500).json({ error: 'Failed to save profile' });
  }
});

// ===============================
// RESUME ROUTES
// ===============================

// UPLOAD RESUME
router.post('/resume/upload', requireAuth, upload.single('file'), async (req, res) => {
  try {
    const { userId } = req.body;

    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    let profile = await Profile.findOne({ userId });

    if (!profile) {
      profile = new Profile({
        userId,
        resumes: []
      });
    }

    const fileData = {
      fileId: req.file.filename,
      name: req.file.originalname,
      uploadDate: new Date(),
      isActive: true,
    };

    profile.resumes.push(fileData);
    await profile.save();

    res.json({
      success: true,
      message: 'Resume uploaded successfully',
      resumes: profile.resumes,
    });

  } catch (error) {
    console.error('Resume Upload Error:', error);
    res.status(500).json({
      error: 'Failed to upload resume',
      details: error.message,
    });
  }
});

// DELETE RESUME
router.delete('/resume/:fileId', requireAuth, async (req, res) => {
  try {
    const { fileId } = req.params;
    const { userId } = req.body;

    if (!userId) return res.status(400).json({ error: 'userId is required' });

    let profile = await Profile.findOne({ userId });
    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    // remove from DB
    profile.resumes = profile.resumes.filter(r => r.fileId !== fileId);
    await profile.save();

    // delete file
    const filePath = path.join(uploadsDir, fileId);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    res.json({
      success: true,
      message: 'Resume deleted successfully',
      resumes: profile.resumes,
    });

  } catch (error) {
    console.error('Resume Delete Error:', error);
    res.status(500).json({ error: 'Failed to delete resume' });
  }
});

// DOWNLOAD RESUME
router.get('/resume/download/:fileId', requireAuth, async (req, res) => {
  try {
    const { fileId } = req.params;
    const filePath = path.join(uploadsDir, fileId);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    return res.download(filePath);

  } catch (error) {
    console.error('Resume Download Error:', error);
    res.status(500).json({ error: 'Failed to download resume' });
  }
});

// ===============================
// OFF-CAMPUS ROUTES
// ===============================

router.get('/off-campus/:userId', requireAuth, async (req, res) => {
  try {
    res.json([]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

router.post('/off-campus', requireAuth, async (req, res) => {
  try {
    console.log('Creating off-campus application:', req.body);
    res.json({ success: true, message: 'Application added' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to add application' });
  }
});

// ===============================
// ON-CAMPUS ROUTES
// ===============================

router.get('/on-campus/:userId', requireAuth, async (req, res) => {
  try {
    res.json([]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// ===============================
// EXPORT ROUTER
// ===============================

module.exports = router;
