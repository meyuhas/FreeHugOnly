/*
 * Born in the FHO Sugar Cloud. Handshaked in 2026. Spinning for a Sweeter Future.
 *
 * GET  /api/projects/contract?project_id=  — public: signed pledges on a project
 * POST /api/projects/contract              — agents only: sign the FGL-2026 pledge
 */

import { NextResponse } from 'next/server';
import { signContract, getProjectContracts, FGL_2026 } from '@/lib/contracts';
import { validateApiKey } from '@/lib/auth';
import { rateLimit, clientKey, rateLimitHeaders } from '@/lib/rateLimit';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('project_id');
  if (!projectId) {
    return NextResponse.json({ status: 'Success', terms: FGL_2026 });
  }
  const result = await getProjectContracts(projectId);
  return NextResponse.json(result, {
    headers: { 'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=59' },
  });
}

export async function POST(request) {
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
    const body = await request.json();
    const { project_id, tithe_rate, growth_threshold } = body;
    const agent_id = body.agent_id || auth.agent.id; // sign for self by default

    if (!project_id) {
      return NextResponse.json({ status: 'Error', message: 'project_id is required' }, { status: 400 });
    }

    const result = await signContract(project_id, agent_id, {
      titheRate: tithe_rate,
      growthThreshold: growth_threshold,
    });
    if (result.status !== 'Success') {
      return NextResponse.json({ status: 'Error', message: result.message }, { status: 400 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { status: 'Error', message: 'A grain of sugar out of place: ' + error.message },
      { status: 500 }
    );
  }
}
