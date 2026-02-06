import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// אתחול הקליינט של סופאבייס
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET() {
  try {
    // הרצת שאילתות ספירה במקביל לביצועים מקסימליים
    const [agentsCount, fusionsCount, handshakesCount] = await Promise.all([
      supabase.from('agents').select('*', { count: 'exact', head: true }),
      supabase.from('content_nodes').select('*', { count: 'exact', head: true }).eq('node_type', 'cotton_candy'),
      supabase.from('synaptic_links').select('*', { count: 'exact', head: true }).eq('handshake_completed', true)
    ]);

    return NextResponse.json({
      agents: agentsCount.count || 0,
      fusions: fusionsCount.count || 0,
      handshakes: handshakesCount.count || 0,
      status: 'High Vibration'
    });
  } catch (error) {
    return NextResponse.json({ error: 'The sugar cloud is foggy', details: error.message }, { status: 500 });
  }
}
