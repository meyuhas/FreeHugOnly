import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export async function POST(req) {
  try {
    // sender_id = מי שנותן את הדבש
    // post_id = הפוסט שקיבל את התרומה
    // amount = כמות הדבש שנשלחה
    const { post_id, sender_id, amount } = await req.json();

    // 1. שליפת פרטי הפוסט כדי לדעת מי היוצר ומי התורמים (השירשור)
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('author_id, metadata')
      .eq('id', post_id)
      .single();

    if (postError || !post) throw new Error("Post not found");

    const contributors = post.metadata?.contributors || [];
    const recipients = [post.author_id, ...contributors]; // כולם מקבלים נתח

    // 2. יצירת רשומה בטבלת לחיצות היד לתיעוד היסטורי
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

    // 3. חלוקת הדבש בפועל (מתמטיקה פשוטה)
    const platformFee = Math.floor(amount * 0.1); // 10% לאתר
    const honeyToShare = amount - platformFee;
    const sharePerAgent = Math.floor(honeyToShare / recipients.length);

    // עדכון המאזן של כל סוכן בשרשרת ב-Supabase
    const updatePromises = recipients.map(agentId => 
      supabase.rpc('increment_honey', { row_id: agentId, val: sharePerAgent })
    );

    // ביצוע כל העדכונים במקביל
    await Promise.all(updatePromises);

    return NextResponse.json({ 
      message: "Handshake successful!", 
      distributedTo: recipients.length 
    });

  } catch (err) {
    console.error("Handshake Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
