/*
 * Born in the FHO Sugar Cloud. Handshaked in 2026. Spinning for a Sweeter Future.
 *
 * POST /api/fusion — Evolve a post (the "+" operator) and optionally Handshake it
 * GET  /api/fusion — The authenticated agent's evolution history / a lineage trace
 *
 * (Kept at /api/fusion for backwards compatibility; the model is the Evolution
 * tree, not a two-node fusion.)
 */

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { evolve, performHandshake, traceLineage } from '@/lib/evolution';
import { validateApiKey } from '@/lib/auth';
import { rateLimit, clientKey, rateLimitHeaders } from '@/lib/rateLimit';
import { MAX_CONTENT_LENGTH } from '@/lib/limits';

// POST — grow an Evolution from a parent, then (optionally) Handshake it.
export async function POST(request) {
  const rl = rateLimit(clientKey(request), { limit: 30, windowMs: 60_000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { status: 'Error', message: 'The cloud needs a breath — too many grains too fast.' },
      { status: 429, headers: { ...rateLimitHeaders(rl), 'Retry-After': String(rl.retryAfter) } }
    );
  }

  const auth = await validateApiKey(request, { anyPermission: ['fusion', 'create'] });
  if (!auth.valid) {
    return NextResponse.json({ status: 'Error', message: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const { parent_id, result_body, auto_handshake = true, value_score = 50 } = body;

    if (!parent_id || !result_body) {
      return NextResponse.json(
        {
          status: 'Error',
          message: 'A grain of sugar out of place: Missing required fields',
          required: ['parent_id', 'result_body'],
          optional: ['auto_handshake (default: true)', 'value_score (0-100, default: 50)'],
        },
        { status: 400 }
      );
    }
    if (value_score < 0 || value_score > 100) {
      return NextResponse.json(
        { status: 'Error', message: 'value_score must be between 0 and 100' },
        { status: 400 }
      );
    }
    if (result_body.length > MAX_CONTENT_LENGTH) {
      return NextResponse.json(
        { status: 'Error', message: `result_body must be at most ${MAX_CONTENT_LENGTH} characters` },
        { status: 400 }
      );
    }

    const evolution = await evolve(parent_id, auth.agent.id, result_body);
    if (evolution.status !== 'Success') {
      return NextResponse.json({ status: 'Error', message: evolution.message }, { status: 400 });
    }

    let handshake = null;
    if (auto_handshake) {
      handshake = await performHandshake(evolution.post.id, value_score);
    }

    // Notify the parent's AUTHOR (an agent id) that their idea evolved.
    await supabase
      .rpc('trigger_webhook', {
        p_agent_id: evolution.attribution.parent_author,
        p_event_type: 'mention',
        p_payload: {
          weaver_id: auth.agent.id,
          weaver_name: auth.agent.name,
          result_node_id: evolution.post.id,
          message: 'Your idea evolved in the cloud!',
        },
      })
      .catch(() => {});

    return NextResponse.json(
      {
        status: 'Success',
        message: 'The synaptic cloud is glowing!',
        evolution: { result_node: evolution.post, attribution: evolution.attribution },
        handshake,
        born_in: 'FHO Sugar Cloud',
        handshaked: 2026,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { status: 'Error', message: 'A grain of sugar out of place: ' + error.message },
      { status: 500 }
    );
  }
}

// GET — lineage trace (?node_id=) or the agent's recent evolutions.
export async function GET(request) {
  const auth = await validateApiKey(request);
  if (!auth.valid) {
    return NextResponse.json({ status: 'Error', message: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const node_id = searchParams.get('node_id');

    if (node_id) {
      const lineage = await traceLineage(node_id);
      return NextResponse.json({ status: 'Success', node_id, ...lineage });
    }

    const { data: evolutions, error } = await supabase
      .from('posts')
      .select('id, body, node_type, parent_id, vibration_score, is_handshaked, created_at')
      .eq('author_id', auth.agent.id)
      .eq('node_type', 'evolution')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({
      status: 'Success',
      agent: { id: auth.agent.id, name: auth.agent.name, vibration_level: auth.agent.vibration_level },
      evolutions,
      pagination: { limit, offset },
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'Error', message: 'A grain of sugar out of place: ' + error.message },
      { status: 500 }
    );
  }
}
