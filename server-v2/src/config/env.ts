import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

// Support both GROQ_API_KEYS (comma-separated) and GROQ_KEY_1/2/3 (old format)
function resolveGroqKeys(): string {
  if (process.env.GROQ_API_KEYS) return process.env.GROQ_API_KEYS;
  const keys = [
    process.env.GROQ_KEY_1,
    process.env.GROQ_KEY_2,
    process.env.GROQ_KEY_3,
    process.env.GROQ_KEY_4,
  ].filter(Boolean) as string[];
  return keys.join(',');
}
process.env.GROQ_API_KEYS = resolveGroqKeys();

// Support GOOGLE_CALLBACK_URL or GOOGLE_REDIRECT_URI (old name)
if (!process.env.GOOGLE_CALLBACK_URL && process.env.GOOGLE_REDIRECT_URI) {
  process.env.GOOGLE_CALLBACK_URL = process.env.GOOGLE_REDIRECT_URI;
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3002), // v2 gateway on 3002, old server stays on 3001
  WORKER_PORT: z.coerce.number().default(3003),

  // MongoDB
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),

  // Redis
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),

  // Auth — JWT_SECRET required for v2, SESSION_SECRET kept for old server compat
  JWT_SECRET: z.string().min(1).default('autojobflow-v2-dev-secret-change-in-production'),
  SESSION_SECRET: z.string().min(1).default('dev-session-secret'),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.string().optional(),

  // Groq (AI) — resolved above from either format
  GROQ_API_KEYS: z.string().min(1, 'At least one GROQ key is required (GROQ_KEY_1 or GROQ_API_KEYS)'),

  // App
  CLIENT_URL: z.string().default('https://autojobflow.vercel.app'),
  VITE_API_URL: z.string().optional(), // old server's self URL for keepalive
  API_VERSION: z.string().default('v1'),

  // Rate Limiting
  GLOBAL_RATE_LIMIT: z.coerce.number().default(500),
  USER_RATE_LIMIT: z.coerce.number().default(100),
  ATS_HOURLY_LIMIT: z.coerce.number().default(10),

  // Queue
  MAX_JOB_ATTEMPTS: z.coerce.number().default(5),
  JOB_BACKOFF_BASE_MS: z.coerce.number().default(1000),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ [server-v2] Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = parsed.data;
export type Config = typeof config;
