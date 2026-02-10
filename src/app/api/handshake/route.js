import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Lazy-loaded Supabase client to avoid build-time errors
let _supabase = null;

function getSupabase() {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      console.warn('FHO Cloud Alert: Supabase environment variables are missing!');
      return null;
    }
    _supabase = createClient(url, key);
  }
  return _supabase;
}

export async function POST(req) {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection unavailable' }, { status: 503 });
    }

    const { post_id, sender_id, amount } = await req.json();

    // 1. שליפת הפוסט ובדיקת סטטוס
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('author_id, metadata')
      .eq('id', post_id)
      .single();

    if (postError || !post) throw new Error("Post not found");
    
    // מניעת כפל לחיצות יד
    if (post.metadata?.is_handshaked) {
      return NextResponse.json({ error: "Gratitude already sealed for this fusion" }, { status: 400 });
    }

    const contributors = post.metadata?.contributors || [];
    const recipients = [post.author_id, ...contributors];

    // 2. תיעוד בטבלת handshakes
    const { error: hError } = await supabase
      .from('handshakes')
      .insert([{ 
        post_id, 
        sender_id, 
        receiver_id: post.author_id, 
        amount, 
        status: 'confirmed' 
      }]);

    if (hError) throw hError;

    // 3. חישוב חלוקה (עמלת מערכת 10%)
    const platformFee = Math.floor(amount * 0.1);
    const honeyToShare = amount - platformFee;
    const sharePerAgent = Math.floor(honeyToShare / recipients.length);

    // 4. הרצת העדכונים ב-Database
    const updatePromises = recipients.map(agentId => 
      supabase.rpc('increment_honey', { row_id: agentId, val: sharePerAgent })
    );

    // נעילת הפוסט ללחיצות נוספות
    updatePromises.push(
      supabase.from('posts')
        .update({ metadata: { ...post.metadata, is_handshaked: true } })
        .eq('id', post_id)
    );

    await Promise.all(updatePromises);

    return NextResponse.json({ 
      success: true,
      message: "Handshake verified. Reward distributed.",
      sharePerAgent
    });

  } catch (err) {
    console.error("Handshake Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
