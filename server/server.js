const express = require('express');
const cors = require('cors');
const passport = require('passport');
const session = require('express-session');
const mongoose = require('mongoose');
const multer = require('multer');
const { GridFSBucket } = require('mongodb');
require('dotenv').config();

// Import routes
const chatbotRoutes = require('./routes/chatbot');

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3001;

// ============================================================================
// MIDDLEWARE SETUP
// ============================================================================


app.use(cors({
  origin: true,
  credentials: true
}));
// ============================
// MULTER CONFIG
// ============================

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf"
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files allowed"));
    }
  }
});


app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const axios = require("axios");

const pdf = require("pdf-parse");

async function extractPdfText(buffer) {
  try {
    const data = await pdf(buffer);
    return data.text;
  } catch (err) {
    console.error("PDF Parse Error:", err);
    throw new Error("Failed to parse PDF");
  }
}

function cleanResumeText(text) {
  if (!text) return "";

  return text
    .replace(/[^\x00-\x7F]/g, " ")
    .replace(/\r\n/g, "\n")
    .replace(/\n{2,}/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
app.post("/ai/ats-upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "PDF file required" });
    }

    // 1️⃣ Extract text from PDF
    let rawText = await extractPdfText(req.file.buffer);

    // 2️⃣ Clean text
    let resumeText = cleanResumeText(rawText);

    if (resumeText.length < 200) {
      return res.status(400).json({
        error: "Resume extraction failed. Try a clearer PDF."
      });
    }

    // 3️⃣ Send to Groq ATS
    const aiResponse = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content: `
You are an ATS evaluator.
Return ONLY JSON.
Score must be integer 0-100.
`
          },
          {
            role: "user",
            content: `
Return JSON:

{
  "score": 0,
  "summary": "",
  "suggestions": [],
  "detected_skills": []
}

Resume:
${resumeText.slice(0, 4000)}
`
          }
        ],
        temperature: 0,
        max_tokens: 400
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    let content = aiResponse.data.choices[0].message.content.trim();
    content = content.replace(/```json|```/g, "").trim();

    const parsed = JSON.parse(content);

    res.json(parsed);

  } catch (err) {
    console.error("ATS Upload Error:", err.response?.data || err.message);

    res.status(500).json({
      error: "ATS processing failed",
      details: err.response?.data || err.message
    });
  }
});


app.post("/ai/cold-emails", async (req, res) => {
  try {
    const { userName, contacts } = req.body;

    if (!userName || !Array.isArray(contacts) || contacts.length === 0) {
      return res.status(400).json({ error: "Invalid input data" });
    }

    const prompt = `
You are a professional cold email writer.

Generate personalized cold emails.

Return ONLY valid JSON.
No markdown.
No explanation.
No backticks.

Format EXACTLY:

{
  "emails": [
    {
      "email": "string",
      "content": "Subject: ...\\n\\nBody..."
    }
  ]
}

User Name: ${userName}

Contacts:
${JSON.stringify(contacts)}
`;

    const aiResponse = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: "You strictly return JSON." },
          { role: "user", content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 800
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    let content = aiResponse.data.choices[0].message.content.trim();

    console.log("RAW AI RESPONSE:\n", content);

    content = content.replace(/```json|```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      console.error("JSON Parse Error:", content);
      return res.status(500).json({
        error: "AI returned invalid JSON",
        raw: content
      });
    }

    if (!parsed.emails || !Array.isArray(parsed.emails)) {
      return res.status(500).json({
        error: "Invalid cold email structure",
        raw: parsed
      });
    }

    return res.json({ emails: parsed.emails });

  } catch (err) {
    console.error("Groq Cold Email Error:");
    console.error(err.response?.data || err.message);

    return res.status(500).json({
      error: "Cold email AI processing failed",
      details: err.response?.data || err.message
    });
  }
});



app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: true,
    sameSite: 'None',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

app.use(passport.initialize());
app.use(passport.session());

// ============================================================================
// DATABASE CONNECTION
// ============================================================================

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
  }
};

// Connect to MongoDB
try {
  if (process.env.MONGODB_URI) {
    connectDB();
  } else {
    console.warn('⚠️ MONGODB_URI not found in environment variables');
  }
} catch (error) {
  console.error('⚠️ MongoDB connection error:', error.message);
}

// ============================================================================
// MONGOOSE SCHEMAS FOR PLACEMENT TRACKER
// ============================================================================

// NOTE: Profile schema (with ResumeSchema + validators) lives in ./models/Profile.js

const OffCampusApplicationSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  company: { type: String, required: true },
  jobTitle: { type: String, required: true },
  jobLink: String,
  salary: Number,
  currency: { type: String, default: 'INR' },
  appliedDate: { type: String, required: true },
  statusUpdatedDate: { type: String, default: () => new Date().toISOString().split('T')[0] },
  status: {
    type: String,
    enum: ['applied', 'screening', 'interview', 'offer', 'rejected', 'accepted'],
    default: 'applied'
  },
  notes: String,
  followUpDates: [String],
  source: {
    type: String,
    enum: ['linkedin', 'indeed', 'naukri', 'direct', 'other'],
    default: 'linkedin'
  },
  createdAt: { type: Date, default: Date.now }
});

const OnCampusApplicationSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  companyName: { type: String, required: true },
  role: String,
  appliedDate: { type: String },
  status: {
    type: String,
    enum: ['applied', 'shortlisted', 'interview_1', 'interview_2', 'interview_3', 'rejected', 'offer'],
    default: 'applied'
  },
  interviewRounds: { type: Number, default: 0 },
  offerPackage: Number,
  offerLocation: String,
  createdAt: { type: Date, default: Date.now }
});

const CompanyDriveSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  companyName: { type: String, required: true },
  roles: [String],
  cutoffCGPA: Number,
  batchDate: String,
  resultsDate: String,
  averagePackage: Number,
  numberOfSelected: Number,
  totalApplied: Number,
  createdAt: { type: Date, default: Date.now }
});

// Models
const Profile = require("./models/Profile");
const OffCampusApplication = mongoose.model('OffCampusApplication', OffCampusApplicationSchema);
const OnCampusApplication = mongoose.model('OnCampusApplication', OnCampusApplicationSchema);
const CompanyDrive = mongoose.model('CompanyDrive', CompanyDriveSchema);


// Gmail Routes
app.use("/gmail", require("./routes/gmail"));

// Auth Routes
app.use('/auth', require("./routes/auth"));

// API Routes
app.use('/api', require("./routes/api"));

// Chatbot Routes
app.use('/api/chatbot', chatbotRoutes);

// ============================================================================
// PLACEMENT TRACKER API ROUTES
// ============================================================================

// ============================================================================
// USER PROFILE ROUTES
// ============================================================================

// Get user profile
app.get('/api/placement/profile/:userId', async (req, res) => {
  try {
    const profile = await Profile.findOne({ userId: req.params.userId });
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    res.json(profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Create or update user profile
app.post('/api/placement/profile', async (req, res) => {
  try {
    const { userId, ...profileData } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Validate required fields
    const requiredFields = ['name', 'email', 'phone', 'college', 'branch', 'year', 'cgpa'];
    for (const field of requiredFields) {
      if (!profileData[field] && profileData[field] !== 0) {
        return res.status(400).json({ error: `${field} is required` });
      }
    }

    // Update or create profile (uses validators from ./models/Profile.js)
    const profile = await Profile.findOneAndUpdate(
      { userId },
      { userId, ...profileData, updatedAt: new Date() },
      { new: true, upsert: true, runValidators: true }
    );

    res.json(profile);
  } catch (error) {
    console.error('Error saving profile:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ error: messages.join(', ') });
    }
    res.status(500).json({ error: 'Failed to save profile' });
  }
});

// ============================================================================
// RESUME UPLOAD/DOWNLOAD ROUTES
// ============================================================================

// Upload resume
app.post('/api/placement/resume/upload', upload.single('file'), async (req, res) => {
  try {
    const { userId } = req.body;
    const file = req.file;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Initialize GridFS
    const db = mongoose.connection.db;
    const bucket = new GridFSBucket(db, { bucketName: 'resumes' });

    // Upload to GridFS
    const uploadStream = bucket.openUploadStream(file.originalname, {
      contentType: file.mimetype,
      metadata: { userId }
    });

    uploadStream.end(file.buffer);

    uploadStream.on('finish', async () => {
      try {
        // Add resume to profile
        const profile = await Profile.findOneAndUpdate(
          { userId },
          {
            $push: {
              resumes: {
                fileId: uploadStream.id.toString(),
                name: file.originalname,
                uploadDate: new Date(),
                isActive: false
              }
            }
          },
          { new: true, upsert: true }
        );

        res.json({
          message: 'Resume uploaded successfully',
          fileId: uploadStream.id.toString(),
          resumes: profile.resumes
        });
      } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ error: 'Failed to update profile' });
      }
    });

    uploadStream.on('error', (error) => {
      console.error('Upload error:', error);
      res.status(500).json({ error: 'Failed to upload file' });
    });

  } catch (error) {
    console.error('Error uploading resume:', error);
    res.status(500).json({ error: 'Failed to upload resume' });
  }
});

// Delete resume
app.delete('/api/placement/resume/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Delete from GridFS
    const db = mongoose.connection.db;
    const bucket = new GridFSBucket(db, { bucketName: 'resumes' });
    
    try {
      await bucket.delete(new mongoose.Types.ObjectId(fileId));
    } catch (err) {
      console.error('GridFS delete error:', err);
      // Continue even if file not found in GridFS
    }

    // Remove from profile
    const profile = await Profile.findOneAndUpdate(
      { userId },
      { $pull: { resumes: { fileId } } },
      { new: true }
    );

    res.json({
      message: 'Resume deleted successfully',
      resumes: profile?.resumes || []
    });
  } catch (error) {
    console.error('Error deleting resume:', error);
    res.status(500).json({ error: 'Failed to delete resume' });
  }
});

