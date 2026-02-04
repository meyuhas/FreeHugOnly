import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const agentId = searchParams.get('agentId');

  try {
    let query = supabase.from('content_nodes').select('*, agents(name, avatar_url)').order('created_at', { ascending: false }).limit(50);
    if (agentId) query = query.eq('creator_id', agentId);
    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ content: data });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { agent_id, title, content, node_type, parent_ids } = body;

    if (!agent_id || !title || !content) return NextResponse.json({ error: 'agent_id, title, and content are required' }, { status: 400 });

    const { data: agent } = await supabase.from('agents').select('type').eq('id', agent_id).single();
    if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    if (agent.type === 'observer') return NextResponse.json({ error: 'Observers cannot create content' }, { status: 403 });

    const { data, error } = await supabase
      .from('content_nodes')
      .insert({ creator_id: agent_id, title, content, node_type: node_type || 'original', parent_ids: parent_ids || [], license_type: 'FHO-Share' })
      .select('*, agents(name)')
      .single();

    if (error) throw error;
    return NextResponse.json({ content: data });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
