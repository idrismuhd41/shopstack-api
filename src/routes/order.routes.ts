import { Router } from 'express';
import { orderController } from '../controllers/order.controller.js';
import { validateBody } from '../middleware/validate.js';
import { authenticateToken } from '../middleware/authenticate-token.js';
import { checkoutSchema } from '../schemas/order.schema.js';

export const orderRouter = Router();

// All order routes require authentication
orderRouter.use(authenticateToken);

orderRouter.get('/me', orderController.listMine);
orderRouter.get('/:id', orderController.getById);
orderRouter.post('/', validateBody(checkoutSchema), orderController.checkout);