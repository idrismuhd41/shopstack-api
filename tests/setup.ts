import { execSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';

// Use the test database, not the dev database
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  'postgresql://shopstack:shopstack_dev@localhost:5432/shopstack_test?schema=public';
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_EXPIRES_IN = '1h';
process.env.API_KEY = 'test-api-key';
process.env.CORS_ORIGIN = 'http://localhost:5173';
process.env.BCRYPT_ROUNDS = '4'; // lower cost for faster tests

beforeAll(async () => {
  // Apply migrations to the test database
  execSync('npx prisma migrate deploy', {
    env: { ...process.env },
    stdio: 'inherit',
  });
});

const prisma = new PrismaClient();

afterEach(async () => {
  // Clear tables between tests — cascade will delete children
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "order_items", "orders", "products", "users" RESTART IDENTITY CASCADE');
});

afterAll(async () => {
  await prisma.$disconnect();
});