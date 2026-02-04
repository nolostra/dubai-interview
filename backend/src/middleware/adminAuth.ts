import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

/**
 * Protects admin routes: requires X-Admin-Key header to match ADMIN_API_KEY.
 * Set ADMIN_API_KEY in .env. Returns 401 if missing or invalid.
 */
export function adminAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const key = req.headers['x-admin-key'];
  if (!env.ADMIN_API_KEY) {
    res.status(501).json({ error: 'Admin API not configured (ADMIN_API_KEY)' });
    return;
  }
  if (key !== env.ADMIN_API_KEY) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
}
