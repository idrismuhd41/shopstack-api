import type { Request, Response } from 'express';
import { orderService } from '../services/order.service.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { AppError } from '../middleware/error-handler.js';
import type { CheckoutDto } from '../schemas/order.schema.js';

export const orderController = {
  listMine: asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const orders = await orderService.listForUser(req.user!.sub);
    res.json({ data: orders });
  }),

  getById: asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const order = await orderService.getById(req.params.id);
    // Ownership check — user can only see their own orders
    if (order.userId !== req.user!.sub && req.user!.role !== 'ADMIN') {
      throw new AppError(403, 'Cannot view other users\' orders');
    }
    res.json({ data: order });
  }),

  checkout: asyncHandler(
    async (req: Request<{}, {}, CheckoutDto>, res: Response): Promise<void> => {
      const order = await orderService.checkout(req.user!.sub, req.body.items);
      res.status(201).json({ data: order });
    },
  ),
};