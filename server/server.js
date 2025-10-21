const express = require('express');
const cors = require('cors');
const passport = require('passport');
const session = require('express-session');
const mongoose = require('mongoose');
require('dotenv').config();

// Import routes
const chatbotRoutes = require('./routes/chatbot');
const connectDB = require('./config/db');

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 5001;

// ============================================================================
// MIDDLEWARE SETUP
// ============================================================================

app.use(cors({
  origin: 'https://jobflow-black.vercel.app',
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
  name: String,
  url: String,
  uploadDate: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: false }
});

const UserProfileSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  name: String,
  email: { type: String, required: true },
  phone: String,
  college: String,
  branch: String,
  year: Number,
  cgpa: Number,
  skills: [String],
  resumes: [ResumeSchema],
  linkedIn: String,
  github: String,
  preferredRoles: [String],
  preferredLocations: [String],
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
  appliedDate: { type: Date, default: Date.now },
  statusUpdatedDate: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ['applied', 'screening', 'interview', 'offer', 'rejected', 'accepted'],
    default: 'applied'
  },
  notes: String,
  followUpDates: [Date],
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
  appliedDate: { type: Date, default: Date.now },
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
  batchDate: Date,
  resultsDate: Date,
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

// USER PROFILE ROUTES
// Get user profile
app.get('/api/placement/profile/:userId', async (req, res) => {
  try {
    const profile = await UserProfile.findOne({ userId: req.params.userId });
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    res.json(profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create or update user profile
app.post('/api/placement/profile', async (req, res) => {
  try {
    const { userId, ...profileData } = req.body;
    
    if (!userId) {
      return res.status(400).json({ message: 'userId is required' });
    }

    let profile = await UserProfile.findOne({ userId });
    
    if (profile) {
      Object.assign(profile, profileData);
      profile.updatedAt = new Date();
      await profile.save();
    } else {
      profile = new UserProfile({ userId, ...profileData });
      await profile.save();
    }
    
    res.json(profile);
  } catch (error) {
    console.error('Error saving profile:', error);
    res.status(500).json({ message: error.message });
  }
});

// OFF-CAMPUS APPLICATION ROUTES
// Get all off-campus applications for a user
app.get('/api/placement/off-campus/:userId', async (req, res) => {
  try {
    const applications = await OffCampusApplication.find({ 
      userId: req.params.userId 
    }).sort({ createdAt: -1 });
    res.json(applications);
  } catch (error) {
    console.error('Error fetching off-campus applications:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create off-campus application
app.post('/api/placement/off-campus', async (req, res) => {
  try {
    if (!req.body.userId || !req.body.company || !req.body.jobTitle) {
      return res.status(400).json({ 
        message: 'userId, company, and jobTitle are required' 
      });
    }

    const application = new OffCampusApplication(req.body);
    await application.save();
    res.status(201).json(application);
  } catch (error) {
    console.error('Error creating off-campus application:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update off-campus application
app.put('/api/placement/off-campus/:id', async (req, res) => {
  try {
    const application = await OffCampusApplication.findByIdAndUpdate(
      req.params.id,
      { ...req.body, statusUpdatedDate: new Date() },
      { new: true, runValidators: true }
    );
    
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    
    res.json(application);
  } catch (error) {
    console.error('Error updating off-campus application:', error);
    res.status(500).json({ message: error.message });
  }
});

// Delete off-campus application
app.delete('/api/placement/off-campus/:id', async (req, res) => {
  try {
    const application = await OffCampusApplication.findByIdAndDelete(req.params.id);
    
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    
    res.json({ message: 'Application deleted successfully' });
  } catch (error) {
    console.error('Error deleting off-campus application:', error);
    res.status(500).json({ message: error.message });
  }
});

// ON-CAMPUS APPLICATION ROUTES
// Get all on-campus applications for a user
app.get('/api/placement/on-campus/:userId', async (req, res) => {
  try {
    const applications = await OnCampusApplication.find({ 
      userId: req.params.userId 
    }).sort({ createdAt: -1 });
    res.json(applications);
  } catch (error) {
    console.error('Error fetching on-campus applications:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create on-campus application
app.post('/api/placement/on-campus', async (req, res) => {
  try {
    if (!req.body.userId || !req.body.companyName) {
      return res.status(400).json({ 
        message: 'userId and companyName are required' 
      });
    }

    const application = new OnCampusApplication(req.body);
    await application.save();
    res.status(201).json(application);
  } catch (error) {
    console.error('Error creating on-campus application:', error);
    res.status(500).json({ message: error.message });
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
      return res.status(404).json({ message: 'Application not found' });
    }
    
    res.json(application);
  } catch (error) {
    console.error('Error updating on-campus application:', error);
    res.status(500).json({ message: error.message });
  }
});

// Delete on-campus application
app.delete('/api/placement/on-campus/:id', async (req, res) => {
  try {
    const application = await OnCampusApplication.findByIdAndDelete(req.params.id);
    
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    
    res.json({ message: 'Application deleted successfully' });
  } catch (error) {
    console.error('Error deleting on-campus application:', error);
    res.status(500).json({ message: error.message });
  }
});

// COMPANY DRIVE ROUTES
// Get all company drives for a user
app.get('/api/placement/company-drives/:userId', async (req, res) => {
  try {
    const drives = await CompanyDrive.find({ 
      userId: req.params.userId 
    }).sort({ batchDate: -1 });
    res.json(drives);
  } catch (error) {
    console.error('Error fetching company drives:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create company drive
app.post('/api/placement/company-drives', async (req, res) => {
  try {
    if (!req.body.userId || !req.body.companyName) {
      return res.status(400).json({ 
        message: 'userId and companyName are required' 
      });
    }

    const drive = new CompanyDrive(req.body);
    await drive.save();
    res.status(201).json(drive);
  } catch (error) {
    console.error('Error creating company drive:', error);
    res.status(500).json({ message: error.message });
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
      return res.status(404).json({ message: 'Company drive not found' });
    }
    
    res.json(drive);
  } catch (error) {
    console.error('Error updating company drive:', error);
    res.status(500).json({ message: error.message });
  }
});

// Delete company drive
app.delete('/api/placement/company-drives/:id', async (req, res) => {
  try {
    const drive = await CompanyDrive.findByIdAndDelete(req.params.id);
    
    if (!drive) {
      return res.status(404).json({ message: 'Company drive not found' });
    }
    
    res.json({ message: 'Company drive deleted successfully' });
  } catch (error) {
    console.error('Error deleting company drive:', error);
    res.status(500).json({ message: error.message });
  }
});

// ANALYTICS ENDPOINT
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
    res.status(500).json({ message: error.message });
  }
});

// ============================================================================
// HEALTH CHECK & INFO ENDPOINTS
// ============================================================================

app.get('/', (req, res) => {
  res.json({
    message: 'AutoJob Flow API Server is running!',
    version: '1.0.0',
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
║  Port: ${PORT}                                              ║
║  Environment: ${process.env.NODE_ENV || 'development'}                           ║
║  MongoDB: ${mongoose.connection.readyState === 1 ? '✅ Connected' : '⚠️  Disconnected'}                                  ║
║                                                            ║
║  Features:                                                 ║
║    ✅ Authentication (Passport)                            ║
║    ✅ Gmail Integration                                    ║
║    ✅ API Routes                                           ║
║    ✅ AI Chatbot with RAG                                  ║
║    ✅ Placement Tracking                                   ║
║                                                            ║
║  Placement Endpoints:                                      ║
║    GET/POST /api/placement/profile/:userId                 ║
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