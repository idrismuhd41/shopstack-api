import request from 'supertest';
import { app } from '../../src/app.js';
import { prisma } from '../../src/lib/prisma.js';
import { hashPassword } from '../../src/services/auth.service.js';

async function seedUserAndProducts() {
  const passwordHash = await hashPassword('password123');
  const user = await prisma.user.create({
    data: { name: 'Buyer', email: 'buyer@test.com', passwordHash, role: 'USER' },
  });

  const laptop = await prisma.product.create({
    data: { name: 'Laptop', price: 129900, stock: 10 },
  });
  const mouse = await prisma.product.create({
    data: { name: 'Mouse', price: 2999, stock: 50 },
  });

  const login = await request(app)
    .post('/api/auth/login')
    .send({ email: 'buyer@test.com', password: 'password123' });

  return {
    user,
    laptop,
    mouse,
    token: login.body.data.token as string,
  };
}

describe('Orders API', () => {
  it('checkout creates order, decrements stock, computes total', async () => {
    const { laptop, mouse, token } = await seedUserAndProducts();

    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        items: [
          { productId: laptop.id, quantity: 1 },
          { productId: mouse.id, quantity: 2 },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.data.total).toBe(129900 + 2 * 2999);
    expect(res.body.data.items.length).toBe(2);

    // Stock decreased
    const laptopAfter = await prisma.product.findUnique({ where: { id: laptop.id } });
    const mouseAfter = await prisma.product.findUnique({ where: { id: mouse.id } });
    expect(laptopAfter?.stock).toBe(9);
    expect(mouseAfter?.stock).toBe(48);
  });

  it('insufficient stock → 409 and transaction rolls back', async () => {
    const { laptop, token } = await seedUserAndProducts();

    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ items: [{ productId: laptop.id, quantity: 100 }] });

    expect(res.status).toBe(409);
    expect(res.body.message).toContain('Insufficient stock');

    // Stock unchanged — no partial decrement
    const laptopAfter = await prisma.product.findUnique({ where: { id: laptop.id } });
    expect(laptopAfter?.stock).toBe(10);
  });

  it('multi-item partial failure → BOTH stocks unchanged (ACID)', async () => {
    const { laptop, mouse, token } = await seedUserAndProducts();

    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        items: [
          { productId: laptop.id, quantity: 1 },  // in stock
          { productId: mouse.id, quantity: 100 }, // out of stock
        ],
      });

    expect(res.status).toBe(409);

    // CRITICAL: both stocks must be unchanged — this is the ACID proof
    const laptopAfter = await prisma.product.findUnique({ where: { id: laptop.id } });
    const mouseAfter = await prisma.product.findUnique({ where: { id: mouse.id } });
    expect(laptopAfter?.stock).toBe(10);
    expect(mouseAfter?.stock).toBe(50);

    // No orphan order
    const orders = await prisma.order.count();
    expect(orders).toBe(0);
  });

  it('GET /api/orders/me returns current user\'s orders only', async () => {
    const { token } = await seedUserAndProducts();
    const laptop = await prisma.product.findFirst({ where: { name: 'Laptop' } });
    await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ items: [{ productId: laptop!.id, quantity: 1 }] });

    const res = await request(app)
      .get('/api/orders/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
  });
});