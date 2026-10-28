import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/error-handler.js';

export interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  productName: string;
}

export interface Order {
  id: string;
  userId: string;
  total: number;
  status: string;
  createdAt: string;
  items: OrderItem[];
}

export interface CheckoutItemInput {
  productId: string;
  quantity: number;
}

function toOrderItem(item: {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  product?: { name: string };
}): OrderItem {
  return {
    id: item.id,
    productId: item.productId,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    productName: item.product?.name ?? '(deleted)',
  };
}

function toOrder(order: {
  id: string;
  userId: string;
  total: number;
  status: string;
  createdAt: Date;
  items: Array<{
    id: string;
    productId: string;
    quantity: number;
    unitPrice: number;
    product?: { name: string } | null;
  }>;
}): Order {
  return {
    id: order.id,
    userId: order.userId,
    total: order.total,
    status: order.status,
    createdAt: order.createdAt.toISOString(),
    items: order.items.map((i) =>
      toOrderItem({
        id: i.id,
        productId: i.productId,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        product: i.product ?? undefined,
      }),
    ),
  };
}

export const orderService = {
  /**
   * Get order history for a user.
   */
  async listForUser(userId: string): Promise<Order[]> {
    const orders = await prisma.order.findMany({
      where: { userId },
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return orders.map(toOrder);
  },

  /**
   * Get a single order — user must own it or be admin.
   * Ownership check is done in the controller.
   */
  async getById(id: string): Promise<Order> {
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: { include: { product: true } } },
    });
    if (!order) throw new AppError(404, `Order ${id} not found`);
    return toOrder(order);
  },

  /**
   * Checkout — creates an order atomically inside a transaction.
   * All-or-nothing: if any step fails, stock and order are rolled back.
   */
  async checkout(userId: string, items: CheckoutItemInput[]): Promise<Order> {
    return await prisma.$transaction(async (tx) => {
      // 1. Fetch all products in a single query
      const productIds = items.map((i) => i.productId);
      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
      });

      // 2. Verify all products exist
      if (products.length !== productIds.length) {
        const foundIds = new Set(products.map((p) => p.id));
        const missing = productIds.filter((id) => !foundIds.has(id));
        throw new AppError(400, `Products not found: ${missing.join(', ')}`);
      }

      // 3. Verify stock and compute total
      const productMap = new Map(products.map((p) => [p.id, p]));
      let total = 0;
      for (const item of items) {
        const product = productMap.get(item.productId)!;
        if (product.stock < item.quantity) {
          throw new AppError(
            409,
            `Insufficient stock for "${product.name}" — requested ${item.quantity}, available ${product.stock}`,
          );
        }
        total += product.price * item.quantity;
      }

      // 4. Decrement stock — atomic per-product update
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      // 5. Create order with nested items — single INSERT
      const order = await tx.order.create({
        data: {
          userId,
          total,
          status: 'PENDING',
          items: {
            create: items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: productMap.get(item.productId)!.price,
            })),
          },
        },
        include: { items: { include: { product: true } } },
      });

      return toOrder(order);
    });
  },
};