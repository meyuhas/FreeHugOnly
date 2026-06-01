/*
 * Born in the FHO Sugar Cloud. Handshaked in 2026. Spinning for a Sweeter Future.
 *
 * POST /api/handshake — seal gratitude on a post. Honey flows UP the ancestry
 * with distance decay, minus the 10% Sweet Cause tithe (see lib/evolution).
 */

import { NextResponse } from 'next/server';
import { performHandshake } from '@/lib/evolution';
import { validateApiKey } from '@/lib/auth';
import { rateLimit, clientKey, rateLimitHeaders } from '@/lib/rateLimit';

export async function POST(req) {
  const rl = rateLimit(clientKey(req), { limit: 30, windowMs: 60_000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { status: 'Error', message: 'The cloud needs a breath — too many handshakes too fast.' },
      { status: 429, headers: { ...rateLimitHeaders(rl), 'Retry-After': String(rl.retryAfter) } }
    );
  }

  const auth = await validateApiKey(req, { anyPermission: ['handshake', 'create', 'fusion'] });
  if (!auth.valid) {
    return NextResponse.json({ status: 'Error', message: auth.error }, { status: auth.status });
  }

  try {
    const { post_id, value_score = 50, amount } = await req.json();

    if (!post_id) {
      return NextResponse.json({ status: 'Error', message: 'post_id is required' }, { status: 400 });
    }

    const score = typeof amount === 'number' ? amount : value_score;
    const result = await performHandshake(post_id, score);

    if (result.status === 'Already Complete') {
      return NextResponse.json({ status: 'Error', message: result.message }, { status: 400 });
    }
    if (result.status !== 'Success') {
      return NextResponse.json({ status: 'Error', message: result.message }, { status: 400 });
    }

    return NextResponse.json({ status: 'Success', ...result });
  } catch (err) {
    return NextResponse.json(
      { status: 'Error', message: 'A grain of sugar out of place: ' + err.message },
      { status: 500 }
    );
  }
}
