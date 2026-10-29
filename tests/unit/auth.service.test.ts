import {
  hashPassword,
  verifyPassword,
  signToken,
  verifyToken,
} from '../../src/services/auth.service.js';
import { AppError } from '../../src/middleware/error-handler.js';

describe('auth.service — password hashing', () => {
  it('hashes a password to a bcrypt string', async () => {
    const hash = await hashPassword('secret123');
    expect(hash).toMatch(/^\$2[aby]\$\d{2}\$/);
    expect(hash).not.toBe('secret123');
  });

  it('verifies a correct password against its hash', async () => {
    const hash = await hashPassword('secret123');
    expect(await verifyPassword('secret123', hash)).toBe(true);
  });

  it('rejects an incorrect password', async () => {
    const hash = await hashPassword('secret123');
    expect(await verifyPassword('wrong', hash)).toBe(false);
  });

  it('returns false for empty hash (Task 3 legacy user)', async () => {
    expect(await verifyPassword('anything', '')).toBe(false);
  });

  it('produces different hashes for the same password (random salt)', async () => {
    const h1 = await hashPassword('secret123');
    const h2 = await hashPassword('secret123');
    expect(h1).not.toBe(h2);
    expect(await verifyPassword('secret123', h1)).toBe(true);
    expect(await verifyPassword('secret123', h2)).toBe(true);
  });
});

describe('auth.service — JWT', () => {
  const payload = { sub: 'user-1', email: 'a@b.com', role: 'USER' as const };

  it('signs and verifies a token', () => {
    const token = signToken(payload);
    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(3);

    const decoded = verifyToken(token);
    expect(decoded.sub).toBe('user-1');
    expect(decoded.email).toBe('a@b.com');
    expect(decoded.role).toBe('USER');
  });

  it('rejects a malformed token with 401', () => {
    expect(() => verifyToken('not.a.token')).toThrow(AppError);
    expect(() => verifyToken('not.a.token')).toThrow('Invalid or expired token');
  });

  it('rejects a token with tampered payload', () => {
    const token = signToken(payload);
    const [header, , sig] = token.split('.');
    const fakePayload = Buffer.from(
      JSON.stringify({ sub: 'hacker', email: 'x@y.com', role: 'ADMIN' })
    ).toString('base64url');
    const tampered = `${header}.${fakePayload}.${sig}`;

    expect(() => verifyToken(tampered)).toThrow(AppError);
  });

  it('defaults role to USER when claim is missing/invalid', () => {
    const weirdPayload = { sub: 'u', email: 'e@x.com', role: 'HACKER' } as unknown as typeof payload;
    const token = signToken(weirdPayload);
    const decoded = verifyToken(token);
    expect(decoded.role).toBe('USER'); // fails closed
  });
});