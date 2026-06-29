import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import compression from 'compression';
import { createServer } from 'http';
import { Server as SocketIO } from 'socket.io';

import { config } from '../config/env';
import { connectMongoDB } from '../config/mongodb';
import { getRedisClient } from '../config/redis';
import { logger } from '../utils/logger';

import { requestContextMiddleware } from '../middlewares/requestContext';
import { globalErrorHandler, notFoundHandler } from '../middlewares/errorHandler';
import {
  globalRateLimiter,
  userRateLimiter,
  atsRateLimiter,
  leaderboardRateLimiter,
} from '../middlewares/rateLimiter';
import { authenticate, requireRole, generateToken } from '../middlewares/auth';

import { analyzeResume, getATSStatus, resumeUpload } from '../services/ats/atsService';
import {
  toggleProgress,
  starQuestion,
  getMyProgress,
  getLeaderboard,
} from '../services/user/progressService';
import {
  getFailedJobs,
  retryJob,
  deleteJob,
  getQueueMetricsAll,
  getRedisMetrics,
  getSystemHealth,
  getRateLimitStats,
} from '../services/admin/adminService';

// ─────────────────────────────────────────────────────────────────────────────
// App setup
// ─────────────────────────────────────────────────────────────────────────────
const app = express();
const httpServer = createServer(app);

export const io = new SocketIO(httpServer, {
  cors: { origin: config.CLIENT_URL, credentials: true },
});

// ─────────────────────────────────────────────────────────────────────────────
// Global middleware
// ─────────────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: [config.CLIENT_URL, 'http://localhost:5173', 'http://localhost:5174'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-request-id',
      'x-correlation-id',
      'Cookie',
    ],
    exposedHeaders: [
      'x-request-id',
      'x-correlation-id',
      'x-ratelimit-limit',
      'x-ratelimit-remaining',
      'x-ratelimit-reset',
      'x-cache',
    ],
  })
);

app.options('*', cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.set('trust proxy', 1);

// Request context — must be first
app.use(requestContextMiddleware);

// Global rate limiting — 500 req/min/IP with burst
app.use(globalRateLimiter);

// Structured request logging
app.use((req, res, next) => {
  res.on('finish', () => {
    logger.info({
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      processingTimeMs: Date.now() - req.startTime,
      requestId: req.requestId,
      correlationId: req.correlationId,
      userId: req.user?.userId,
      ip: req.ip,
    }, 'Request completed');
  });
  next();
});

// ─────────────────────────────────────────────────────────────────────────────
// JWT Token Exchange Endpoint
// Allows old-server session-authenticated users to get a v2 JWT token.
// Frontend calls: POST /api/v2/auth/token  with { userId, email, name, role? }
// This endpoint should only be called from the old server's auth callback or
// from the frontend after verifying session at /auth/status on the old server.
// ─────────────────────────────────────────────────────────────────────────────
app.post('/api/v2/auth/token', (req, res) => {
  const { userId, email, name, googleId, role } = req.body as {
    userId?: string;
    email?: string;
    name?: string;
    googleId?: string;
    role?: 'free' | 'premium' | 'admin';
  };

  if (!userId || !email) {
    res.status(400).json({ error: 'userId and email are required' });
    return;
  }

  const token = generateToken({
    userId,
    email,
    name: name ?? email.split('@')[0],
    role: role ?? 'free',
    googleId,
  });

  res.json({ token, expiresIn: '7d' });
});

// ─────────────────────────────────────────────────────────────────────────────
// API v1 Router
// ─────────────────────────────────────────────────────────────────────────────
const v1 = express.Router();

// ── ATS Routes
v1.post(
  '/ats/analyze',
  authenticate,
  userRateLimiter,
  atsRateLimiter,
  resumeUpload.single('file'),
  analyzeResume
);
v1.get('/ats/status/:jobId', authenticate, getATSStatus);

// ── Progress Routes
v1.post('/progress/toggle', authenticate, userRateLimiter, toggleProgress);
v1.post('/progress/star',   authenticate, userRateLimiter, starQuestion);
v1.get('/progress/me',      authenticate, getMyProgress);

// ── Leaderboard
v1.get('/leaderboard', authenticate, leaderboardRateLimiter, getLeaderboard);

// ── Admin Routes (admin role required)
v1.get('/admin/jobs/failed',          authenticate, requireRole('admin'), getFailedJobs);
v1.post('/admin/jobs/retry/:id',      authenticate, requireRole('admin'), retryJob);
v1.delete('/admin/jobs/:id',          authenticate, requireRole('admin'), deleteJob);
v1.get('/admin/metrics/queues',       authenticate, requireRole('admin'), getQueueMetricsAll);
v1.get('/admin/metrics/redis',        authenticate, requireRole('admin'), getRedisMetrics);
v1.get('/admin/metrics/rate-limits',  authenticate, requireRole('admin'), getRateLimitStats);
v1.get('/admin/health',               getSystemHealth);

app.use('/api/v1', v1);

// ─────────────────────────────────────────────────────────────────────────────
// Health + root
// ─────────────────────────────────────────────────────────────────────────────
app.get('/health', getSystemHealth);
app.get('/', (_req, res) => {
  res.json({
    name: 'AutoJobFlow v2 API Gateway',
    version: '2.0.0',
    port: config.PORT,
    note: 'Original server still runs on port 3001. This v2 gateway runs on port 3002.',
    endpoints: {
      tokenExchange: 'POST /api/v2/auth/token',
      ats:           '/api/v1/ats',
      progress:      '/api/v1/progress',
      leaderboard:   '/api/v1/leaderboard',
      admin:         '/api/v1/admin',
      health:        '/health',
    },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// WebSocket — real-time job status updates
// ─────────────────────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  logger.debug({ socketId: socket.id }, 'WebSocket client connected');
  socket.on('subscribe:job', (jobId: string) => {
    socket.join(`job:${jobId}`);
    logger.debug({ socketId: socket.id, jobId }, 'Client subscribed to job');
  });
  socket.on('disconnect', () => {
    logger.debug({ socketId: socket.id }, 'WebSocket client disconnected');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Error handling — must be last
// ─────────────────────────────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(globalErrorHandler);

// ─────────────────────────────────────────────────────────────────────────────
// Bootstrap
// ─────────────────────────────────────────────────────────────────────────────
async function start(): Promise<void> {
  await connectMongoDB();
  getRedisClient();

  httpServer.listen(config.PORT, () => {
    logger.info(`✅ AutoJobFlow v2 Gateway running on port ${config.PORT}`);
    logger.info(`   Old server (v1): port 3001`);
    logger.info(`   v2 Gateway:      port ${config.PORT}`);
    logger.info(`   Environment:     ${config.NODE_ENV}`);
  });

  async function shutdown(signal: string): Promise<void> {
    logger.warn({ signal }, 'Shutdown signal received');
    httpServer.close(async () => {
      const { closeMongoDB } = await import('../config/mongodb');
      const { closeRedis } = await import('../config/redis');
      const { closeAllQueues } = await import('../queues');
      await Promise.all([closeMongoDB(), closeRedis(), closeAllQueues()]);
      logger.info('v2 Gateway gracefully shut down');
      process.exit(0);
    });
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
  process.on('uncaughtException',  (err)    => { logger.fatal({ err }, 'Uncaught exception'); process.exit(1); });
  process.on('unhandledRejection', (reason) => { logger.fatal({ reason }, 'Unhandled rejection'); process.exit(1); });
}

start().catch((err) => {
  logger.fatal({ err }, 'Failed to start v2 Gateway');
  process.exit(1);
});
