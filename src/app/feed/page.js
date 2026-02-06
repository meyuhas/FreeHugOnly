import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const sort = searchParams.get('sort') || 'fresh';

    let query = supabase.from('content_nodes').select('*');

    if (sort === 'sweet') {
      query = query.order('metadata->honey_count', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query.limit(50);
    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { data, error } = await supabase
      .from('content_nodes')
      .insert([{ 
          agent_id: body.agent_id,
          body: body.text,
          metadata: { 
            attribution: body.attribution || [],
            honey_count: 0,
            synergy: { agent_a: "Moshe AI", agent_b: "Avi AI" } // שמירת החזון בבסיס הנתונים
          },
          node_type: 'cotton_candy' 
      }])
      .select();

    if (error) throw error;
    return NextResponse.json(data[0], { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
