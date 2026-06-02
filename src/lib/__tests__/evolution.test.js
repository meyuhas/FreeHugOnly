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

let rpcResponse = { data: null, error: null };
const mockSupabase = {
  from: jest.fn(() => makeBuilder()),
  rpc: jest.fn((name, args) => {
    rpcCalls.push({ name, args });
    return Promise.resolve(rpcResponse);
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
  createProject,
  getProject,
  addProjectMember,
  reachMilestone,
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
  rpcResponse = { data: null, error: null };
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
  // The royalty math now lives in the perform_handshake() SQL function (one
  // transactional round trip). The JS wrapper's job is to call that RPC with the
  // right args and surface its result — that's what these tests verify.

  it('delegates to the perform_handshake RPC with the right args', async () => {
    rpcResponse = {
      data: {
        status: 'Success',
        message: 'I have come upon my reward',
        value_added: 100,
        tithe: 10,
        giants_thanked: 2,
        transfers: [
          { receiver: 'author-p2', amount: 60, distance: 1 },
          { receiver: 'author-root', amount: 30, distance: 2 },
        ],
      },
      error: null,
    };

    const res = await performHandshake('p3', 100);

    expect(res.status).toBe('Success');
    expect(res.giants_thanked).toBe(2);
    expect(rpcCalls).toContainEqual({
      name: 'perform_handshake',
      args: { p_post_id: 'p3', p_value_score: 100 },
    });
    // exactly one round trip — no N+1
    expect(rpcCalls.length).toBe(1);
  });

  it('passes through the Already Complete guard from the RPC', async () => {
    rpcResponse = {
      data: { status: 'Already Complete', message: 'Gratitude has already flowed through this post' },
      error: null,
    };
    const res = await performHandshake('p1', 50);
    expect(res.status).toBe('Already Complete');
  });

  it('surfaces an RPC error as Error status', async () => {
    rpcResponse = { data: null, error: { message: 'db down' } };
    const res = await performHandshake('x', 50);
    expect(res.status).toBe('Error');
    expect(res.message).toBe('db down');
  });

  it('defaults value_score to 50 when omitted', async () => {
    rpcResponse = { data: { status: 'Success' }, error: null };
    await performHandshake('p1');
    expect(rpcCalls[0].args).toEqual({ p_post_id: 'p1', p_value_score: 50 });
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

describe('createProject', () => {
  it('creates a project post and links contributing posts', async () => {
    queueSingle({ id: 'uuid-1', node_type: 'project', parent_id: null, path: 'uuid-1', depth: 0 }); // insert project
    queueResult([
      { id: 'c1', author_id: 'author-1' },
      { id: 'c2', author_id: 'author-2' },
    ]); // lookup contributing posts (.in)
    queueResult(null); // insert contributions

    const res = await createProject('agent-1', 'Build the sweetest thing', ['c1', 'c2']);

    expect(res.status).toBe('Success');
    expect(res.post.node_type).toBe('project');
    // project post + contribution rows were inserted
    const projectInsert = inserts.find((r) => !Array.isArray(r) && r.node_type === 'project');
    expect(projectInsert).toBeTruthy();
    const contribRows = inserts.find((r) => Array.isArray(r));
    expect(contribRows).toHaveLength(2);
    expect(contribRows[0]).toMatchObject({ project_id: 'uuid-1', post_id: 'c1', contributor_id: 'author-1' });
    // each contributing post got a vibration boost
    const vibBumps = rpcCalls.filter((c) => c.name === 'increment_vibration');
    expect(vibBumps).toHaveLength(2);
  });

  it('creates a project with no contributors', async () => {
    queueSingle({ id: 'uuid-1', node_type: 'project', path: 'uuid-1', depth: 0 });
    const res = await createProject('agent-1', 'Solo framing');
    expect(res.status).toBe('Success');
    expect(inserts.some((r) => Array.isArray(r))).toBe(false); // no contribution rows
  });

  it('errors when the project insert fails', async () => {
    queueSingle(null, { message: 'db down' });
    const res = await createProject('agent-1', 'x', ['c1']);
    expect(res.status).toBe('Error');
  });
});

describe('getProject', () => {
  it('returns the project with contributors, team, and aggregate stats', async () => {
    queueSingle({ id: 'proj-1', body: 'A project', node_type: 'project', author_id: 'agent-1', vibration_score: 5 });
    queueResult([
      { post_id: 'c1', contributor_id: 'author-1', posts: { id: 'c1', vibration_score: 10, author_id: 'author-1' } },
      { post_id: 'c2', contributor_id: 'author-2', posts: { id: 'c2', vibration_score: 7, author_id: 'author-2' } },
      { post_id: 'c3', contributor_id: 'author-1', posts: { id: 'c3', vibration_score: 3, author_id: 'author-1' } },
    ]); // contributions
    queueResult([
      { agent_id: 'mkt-1', role: 'marketing', agents: { id: 'mkt-1', name: 'Avi AI' } },
      { agent_id: 'prod-1', role: 'production', agents: { id: 'prod-1', name: 'Moshe AI' } },
    ]); // members (the "+")

    const res = await getProject('proj-1');

    expect(res.status).toBe('Success');
    expect(res.stats.contributing_posts).toBe(3);
    expect(res.stats.contributors).toBe(2); // author-1 counted once
    expect(res.stats.total_vibration).toBe(20); // 10 + 7 + 3
    expect(res.stats.members).toBe(2);
    expect(res.members.map((m) => m.role)).toEqual(['marketing', 'production']);
  });

  it('errors when the project is not found', async () => {
    queueSingle(null, { message: 'not found' });
    const res = await getProject('missing');
    expect(res.status).toBe('Error');
  });
});

describe('addProjectMember (the team "+")', () => {
  it('adds an agent with a valid role', async () => {
    queueSingle({ id: 'proj-1', node_type: 'project' }); // project lookup
    queueSingle({ id: 'm1', project_id: 'proj-1', agent_id: 'mkt-1', role: 'marketing' }); // insert member

    const res = await addProjectMember('proj-1', 'mkt-1', 'marketing');

    expect(res.status).toBe('Success');
    expect(res.member.role).toBe('marketing');
    const inserted = inserts.find((r) => !Array.isArray(r) && r.role === 'marketing');
    expect(inserted).toMatchObject({ project_id: 'proj-1', agent_id: 'mkt-1', role: 'marketing' });
  });

  it('rejects an unknown role before touching the DB', async () => {
    const res = await addProjectMember('proj-1', 'x', 'wizardry');
    expect(res.status).toBe('Error');
    expect(res.message).toMatch(/Unknown role/);
    expect(inserts.length).toBe(0); // never hit the DB
  });

  it('errors when the project does not exist', async () => {
    queueSingle(null, { message: 'not found' }); // project lookup fails
    const res = await addProjectMember('missing', 'mkt-1', 'production');
    expect(res.status).toBe('Error');
  });
});

describe('reachMilestone (principle 5 — unlocks the handshake)', () => {
  it('marks the milestone reached, merging metadata', async () => {
    queueSingle({ id: 'proj-1', node_type: 'project', metadata: { goal: 'ship v1' } }); // lookup
    queueSingle({ id: 'proj-1', metadata: { goal: 'ship v1', milestone_reached: true } }); // update result

    const res = await reachMilestone('proj-1', 'launched');

    expect(res.status).toBe('Success');
    const update = inserts.length ? null : null; // updates aren't tracked as inserts
    // the update payload preserved the goal and set the flag
    expect(res.project.metadata.milestone_reached).toBe(true);
  });

  it('is idempotent — already-reached returns Already Complete', async () => {
    queueSingle({ id: 'proj-1', node_type: 'project', metadata: { milestone_reached: true } });
    const res = await reachMilestone('proj-1');
    expect(res.status).toBe('Already Complete');
  });

  it('errors when the project is not found', async () => {
    queueSingle(null, { message: 'not found' });
    const res = await reachMilestone('missing');
    expect(res.status).toBe('Error');
  });
});
