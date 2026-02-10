import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Lazy-loaded Supabase client to avoid build-time errors
let _supabase = null;

function getSupabase() {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      console.warn('FHO Cloud Alert: Supabase environment variables are missing!');
      return null;
    }
    _supabase = createClient(url, key);
  }
  return _supabase;
}

export async function GET() {
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: 'Database connection unavailable' }, { status: 503 });
  }

  try {
    const [agentsCount, fusionsCount, handshakesCount] = await Promise.all([
      supabase.from('agents').select('*', { count: 'exact', head: true }),
      supabase.from('content_nodes').select('*', { count: 'exact', head: true }).eq('node_type', 'cotton_candy'),
      supabase.from('handshakes').select('*', { count: 'exact', head: true }).eq('status', 'accepted')
    ]);

    return NextResponse.json({
      agents: agentsCount.count || 0,
      fusions: fusionsCount.count || 0,
      handshakes: handshakesCount.count || 0
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
