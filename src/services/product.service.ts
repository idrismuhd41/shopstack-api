import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/error-handler.js';

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;     // cents
  stock: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductInput {
  name: string;
  description?: string;
  price: number;
  stock?: number;
}

export interface UpdateProductInput {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
}

export interface ListProductsOptions {
  page?: number;
  limit?: number;
  search?: string;
}

export interface PaginatedProducts {
  items: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Helper: Prisma Product (with Date) → API Product (with ISO strings)
function toProduct(p: {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  createdAt: Date;
  updatedAt: Date;
}): Product {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    price: p.price,
    stock: p.stock,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

export const productService = {
  /**
   * Paginated list with optional name search.
   * Demonstrates `take`, `skip`, and `where` (Task 5 requirement).
   */
  async list(options: ListProductsOptions = {}): Promise<PaginatedProducts> {
    const page = Math.max(1, options.page ?? 1);
    const limit = Math.min(100, Math.max(1, options.limit ?? 20));
    const skip = (page - 1) * limit;

    // Build the where clause only if a search was provided
    const where = options.search
      ? { name: { contains: options.search, mode: 'insensitive' as const } }
      : {};

    // Run count and page fetch in parallel
    const [total, rows] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
    ]);

    return {
      items: rows.map(toProduct),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  async getById(id: string): Promise<Product> {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) throw new AppError(404, `Product ${id} not found`);
    return toProduct(product);
  },

  async create(input: CreateProductInput): Promise<Product> {
    const product = await prisma.product.create({
      data: {
        name: input.name,
        description: input.description ?? null,
        price: input.price,
        stock: input.stock ?? 0,
      },
    });
    return toProduct(product);
  },

  async update(id: string, input: UpdateProductInput): Promise<Product> {
    try {
      const product = await prisma.product.update({
        where: { id },
        data: input,
      });
      return toProduct(product);
    } catch (err) {
      if ((err as { code?: string }).code === 'P2025') {
        throw new AppError(404, `Product ${id} not found`);
      }
      throw err;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await prisma.product.delete({ where: { id } });
    } catch (err) {
      if ((err as { code?: string }).code === 'P2025') {
        throw new AppError(404, `Product ${id} not found`);
      }
      // P2003 = foreign key violation — product appears in existing orders
      if ((err as { code?: string }).code === 'P2003') {
        throw new AppError(409, 'Cannot delete product referenced by existing orders');
      }
      throw err;
    }
  },
};