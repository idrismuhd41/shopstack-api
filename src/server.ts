import { app } from './app.js';
import { env } from './config/env.js';

const server = app.listen(env.port, () => {
  console.log(`ShopStack API running on http://localhost:${env.port} [${env.nodeEnv}]`);
});

// Graceful shutdown — important for Docker (Task 7)
const shutdown = (signal: string): void => {
  console.log(`${signal} received. Shutting down gracefully...`);
  server.close(() => process.exit(0));
};
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));