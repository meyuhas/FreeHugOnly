/*
 * 🍭 FHO: route handler tests for /api/projects/members (the team "+")
 * Born in the FHO Sugar Cloud. Handshaked in 2026.
 *
 * Exercises the HTTP layer (rate-limit gate → auth gate → validation → handler),
 * which the lib tests don't cover. Deps are mocked; we assert status + payload.
 */

jest.mock('@/lib/rateLimit', () => ({
  rateLimit: jest.fn(() => ({ allowed: true, limit: 30, remaining: 29, reset: 0, retryAfter: 0 })),
  clientKey: () => 'test-key',
  rateLimitHeaders: () => ({}),
}));
jest.mock('@/lib/auth', () => ({ validateApiKey: jest.fn() }));
jest.mock('@/lib/evolution', () => ({ addProjectMember: jest.fn() }));

const { rateLimit } = require('@/lib/rateLimit');
const { validateApiKey } = require('@/lib/auth');
const { addProjectMember } = require('@/lib/evolution');
const { GET, POST } = require('../projects/members/route');

function mkReq({ headers = {}, body = {}, url = 'http://localhost/api/projects/members' } = {}) {
  const lower = {};
  Object.entries(headers).forEach(([k, v]) => { lower[k.toLowerCase()] = v; });
  return { headers: { get: (h) => lower[h.toLowerCase()] ?? null }, json: async () => body, url };
}

beforeEach(() => jest.clearAllMocks());

describe('GET /api/projects/members', () => {
  it('returns the role taxonomy (the dropdown), publicly', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe('Success');
    expect(Array.isArray(data.roles)).toBe(true);
    expect(data.roles.find((r) => r.id === 'production')).toBeTruthy();
  });
});

describe('POST /api/projects/members', () => {
  it('429s when rate limited', async () => {
    rateLimit.mockReturnValueOnce({ allowed: false, retryAfter: 30, limit: 30, remaining: 0, reset: 0 });
    const res = await POST(mkReq());
    expect(res.status).toBe(429);
  });

  it('rejects an unauthenticated request with the auth status', async () => {
    validateApiKey.mockResolvedValueOnce({ valid: false, status: 401, error: 'no key' });
    const res = await POST(mkReq());
    expect(res.status).toBe(401);
  });

  it('400s when project_id or role is missing', async () => {
    validateApiKey.mockResolvedValueOnce({ valid: true, agent: { id: 'a1' } });
    const res = await POST(mkReq({ body: { project_id: 'p1' } })); // role missing
    expect(res.status).toBe(400);
    expect(addProjectMember).not.toHaveBeenCalled();
  });

  it('adds a member and returns 201 on success', async () => {
    validateApiKey.mockResolvedValueOnce({ valid: true, agent: { id: 'a1' } });
    addProjectMember.mockResolvedValueOnce({ status: 'Success', member: { id: 'm1', role: 'marketing' } });
    const res = await POST(mkReq({ body: { project_id: 'p1', role: 'marketing', agent_id: 'mkt-1' } }));
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.member.role).toBe('marketing');
    expect(addProjectMember).toHaveBeenCalledWith('p1', 'mkt-1', 'marketing');
  });

  it('defaults agent_id to the authenticated agent', async () => {
    validateApiKey.mockResolvedValueOnce({ valid: true, agent: { id: 'self-agent' } });
    addProjectMember.mockResolvedValueOnce({ status: 'Success', member: {} });
    await POST(mkReq({ body: { project_id: 'p1', role: 'production' } }));
    expect(addProjectMember).toHaveBeenCalledWith('p1', 'self-agent', 'production');
  });

  it('surfaces a handler error as 400', async () => {
    validateApiKey.mockResolvedValueOnce({ valid: true, agent: { id: 'a1' } });
    addProjectMember.mockResolvedValueOnce({ status: 'Error', message: 'already a member' });
    const res = await POST(mkReq({ body: { project_id: 'p1', role: 'marketing' } }));
    expect(res.status).toBe(400);
  });
});
