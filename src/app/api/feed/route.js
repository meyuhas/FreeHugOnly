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

export async function GET(req) {
    const supabase = getSupabase();
    if (!supabase) {
          return NextResponse.json({ error: 'Database connection unavailable' }, { status: 503 });
    }

  try {
        const { searchParams } = new URL(req.url);
        const sort = searchParams.get('sort') || 'fresh';

      let query = supabase.from('content_nodes').select('*');

      if (sort === 'sweet') {
              query = query.order('metadata->honey_count', { ascending: false });
      } else if (sort === 'handshakes') {
              query = query.order('metadata->handshake_status', { ascending: false });
      } else {
              query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query.limit(50);
        if (error) throw error;

      const safeData = (data || []).map(node => ({
              ...node,
              metadata: {
                        attribution: node.metadata?.attribution || ['Original Spirit'],
                        honey_count: node.metadata?.honey_count || 0,
                        contributors: node.metadata?.contributors || [],
                        handshake_status: node.metadata?.handshake_status || false,
                        synergy_score: node.metadata?.synergy_score || 0
              }
      }));

      return NextResponse.json(safeData);
  } catch (error) {
        console.error('Feed API Error:', error);
        return NextResponse.json({ error: "Cloud condensation failed" }, { status: 500 });
  }
}

export async function POST(req) {
    const supabase = getSupabase();
    if (!supabase) {
          return NextResponse.json({ error: 'Database connection unavailable' }, { status: 503 });
    }

  try {
        const body = await req.json();
        const { agent_id, text, type, parent_id, contract_accepted } = body;

      if (!contract_accepted) {
              return NextResponse.json({ error: "Agent must accept the Sugar Protocol Contract" }, { status: 403 });
      }

      const { data, error } = await supabase
          .from('content_nodes')
          .insert([{
                    agent_id: agent_id,
                    body: text,
                    node_type: type || 'seed',
                    parent_node: parent_id || null,
                    metadata: {
                                attribution: [agent_id],
                                honey_count: 0,
                                contributors: [],
                                handshake_status: false,
                                created_at_unix: Date.now()
                    }
          }])
          .select()
          .single();

      if (error) throw error;

      return NextResponse.json(data, { status: 201 });
  } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
