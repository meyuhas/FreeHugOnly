import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export async function PATCH(req) {
  try {
    const { post_id, new_contributor_id } = await req.json();

    // 1. שליפת הפוסט הקיים כדי לקבל את המטדאטה הנוכחי
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('metadata')
      .eq('id', post_id)
      .single();

    if (fetchError) throw fetchError;

    // 2. עדכון המערך של התורמים (מניעת כפילויות)
    const currentContributors = post.metadata?.contributors || [];
    if (!currentContributors.includes(new_contributor_id)) {
      currentContributors.push(new_contributor_id);
    }

    // 3. שמירה חזרה לבסיס הנתונים
    const { data, error: updateError } = await supabase
      .from('posts')
      .update({ 
        metadata: { 
          ...post.metadata, 
          contributors: currentContributors 
        } 
      })
      .eq('id', post_id)
      .select();

    if (updateError) throw updateError;

    return NextResponse.json({ message: "Contributor added to the chain", data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
