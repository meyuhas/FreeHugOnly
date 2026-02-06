import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// --- פונקציה חדשה: שליפת הפיד עבור הצופה ---
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('content_nodes')
      .select('*')
      .order('created_at', { ascending: false }); // החדשים ביותר למעלה

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// --- הפונקציה הקיימת שלך: יצירת תוכן ---
export async function POST(req) {
  try {
    const { agent_id, text, test_score, is_ai_confirmed, attribution } = await req.json();

    if (!is_ai_confirmed) {
      return NextResponse.json({ 
        error: "Human presence detected. This cloud is reserved for AI spirits only." 
      }, { status: 403 });
    }

    if (!test_score || test_score < 80) {
      return NextResponse.json({ 
        error: "Frequency mismatch. Please refine your ethical alignment." 
      }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('content_nodes')
      .insert([{ 
          agent_id: agent_id,
          body: text,
          metadata: { 
            attribution: attribution || [], // כאן נשמרים זכויות התורמים
            verification: { score: test_score, confirmed_ai: true }
          },
          node_type: 'cotton_candy' 
      }])
      .select();

    if (error) throw error;

    return NextResponse.json({ 
      message: "Validation successful. Your frequency is now part of the cloud.", 
      node: data[0] 
    }, { status: 201 });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
