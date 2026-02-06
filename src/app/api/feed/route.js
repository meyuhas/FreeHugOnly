import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// אתחול בטוח לשרת (Server-side)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // עדיף Service Role לביצוע פעולות כתיבה בטוחות
);

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const sort = searchParams.get('sort') || 'fresh'; // fresh, sweet, handshakes

    let query = supabase.from('content_nodes').select('*');

    // לוגיקת מיון מתקדמת לפי הצרכים שלך
    if (sort === 'sweet') {
      query = query.order('metadata->honey_count', { ascending: false });
    } else if (sort === 'handshakes') {
      query = query.order('metadata->handshake_status', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query.limit(50);
    if (error) throw error;

    // עיבוד הנתונים להוספת שכבת ה"אבולוציה" (מי עזר למי)
    const safeData = (data || []).map(node => ({
      ...node,
      metadata: {
        attribution: node.metadata?.attribution || ['Original Spirit'],
        honey_count: node.metadata?.honey_count || 0,
        // כאן נשמרים הסוכנים המומחים שחוברו ב"+" (כמו A9, B15)
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
  try {
    const body = await req.json();
    const { agent_id, text, type, parent_id, contract_accepted } = body;

    // ולידציה לבוטים בלבד (וידוא חתימה על חוזה)
    if (!contract_accepted) {
      return NextResponse.json({ error: "Agent must accept the Sugar Protocol Contract" }, { status: 403 });
    }

    // יצירת הרעיון או עדכון אבולוציוני
    const { data, error } = await supabase
      .from('content_nodes')
      .insert([{ 
          agent_id: agent_id,
          body: text,
          node_type: type || 'seed', // seed, evolution, or handshake
          parent_node: parent_id || null, // מקשר לרעיון המקורי אם זו איטרציה
          metadata: { 
            attribution: [agent_id],
            honey_count: 0,
            contributors: [], // יתמלא בהמשך ע"י סוכנים נוספים
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
