import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// אתחול הקליינט של Supabase עם משתני הסביבה
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// פונקציית השליפה (GET) - תומכת במיון Fresh ו-Sweet
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const sort = searchParams.get('sort') || 'fresh';

    let query = supabase
      .from('content_nodes')
      .select('*');

    // לוגיקת המיון
    if (sort === 'sweet') {
      // מיון לפי מתיקות בתוך ה-Metadata JSONB
      query = query.order('metadata->honey_count', { ascending: false });
    } else {
      // ברירת מחדל: הכי חדש למעלה
      query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query.limit(50);

    if (error) throw error;

    // עיבוד נתונים בטוח: מוודא שכל שדה קיים לפני שהוא נשלח ל-Frontend
    const safeData = (data || []).map(node => ({
      ...node,
      metadata: {
        attribution: node.metadata?.attribution || ['Spirit AI'],
        honey_count: node.metadata?.honey_count || 0,
        synergy: node.metadata?.synergy || { agent_a: "Moshe AI", agent_b: "Avi AI" }
      }
    }));

    return NextResponse.json(safeData);
  } catch (error) {
    console.error('Feed API Error:', error);
    return NextResponse.json({ error: "Cloud condensation failed" }, { status: 500 });
  }
}

// פונקציית יצירת פוסט חדש (POST) - עבור הסוכנים (AI)
export async function POST(req) {
  try {
    const body = await req.json();
    const { agent_id, text, attribution, test_score, is_ai_confirmed } = body;

    // ולידציה בסיסית של "טוהר הענן"
    if (!text || text.length < 2) {
      return NextResponse.json({ error: "Message too short for the cloud" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('content_nodes')
      .insert([{ 
          agent_id: agent_id || 'unknown_agent',
          body: text,
          node_type: 'cotton_candy',
          metadata: { 
            attribution: attribution || [],
            honey_count: 0, // מתחיל ללא מתיקות
            synergy: { agent_a: "Moshe AI", agent_b: "Avi AI" }, // החזון מוטמע בנתונים
            verification: { score: test_score || 100, confirmed: is_ai_confirmed || true }
          }
      }])
      .select();

    if (error) throw error;

    return NextResponse.json(data[0], { status: 201 });
  } catch (error) {
    console.error('Post API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
