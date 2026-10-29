import request from 'supertest';
import { app } from '../../src/app.js';

describe('POST /api/auth/register', () => {
  it('creates a user and returns safe data', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test',
      email: 'test@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(201);
    expect(res.body.data.email).toBe('test@example.com');
    expect(res.body.data.role).toBe('USER');
    expect(res.body.data.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(res.body.data).not.toHaveProperty('passwordHash');
  });

  it('lowercases the email', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test',
      email: 'TEST@EXAMPLE.COM',
      password: 'password123',
    });
    expect(res.status).toBe(201);
    expect(res.body.data.email).toBe('test@example.com');
  });

  it('rejects duplicate email with 409', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'First',
      email: 'dup@example.com',
      password: 'password123',
    });
    const res = await request(app).post('/api/auth/register').send({
      name: 'Second',
      email: 'dup@example.com',
      password: 'password456',
    });
    expect(res.status).toBe(409);
    expect(res.body.message).toContain('Email already exists');
  });

  it('rejects short password with 400', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test',
      email: 'x@example.com',
      password: 'short',
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('ValidationError');
    expect(res.body.issues.some((i: { path: string }) => i.path === 'password')).toBe(true);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Login Test',
      email: 'login@example.com',
      password: 'password123',
    });
  });

  it('returns a valid JWT on correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@example.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.data.token.split('.').length).toBe(3);
    expect(res.body.data.user.email).toBe('login@example.com');
    expect(res.body.data.user).not.toHaveProperty('passwordHash');
  });

  it('rejects wrong password with 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@example.com', password: 'wrong' });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid email or password');
  });

  it('rejects unknown email with the same 401 message (no enumeration)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'unknown@example.com', password: 'password123' });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid email or password');
  });
});

describe('GET /api/auth/me', () => {
  it('returns 401 without a token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns the current user with a valid token', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Me Test',
      email: 'me@example.com',
      password: 'password123',
    });
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'me@example.com', password: 'password123' });

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${login.body.data.token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('me@example.com');
  });

  it('returns 401 for an invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer not-a-valid-token');
    expect(res.status).toBe(401);
  });
});