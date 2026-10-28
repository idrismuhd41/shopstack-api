import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/error-handler.js';

export type UserRole = 'USER' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: string;
}

export interface CreateUserInput {
  name: string;
  email: string;
}

export interface CreateUserWithPasswordInput {
  name: string;
  email: string;
  passwordHash: string;
  role?: UserRole;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
}

// Helper: strip passwordHash before returning to callers
function toSafeUser(user: {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: string;
  createdAt: Date;
}): Omit<User, 'passwordHash'> {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as UserRole,
    createdAt: user.createdAt.toISOString(),
  };
}

export const userService = {
  async list(): Promise<Omit<User, 'passwordHash'>[]> {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return users.map(toSafeUser);
  },

  async getById(id: string): Promise<Omit<User, 'passwordHash'>> {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new AppError(404, `User ${id} not found`);
    return toSafeUser(user);
  },

  async create(input: CreateUserInput): Promise<Omit<User, 'passwordHash'>> {
    const duplicate = await prisma.user.findUnique({ where: { email: input.email } });
    if (duplicate) throw new AppError(409, 'Email already exists');

    try {
      const user = await prisma.user.create({
        data: {
          name: input.name,
          email: input.email,
          passwordHash: '',
          role: 'USER',
        },
      });
      return toSafeUser(user);
    } catch (err) {
      // Prisma unique constraint violation (P2002) — handles race condition
      if ((err as { code?: string }).code === 'P2002') {
        throw new AppError(409, 'Email already exists');
      }
      throw err;
    }
  },

  async createWithPassword(
    input: CreateUserWithPasswordInput,
  ): Promise<Omit<User, 'passwordHash'>> {
    const duplicate = await prisma.user.findUnique({ where: { email: input.email } });
    if (duplicate) throw new AppError(409, 'Email already exists');

    try {
      const user = await prisma.user.create({
        data: {
          name: input.name,
          email: input.email,
          passwordHash: input.passwordHash,
          role: input.role ?? 'USER',
        },
      });
      return toSafeUser(user);
    } catch (err) {
      if ((err as { code?: string }).code === 'P2002') {
        throw new AppError(409, 'Email already exists');
      }
      throw err;
    }
  },

  async update(id: string, input: UpdateUserInput): Promise<Omit<User, 'passwordHash'>> {
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) throw new AppError(404, `User ${id} not found`);

    try {
      const updated = await prisma.user.update({
        where: { id },
        data: input,
      });
      return toSafeUser(updated);
    } catch (err) {
      if ((err as { code?: string }).code === 'P2002') {
        throw new AppError(409, 'Email already exists');
      }
      throw err;
    }
  },

  async delete(id: string): Promise<void> {
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) throw new AppError(404, `User ${id} not found`);
    await prisma.user.delete({ where: { id } });
  },

  /**
   * Internal-only method — returns the full user INCLUDING passwordHash.
   * Used exclusively by auth.service for login credential checks.
   */
  async findByEmailInternal(email: string): Promise<User | null> {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return null;
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      passwordHash: user.passwordHash,
      role: user.role as UserRole,
      createdAt: user.createdAt.toISOString(),
    };
  },
};