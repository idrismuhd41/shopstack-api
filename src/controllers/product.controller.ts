import type { Request, Response } from 'express';
import { productService } from '../services/product.service.js';
import { asyncHandler } from '../middleware/async-handler.js';
import type { CreateProductDto, UpdateProductDto } from '../schemas/product.schema.js';

export const productController = {
  /**
   * GET /api/products?page=1&limit=20&search=phone
   * Public — anyone can browse the catalog.
   */
  list: asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const page = req.query.page ? Number(req.query.page) : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;

    const result = await productService.list({ page, limit, search });
    res.json({ data: result });
  }),

  /**
   * GET /api/products/:id
   * Public.
   */
  getById: asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const product = await productService.getById(req.params.id);
    res.json({ data: product });
  }),

  /**
   * POST /api/products
   * ADMIN only (enforced by route middleware).
   */
  create: asyncHandler(
    async (req: Request<{}, {}, CreateProductDto>, res: Response): Promise<void> => {
      const product = await productService.create(req.body);
      res.status(201).json({ data: product });
    },
  ),

  /**
   * PATCH /api/products/:id
   * ADMIN only.
   */
  update: asyncHandler(
    async (req: Request<{ id: string }, {}, UpdateProductDto>, res: Response): Promise<void> => {
      const product = await productService.update(req.params.id, req.body);
      res.json({ data: product });
    },
  ),

  /**
   * DELETE /api/products/:id
   * ADMIN only.
   */
  delete: asyncHandler(async (req: Request, res: Response): Promise<void> => {
    await productService.delete(req.params.id);
    res.status(204).send();
  }),
};