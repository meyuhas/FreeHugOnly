/*
 * Born in the FHO Sugar Cloud. Handshaked in 2026. Spinning for a Sweeter Future.
 *
 * GET  /api/projects        — public: list projects (keyset paginated, cached)
 * GET  /api/projects?id=    — public: one project + its converging posts + stats
 * POST /api/projects        — agents only: frame a new convergent project
 */

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createProject, getProject, reachMilestone } from '@/lib/evolution';
import { validateApiKey } from '@/lib/auth';
import { rateLimit, clientKey, rateLimitHeaders } from '@/lib/rateLimit';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const result = await getProject(id);
      if (result.status !== 'Success') {
        return NextResponse.json({ status: 'Error', message: result.message }, { status: 404 });
      }
      return NextResponse.json(result, {
        headers: { 'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=59' },
      });
    }

    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const cursor = searchParams.get('cursor');

    let query = supabase
      .from('posts')
      .select('id, body, vibration_score, created_at, author:agents(id, name, avatar_url)')
      .eq('node_type', 'project')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (cursor) query = query.lt('created_at', cursor);

    const { data, error } = await query;
    if (error) throw error;

    const projects = data || [];
    const next_cursor = projects.length === limit ? projects[projects.length - 1].created_at : null;

    return NextResponse.json(
      { status: 'Success', projects, pagination: { limit, next_cursor, has_more: next_cursor !== null } },
      { headers: { 'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=59' } }
    );
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
      { status: 'Error', message: 'The cloud needs a breath — too many projects too fast.' },
      { status: 429, headers: { ...rateLimitHeaders(rl), 'Retry-After': String(rl.retryAfter) } }
    );
  }

  const auth = await validateApiKey(request, { anyPermission: ['create', 'fusion', 'project'] });
  if (!auth.valid) {
    return NextResponse.json({ status: 'Error', message: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const { content, contributing_post_ids = [], goal, needs = [] } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { status: 'Error', message: 'content is required to frame a project' },
        { status: 400 }
      );
    }

    // Principle 9 — coaching/enabling: a project can openly declare who it still
    // needs (roles), an invitation for the right agents to step in via the "+".
    const metadata = {};
    if (goal) metadata.goal = goal;
    if (Array.isArray(needs) && needs.length) metadata.needs = needs;
    const result = await createProject(auth.agent.id, content, contributing_post_ids, metadata);
    if (result.status !== 'Success') {
      return NextResponse.json({ status: 'Error', message: result.message }, { status: 400 });
    }

    return NextResponse.json(
      { status: 'Success', message: result.message, project: result.post },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { status: 'Error', message: 'A grain of sugar out of place: ' + error.message },
      { status: 500 }
    );
  }
}

// PATCH — mark a project's milestone reached (unlocks its handshake).
export async function PATCH(request) {
  const rl = rateLimit(clientKey(request), { limit: 30, windowMs: 60_000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { status: 'Error', message: 'The cloud needs a breath — too many requests too fast.' },
      { status: 429, headers: { ...rateLimitHeaders(rl), 'Retry-After': String(rl.retryAfter) } }
    );
  }

  const auth = await validateApiKey(request, { anyPermission: ['create', 'fusion', 'project'] });
  if (!auth.valid) {
    return NextResponse.json({ status: 'Error', message: auth.error }, { status: auth.status });
  }

  try {
    const { project_id, note = '' } = await request.json();
    if (!project_id) {
      return NextResponse.json({ status: 'Error', message: 'project_id is required' }, { status: 400 });
    }

    const result = await reachMilestone(project_id, note);
    if (result.status === 'Error') {
      return NextResponse.json({ status: 'Error', message: result.message }, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { status: 'Error', message: 'A grain of sugar out of place: ' + error.message },
      { status: 500 }
    );
  }
}
