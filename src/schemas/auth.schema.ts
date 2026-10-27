import { z } from 'zod';

/**
 * Registration schema.
 * - Password min 8 chars: NIST SP 800-63B baseline
 * - Password max 72 bytes: bcrypt truncates silently past 72 bytes — capping
 *   here avoids the "different passwords, same hash" trap.
 */
export const registerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address').toLowerCase(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must be at most 72 characters (bcrypt limit)'),
});

/**
 * Login schema.
 * Same password bounds as register — rejecting early avoids
 * wasting a bcrypt.compare call on impossible input.
 */
export const loginSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required').max(72),
});

export type RegisterDto = z.infer<typeof registerSchema>;
export type LoginDto = z.infer<typeof loginSchema>;