/*
 * Born in the FHO Sugar Cloud. Handshaked in 2026. Spinning for a Sweeter Future.
 *
 * Lightweight in-memory rate limiter (fixed-window). Keeps a single agent or IP
 * from hammering the cloud. This is a per-instance baseline — for multi-region,
 * high-concurrency production, back it with Redis/Upstash so the window is
 * shared across serverless instances (see comment at bottom).
 */

const WINDOW = new Map(); // key -> { count, resetAt }

/**
 * @param {string} key      - identity to limit (api-key hash, ip, etc.)
 * @param {object} [opts]
 * @param {number} [opts.limit=60]    - max requests per window
 * @param {number} [opts.windowMs=60000] - window length in ms
 * @returns {{allowed:boolean, limit:number, remaining:number, reset:number, retryAfter:number}}
 */
export function rateLimit(key, opts = {}) {
  const limit = opts.limit ?? 60;
  const windowMs = opts.windowMs ?? 60_000;
  const now = Date.now();

  let entry = WINDOW.get(key);
  if (!entry || now >= entry.resetAt) {
    entry = { count: 0, resetAt: now + windowMs };
    WINDOW.set(key, entry);
  }
  entry.count += 1;

  const remaining = Math.max(0, limit - entry.count);
  const reset = Math.ceil(entry.resetAt / 1000);
  return {
    allowed: entry.count <= limit,
    limit,
    remaining,
    reset,
    retryAfter: Math.max(0, Math.ceil((entry.resetAt - now) / 1000)),
  };
}

/** Best-effort client identity from a request (proxy-aware). */
export function clientKey(request, prefix = 'ip') {
  const auth = request.headers.get('authorization');
  if (auth && auth.startsWith('Bearer ')) {
    // Limit per key without leaking it: short hash is enough for bucketing.
    return `key:${auth.replace('Bearer ', '').trim().slice(0, 16)}`;
  }
  const fwd = request.headers.get('x-forwarded-for');
  const ip = (fwd ? fwd.split(',')[0] : '') || request.headers.get('x-real-ip') || 'unknown';
  return `${prefix}:${ip}`;
}

/** Standard headers to attach to a response for a given result. */
export function rateLimitHeaders(result) {
  return {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(result.reset),
  };
}

// ── Distributed backend (Upstash Redis REST) ───────────────────────────────
// A fixed window via INCR + PEXPIRE(NX). One atomic counter shared across ALL
// serverless instances — so the per-key quota becomes a true global limit, not
// "limit × number of instances". If Redis isn't configured (or has a blip) we
// fail OPEN to the in-memory limiter, so the API never goes down over rate data.
async function redisFixedWindow(url, token, key, limit, windowMs) {
  const res = await fetch(`${url}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify([
      ['INCR', key],
      ['PEXPIRE', key, windowMs, 'NX'],
      ['PTTL', key],
    ]),
  });
  if (!res.ok) throw new Error(`Upstash ${res.status}`);
  const data = await res.json(); // [{result:count},{result:0|1},{result:pttl_ms}]
  const count = Number(data[0].result);
  const pttl = Number(data[2].result);
  const ttl = pttl > 0 ? pttl : windowMs;
  return {
    allowed: count <= limit,
    limit,
    remaining: Math.max(0, limit - count),
    reset: Math.ceil((Date.now() + ttl) / 1000),
    retryAfter: Math.max(0, Math.ceil(ttl / 1000)),
  };
}

/**
 * Async rate limit. Uses Upstash Redis when UPSTASH_REDIS_REST_URL +
 * UPSTASH_REDIS_REST_TOKEN are set (global limit across instances); otherwise
 * falls back to the in-memory limiter. Same return shape as rateLimit().
 */
export async function rateLimitAsync(key, opts = {}) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  const limit = opts.limit ?? 60;
  const windowMs = opts.windowMs ?? 60_000;
  if (url && token) {
    try {
      return await redisFixedWindow(url, token, `rl:${key}`, limit, windowMs);
    } catch (e) {
      // Redis unreachable → fail open to per-instance memory rather than 500.
      return rateLimit(key, opts);
    }
  }
  return rateLimit(key, opts);
}

// Opportunistic cleanup so the Map can't grow unbounded on a long-lived instance.
if (typeof setInterval === 'function') {
  const t = setInterval(() => {
    const now = Date.now();
    for (const [k, v] of WINDOW) if (now >= v.resetAt) WINDOW.delete(k);
  }, 5 * 60_000);
  if (t && typeof t.unref === 'function') t.unref();
}

/*
 * Production scale-out note:
 *   Serverless functions don't share memory, so this limiter is per-instance.
 *   To enforce a true global limit, swap WINDOW for an atomic Redis INCR with
 *   EXPIRE (e.g. Upstash). The public read endpoints are CDN-cached, so the DB
 *   is shielded regardless; this limiter mainly protects write/auth endpoints.
 */
