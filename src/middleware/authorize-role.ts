import type { Request, Response, NextFunction } from 'express';
import { AppError } from './error-handler.js';

export type Role = 'USER' | 'ADMIN';

/**
 * Task 4 requirement: `authorizeRole` middleware factory.
 *
 * Must run AFTER `authenticateToken` (which sets `req.user`).
 * Rejects with 403 if the authenticated user's role does not match.
 *
 * Usage:
 *   router.delete('/products/:id', authenticateToken, authorizeRole('ADMIN'), handler)
 */
export function authorizeRole(requiredRole: Role) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    // Defense in depth — authenticateToken should have already set this.
    if (!req.user) {
      return next(new AppError(401, 'Authentication required'));
    }

    if (req.user.role !== requiredRole) {
      return next(new AppError(403, `Requires role: ${requiredRole}`));
    }

    next();
  };
}