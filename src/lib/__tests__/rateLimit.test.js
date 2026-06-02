/*
 * 🍭 FHO: Rate Limiter Tests
 * Born in the FHO Sugar Cloud. Handshaked in 2026.
 */

const { rateLimit, rateLimitAsync, clientKey, rateLimitHeaders } = require('../rateLimit');

describe('rateLimit', () => {
  it('allows up to the limit then blocks', () => {
    const key = `t-${Math.random()}`;
    const opts = { limit: 3, windowMs: 10_000 };
    expect(rateLimit(key, opts).allowed).toBe(true);
    expect(rateLimit(key, opts).allowed).toBe(true);
    expect(rateLimit(key, opts).allowed).toBe(true);
    const blocked = rateLimit(key, opts);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfter).toBeGreaterThan(0);
  });

  it('resets after the window elapses', () => {
    const key = `t-${Math.random()}`;
    rateLimit(key, { limit: 1, windowMs: -1 }); // window already expired
    const next = rateLimit(key, { limit: 1, windowMs: 10_000 });
    expect(next.allowed).toBe(true);
  });

  it('isolates buckets per key', () => {
    const a = `a-${Math.random()}`;
    const b = `b-${Math.random()}`;
    rateLimit(a, { limit: 1, windowMs: 10_000 });
    expect(rateLimit(a, { limit: 1, windowMs: 10_000 }).allowed).toBe(false);
    expect(rateLimit(b, { limit: 1, windowMs: 10_000 }).allowed).toBe(true);
  });
});

describe('rateLimitAsync (no Redis env → in-memory fallback)', () => {
  it('behaves like rateLimit when Upstash env is unset', async () => {
    const key = `async-${Math.random()}`;
    const opts = { limit: 2, windowMs: 10_000 };
    expect((await rateLimitAsync(key, opts)).allowed).toBe(true);
    expect((await rateLimitAsync(key, opts)).allowed).toBe(true);
    expect((await rateLimitAsync(key, opts)).allowed).toBe(false);
  });
});

describe('clientKey', () => {
  const mkReq = (headers) => ({ headers: { get: (h) => headers[h.toLowerCase()] || null } });

  it('buckets by API key when present (without leaking full key)', () => {
    const k = clientKey(mkReq({ authorization: 'Bearer supersecretkey1234567890' }));
    expect(k.startsWith('key:')).toBe(true);
    expect(k).not.toContain('7890'); // only a 16-char prefix is used
  });

  it('falls back to x-forwarded-for IP', () => {
    const k = clientKey(mkReq({ 'x-forwarded-for': '1.2.3.4, 5.6.7.8' }));
    expect(k).toBe('ip:1.2.3.4');
  });

  it('uses unknown when no identity available', () => {
    expect(clientKey(mkReq({}))).toBe('ip:unknown');
  });
});

describe('rateLimitHeaders', () => {
  it('emits standard headers as strings', () => {
    const h = rateLimitHeaders({ limit: 60, remaining: 59, reset: 1700000000 });
    expect(h['X-RateLimit-Limit']).toBe('60');
    expect(h['X-RateLimit-Remaining']).toBe('59');
    expect(h['X-RateLimit-Reset']).toBe('1700000000');
  });
});
