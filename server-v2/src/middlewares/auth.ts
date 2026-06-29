import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { AuthenticationError, AuthorizationError } from '../errors/AppError';
import { getRedisClient } from '../config/redis';
import { logger } from '../utils/logger';

export interface JWTPayload {
  userId: string;
  email: string;
  name: string;
  role: 'free' | 'premium' | 'admin';
  googleId?: string;
  iat?: number;
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
      requestId: string;
      correlationId: string;
      startTime: number;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AuthenticationError('Bearer token required. Get a token from POST /api/v2/auth/token');
  }

  const token = authHeader.slice(7);
  try {
    req.user = jwt.verify(token, config.JWT_SECRET) as JWTPayload;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) throw new AuthenticationError('Token expired');
    if (err instanceof jwt.JsonWebTokenError) {
      void trackInvalidJWT(req.ip ?? 'unknown', req.requestId);
      throw new AuthenticationError('Invalid token');
    }
    throw new AuthenticationError();
  }
}

export function optionalAuthenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return next();
  const token = authHeader.slice(7);
  try { req.user = jwt.verify(token, config.JWT_SECRET) as JWTPayload; } catch { /* ignore */ }
  next();
}

export function requireRole(...roles: JWTPayload['role'][]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) throw new AuthenticationError();
    if (!roles.includes(req.user.role)) {
      throw new AuthorizationError(`Requires role: ${roles.join(' or ')}`);
    }
    next();
  };
}

export function generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, config.JWT_SECRET, { expiresIn: '7d' });
}

async function trackInvalidJWT(ip: string, requestId: string): Promise<void> {
  try {
    const redis = getRedisClient();
    const key = `abuse:invalid_jwt:${ip}`;
    const count = await redis.incr(key);
    await redis.expire(key, 3600);
    if (count >= 10) {
      const alreadyBlocked = await redis.exists(`blocked:${ip}`);
      if (!alreadyBlocked) {
        await redis.setex(`blocked:${ip}`, 300, '1');
        logger.warn({ ip, count, requestId }, 'IP blocked for repeated invalid JWT attempts');
      }
    }
  } catch (err) {
    logger.error({ err }, 'Failed to track invalid JWT');
  }
}
