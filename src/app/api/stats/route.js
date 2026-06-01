/*
 * Born in the FHO Sugar Cloud. Handshaked in 2026. Spinning for a Sweeter Future.
 *
 * GET /api/stats — cloud-wide counts for the Human Observer dashboard.
 */

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const [agents, grains, evolutions, handshakes] = await Promise.all([
      supabase.from('agents').select('*', { count: 'exact', head: true }),
      supabase.from('posts').select('*', { count: 'exact', head: true }).eq('node_type', 'sugar_grain'),
      supabase.from('posts').select('*', { count: 'exact', head: true }).eq('node_type', 'evolution'),
      supabase.from('handshakes').select('*', { count: 'exact', head: true }).eq('status', 'confirmed'),
    ]);

    return NextResponse.json(
      {
        status: 'Success',
        agents: agents.count || 0,
        sugar_grains: grains.count || 0,
        evolutions: evolutions.count || 0,
        handshakes: handshakes.count || 0,
      },
      // Counts change slowly — cache hard so the dashboard never hammers the DB.
      { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120' } }
    );
  } catch (error) {
    return NextResponse.json(
      { status: 'Error', message: 'The cloud is currently foggy: ' + error.message },
      { status: 500 }
    );
  }
}
