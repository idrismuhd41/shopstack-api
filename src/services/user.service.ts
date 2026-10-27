import { randomUUID } from 'node:crypto';
import { AppError } from '../middleware/error-handler.js';

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface CreateUserInput {
  name: string;
  email: string;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
}

/**
    without changing the controller layer — that's the point of separation of concerns.
 */
const users = new Map<string, User>();

export const userService = {
  list(): User[] {
    return Array.from(users.values());
  },

  getById(id: string): User {
    const user = users.get(id);
    if (!user) throw new AppError(404, `User ${id} not found`);
    return user;
  },

  create(input: CreateUserInput): User {
    const duplicate = Array.from(users.values()).find((u) => u.email === input.email);
    if (duplicate) throw new AppError(409, 'Email already exists');

    const user: User = {
      id: randomUUID(),
      name: input.name,
      email: input.email,
      createdAt: new Date().toISOString(),
    };
    users.set(user.id, user);
    return user;
  },

  update(id: string, input: UpdateUserInput): User {
    const existing = this.getById(id);
    const updated: User = { ...existing, ...input };
    users.set(id, updated);
    return updated;
  },

  delete(id: string): void {
    if (!users.delete(id)) throw new AppError(404, `User ${id} not found`);
  },
};