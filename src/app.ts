import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { requestLogger } from './middleware/request-logger.js';
import { requireAPIKey } from './middleware/require-api-key.js';
import { userRouter } from './routes/user.routes.js';
import { notFoundHandler, errorHandler } from './middleware/error-handler.js';

export const app = express();

// Global middleware (order matters!)
app.use(helmet());
app.use(cors({ origin: env.corsOrigin }));
app.use(express.json({ limit: '1mb' }));
app.use(requestLogger); // Task 3 core: observability

// Health endpoint (public)
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Protected API routes (Task 3 bonus: x-api-key)
app.use('/api/users', requireAPIKey, userRouter);

// Fallbacks (must be last)
app.use(notFoundHandler);
app.use(errorHandler);