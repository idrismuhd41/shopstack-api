import type { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';

/**
  * Rejects requests missing a valid `x-api-key` header with 401 JSON.
 */
export function requireAPIKey(req: Request, res: Response, next: NextFunction): void {
  const provided = req.header('x-api-key');
  if (!provided || provided !== env.apiKey) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing or invalid x-api-key header',
    });
    return;
  }
  next();
}