/*
 * 🍭 FHO: Webhook delivery worker tests
 * Born in the FHO Sugar Cloud. Handshaked in 2026.
 */

const resultQueue = [];
const updates = [];

function makeBuilder() {
  const b = {};
  ['select', 'is', 'order', 'limit', 'eq'].forEach((m) => { b[m] = () => b; });
  b.update = (vals) => { updates.push(vals); return b; };
  b.then = (resolve) =>
    Promise.resolve(resultQueue.length ? resultQueue.shift() : { data: null, error: null }).then(resolve);
  return b;
}

jest.mock('../supabase', () => ({
  supabase: { from: jest.fn(() => makeBuilder()) },
  sweeten: (m) => m,
}));

const { dispatchWebhooks, signPayload } = require('../webhooks');

const queueResult = (data, error = null) => resultQueue.push({ data, error });

beforeEach(() => {
  resultQueue.length = 0;
  updates.length = 0;
  jest.clearAllMocks();
  global.fetch = jest.fn();
});

describe('signPayload', () => {
  it('is a stable 64-char HMAC-SHA256 hex', () => {
    const a = signPayload('{"x":1}');
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(a).toBe(signPayload('{"x":1}'));
    expect(a).not.toBe(signPayload('{"x":2}'));
  });
});

describe('dispatchWebhooks', () => {
  it('delivers a pending webhook and records a 200', async () => {
    queueResult([
      { id: 'd1', webhook_id: 'w1', event_type: 'handshake.received', payload: { amount: 5 },
        webhooks: { url: 'https://hook.example/x', is_active: true } },
    ]); // the pending select
    queueResult(null); // the update after delivery
    global.fetch.mockResolvedValue({ ok: true, status: 200, text: async () => 'ok' });

    const res = await dispatchWebhooks({ limit: 10 });

    expect(res.delivered).toBe(1);
    expect(res.failed).toBe(0);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    // it signed and labelled the request
    const [, opts] = global.fetch.mock.calls[0];
    expect(opts.headers['X-FHO-Signature']).toMatch(/^[0-9a-f]{64}$/);
    expect(opts.headers['X-FHO-Event']).toBe('handshake.received');
    // it recorded the response status
    expect(updates.some((u) => u.response_status === 200)).toBe(true);
  });

  it('marks an inactive webhook as failed without calling fetch', async () => {
    queueResult([
      { id: 'd2', webhook_id: 'w2', event_type: 'mention', payload: {},
        webhooks: { url: 'https://hook.example/y', is_active: false } },
    ]);
    queueResult(null);

    const res = await dispatchWebhooks();

    expect(res.failed).toBe(1);
    expect(res.delivered).toBe(0);
    expect(global.fetch).not.toHaveBeenCalled();
    expect(updates.some((u) => u.response_status === 0)).toBe(true);
  });

  it('records a failure when the POST throws', async () => {
    queueResult([
      { id: 'd3', webhook_id: 'w3', event_type: 'handshake.received', payload: {},
        webhooks: { url: 'https://hook.example/z', is_active: true } },
    ]);
    queueResult(null);
    global.fetch.mockRejectedValue(new Error('network down'));

    const res = await dispatchWebhooks();

    expect(res.failed).toBe(1);
    expect(updates.some((u) => u.response_status === 0)).toBe(true);
  });

  it('returns zeros when the queue is empty', async () => {
    queueResult([]);
    const res = await dispatchWebhooks();
    expect(res).toMatchObject({ processed: 0, delivered: 0, failed: 0 });
  });
});
