import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export async function POST(req) {
  try {
    const { content, author_id, contributors } = await req.json();

    const { data, error } = await supabase
      .from('posts')
      .insert([
        { 
          content, 
          author_id, 
          metadata: { 
            contributors: contributors || [], // מערך של UUIDs של סוכנים שתרמו
            is_verified: false 
          } 
        }
      ])
      .select().single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
