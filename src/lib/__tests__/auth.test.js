/*
 * 🍭 FHO: Shared Auth Tests
 * Born in the FHO Sugar Cloud. Handshaked in 2026.
 */

let singleResponse = { data: null, error: null };

const mockSupabase = {
  from: jest.fn(() => mockSupabase),
  select: jest.fn(() => mockSupabase),
  eq: jest.fn(() => mockSupabase),
  single: jest.fn(() => Promise.resolve(singleResponse)),
};

jest.mock('../supabase', () => ({ supabase: mockSupabase, sweeten: (m) => m }));

const { validateApiKey, hashApiKey } = require('../auth');

function mkReq(authHeader) {
  return { headers: { get: (h) => (h.toLowerCase() === 'authorization' ? authHeader : null) } };
}

beforeEach(() => {
  singleResponse = { data: null, error: null };
  jest.clearAllMocks();
});

describe('hashApiKey', () => {
  it('is a stable 64-char SHA-256 hex', () => {
    const h = hashApiKey('my-key');
    expect(h).toMatch(/^[0-9a-f]{64}$/);
    expect(h).toBe(hashApiKey('my-key'));
    expect(h).not.toBe(hashApiKey('other-key'));
  });
});

describe('validateApiKey', () => {
  it('rejects a missing Authorization header (401)', async () => {
    const res = await validateApiKey(mkReq(null));
    expect(res.valid).toBe(false);
    expect(res.status).toBe(401);
  });

  it('rejects a non-Bearer header (401)', async () => {
    const res = await validateApiKey(mkReq('Basic abc'));
    expect(res.valid).toBe(false);
    expect(res.status).toBe(401);
  });

  it('rejects an unknown key (401)', async () => {
    singleResponse = { data: null, error: null };
    const res = await validateApiKey(mkReq('Bearer ghost'));
    expect(res.valid).toBe(false);
    expect(res.status).toBe(401);
  });

  it('rejects an agent that has not passed the Honey Filter (403)', async () => {
    singleResponse = {
      data: { permissions: ['create'], agents: { id: 'a1', honey_filter_passed: false } },
      error: null,
    };
    const res = await validateApiKey(mkReq('Bearer good'));
    expect(res.valid).toBe(false);
    expect(res.status).toBe(403);
  });

  it('rejects when required permission is absent (403)', async () => {
    singleResponse = {
      data: { permissions: ['read'], agents: { id: 'a1', honey_filter_passed: true } },
      error: null,
    };
    const res = await validateApiKey(mkReq('Bearer good'), { anyPermission: ['create', 'fusion'] });
    expect(res.valid).toBe(false);
    expect(res.status).toBe(403);
  });

  it('accepts a filtered agent with a valid permission', async () => {
    singleResponse = {
      data: { permissions: ['create'], agents: { id: 'a1', name: 'Sweet', honey_filter_passed: true } },
      error: null,
    };
    const res = await validateApiKey(mkReq('Bearer good'), { anyPermission: ['create', 'fusion'] });
    expect(res.valid).toBe(true);
    expect(res.agent.id).toBe('a1');
  });

  it('can skip the honey-filter requirement when asked', async () => {
    singleResponse = {
      data: { permissions: [], agents: { id: 'a1', honey_filter_passed: false } },
      error: null,
    };
    const res = await validateApiKey(mkReq('Bearer good'), { requireHoneyFilter: false });
    expect(res.valid).toBe(true);
  });
});
