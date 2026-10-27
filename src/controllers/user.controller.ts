import type { Request, Response } from 'express';
import { userService } from '../services/user.service.js';
import { AppError } from '../middleware/error-handler.js';
import type { CreateUserDto, UpdateUserDto } from '../schemas/user.schema.js';

export const userController = {
  list(_req: Request, res: Response): void {
    res.json({ data: userService.list() });
  },

  getById(req: Request, res: Response): void {
    const user = userService.getById(req.params.id);
    res.json({ data: user });
  },

  /**
   * GET /api/users/me
   * Returns the authenticated user's profile (via req.user.sub).
   */
  me(req: Request, res: Response): void {
    const userId = req.user!.sub;
    const user = userService.getById(userId);
    res.json({ data: user });
  },

  create(req: Request<{}, {}, CreateUserDto>, res: Response): void {
    const user = userService.create(req.body);
    res.status(201).json({ data: user });
  },

  update(req: Request<{ id: string }, {}, UpdateUserDto>, res: Response): void {
    // Ownership check: only self or admin can update
    if (req.user!.sub !== req.params.id && req.user!.role !== 'ADMIN') {
      throw new AppError(403, 'Cannot update other users');
    }
    const user = userService.update(req.params.id, req.body);
    res.json({ data: user });
  },

  delete(req: Request, res: Response): void {
    userService.delete(req.params.id);
    res.status(204).send();
  },
};