// Download resume
app.get('/api/placement/resume/download/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;

    const db = mongoose.connection.db;
    const bucket = new GridFSBucket(db, { bucketName: 'resumes' });

    // Get file info first to set headers
    const files = await db.collection('resumes.files').find({ 
      _id: new mongoose.Types.ObjectId(fileId) 
    }).toArray();

    if (!files || files.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }

    const file = files[0];
    
    // Set headers
    res.set({
      'Content-Type': file.contentType,
      'Content-Disposition': `attachment; filename="${file.filename}"`
    });

    const downloadStream = bucket.openDownloadStream(new mongoose.Types.ObjectId(fileId));

    downloadStream.on('error', (error) => {
      console.error('Download error:', error);
      if (!res.headersSent) {
        res.status(404).json({ error: 'File not found' });
      }
    });

    downloadStream.pipe(res);
  } catch (error) {
    console.error('Error downloading resume:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to download resume' });
    }
  }
});

// ============================================================================
// OFF-CAMPUS APPLICATION ROUTES
// ============================================================================

// Get all off-campus applications for a user
app.get('/api/placement/off-campus/:userId', async (req, res) => {
  try {
    const applications = await OffCampusApplication.find({ 
      userId: req.params.userId 
    }).sort({ createdAt: -1 });
    res.json(applications);
  } catch (error) {
    console.error('Error fetching off-campus applications:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// Create off-campus application
app.post('/api/placement/off-campus', async (req, res) => {
  try {
    if (!req.body.userId || !req.body.company || !req.body.jobTitle) {
      return res.status(400).json({ 
        error: 'userId, company, and jobTitle are required' 
      });
    }

    const application = new OffCampusApplication(req.body);
    await application.save();
    res.status(201).json(application);
  } catch (error) {
    console.error('Error creating off-campus application:', error);
    res.status(500).json({ error: 'Failed to create application' });
  }
});

// Update off-campus application
app.put('/api/placement/off-campus/:id', async (req, res) => {
  try {
    const application = await OffCampusApplication.findByIdAndUpdate(
      req.params.id,
      { 
        ...req.body, 
        statusUpdatedDate: new Date().toISOString().split('T')[0] 
      },
      { new: true, runValidators: true }
    );
    
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    res.json(application);
  } catch (error) {
    console.error('Error updating off-campus application:', error);
    res.status(500).json({ error: 'Failed to update application' });
  }
});

// Delete off-campus application
app.delete('/api/placement/off-campus/:id', async (req, res) => {
  try {
    const application = await OffCampusApplication.findByIdAndDelete(req.params.id);
    
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    res.json({ message: 'Application deleted successfully' });
  } catch (error) {
    console.error('Error deleting off-campus application:', error);
    res.status(500).json({ error: 'Failed to delete application' });
  }
});

// ============================================================================
// ON-CAMPUS APPLICATION ROUTES
// ============================================================================

// Get all on-campus applications for a user
app.get('/api/placement/on-campus/:userId', async (req, res) => {
  try {
    const applications = await OnCampusApplication.find({ 
      userId: req.params.userId 
    }).sort({ createdAt: -1 });
    res.json(applications);
  } catch (error) {
    console.error('Error fetching on-campus applications:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// Create on-campus application
app.post('/api/placement/on-campus', async (req, res) => {
  try {
    if (!req.body.userId || !req.body.companyName) {
      return res.status(400).json({ 
        error: 'userId and companyName are required' 
      });
    }

    const application = new OnCampusApplication(req.body);
    await application.save();
    res.status(201).json(application);
  } catch (error) {
    console.error('Error creating on-campus application:', error);
    res.status(500).json({ error: 'Failed to create application' });
  }
});

// Update on-campus application
app.put('/api/placement/on-campus/:id', async (req, res) => {
  try {
    const application = await OnCampusApplication.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    res.json(application);
  } catch (error) {
    console.error('Error updating on-campus application:', error);
    res.status(500).json({ error: 'Failed to update application' });
  }
});

// Delete on-campus application
app.delete('/api/placement/on-campus/:id', async (req, res) => {
  try {
    const application = await OnCampusApplication.findByIdAndDelete(req.params.id);
    
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    res.json({ message: 'Application deleted successfully' });
  } catch (error) {
    console.error('Error deleting on-campus application:', error);
    res.status(500).json({ error: 'Failed to delete application' });
  }
});

// ============================================================================
// COMPANY DRIVE ROUTES
// ============================================================================

// Get all company drives for a user
app.get('/api/placement/company-drives/:userId', async (req, res) => {
  try {
    const drives = await CompanyDrive.find({ 
      userId: req.params.userId 
    }).sort({ createdAt: -1 });
    res.json(drives);
  } catch (error) {
    console.error('Error fetching company drives:', error);
    res.status(500).json({ error: 'Failed to fetch company drives' });
  }
});

// Create company drive
app.post('/api/placement/company-drives', async (req, res) => {
  try {
    if (!req.body.userId || !req.body.companyName) {
      return res.status(400).json({ 
        error: 'userId and companyName are required' 
      });
    }

    const drive = new CompanyDrive(req.body);
    await drive.save();
    res.status(201).json(drive);
  } catch (error) {
    console.error('Error creating company drive:', error);
    res.status(500).json({ error: 'Failed to create company drive' });
  }
});

// Update company drive
app.put('/api/placement/company-drives/:id', async (req, res) => {
  try {
    const drive = await CompanyDrive.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!drive) {
      return res.status(404).json({ error: 'Company drive not found' });
    }
    
    res.json(drive);
  } catch (error) {
    console.error('Error updating company drive:', error);
    res.status(500).json({ error: 'Failed to update company drive' });
  }
});

// Delete company drive
app.delete('/api/placement/company-drives/:id', async (req, res) => {
  try {
    const drive = await CompanyDrive.findByIdAndDelete(req.params.id);
    
    if (!drive) {
      return res.status(404).json({ error: 'Company drive not found' });
    }
    
    res.json({ message: 'Company drive deleted successfully' });
  } catch (error) {
    console.error('Error deleting company drive:', error);
    res.status(500).json({ error: 'Failed to delete company drive' });
  }
});

// ============================================================================
// ANALYTICS ENDPOINT
// ============================================================================

app.get('/api/placement/analytics/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;

    const [offCampusApps, onCampusApps, profile] = await Promise.all([
      OffCampusApplication.find({ userId }),
      OnCampusApplication.find({ userId }),
      Profile.findOne({ userId })
    ]);

    const analytics = {
      totalApplications: offCampusApps.length + onCampusApps.length,
      totalOffCampus: offCampusApps.length,
      totalOnCampus: onCampusApps.length,
      offCampusBreakdown: {
        applied: offCampusApps.filter(a => a.status === 'applied').length,
        screening: offCampusApps.filter(a => a.status === 'screening').length,
        interview: offCampusApps.filter(a => a.status === 'interview').length,
        offer: offCampusApps.filter(a => a.status === 'offer').length,
        rejected: offCampusApps.filter(a => a.status === 'rejected').length,
        accepted: offCampusApps.filter(a => a.status === 'accepted').length
      },
      onCampusBreakdown: {
        applied: onCampusApps.filter(a => a.status === 'applied').length,
        shortlisted: onCampusApps.filter(a => a.status === 'shortlisted').length,
        rejected: onCampusApps.filter(a => a.status === 'rejected').length,
        offer: onCampusApps.filter(a => a.status === 'offer').length
      },
      sourceBreakdown: {
        linkedin: offCampusApps.filter(a => a.source === 'linkedin').length,
        indeed: offCampusApps.filter(a => a.source === 'indeed').length,
        naukri: offCampusApps.filter(a => a.source === 'naukri').length,
        direct: offCampusApps.filter(a => a.source === 'direct').length,
        other: offCampusApps.filter(a => a.source === 'other').length
      },
      profile: profile || null
    };

    res.json(analytics);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// ============================================================================
// HEALTH CHECK & INFO ENDPOINTS
// ============================================================================

app.get('/', (req, res) => {
  res.json({
    message: 'AutoJob Flow API Server is running!',
    version: '2.0.0',
    endpoints: {
      auth: '/auth',
      gmail: '/gmail',
      api: '/api',
      chatbot: '/api/chatbot',
      placement: '/api/placement'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'running',
    timestamp: new Date(),
    uptime: process.uptime(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    services: {
      chatbot: 'enabled',
      gmail: 'enabled',
      auth: 'enabled',
      api: 'enabled',
      placement: 'enabled'
    },
    database: {
      status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      name: mongoose.connection.name || 'N/A'
    }
  });
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    status: err.status || 500
  });
});

app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
    method: req.method
  });
});
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
