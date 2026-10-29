import request from 'supertest';
import { app } from '../../src/app.js';
import { prisma } from '../../src/lib/prisma.js';

async function createAdminAndGetToken(): Promise<string> {
  const { hashPassword } = await import('../../src/services/auth.service.js');
  const passwordHash = await hashPassword('admin123');
  await prisma.user.create({
    data: { name: 'Admin', email: 'admin@test.com', passwordHash, role: 'ADMIN' },
  });
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@test.com', password: 'admin123' });
  return res.body.data.token;
}

describe('Products API', () => {
  let adminToken: string;

  beforeEach(async () => {
    adminToken = await createAdminAndGetToken();
  });

  it('public GET /api/products returns empty list (no auth)', async () => {
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    expect(res.body.data.items).toEqual([]);
    expect(res.body.data.total).toBe(0);
  });

  it('USER cannot create products (403)', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'User', email: 'user@test.com', password: 'password123',
    });
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@test.com', password: 'password123' });

    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${login.body.data.token}`)
      .send({ name: 'X', price: 100 });

    expect(res.status).toBe(403);
  });

  it('ADMIN can create products', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Laptop', price: 129900, stock: 10 });
    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Laptop');
  });

  it('rejects non-integer price', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Bad', price: 10.99 });
    expect(res.status).toBe(400);
    expect(res.body.issues.some((i: { message: string }) => i.message.includes('integer'))).toBe(true);
  });

  it('pagination: totalPages reflects total', async () => {
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: `P${i}`, price: 100 + i });
    }

    const res = await request(app).get('/api/products?limit=2');
    expect(res.status).toBe(200);
    expect(res.body.data.items.length).toBe(2);
    expect(res.body.data.total).toBe(5);
    expect(res.body.data.totalPages).toBe(3);
    expect(res.body.data.page).toBe(1);
  });

  it('filtering: search matches case-insensitively', async () => {
    await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'iPhone 15', price: 99900 });

    const lower = await request(app).get('/api/products?search=iphone');
    const upper = await request(app).get('/api/products?search=IPHONE');
    expect(lower.body.data.total).toBe(1);
    expect(upper.body.data.total).toBe(1);
  });

  it('404 for unknown product', async () => {
    const res = await request(app).get('/api/products/00000000-0000-0000-0000-000000000000');
    expect(res.status).toBe(404);
  });
});