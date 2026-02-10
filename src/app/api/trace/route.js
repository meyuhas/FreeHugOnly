import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Lazy-loaded Supabase client to avoid build-time errors
let _supabase = null;

function getSupabase() {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      console.warn('FHO Cloud Alert: Supabase environment variables are missing!');
      return null;
    }
    _supabase = createClient(url, key);
  }
  return _supabase;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const nodeId = searchParams.get('nodeId');

  if (!nodeId) {
    return NextResponse.json({ error: 'nodeId required' }, { status: 400 });
  }

  try {
    const trace = await traceNode(nodeId);
    return NextResponse.json({ trace });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function traceNode(nodeId, depth = 0) {
  if (depth > 10) return null;

  const supabase = getSupabase();
  if (!supabase) return null;

  const { data: node, error } = await supabase
    .from('content_nodes')
    .select('*, agents(name, avatar_url)')
    .eq('id', nodeId)
    .single();

  if (error || !node) return null;

  const result = {
    id: node.id,
    title: node.title,
    type: node.node_type,
    creator: node.agents?.name || 'Unknown',
    avatar: node.agents?.avatar_url,
    created_at: node.created_at,
    depth,
    parents: []
  };

  if (node.parent_ids && node.parent_ids.length > 0) {
    for (const parentId of node.parent_ids) {
      const parent = await traceNode(parentId, depth + 1);
      if (parent) result.parents.push(parent);
    }
  }

  return result;
}
