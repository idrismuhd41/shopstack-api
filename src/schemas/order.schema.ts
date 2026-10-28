import { z } from 'zod';

export const checkoutItemSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  quantity: z
    .number()
    .int('Quantity must be an integer')
    .min(1, 'Quantity must be at least 1')
    .max(1000, 'Quantity must be at most 1000'),
});

export const checkoutSchema = z.object({
  items: z
    .array(checkoutItemSchema)
    .min(1, 'At least one item is required')
    .max(50, 'Maximum 50 distinct items per order')
    .refine(
      (items) => {
        // No duplicate product IDs
        const ids = items.map((i) => i.productId);
        return new Set(ids).size === ids.length;
      },
      { message: 'Duplicate products in checkout — combine quantities' },
    ),
});

export type CheckoutDto = z.infer<typeof checkoutSchema>;