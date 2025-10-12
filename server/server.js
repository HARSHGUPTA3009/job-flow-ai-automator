const express = require('express');
const cors = require('cors');
const passport = require('passport');
const session = require('express-session');
require('dotenv').config();

// Import chatbot routes
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

// Connect to MongoDB (optional if using cloud)
try {
  if (process.env.MONGODB_URI) {
    connectDB();
  }
} catch (error) {
  console.error('⚠️ MongoDB connection not configured:', error.message);
}

// ============================================================================
// ROUTES
// ============================================================================

// Gmail Routes
app.use("/gmail", require("./routes/gmail"));

// Auth Routes
app.use('/auth', require("./routes/auth"));

// API Routes
app.use('/api', require("./routes/api"));

// Chatbot Routes (NEW)
app.use('/api/chatbot', chatbotRoutes);

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
      chatbot: '/api/chatbot'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'running',
    timestamp: new Date(),
    uptime: process.uptime()
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    services: {
      chatbot: 'enabled',
      gmail: 'enabled',
      auth: 'enabled',
      api: 'enabled'
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
║  Features:                                                 ║
║    ✅ Authentication (Passport)                            ║
║    ✅ Gmail Integration                                    ║
║    ✅ API Routes                                           ║
║    ✅ AI Chatbot with RAG                                  ║
║    ✅ Placement Tracking                                   ║
║                                                            ║
║  Endpoints:                                                ║
║    GET  /                 - Server info                    ║
║    GET  /health           - Health check                   ║
║    POST /api/chatbot/initialize  - Init chat               ║
║    POST /api/chatbot/message     - Send message            ║
║    POST /api/chatbot/clear       - Clear chat              ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
});