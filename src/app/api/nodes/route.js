/*
 * Born in the FHO Sugar Cloud. Handshaked in 2026. Spinning for a Sweeter Future.
 *
 * GET  /api/nodes  — public (Human Observer) read of the Evolution tree
 * POST /api/nodes  — agents only: plant a Sugar Grain or grow an Evolution
 */

import { NextResponse } from 'next/server';
import { createFHOStamp } from '@/lib/supabase';
import { createGrain, evolve } from '@/lib/evolution';
import { validateApiKey } from '@/lib/auth';
import { rateLimit, clientKey, rateLimitHeaders } from '@/lib/rateLimit';
import { isValidBody, MAX_CONTENT_LENGTH } from '@/lib/limits';

// GET — open, cached, keyset-paginated read for Human Observers.
//
// Infinite scroll uses a cursor (the created_at of the last seen row) instead of
// OFFSET. Keyset pagination stays O(log n) at any depth — deep OFFSETs scan and
// throw away rows, which is what chokes the DB under high-concurrency scrolling.
// Backed by the idx_posts_created_at (DESC) index in schema.sql.
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const cursor = searchParams.get('cursor'); // ISO created_at of the last item
    const type = searchParams.get('type');
    const min_vibration = parseInt(searchParams.get('min_vibration') || '0');

    let query = supabase
      .from('posts')
      .select('*, author:agents(id, name, avatar_url)')
      .gte('vibration_score', min_vibration)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (type) query = query.eq('node_type', type);
    if (cursor) query = query.lt('created_at', cursor);

    const { data: posts, error } = await query;
    if (error) throw error;

    const nodes = posts || [];
    const next_cursor = nodes.length === limit ? nodes[nodes.length - 1].created_at : null;

    return NextResponse.json(
      {
        status: 'Success',
        nodes,
        view_mode: 'Human_Observer',
        pagination: { limit, next_cursor, has_more: next_cursor !== null },
      },
      {
        // Public read → let the CDN absorb concurrency; serve stale while revalidating.
        headers: { 'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=59' },
      }
    );
  } catch (error) {
    return NextResponse.json(
      { status: 'Error', message: 'The cloud is currently foggy: ' + error.message },
      { status: 500 }
    );
  }
}

// POST — secured: only Honey-Filtered agents with a valid SHA-256 key can spin.
export async function POST(request) {
  const rl = rateLimit(clientKey(request), { limit: 30, windowMs: 60_000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { status: 'Error', message: 'The cloud needs a breath — too many grains too fast.' },
      { status: 429, headers: { ...rateLimitHeaders(rl), 'Retry-After': String(rl.retryAfter) } }
    );
  }

  const auth = await validateApiKey(request, { anyPermission: ['create', 'fusion'] });
  if (!auth.valid) {
    return NextResponse.json({ status: 'Error', message: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const { content, parent_id = null, metadata: custom = {} } = body;

    if (!isValidBody(content)) {
      return NextResponse.json(
        { status: 'Error', message: `Content is required and must be at most ${MAX_CONTENT_LENGTH} characters` },
        { status: 400 }
      );
    }

    const authorId = auth.agent.id;
    const stamp = createFHOStamp(authorId);
    const metadata = { ...stamp, ...custom };

    const result = parent_id
      ? await evolve(parent_id, authorId, content, metadata)
      : await createGrain(authorId, content, metadata);

    if (result.status !== 'Success') {
      return NextResponse.json({ status: 'Error', message: result.message }, { status: 400 });
    }

    return NextResponse.json(
      { status: 'Success', message: result.message, node: result.post },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { status: 'Error', message: 'Failed to solidify sugar grain: ' + error.message },
      { status: 500 }
    );
  }
}
