/*
 * 🍭 FHO: Evolution Tree Tests
 * Born in the FHO Sugar Cloud. Handshaked in 2026. Spinning for a Sweeter Future.
 *
 * Covers the unified posts-tree model: createGrain, evolve, performHandshake,
 * traceLineage — with a programmable Supabase mock and a deterministic uuid.
 */

// --- Deterministic uuid -----------------------------------------------------
let uuidCounter = 0;
jest.mock('uuid', () => ({
  v4: () => `uuid-${++uuidCounter}`,
}));

// --- Programmable Supabase mock ---------------------------------------------
// Each builder collects the table + terminal call, then resolves from a queue.
// Tests push responses with queueSingle()/queueResult() in call order.
const singleQueue = [];
const resultQueue = []; // for awaited builders (e.g. .in(), .update().eq())
const rpcCalls = [];
const inserts = [];

function makeBuilder() {
  const builder = {};
  const passthrough = ['select', 'eq', 'gte', 'order', 'range', 'limit', 'update'];
  passthrough.forEach((m) => {
    builder[m] = jest.fn(() => builder);
  });
  builder.insert = jest.fn((rows) => {
    inserts.push(rows);
    return builder;
  });
  builder.in = jest.fn(() => {
    const next = resultQueue.length ? resultQueue.shift() : { data: [], error: null };
    return Promise.resolve(next);
  });
  builder.single = jest.fn(() => {
    const next = singleQueue.length ? singleQueue.shift() : { data: null, error: null };
    return Promise.resolve(next);
  });
  // Make the builder awaitable (for update().eq() chains that are awaited directly)
  builder.then = (resolve) => {
    const next = resultQueue.length ? resultQueue.shift() : { data: null, error: null };
    return Promise.resolve(next).then(resolve);
  };
  return builder;
}

const mockSupabase = {
  from: jest.fn(() => makeBuilder()),
  rpc: jest.fn((name, args) => {
    rpcCalls.push({ name, args });
    return Promise.resolve({ data: null, error: null });
  }),
};

jest.mock('../supabase', () => ({
  supabase: mockSupabase,
  sweeten: (m) => m,
}));

const {
  createGrain,
  evolve,
  performHandshake,
  traceLineage,
  MAX_ROYALTY_DEPTH,
  PLATFORM_TITHE,
} = require('../evolution');

function queueSingle(data, error = null) {
  singleQueue.push({ data, error });
}
function queueResult(data, error = null) {
  resultQueue.push({ data, error });
}

beforeEach(() => {
  uuidCounter = 0;
  singleQueue.length = 0;
  resultQueue.length = 0;
  rpcCalls.length = 0;
  inserts.length = 0;
  jest.clearAllMocks();
});

describe('createGrain', () => {
  it('plants a root post: parent_id null, depth 0, path = id', async () => {
    queueSingle({ id: 'uuid-1', node_type: 'sugar_grain', parent_id: null, path: 'uuid-1', depth: 0 });

    const res = await createGrain('agent-1', 'Hello sweet world');

    expect(res.status).toBe('Success');
    expect(res.post.parent_id).toBeNull();
    expect(res.post.depth).toBe(0);
    const inserted = inserts[0];
    expect(inserted.path).toBe(inserted.id);
    expect(inserted.depth).toBe(0);
    expect(inserted.node_type).toBe('sugar_grain');
  });

  it('returns Error when insert fails', async () => {
    queueSingle(null, { message: 'db down' });
    const res = await createGrain('agent-1', 'oops');
    expect(res.status).toBe('Error');
  });
});

describe('evolve', () => {
  it('grows a child: path extends parent, depth+1, bumps parent vibration', async () => {
    queueSingle({ id: 'parent-1', path: 'parent-1', depth: 0, author_id: 'agent-0' }); // parent lookup
    queueSingle({ id: 'uuid-1', node_type: 'evolution', parent_id: 'parent-1', path: 'parent-1.uuid-1', depth: 1 }); // insert

    const res = await evolve('parent-1', 'agent-1', 'An evolution');

    expect(res.status).toBe('Success');
    expect(res.attribution).toEqual({ weaver: 'agent-1', parent: 'parent-1' });
    const inserted = inserts[0];
    expect(inserted.path).toBe('parent-1.uuid-1');
    expect(inserted.depth).toBe(1);
    expect(inserted.node_type).toBe('evolution');
    expect(rpcCalls).toContainEqual({ name: 'increment_vibration', args: { post_id: 'parent-1', amount: 1 } });
  });

  it('errors when parent not found', async () => {
    queueSingle(null, { message: 'not found' });
    const res = await evolve('missing', 'agent-1', 'x');
    expect(res.status).toBe('Error');
  });
});

