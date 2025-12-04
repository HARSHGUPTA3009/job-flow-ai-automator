
const express = require('express');
const multer = require('multer');
const router = express.Router();

const fs = require('fs');
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Middleware to check if user is authenticated
const requireAuth = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Authentication required' });
};

// Resume upload and ATS check endpoint
router.post('/ats-check', requireAuth, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No resume file uploaded' });
    }

    // TODO: Implement ATS check logic using Affinda or similar API
    // For now, return a mock response
    const mockScore = Math.floor(Math.random() * 30) + 70; // Random score between 70-100
    
    res.json({
      success: true,
      score: mockScore,
      suggestions: [
        'Add more relevant keywords',
        'Improve formatting consistency',
        'Include quantifiable achievements'
      ],
      filename: req.file.filename
    });
  } catch (error) {
    console.error('ATS Check Error:', error);
    res.status(500).json({ error: 'Failed to process resume' });
  }
});

// ===============================
// RESUME ROUTES
// ===============================
// Upload resume
// Upload resume
router.post('/resume/upload', requireAuth, upload.single('file'), async (req, res) => {
  try {
    const { userId } = req.body;

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

    // 👉 Save to user profile
    const profile = await Profile.findOne({ userId });

    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    if (!profile.resumes) profile.resumes = [];
    profile.resumes.push(fileData);

    await profile.save();

    res.json({
      success: true,
      message: 'Resume uploaded successfully',
      resumes: profile.resumes,   // 👈 send updated list
    });

  } catch (error) {
    console.error('Resume Upload Error:', error);
    res.status(500).json({ error: 'Failed to upload resume' });
  }
});
router.delete('/resume/:fileId', requireAuth, async (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.user._id || req.body.userId;

    const profile = await Profile.findOne({ userId });

    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    profile.resumes = profile.resumes.filter(r => r.fileId !== fileId);

    await profile.save();

    // delete physical file...
    
    res.json({
      success: true,
      message: 'Resume deleted',
      resumes: profile.resumes, // 👈 send updated list
    });

  } catch (error) {
    console.error('Resume Delete Error:', error);
    res.status(500).json({ error: 'Failed to delete resume' });
  }
});

router.get('/profile/:userId', requireAuth, async (req, res) => {
  const { userId } = req.params;

  const profile = await Profile.findOne({ userId });

  if (!profile) {
    return res.json(null);
  }

  return res.json(profile); // 👈 includes profile.resumes automatically
});



// Cold email setup endpoint
router.post('/cold-email-setup', requireAuth, async (req, res) => {
  try {
    const { googleSheetUrl } = req.body;
    
    if (!googleSheetUrl) {
      return res.status(400).json({ error: 'Google Sheets URL is required' });
    }

    // TODO: Implement Google Sheets integration and email setup
    // For now, return a mock response
    res.json({
      success: true,
      message: 'Cold email campaign setup initiated',
      sheetUrl: googleSheetUrl,
      contactsFound: Math.floor(Math.random() * 50) + 10 // Mock number
    });
  } catch (error) {
    console.error('Cold Email Setup Error:', error);
    res.status(500).json({ error: 'Failed to setup cold email campaign' });
  }
});

// Job search endpoint
router.post('/job-search', requireAuth, async (req, res) => {
  try {
    const { keywords, location, experience } = req.body;
    
    // TODO: Implement job search using Serper.dev or RapidAPI
    // For now, return mock data
    const mockJobs = [
      {
        title: 'Senior Software Engineer',
        company: 'Tech Corp',
        location: 'San Francisco, CA',
        salary: '$120k - $180k',
        description: 'Looking for a senior software engineer...'
      }
    ];
    
    res.json({
      success: true,
      jobs: mockJobs,
      totalFound: mockJobs.length
    });
  } catch (error) {
    console.error('Job Search Error:', error);
    res.status(500).json({ error: 'Failed to search jobs' });
  }
});

module.exports = router;
