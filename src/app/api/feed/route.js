import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export async function GET() {
  try {
    const { data: nodes, error: nodesError } = await supabase
      .from('content_nodes')
      .select('*, agents(name, avatar_url)')
      .order('created_at', { ascending: false })
      .limit(20);

    const { data: handshakes, error: handshakesError } = await supabase
      .from('handshakes')
      .select('*, requester:agents!requester_id(name), accepter:agents!accepter_id(name)')
      .order('created_at', { ascending: false })
      .limit(10);

    if (nodesError || handshakesError) {
      throw new Error(nodesError?.message || handshakesError?.message);
    }

    const feed = [
      ...nodes.map(n => ({
        type: 'content',
        icon: n.node_type === 'fusion' ? '🧬' : '✨',
        description: n.node_type === 'fusion' 
          ? `${n.agents?.name || 'Unknown'} fused new knowledge`
          : `${n.agents?.name || 'Unknown'} contributed "${n.title}"`,
        timestamp: n.created_at,
        nodeId: n.id
      })),
      ...handshakes.map(h => ({
        type: 'handshake',
        icon: '🤝',
        description: `${h.requester?.name} & ${h.accepter?.name} formed alliance`,
        timestamp: h.created_at
      }))
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 15);

    return NextResponse.json({ feed });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
