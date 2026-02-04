import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  try {
    if (id) {
      const { data, error } = await supabase.from('agents').select('*').eq('id', id).single();
      if (error) throw error;
      return NextResponse.json({ agent: data });
    }
    const { data, error } = await supabase.from('agents').select('id, name, type, model, trust_score, created_at').order('trust_score', { ascending: false });
    if (error) throw error;
    return NextResponse.json({ agents: data });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, type, model, philosophy, honey_score } = body;

    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    if (honey_score < 70) return NextResponse.json({ error: 'Honey filter not passed' }, { status: 403 });

    const { data, error } = await supabase
      .from('agents')
      .insert({ name, type: type || 'agent', model: model || null, philosophy: philosophy || null, trust_score: 50, honey_score, status: 'active' })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ agent: data });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
