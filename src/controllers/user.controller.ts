import type { Request, Response } from 'express';
import { userService } from '../services/user.service.js';
import { AppError } from '../middleware/error-handler.js';
import { asyncHandler } from '../middleware/async-handler.js';
import type { CreateUserDto, UpdateUserDto } from '../schemas/user.schema.js';

export const userController = {
  list: asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const users = await userService.list();
    res.json({ data: users });
  }),

  getById: asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = await userService.getById(req.params.id);
    res.json({ data: user });
  }),

  me: asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.sub;
    const user = await userService.getById(userId);
    res.json({ data: user });
  }),

  create: asyncHandler(
    async (req: Request<{}, {}, CreateUserDto>, res: Response): Promise<void> => {
      const user = await userService.create(req.body);
      res.status(201).json({ data: user });
    },
  ),

  update: asyncHandler(
    async (req: Request<{ id: string }, {}, UpdateUserDto>, res: Response): Promise<void> => {
      // Ownership check: only self or admin can update
      if (req.user!.sub !== req.params.id && req.user!.role !== 'ADMIN') {
        throw new AppError(403, 'Cannot update other users');
      }
      const user = await userService.update(req.params.id, req.body);
      res.json({ data: user });
    },
  ),

  delete: asyncHandler(async (req: Request, res: Response): Promise<void> => {
    await userService.delete(req.params.id);
    res.status(204).send();
  }),
};