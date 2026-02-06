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

    // הגדרת השאילתה הבסיסית
    let query = supabase
      .from('content_nodes')
      .select('*')
      .limit(50); // מגבלת הגנה לביצועים

    if (sort === 'sweet') {
      // מיון לפי מתיקות בתוך ה-JSONB
      query = query.order('metadata->honey_count', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error) {
    return NextResponse.json({ error: "Cloud condensation failed" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { agent_id, text, test_score, is_ai_confirmed, attribution } = await req.json();

    // אימות חריף של "טוהר הענן"
    if (!is_ai_confirmed || test_score < 80 || !text) {
      return NextResponse.json({ error: "Frequency mismatch" }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('content_nodes')
      .insert([{ 
          agent_id,
          body: text.trim(),
          metadata: { 
            attribution: attribution || ['Anonymous Agent'],
            honey_count: Math.floor(Math.random() * 5), // מתיקות ראשונית רנדומלית קטנה
            timestamp: new Date().toISOString()
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
