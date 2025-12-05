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
const PORT = process.env.PORT || 5001;

// ============================================================================
// MIDDLEWARE SETUP
// ============================================================================

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

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

const ResumeSchema = new mongoose.Schema({
  fileId: { type: String, required: true },
  name: { type: String, required: true },
  uploadDate: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: false }
});

// URL validator - more lenient
const urlRegex = /^https?:\/\/.+/i;

const UserProfileSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  phone: { type: String, required: true },
  college: { type: String, required: true, trim: true },
  branch: { type: String, required: true, trim: true },
  year: { type: Number, required: true, min: 1, max: 5 },
  cgpa: { type: Number, required: true, min: 0, max: 10 },
  skills: { type: [String], default: [] },
  resumes: { type: [ResumeSchema], default: [] },
  linkedIn: { 
    type: String, 
    default: "",
    trim: true,
    validate: {
      validator: function(v) {
        if (!v || v === "") return true;
        return urlRegex.test(v);
      },
      message: "Invalid LinkedIn URL. Must start with http:// or https://"
    }
  },
  github: { 
    type: String, 
    default: "",
    trim: true,
    validate: {
      validator: function(v) {
        if (!v || v === "") return true;
        return urlRegex.test(v);
      },
      message: "Invalid GitHub URL. Must start with http:// or https://"
    }
  },
  preferredRoles: { type: [String], default: [] },
  preferredLocations: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

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
const UserProfile = mongoose.model('UserProfile', UserProfileSchema);
const OffCampusApplication = mongoose.model('OffCampusApplication', OffCampusApplicationSchema);
const OnCampusApplication = mongoose.model('OnCampusApplication', OnCampusApplicationSchema);
const CompanyDrive = mongoose.model('CompanyDrive', CompanyDriveSchema);

// ============================================================================
// MULTER CONFIGURATION FOR FILE UPLOADS
// ============================================================================

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
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

// ============================================================================
// ROUTES - EXISTING
// ============================================================================

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
    const profile = await UserProfile.findOne({ userId: req.params.userId });
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

    // Update or create profile
    const profile = await UserProfile.findOneAndUpdate(
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
        const profile = await UserProfile.findOneAndUpdate(
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
    const profile = await UserProfile.findOneAndUpdate(
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
      UserProfile.findOne({ userId })
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

// ============================================================================
// START SERVER
// ============================================================================

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║       🚀 AutoJob Flow API Server Started                   ║
║                                                            ║
║  Port: ${PORT.toString().padEnd(48)}║
║  Environment: ${(process.env.NODE_ENV || 'development').padEnd(41)}║
║  MongoDB: ${(mongoose.connection.readyState === 1 ? '✅ Connected' : '⚠️  Disconnected').padEnd(44)}║
║                                                            ║
║  Features:                                                 ║
║    ✅ Authentication (Passport)                            ║
║    ✅ Gmail Integration                                    ║
║    ✅ API Routes                                           ║
║    ✅ AI Chatbot with RAG                                  ║
║    ✅ Placement Tracking with Resume Upload                ║
║                                                            ║
║  Placement Endpoints:                                      ║
║    GET/POST /api/placement/profile/:userId                 ║
║    POST    /api/placement/resume/upload                    ║
║    DELETE  /api/placement/resume/:fileId                   ║
║    GET     /api/placement/resume/download/:fileId          ║
║    CRUD    /api/placement/off-campus                       ║
║    CRUD    /api/placement/on-campus                        ║
║    CRUD    /api/placement/company-drives                   ║
║    GET     /api/placement/analytics/:userId                ║
║                                                            ║
║  Other Endpoints:                                          ║
║    GET  /                 - Server info                    ║
║    GET  /health           - Health check                   ║
║    POST /api/chatbot/initialize  - Init chat               ║
║    POST /api/chatbot/message     - Send message            ║
║    POST /api/chatbot/clear       - Clear chat              ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
});