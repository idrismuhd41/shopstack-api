import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from '../middleware/error-handler.js';

export interface JwtPayload {
  sub: string;   // user id (JWT "subject" claim per RFC 7519)
  email: string;
  role: 'USER' | 'ADMIN';
}

/**
 * Hash a plaintext password using bcrypt.
 * Cost factor is read from env (BCRYPT_ROUNDS, default 10).
 */
export async function hashPassword(plain: string): Promise<string> {
  const rounds = Number(process.env.BCRYPT_ROUNDS ?? '10');
  return bcrypt.hash(plain, rounds);
}

/**
 * Compare a plaintext password against a stored bcrypt hash.
 * Returns true if the password matches, false otherwise.
 * bcrypt.compare is constant-time — safe against timing attacks.
 */
export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/**
 * Sign a JWT with the configured secret and expiry.
 */
export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn as jwt.SignOptions['expiresIn'],
  });
}

/**
 * Verify and decode a JWT.
 * Throws AppError(401) if the token is invalid, expired, or malformed.
 */
export function verifyToken(token: string): JwtPayload {
  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    // jwt.verify returns `string | JwtPayload`; assert our shape
    if (typeof decoded === 'string' || !decoded.sub) {
      throw new AppError(401, 'Invalid token payload');
    }
    return {
      sub: String(decoded.sub),
      email: String((decoded as { email?: string }).email ?? ''),
      role: ((decoded as { role?: string }).role === 'ADMIN' ? 'ADMIN' : 'USER'),
    };
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(401, 'Invalid or expired token');
  }
}