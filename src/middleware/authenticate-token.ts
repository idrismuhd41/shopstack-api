import type { Request, Response, NextFunction } from 'express';
import { verifyToken, type JwtPayload } from '../services/auth.service.js';
import { AppError } from './error-handler.js';

/**
 * Task 4 requirement: `authenticateToken` middleware.
 *
 * Verifies a Bearer JWT from the Authorization header and attaches
 * the decoded payload to `req.user`. Returns 401 on any failure.
 */
export function authenticateToken(req: Request, _res: Response, next: NextFunction): void {
  const header = req.header('authorization');
  if (!header || !header.startsWith('Bearer ')) {
    return next(new AppError(401, 'Missing or malformed Authorization header'));
  }

  const token = header.slice('Bearer '.length).trim();
  if (!token) {
    return next(new AppError(401, 'Empty bearer token'));
  }

  try {
    const payload: JwtPayload = verifyToken(token);
    req.user = payload;
    next();
  } catch (err) {
    if (err instanceof AppError) return next(err);
    next(new AppError(401, 'Invalid or expired token'));
  }
}