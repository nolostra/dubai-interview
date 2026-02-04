import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Logs method, URL, and response time for each request.
 * Must be registered early so it runs for all routes.
 */
export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const { method, originalUrl } = req;
    const status = res.statusCode;
    logger.info(`${method} ${originalUrl} ${status}`, {
      method,
      url: originalUrl,
      status,
      durationMs: duration,
    });
  });

  next();
}
