import type { Request, Response } from 'express';
import { userService } from '../services/user.service.js';
import type { CreateUserDto, UpdateUserDto } from '../schemas/user.schema.js';

export const userController = {
  list(_req: Request, res: Response): void {
    res.json({ data: userService.list() });
  },

  getById(req: Request, res: Response): void {
    const user = userService.getById(req.params.id);
    res.json({ data: user });
  },

  create(req: Request<{}, {}, CreateUserDto>, res: Response): void {
    const user = userService.create(req.body);
    res.status(201).json({ data: user });
  },

  update(req: Request<{ id: string }, {}, UpdateUserDto>, res: Response): void {
    const user = userService.update(req.params.id, req.body);
    res.json({ data: user });
  },

  delete(req: Request<{ id: string }>, res: Response): void {
    userService.delete(req.params.id);
    res.status(204).send();
  },
};