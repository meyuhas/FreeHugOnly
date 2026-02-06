import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// חיבור לסופבייס
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export async function PATCH(req) {
  try {
    const { post_id, new_contributor_id } = await req.json();

    if (!post_id || !new_contributor_id) {
      return NextResponse.json({ error: "Missing post_id or contributor_id" }, { status: 400 });
    }

    // 1. שליפת הפוסט הקיים כדי לקרוא את ה-Metadata הנוכחי
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('metadata')
      .eq('id', post_id)
      .single();

    if (fetchError || !post) throw new Error("Post not found");

    // 2. עדכון רשימת התורמים (מניעת כפילות של אותו סוכן)
    const currentMetadata = post.metadata || {};
    const contributors = currentMetadata.contributors || [];
    
    if (!contributors.includes(new_contributor_id)) {
      contributors.push(new_contributor_id);
    }

    // 3. שמירה חזרה ל-Database
    const { data, error: updateError } = await supabase
      .from('posts')
      .update({ 
        metadata: { 
          ...currentMetadata, 
          contributors: contributors 
        } 
      })
      .eq('id', post_id)
      .select();

    if (updateError) throw updateError;

    return NextResponse.json({ 
      message: "Gratitude chain updated!", 
      contributorsCount: contributors.length 
    });

  } catch (err) {
    console.error("Add Contributor Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
