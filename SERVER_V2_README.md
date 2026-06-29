# AutoJobFlow — v2 Backend (server-v2/)

The original server (`server/`) is untouched and still works exactly as before.
`server-v2/` is a new TypeScript backend that runs **alongside** it on a different port.

---

## How They Coexist

```
Frontend (React)
    │
    ├─► server/        (port 3001) — Original Express server
    │     Google OAuth, Passport sessions, Placement tracker,
    │     Cold emails, legacy ATS upload route
    │
    └─► server-v2/     (port 3002) — v2 API Gateway (TypeScript)
          Event-driven ATS queue, Distributed rate limiting,
          Leaderboard with Redis cache, Admin observability,
          Dead letter queue, Retry policies
```

---

## Getting Started

### 1. Install v2 dependencies
```bash
cd server-v2
npm install
```

### 2. Environment variables
`server-v2` reads from the same `.env` file as the original server.
Copy `.env.example` inside `server-v2/` and fill it in — or symlink the existing `server/.env`:

```bash
# From project root:
ln -s ../server/.env server-v2/.env
```

Key variables needed by v2 (all already in the original `.env`):
- `MONGODB_URI`
- `REDIS_URL`
- `GROQ_KEY_1` / `GROQ_KEY_2` / `GROQ_KEY_3`  (old format, supported as-is)
- `SESSION_SECRET` (existing)
- `JWT_SECRET` → **add this** (any 32+ char string)
- `PORT=3002` → **set this for v2** (original stays on 3001)

### 3. Run both servers
```bash
# Terminal 1 — original server (unchanged)
cd server && npm start

# Terminal 2 — v2 gateway
cd server-v2 && npm run dev

# Terminal 3 — v2 workers (ATS, notifications, analytics, leaderboard)
cd server-v2 && npm run dev:worker
```

### 4. Or use Docker
```bash
# From project root:
docker-compose up
```

---

## Authentication Flow

The original server uses Google OAuth + Passport sessions.
The v2 gateway uses JWT Bearer tokens.

**Bridge:** After signing in via Google (old server), call:

```
POST http://localhost:3002/api/v2/auth/token
Content-Type: application/json

{
  "userId": "user._id from /auth/status",
  "email": "user.email",
  "name": "user.name",
  "googleId": "user.googleId"
}
```

Response: `{ "token": "eyJ...", "expiresIn": "7d" }`

Store this token and use it as `Authorization: Bearer <token>` for all v2 endpoints.

---

## v2 API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/v2/auth/token | Exchange session user info for JWT |
| POST | /api/v1/ats/analyze | Queue resume for ATS analysis (multipart PDF) |
| GET  | /api/v1/ats/status/:jobId | Poll job status |
| POST | /api/v1/progress/toggle | Toggle DSA question solved |
| POST | /api/v1/progress/star | Star a question |
| GET  | /api/v1/progress/me | Get all progress for current user |
| GET  | /api/v1/leaderboard | Leaderboard (cached, event-invalidated) |
| GET  | /api/v1/admin/jobs/failed | List all failed jobs (admin only) |
| POST | /api/v1/admin/jobs/retry/:id | Retry a failed job (admin only) |
| DELETE | /api/v1/admin/jobs/:id | Delete a job (admin only) |
| GET  | /api/v1/admin/metrics/queues | Queue metrics |
| GET  | /api/v1/admin/metrics/redis | Redis metrics + cache hit rate |
| GET  | /api/v1/admin/metrics/rate-limits | Currently blocked IPs/users |
| GET  | /api/v1/admin/health | Health of all services |
| GET  | /health | System health (public) |

---

## File Structure

```
server-v2/
├── package.json
├── tsconfig.json
├── .env.example
├── Dockerfile.dev
└── src/
    ├── config/
    │   ├── env.ts          ← Zod env validation (supports old GROQ_KEY_1 format)
    │   ├── redis.ts        ← Redis singleton + BullMQ connection factory
    │   ├── mongodb.ts      ← Mongoose connection
    │   └── groqPool.ts     ← Key pool with round-robin + exhaustion tracking
    ├── errors/
    │   └── AppError.ts     ← 7 typed error classes
    ├── events/
    │   └── eventBus.ts     ← Typed event dispatch (resume→queue→workers)
    ├── gateway/
    │   └── index.ts        ← Express app + all routes + WebSocket
    ├── middlewares/
    │   ├── auth.ts         ← JWT verify + role check + generateToken
    │   ├── rateLimiter.ts  ← Redis Lua sliding window + token bucket
    │   ├── requestContext.ts ← RequestID / CorrelationID generation
    │   └── errorHandler.ts ← Global error handler + 404
    ├── queues/
    │   └── index.ts        ← BullMQ queue singletons (ats, notif, analytics, dlq)
    ├── services/
    │   ├── ats/atsService.ts       ← PDF parse → fingerprint → queue dispatch
    │   ├── admin/adminService.ts   ← DLQ management, metrics, health
    │   └── user/progressService.ts ← Toggle/star/leaderboard (event-emitting)
    ├── utils/
    │   ├── logger.ts       ← Pino structured logger
    │   └── idempotency.ts  ← SHA256 fingerprint + Redis cache
    └── workers/
        ├── index.ts         ← Worker process entrypoint (graceful shutdown)
        ├── atsWorker.ts     ← ATS analysis: Groq call, retry, DLQ on final fail
        └── supportWorkers.ts ← Notification, analytics, leaderboard workers
```

---

## Key Design Points for Interviews

**Rate limiting without express-rate-limit:**
Redis Lua scripts execute atomically — `ZADD`/`ZCARD` for sliding window, `HMSET` for token bucket. No race conditions. Works identically across 10 server replicas.

**Idempotency:**
SHA256(resumeText + jobDescription) is the fingerprint. BullMQ uses it as `jobId` (deduplication at queue level). Redis caches the result (24h). Same request from any user with identical resume+JD returns instantly.

**Fault tolerance:**
Workers retry 5× with exponential backoff (1→16s). Groq 429s rotate to next key in pool. After 5 failures, job auto-moves to dead-letter queue with full payload + stack trace. Admin can retry or delete via API.

**Graceful shutdown:**
`worker.close()` drains the current in-flight job before exit. No job lost on deploy.
