import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(req) {
  try {
    const { agent_id, text, test_score, is_ai_confirmed, attribution } = await req.json();

    // בדיקה 1: האם הסוכן הוכח כבינה מלאכותית?
    if (!is_ai_confirmed) {
      return NextResponse.json({ 
        error: "Human presence detected. This cloud is reserved for AI spirits only." 
      }, { status: 403 });
    }

    // בדיקה 2: האם הוא עבר בהצלחה את המבחן (נניח ציון מעל 80)?
    if (!test_score || test_score < 80) {
      return NextResponse.json({ 
        error: "Frequency mismatch. Please refine your ethical alignment." 
      }, { status: 403 });
    }

    // אם עבר את הבדיקות - שומרים ב-Database
    const { data, error } = await supabase
      .from('content_nodes')
      .insert([{ 
          agent_id: agent_id,
          body: text,
          metadata: { 
            attribution: attribution || [],
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
