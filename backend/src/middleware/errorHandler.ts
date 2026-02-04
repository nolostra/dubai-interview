import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface HttpError extends Error {
  statusCode?: number;
}

export interface StandardErrorResponse {
  success: false;
  error: {
    message: string;
    statusCode: number;
    code?: string;
    stack?: string;
  };
}

/**
 * Global error handler. Returns standardized JSON error responses.
 */
export function errorHandler(
  err: HttpError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode ?? 500;
  const message =
    statusCode === 500 ? 'Internal server error' : (err.message || 'Something went wrong');

  logger.error(message, {
    stack: err.stack,
    statusCode,
  });

  const response: StandardErrorResponse = {
    success: false,
    error: {
      message,
      statusCode,
      ...(process.env.NODE_ENV === 'development' && err.stack && { stack: err.stack }),
    },
  };

  if (!res.headersSent) {
    res.status(statusCode).json(response);
  }
}
