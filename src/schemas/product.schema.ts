import { z } from 'zod';

/**
 * Create product schema.
 * - price is in cents (integer) — never floats for money
 * - stock is optional, defaults to 0 in the service
 * - description is optional
 */
export const createProductSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().max(2000).optional(),
  price: z
    .number()
    .int('Price must be an integer (in cents)')
    .min(1, 'Price must be at least 1 cent')
    .max(100_000_000, 'Price must be at most 1,000,000.00'), // $1M cap
  stock: z.number().int().min(0).max(1_000_000).optional(),
});

/**
 * Update schema — all fields optional for PATCH semantics.
 */
export const updateProductSchema = createProductSchema.partial();

export type CreateProductDto = z.infer<typeof createProductSchema>;
export type UpdateProductDto = z.infer<typeof updateProductSchema>;