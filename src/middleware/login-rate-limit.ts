import rateLimit from 'express-rate-limit';

/**
 * Task 4 bonus requirement:
 * Limit login attempts to 5 requests per 15-minute window per IP.
 *
 * Rationale:
 * - Login is the highest-value brute-force target in the app.
 * - Bcrypt makes login CPU-expensive (~100ms per attempt), so a flood
 *   of logins is also a DoS vector.
 * - In-memory store is fine for single-instance dev; production would
 *   use Redis-backed rate-limit-redis for cross-instance consistency.
 */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,                    // 5 attempts per window
  standardHeaders: 'draft-7',// RateLimit-* headers per RFC draft
  legacyHeaders: false,      // Disable X-RateLimit-* legacy headers
  message: {
    error: 'TooManyRequests',
    message: 'Too many login attempts. Try again after 15 minutes.',
  },
  // Skip successful requests so a legitimate user who logs in 5x
  // in 15 min doesn't get blocked — only failed attempts count.
  skipSuccessfulRequests: true,
});