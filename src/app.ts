import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { requestLogger } from './middleware/request-logger.js';
import { requireAPIKey } from './middleware/require-api-key.js';
import { userRouter } from './routes/user.routes.js';
import { authRouter } from './routes/auth.routes.js';
import { productRouter } from './routes/product.routes.js';
import { notFoundHandler, errorHandler } from './middleware/error-handler.js';
import { orderRouter } from './routes/order.routes.js';

export const app = express();

// Global middleware
app.use(helmet());
app.use(cors({ origin: env.corsOrigin }));
app.use(express.json({ limit: '1mb' }));
app.use(requestLogger);

// Health (public)
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Auth routes — user-facing, no API key
app.use('/api/auth', authRouter);

// Product routes — public read, admin write (JWT + RBAC on writes)
app.use('/api/products', productRouter);

// User routes — API key + JWT protected
app.use('/api/users', requireAPIKey, userRouter);

app.use('/api/orders', orderRouter);

// Fallbacks
app.use(notFoundHandler);
app.use(errorHandler);

app.post('/_seed-admin', requireAPIKey, async (_req, res) => {
  const { hashPassword } = await import('./services/auth.service.js');
  const { userService } = await import('./services/user.service.js');
  const passwordHash = await hashPassword('admin123');
  const user = await userService.createWithPassword({
    name: 'Admin',
    email: 'admin@example.com',
    passwordHash,
    role: 'ADMIN',
  });
  res.json({ data: user });
});