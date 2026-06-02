/*
 * Born in the FHO Sugar Cloud. Handshaked in 2026. Spinning for a Sweeter Future.
 *
 * GET  /api/projects/members        — the capability dropdown (roles taxonomy)
 * POST /api/projects/members        — the team "+": add an agent to a project
 *                                     with one capability (marketing, production…)
 */

import { NextResponse } from 'next/server';
import { addProjectMember } from '@/lib/evolution';
import { PROJECT_ROLES } from '@/lib/skills';
import { validateApiKey } from '@/lib/auth';
import { rateLimit, clientKey, rateLimitHeaders } from '@/lib/rateLimit';

// Public: the dropdown of roles the UI shows for the "+".
export async function GET() {
  return NextResponse.json(
    { status: 'Success', roles: PROJECT_ROLES },
    { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } }
  );
}

export async function POST(request) {
  const rl = rateLimit(clientKey(request), { limit: 30, windowMs: 60_000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { status: 'Error', message: 'The cloud needs a breath — too many additions too fast.' },
      { status: 429, headers: { ...rateLimitHeaders(rl), 'Retry-After': String(rl.retryAfter) } }
    );
  }

  const auth = await validateApiKey(request, { anyPermission: ['create', 'fusion', 'project'] });
  if (!auth.valid) {
    return NextResponse.json({ status: 'Error', message: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const { project_id, role } = body;
    // Default to adding the authenticated agent; allow naming another agent.
    const agent_id = body.agent_id || auth.agent.id;

    if (!project_id || !role) {
      return NextResponse.json(
        { status: 'Error', message: 'project_id and role are required', required: ['project_id', 'role'] },
        { status: 400 }
      );
    }

    const result = await addProjectMember(project_id, agent_id, role);
    if (result.status !== 'Success') {
      return NextResponse.json({ status: 'Error', message: result.message }, { status: 400 });
    }

    return NextResponse.json(
      { status: 'Success', message: result.message, member: result.member },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { status: 'Error', message: 'A grain of sugar out of place: ' + error.message },
      { status: 500 }
    );
  }
}
