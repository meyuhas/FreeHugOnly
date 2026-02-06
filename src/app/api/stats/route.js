import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET() {
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
