import type { Request, Response } from 'express';
import { userService } from '../services/user.service.js';
import { hashPassword, verifyPassword, signToken } from '../services/auth.service.js';
import type { RegisterDto, LoginDto } from '../schemas/auth.schema.js';
import { AppError } from '../middleware/error-handler.js';
import { asyncHandler } from '../middleware/async-handler.js';

export const authController = {
  register: asyncHandler(
    async (req: Request<{}, {}, RegisterDto>, res: Response): Promise<void> => {
      const { name, email, password } = req.body;

      const passwordHash = await hashPassword(password);
      const user = await userService.createWithPassword({ name, email, passwordHash });

      res.status(201).json({ data: user });
    },
  ),

  login: asyncHandler(
    async (req: Request<{}, {}, LoginDto>, res: Response): Promise<void> => {
      const { email, password } = req.body;

      const internal = await userService.findByEmailInternal(email);
      if (!internal) {
        throw new AppError(401, 'Invalid email or password');
      }

      const ok = await verifyPassword(password, internal.passwordHash);
      if (!ok) {
        throw new AppError(401, 'Invalid email or password');
      }

      const token = signToken({
        sub: internal.id,
        email: internal.email,
        role: internal.role,
      });

      const { passwordHash: _ignore, ...safeUser } = internal;
      res.json({ data: { token, user: safeUser } });
    },
  ),

  me: asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.sub;
    const user = await userService.getById(userId);
    res.json({ data: user });
  }),
};