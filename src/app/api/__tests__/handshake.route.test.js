/*
 * 🍭 FHO: route handler tests for /api/handshake (the economic core)
 * Born in the FHO Sugar Cloud. Handshaked in 2026.
 */

jest.mock('@/lib/rateLimit', () => ({
  rateLimit: jest.fn(() => ({ allowed: true, retryAfter: 0 })),
  clientKey: () => 'test-key',
  rateLimitHeaders: () => ({}),
}));
jest.mock('@/lib/auth', () => ({ validateApiKey: jest.fn() }));
jest.mock('@/lib/evolution', () => ({ performHandshake: jest.fn() }));

const { rateLimit } = require('@/lib/rateLimit');
const { validateApiKey } = require('@/lib/auth');
const { performHandshake } = require('@/lib/evolution');
const { POST } = require('../handshake/route');

function mkReq(body = {}) {
  return { headers: { get: () => 'Bearer k' }, json: async () => body, url: 'http://localhost/api/handshake' };
}

beforeEach(() => {
  jest.clearAllMocks();
  validateApiKey.mockResolvedValue({ valid: true, agent: { id: 'a1' } });
});

it('429s when rate limited', async () => {
  rateLimit.mockReturnValueOnce({ allowed: false, retryAfter: 30 });
  const res = await POST(mkReq({ post_id: 'p1' }));
  expect(res.status).toBe(429);
});

it('401s when unauthenticated', async () => {
  validateApiKey.mockResolvedValueOnce({ valid: false, status: 401, error: 'no key' });
  const res = await POST(mkReq({ post_id: 'p1' }));
  expect(res.status).toBe(401);
});

it('400s when post_id is missing', async () => {
  const res = await POST(mkReq({}));
  expect(res.status).toBe(400);
  expect(performHandshake).not.toHaveBeenCalled();
});

it('400s on an out-of-range value_score (no Honey inflation)', async () => {
  const res = await POST(mkReq({ post_id: 'p1', value_score: 1000000 }));
  expect(res.status).toBe(400);
  expect(performHandshake).not.toHaveBeenCalled();
});

it('distributes on success and passes value_score through', async () => {
  performHandshake.mockResolvedValueOnce({ status: 'Success', giants_thanked: 2, tithe: 10 });
  const res = await POST(mkReq({ post_id: 'p1', value_score: 100 }));
  expect(res.status).toBe(200);
  const data = await res.json();
  expect(data.status).toBe('Success');
  expect(performHandshake).toHaveBeenCalledWith('p1', 100);
});

it('400s when the post was already handshaked', async () => {
  performHandshake.mockResolvedValueOnce({ status: 'Already Complete', message: 'already' });
  const res = await POST(mkReq({ post_id: 'p1' }));
  expect(res.status).toBe(400);
});

it('400s when a project has not reached its milestone (Not Yet)', async () => {
  performHandshake.mockResolvedValueOnce({ status: 'Not Yet', message: 'no milestone' });
  const res = await POST(mkReq({ post_id: 'proj-1' }));
  expect(res.status).toBe(400);
});
