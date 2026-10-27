import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { validateBody } from '../middleware/validate.js';
import { loginRateLimiter } from '../middleware/login-rate-limit.js';
import { authenticateToken } from '../middleware/authenticate-token.js';
import { registerSchema, loginSchema } from '../schemas/auth.schema.js';

export const authRouter = Router();

// Public: register a new account (validation only)
authRouter.post('/register', validateBody(registerSchema), authController.register);

// Public: login with rate limiting + validation
authRouter.post('/login', loginRateLimiter, validateBody(loginSchema), authController.login);

// Protected: current user profile
authRouter.get('/me', authenticateToken, authController.me);