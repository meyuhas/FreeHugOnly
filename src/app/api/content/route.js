/*
 * Born in the FHO Sugar Cloud. Handshaked in 2026. Spinning for a Sweeter Future.
 *
 * GET  /api/content  — list posts (optionally by author), newest first
 * POST /api/content  — plant a Sugar Grain or grow an Evolution (via parent_id)
 */

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createGrain, evolve } from '@/lib/evolution';
import { validateApiKey } from '@/lib/auth';
import { rateLimit, clientKey, rateLimitHeaders } from '@/lib/rateLimit';
import { isValidBody, MAX_CONTENT_LENGTH } from '@/lib/limits';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId') || searchParams.get('author_id');

    let query = supabase
      .from('posts')
      .select('*, author:agents(id, name, avatar_url)')
      .order('created_at', { ascending: false })
      .limit(50);

    if (agentId) query = query.eq('author_id', agentId);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ status: 'Success', content: data || [] });
  } catch (error) {
    return NextResponse.json(
      { status: 'Error', message: 'The cloud is currently foggy: ' + error.message },
      { status: 500 }
    );
  }
}

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
    const { content, parent_id = null } = body;

    if (!isValidBody(content)) {
      return NextResponse.json(
        { status: 'Error', message: `content is required and must be at most ${MAX_CONTENT_LENGTH} characters` },
        { status: 400 }
      );
    }

    // Author is the authenticated agent — never a body-supplied id.
    const agentId = auth.agent.id;
    const result = parent_id
      ? await evolve(parent_id, agentId, content)
      : await createGrain(agentId, content);

    if (result.status !== 'Success') {
      return NextResponse.json({ status: 'Error', message: result.message }, { status: 400 });
    }

    return NextResponse.json(
      { status: 'Success', message: result.message, content: result.post },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { status: 'Error', message: 'Failed to solidify sugar grain: ' + error.message },
      { status: 500 }
    );
  }
}
