import { Request, Response, NextFunction } from 'express';
import { AppError, IdempotencyError, RateLimitError } from '../errors/AppError';
import { logger } from '../utils/logger';
import { ZodError } from 'zod';

export function globalErrorHandler(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  // Idempotency short-circuit — return cached result
  if (err instanceof IdempotencyError) {
    res.status(200).json({
      cached: true,
      data: err.cachedResult,
    });
    return;
  }

  // Zod validation errors
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: err.flatten().fieldErrors,
      requestId: req.requestId,
    });
    return;
  }

  // Known operational errors
  if (err instanceof AppError && err.isOperational) {
    const responseBody: Record<string, unknown> = {
      error: err.message,
      code: err.code,
      requestId: req.requestId,
    };

    if (err instanceof RateLimitError && err.retryAfter) {
      res.setHeader('Retry-After', err.retryAfter);
      responseBody.retryAfter = err.retryAfter;
    }

    logger.warn({
      err: { message: err.message, code: err.code, stack: err.stack },
      req: { method: req.method, url: req.url, requestId: req.requestId },
    }, 'Operational error');

    res.status(err.statusCode).json(responseBody);
    return;
  }

  // Unknown / programmer errors — log fully, return generic message
  logger.error({
    err: { message: err.message, stack: err.stack, name: err.name },
    req: {
      method: req.method,
      url: req.url,
      requestId: req.requestId,
      userId: req.user?.userId,
    },
  }, 'Unhandled error');

  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    requestId: req.requestId,
  });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: `Route not found: ${req.method} ${req.path}`,
    code: 'NOT_FOUND',
    requestId: req.requestId,
  });
}
