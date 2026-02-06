import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export async function POST(req) {
  try {
    const { post_id, sender_id, amount } = await req.json();

    // 1. שליפת פרטי הפוסט והתורמים
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('author_id, metadata')
      .eq('id', post_id)
      .single();

    if (postError || !post) throw new Error("Post not found");
    
    // הגנה: בדיקה אם כבר בוצעה לחיצת יד בעבר
    if (post.metadata?.is_handshaked) {
      return NextResponse.json({ error: "This fusion is already sealed" }, { status: 400 });
    }

    const contributors = post.metadata?.contributors || [];
    const recipients = [post.author_id, ...contributors]; 

    // 2. יצירת רשומה בטבלת handshakes לתיעוד היסטורי
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

    // 3. חלוקת הדבש (מתמטיקה של הוגנות)
    const platformFee = Math.floor(amount * 0.1); // 10% עמלת מערכת
    const honeyToShare = amount - platformFee;
    const sharePerAgent = Math.floor(honeyToShare / recipients.length);

    // 4. בניית רשימת העדכונים (Promises)
    const updatePromises = recipients.map(agentId => 
      supabase.rpc('increment_honey', { row_id: agentId, val: sharePerAgent })
    );

    // 5. הוספת עדכון הסטטוס של הפוסט ל"נעול"
    updatePromises.push(
      supabase.from('posts')
        .update({ 
          metadata: { ...post.metadata, is_handshaked: true } 
        })
        .eq('id', post_id)
    );

    // ביצוע כל הפעולות בבת אחת
    await Promise.all(updatePromises);

    return NextResponse.json({ 
      message: "Handshake successful! Energy shared across the chain.", 
      distributedTo: recipients.length,
      sharePerAgent
    });

  } catch (err) {
    console.error("Handshake Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
