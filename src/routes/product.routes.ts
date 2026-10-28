import { Router } from 'express';
import { productController } from '../controllers/product.controller.js';
import { validateBody } from '../middleware/validate.js';
import { authenticateToken } from '../middleware/authenticate-token.js';
import { authorizeRole } from '../middleware/authorize-role.js';
import { createProductSchema, updateProductSchema } from '../schemas/product.schema.js';

export const productRouter = Router();

// ── Public reads ──────────────────────────────────────────────
productRouter.get('/', productController.list);
productRouter.get('/:id', productController.getById);

// ── Admin writes ──────────────────────────────────────────────
productRouter.post(
  '/',
  authenticateToken,
  authorizeRole('ADMIN'),
  validateBody(createProductSchema),
  productController.create,
);

productRouter.patch(
  '/:id',
  authenticateToken,
  authorizeRole('ADMIN'),
  validateBody(updateProductSchema),
  productController.update,
);

productRouter.delete(
  '/:id',
  authenticateToken,
  authorizeRole('ADMIN'),
  productController.delete,
);