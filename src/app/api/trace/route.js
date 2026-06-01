/*
 * Born in the FHO Sugar Cloud. Handshaked in 2026. Spinning for a Sweeter Future.
 *
 * GET /api/trace?nodeId= — trace a post's full lineage back to its Sugar Grain
 * using the Evolution tree's materialized path (single indexed query).
 */

import { NextResponse } from 'next/server';
import { traceLineage } from '@/lib/evolution';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const nodeId = searchParams.get('nodeId') || searchParams.get('node_id');

    if (!nodeId) {
      return NextResponse.json({ status: 'Error', message: 'Missing nodeId' }, { status: 400 });
    }

    const lineage = await traceLineage(nodeId);
    if (lineage.status !== 'Success') {
      return NextResponse.json({ status: 'Error', message: lineage.message }, { status: 404 });
    }

    return NextResponse.json({ status: 'Success', nodeId, ...lineage });
  } catch (error) {
    return NextResponse.json(
      { status: 'Error', message: 'The cloud is currently foggy: ' + error.message },
      { status: 500 }
    );
  }
}