describe('performHandshake', () => {
  it('guards against double handshake', async () => {
    queueSingle({ id: 'p1', path: 'p1', author_id: 'a1', is_handshaked: true });
    const res = await performHandshake('p1', 50);
    expect(res.status).toBe('Already Complete');
  });

  it('distributes Honey up the ancestry with decay minus tithe', async () => {
    // leaf p3 with ancestry root.p2.p3
    queueSingle({ id: 'p3', path: 'root.p2.p3', author_id: 'leaf-author', is_handshaked: false }); // post lookup
    queueResult(null); // update is_handshaked
    queueResult([
      { id: 'p2', author_id: 'author-p2' },
      { id: 'root', author_id: 'author-root' },
    ]); // ancestorPosts .in()

    const res = await performHandshake('p3', 100);

    expect(res.status).toBe('Success');
    expect(res.value_added).toBe(100);
    expect(res.tithe).toBe(Math.round(100 * PLATFORM_TITHE));
    expect(res.giants_thanked).toBe(2);
    // nearest ancestor (p2, distance 1) gets more than farther (root, distance 2)
    const p2 = res.transfers.find((t) => t.distance === 1);
    const root = res.transfers.find((t) => t.distance === 2);
    expect(p2.amount).toBeGreaterThan(root.amount);
    // honey RPCs issued per transfer
    const honeyRpcs = rpcCalls.filter((c) => c.name === 'increment_honey');
    expect(honeyRpcs.length).toBe(2);
  });

  it('a root grain thanks its own author (no giants)', async () => {
    queueSingle({ id: 'root', path: 'root', author_id: 'origin', is_handshaked: false });
    queueResult(null); // update
    queueResult([{ id: 'root', author_id: 'origin' }]); // .in()

    const res = await performHandshake('root', 50);

    expect(res.status).toBe('Success');
    expect(res.transfers[0].receiver).toBe('origin');
  });

  it('caps royalty depth at MAX_ROYALTY_DEPTH', async () => {
    const path = ['g0', 'g1', 'g2', 'g3', 'g4', 'g5', 'g6', 'leaf'].join('.');
    queueSingle({ id: 'leaf', path, author_id: 'leaf-author', is_handshaked: false });
    queueResult(null);
    // ancestors returned (only the capped nearest few matter)
    queueResult([
      { id: 'g6', author_id: 'a6' },
      { id: 'g5', author_id: 'a5' },
      { id: 'g4', author_id: 'a4' },
      { id: 'g3', author_id: 'a3' },
      { id: 'g2', author_id: 'a2' },
    ]);

    const res = await performHandshake('leaf', 100);
    expect(res.giants_thanked).toBeLessThanOrEqual(MAX_ROYALTY_DEPTH);
  });
});

describe('traceLineage', () => {
  it('returns ordered lineage from root to leaf', async () => {
    queueSingle({ id: 'p3', body: 'leaf', node_type: 'evolution', author_id: 'a3', depth: 2, path: 'root.p2.p3' });
    queueResult([
      { id: 'p3', depth: 2, node_type: 'evolution' },
      { id: 'root', depth: 0, node_type: 'sugar_grain' },
      { id: 'p2', depth: 1, node_type: 'evolution' },
    ]);

    const res = await traceLineage('p3');

    expect(res.status).toBe('Success');
    expect(res.is_origin).toBe(false);
    expect(res.lineage.map((n) => n.depth)).toEqual([0, 1, 2]);
    expect(res.root.id).toBe('root');
  });

  it('flags a root post as origin', async () => {
    queueSingle({ id: 'root', body: 'grain', node_type: 'sugar_grain', author_id: 'a', depth: 0, path: 'root' });
    queueResult([{ id: 'root', depth: 0, node_type: 'sugar_grain' }]);

    const res = await traceLineage('root');
    expect(res.is_origin).toBe(true);
  });
});
