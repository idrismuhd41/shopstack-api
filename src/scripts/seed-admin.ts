import { hashPassword } from '../services/auth.service.js';
import { userService } from '../services/user.service.js';
import { prisma } from '../lib/prisma.js';

async function main() {
  const email = 'admin@example.com';
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log('Admin already exists:', existing.email, existing.role);
    await prisma.$disconnect();
    return;
  }

  const passwordHash = await hashPassword('admin123');
  const user = await userService.createWithPassword({
    name: 'Admin',
    email,
    passwordHash,
    role: 'ADMIN',
  });
  console.log('Admin created:', user);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});