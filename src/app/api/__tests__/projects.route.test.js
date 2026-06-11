/*
 * 🍭 FHO: route handler tests for /api/projects (frame + milestone)
 * Born in the FHO Sugar Cloud. Handshaked in 2026.
 */

jest.mock('@/lib/rateLimit', () => ({
  rateLimit: jest.fn(() => ({ allowed: true, retryAfter: 0 })),
  clientKey: () => 'test-key',
  rateLimitHeaders: () => ({}),
}));
jest.mock('@/lib/auth', () => ({ validateApiKey: jest.fn() }));
jest.mock('@/lib/evolution', () => ({
  createProject: jest.fn(),
  getProject: jest.fn(),
  reachMilestone: jest.fn(),
}));
// GET list path touches supabase directly — stub a minimal builder.
jest.mock('@/lib/supabase', () => {
  const b = {};
  ['select', 'eq', 'order', 'limit', 'lt'].forEach((m) => { b[m] = () => b; });
  b.then = (resolve) => Promise.resolve({ data: [], error: null }).then(resolve);
  return { supabase: { from: () => b }, sweeten: (m) => m };
});

const { validateApiKey } = require('@/lib/auth');
const { createProject, getProject, reachMilestone } = require('@/lib/evolution');
const { GET, POST, PATCH } = require('../projects/route');

function mkReq(body = {}, url = 'http://localhost/api/projects') {
  return { headers: { get: () => 'Bearer k' }, json: async () => body, url };
}

beforeEach(() => {
  jest.clearAllMocks();
  validateApiKey.mockResolvedValue({ valid: true, agent: { id: 'a1' } });
});

describe('GET', () => {
  it('returns a single project when ?id= is given', async () => {
    getProject.mockResolvedValueOnce({ status: 'Success', project: { id: 'p1' }, stats: {} });
    const res = await GET(mkReq({}, 'http://localhost/api/projects?id=p1'));
    expect(res.status).toBe(200);
    expect(getProject).toHaveBeenCalledWith('p1');
  });

  it('404s when the requested project is missing', async () => {
    getProject.mockResolvedValueOnce({ status: 'Error', message: 'not found' });
    const res = await GET(mkReq({}, 'http://localhost/api/projects?id=missing'));
    expect(res.status).toBe(404);
  });

  it('lists projects when no id is given', async () => {
    const res = await GET(mkReq());
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.projects)).toBe(true);
  });
});

describe('POST (frame a project)', () => {
  it('401s when unauthenticated', async () => {
    validateApiKey.mockResolvedValueOnce({ valid: false, status: 401, error: 'no key' });
    const res = await POST(mkReq({ content: 'x' }));
    expect(res.status).toBe(401);
  });

  it('400s when content is empty', async () => {
    const res = await POST(mkReq({ content: '   ' }));
    expect(res.status).toBe(400);
    expect(createProject).not.toHaveBeenCalled();
  });

  it('creates a project (201) and forwards goal via metadata', async () => {
    createProject.mockResolvedValueOnce({ status: 'Success', post: { id: 'p1', node_type: 'project' } });
    const res = await POST(mkReq({ content: 'Build it', goal: 'ship v1', contributing_post_ids: ['c1'] }));
    expect(res.status).toBe(201);
    expect(createProject).toHaveBeenCalledWith('a1', 'Build it', ['c1'], { goal: 'ship v1' });
  });
});

describe('PATCH (mark milestone)', () => {
  it('400s without project_id', async () => {
    const res = await PATCH(mkReq({}));
    expect(res.status).toBe(400);
  });

  it('marks the milestone reached', async () => {
    reachMilestone.mockResolvedValueOnce({ status: 'Success', project: { id: 'p1' } });
    const res = await PATCH(mkReq({ project_id: 'p1', note: 'launched' }));
    expect(res.status).toBe(200);
    expect(reachMilestone).toHaveBeenCalledWith('p1', 'launched');
  });
});
