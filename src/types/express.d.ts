/**
 * Global type augmentation for Express.
 * Adds `req.user` after the authenticateToken middleware runs.
 */
declare global {
  namespace Express {
    interface Request {
      user?: {
        sub: string;    // user id (JWT "subject" claim)
        email: string;
        role: 'USER' | 'ADMIN';
      };
    }
  }
}

export {};