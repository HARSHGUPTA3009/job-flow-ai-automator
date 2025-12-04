const express = require('express');
const multer = require('multer');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Import your Profile model (adjust path as needed)
// const Profile = require('../models/Profile');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and Word documents are allowed.'));
    }
  }
});

// Middleware to check if user is authenticated
const requireAuth = (req, res, next) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  // For testing without full auth
  console.log('Auth check bypassed for testing');
  next();
};

// ===============================
// PROFILE ROUTES
// ===============================

// Get profile
router.get('/profile/:userId', requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;

    // TODO: Replace with actual database query
    // const profile = await Profile.findOne({ userId });
    
    // For now, return null (will trigger profile creation in frontend)
    res.json(null);
  } catch (error) {
    console.error('Profile Fetch Error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Create/Update profile
router.post('/profile', requireAuth, async (req, res) => {
  try {
    const { userId, ...profileData } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // TODO: Replace with actual database save
    // let profile = await Profile.findOne({ userId });
    // if (!profile) {
    //   profile = new Profile({ userId, ...profileData });
    // } else {
    //   Object.assign(profile, profileData);
    // }
    // await profile.save();

    console.log('Profile saved:', { userId, ...profileData });
    res.json({ success: true, message: 'Profile saved successfully' });
  } catch (error) {
    console.error('Profile Save Error:', error);
    res.status(500).json({ error: 'Failed to save profile' });
  }
});

// ===============================
// RESUME ROUTES
// ===============================

// Upload resume
router.post('/resume/upload', requireAuth, upload.single('file'), async (req, res) => {
  try {
    const { userId } = req.body;

    console.log('UPLOAD BODY:', req.body);
    console.log('UPLOAD FILE:', req.file);

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const fileData = {
      fileId: req.file.filename,
      name: req.file.originalname,
      uploadDate: new Date(),
      isActive: false,
    };

    // TODO: Save to database
    // let profile = await Profile.findOne({ userId });
    // if (!profile) {
    //   profile = new Profile({ userId, resumes: [] });
    // }
    // if (!profile.resumes) profile.resumes = [];
    // profile.resumes.push(fileData);
    // await profile.save();

    console.log('Resume uploaded:', fileData);

    res.json({
      success: true,
      message: 'Resume uploaded successfully',
      resumes: [fileData], // Return mock data
    });

  } catch (error) {
    console.error('Resume Upload Error:', error);
    res.status(500).json({ 
      error: 'Failed to upload resume',
      details: error.message 
    });
  }
});

// Delete resume
router.delete('/resume/:fileId', requireAuth, async (req, res) => {
  try {
    const { fileId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    console.log('Deleting resume:', fileId, 'for user:', userId);

    // TODO: Remove from database
    // let profile = await Profile.findOne({ userId });
    // if (!profile) {
    //   return res.status(404).json({ error: 'Profile not found' });
    // }
    // profile.resumes = profile.resumes.filter(r => r.fileId !== fileId);
    // await profile.save();

    // Remove physical file
    const filePath = path.join(uploadsDir, fileId);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log('File deleted:', filePath);
    }

    res.json({
      success: true,
      message: 'Resume deleted successfully',
      resumes: [], // Return updated resumes
    });

  } catch (error) {
    console.error('Resume Delete Error:', error);
    res.status(500).json({ error: 'Failed to delete resume' });
  }
});

// Download resume
router.get('/resume/download/:fileId', requireAuth, async (req, res) => {
  try {
    const { fileId } = req.params;
    const filePath = path.join(uploadsDir, fileId);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.download(filePath);
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
    // TODO: Fetch from database
    res.json([]);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

router.post('/off-campus', requireAuth, async (req, res) => {
  try {
    console.log('Creating off-campus application:', req.body);
    // TODO: Save to database
    res.json({ success: true, message: 'Application added' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to add application' });
  }
});

router.put('/off-campus/:id', requireAuth, async (req, res) => {
  try {
    console.log('Updating application:', req.params.id, req.body);
    // TODO: Update in database
    res.json({ success: true, message: 'Application updated' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to update application' });
  }
});

router.delete('/off-campus/:id', requireAuth, async (req, res) => {
  try {
    console.log('Deleting application:', req.params.id);
    // TODO: Delete from database
    res.json({ success: true, message: 'Application deleted' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to delete application' });
  }
});

// ===============================
// ON-CAMPUS ROUTES
// ===============================

router.get('/on-campus/:userId', requireAuth, async (req, res) => {
  try {
    res.json([]);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

router.get('/company-drives/:userId', requireAuth, async (req, res) => {
  try {
    res.json([]);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to fetch drives' });
  }
});

router.post('/company-drives', requireAuth, async (req, res) => {
  try {
    console.log('Creating company drive:', req.body);
    res.json({ success: true, message: 'Drive added' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to add drive' });
  }
});

router.delete('/company-drives/:id', requireAuth, async (req, res) => {
  try {
    console.log('Deleting drive:', req.params.id);
    res.json({ success: true, message: 'Drive deleted' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to delete drive' });
  }
});

module.exports = router;