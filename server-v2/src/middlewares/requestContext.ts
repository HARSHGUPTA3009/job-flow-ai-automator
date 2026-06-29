import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export function requestContextMiddleware(req: Request, res: Response, next: NextFunction): void {
  req.requestId     = (req.headers['x-request-id']     as string) ?? uuidv4();
  req.correlationId = (req.headers['x-correlation-id'] as string) ?? req.requestId;
  req.startTime     = Date.now();

  res.setHeader('x-request-id',     req.requestId);
  res.setHeader('x-correlation-id', req.correlationId);

  next();
}
