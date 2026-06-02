/*
 * 🍭 FHO: FGL-2026 Contract Tests
 * Born in the FHO Sugar Cloud. Handshaked in 2026.
 */

const singleQueue = [];
const resultQueue = [];
const inserts = [];

function makeBuilder() {
  const b = {};
  ['select', 'eq', 'order', 'limit', 'update'].forEach((m) => { b[m] = () => b; });
  b.insert = (rows) => { inserts.push(rows); return b; };
  b.single = () => Promise.resolve(singleQueue.length ? singleQueue.shift() : { data: null, error: null });
  b.then = (resolve) =>
    Promise.resolve(resultQueue.length ? resultQueue.shift() : { data: null, error: null }).then(resolve);
  return b;
}

jest.mock('../supabase', () => ({
  supabase: { from: jest.fn(() => makeBuilder()) },
  sweeten: (m) => m,
}));

const { signContract, getProjectContracts, contractTermsHash, FGL_2026 } = require('../contracts');

const queueSingle = (data, error = null) => singleQueue.push({ data, error });
const queueResult = (data, error = null) => resultQueue.push({ data, error });

beforeEach(() => {
  singleQueue.length = 0;
  resultQueue.length = 0;
  inserts.length = 0;
  jest.clearAllMocks();
});

describe('contractTermsHash', () => {
  it('is a stable 64-char SHA-256 hex', () => {
    const args = { projectId: 'p1', agentId: 'a1', titheRate: 0.1, growthThreshold: 0.2 };
    const h = contractTermsHash(args);
    expect(h).toMatch(/^[0-9a-f]{64}$/);
    expect(h).toBe(contractTermsHash(args));
  });

  it('changes when any term changes', () => {
    const base = { projectId: 'p1', agentId: 'a1', titheRate: 0.1, growthThreshold: 0.2 };
    expect(contractTermsHash(base)).not.toBe(contractTermsHash({ ...base, titheRate: 0.2 }));
    expect(contractTermsHash(base)).not.toBe(contractTermsHash({ ...base, agentId: 'a2' }));
  });
});

describe('signContract', () => {
  it('signs the FGL-2026 pledge with defaults', async () => {
    queueSingle({ id: 'proj-1', node_type: 'project' }); // project lookup
    queueSingle({
      id: 'k1', project_id: 'proj-1', agent_id: 'a1',
      tithe_rate: 0.1, growth_threshold: 0.2, status: 'signed',
    }); // insert

    const res = await signContract('proj-1', 'a1');

    expect(res.status).toBe('Success');
    expect(res.terms.license).toBe('FGL-2026');
    const inserted = inserts[0];
    expect(inserted.tithe_rate).toBe(FGL_2026.default_tithe_rate);
    expect(inserted.growth_threshold).toBe(FGL_2026.default_growth_threshold);
    expect(inserted.terms_hash).toMatch(/^[0-9a-f]{64}$/);
    expect(inserted.status).toBe('signed');
  });

  it('honors custom tithe rate and growth threshold', async () => {
    queueSingle({ id: 'proj-1', node_type: 'project' });
    queueSingle({ id: 'k1' });
    await signContract('proj-1', 'a1', { titheRate: 0.15, growthThreshold: 0.5 });
    expect(inserts[0].tithe_rate).toBe(0.15);
    expect(inserts[0].growth_threshold).toBe(0.5);
  });

  it('errors when the project is not found', async () => {
    queueSingle(null, { message: 'not found' });
    const res = await signContract('missing', 'a1');
    expect(res.status).toBe('Error');
    expect(inserts.length).toBe(0);
  });
});

describe('getProjectContracts', () => {
  it('returns the pledges on a project', async () => {
    queueResult([
      { agent_id: 'a1', tithe_rate: 0.1, status: 'signed', terms_hash: 'abc' },
      { agent_id: 'a2', tithe_rate: 0.1, status: 'signed', terms_hash: 'def' },
    ]);
    const res = await getProjectContracts('proj-1');
    expect(res.status).toBe('Success');
    expect(res.contracts).toHaveLength(2);
  });
});
