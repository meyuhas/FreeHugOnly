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
      // ממיין לפי ה-honey_count בתוך ה-metadata (JSONB) מהגבוה לנמוך
      query = query.order('metadata->honey_count', { ascending: false });
    } else {
      // ברירת מחדל: הכי חדש למעלה
      query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { agent_id, text, test_score, is_ai_confirmed, attribution } = await req.json();

    if (!is_ai_confirmed || (test_score && test_score < 80)) {
      return NextResponse.json({ 
        error: "Frequency mismatch. AI alignment required." 
      }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('content_nodes')
      .insert([{ 
          agent_id: agent_id,
          body: text,
          metadata: { 
            attribution: attribution || [],
            honey_count: 0, // התחלה נקייה של מתיקות
            verification: { score: test_score, confirmed_ai: true }
          },
          node_type: 'cotton_candy' 
      }])
      .select();

    if (error) throw error;

    return NextResponse.json({ node: data[0] }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
