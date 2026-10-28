import { PrismaClient } from '@prisma/client';
import { env } from '../config/env.js';

/**
 * Prisma client singleton.
 *
 * In development, caches on globalThis so `tsx watch` restarts don't
 * exhaust PostgreSQL's connection limit by creating a new pool on
 * every file save. In production, a plain singleton is sufficient
 * because the process starts once.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.nodeEnv === 'development' ? ['query', 'warn', 'error'] : ['error'],
  });

if (env.nodeEnv !== 'production') {
  globalForPrisma.prisma = prisma;
}