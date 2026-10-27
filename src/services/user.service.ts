import { randomUUID } from 'node:crypto';
import { AppError } from '../middleware/error-handler.js';

export type UserRole = 'USER' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;   // bcrypt hash — NEVER returned in API responses
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

/**
 * In-memory user store for Task 3 / Task 4.
 * Phase 3 (Task 5) will swap this for a Prisma-backed repository.
 */
const users = new Map<string, User>();

export const userService = {
  list(): Omit<User, 'passwordHash'>[] {
    return Array.from(users.values()).map(({ passwordHash: _, ...rest }) => rest);
  },

  getById(id: string): Omit<User, 'passwordHash'> {
    const user = users.get(id);
    if (!user) throw new AppError(404, `User ${id} not found`);
    const { passwordHash: _, ...safe } = user;
    return safe;
  },

  create(input: CreateUserInput): Omit<User, 'passwordHash'> {
    const duplicate = Array.from(users.values()).find((u) => u.email === input.email);
    if (duplicate) throw new AppError(409, 'Email already exists');

    const user: User = {
      id: randomUUID(),
      name: input.name,
      email: input.email,
      passwordHash: '',  // Task 3 users have no password — that's fine
      role: 'USER',
      createdAt: new Date().toISOString(),
    };
    users.set(user.id, user);
    const { passwordHash: _, ...safe } = user;
    return safe;
  },

  createWithPassword(input: CreateUserWithPasswordInput): Omit<User, 'passwordHash'> {
    const duplicate = Array.from(users.values()).find((u) => u.email === input.email);
    if (duplicate) throw new AppError(409, 'Email already exists');

    const user: User = {
      id: randomUUID(),
      name: input.name,
      email: input.email,
      passwordHash: input.passwordHash,
      role: input.role ?? 'USER',
      createdAt: new Date().toISOString(),
    };
    users.set(user.id, user);
    const { passwordHash: _, ...safe } = user;
    return safe;
  },

  update(id: string, input: UpdateUserInput): Omit<User, 'passwordHash'> {
    const existing = users.get(id);
    if (!existing) throw new AppError(404, `User ${id} not found`);
    const updated: User = { ...existing, ...input };
    users.set(id, updated);
    const { passwordHash: _, ...safe } = updated;
    return safe;
  },

  delete(id: string): void {
    if (!users.delete(id)) throw new AppError(404, `User ${id} not found`);
  },

  /**
   * Internal-only method — returns the full user INCLUDING passwordHash.
   * Used exclusively by auth.service for login credential checks.
   * The "findByEmail" method is intentionally NOT exposed in the controller layer.
   */
  findByEmailInternal(email: string): User | null {
    return Array.from(users.values()).find((u) => u.email === email) ?? null;
  },
};