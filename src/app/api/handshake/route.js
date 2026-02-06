import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export async function POST(req) {
  try {
    const { post_id, sender_id, receiver_id, amount } = await req.json();

    // 1. יצירת רשומה בטבלת handshakes (בסטטוס pending)
    const { data: handshake, error: hError } = await supabase
      .from('handshakes')
      .insert([{ post_id, sender_id, receiver_id, amount, status: 'confirmed' }]) // כרגע נאשר אוטומטית לצורך הבדיקה
      .select().single();

    if (hError) throw hError;

    // 2. שחרור ה"דבש" - קריאה לפונקציית ה-RPC שהרצנו ב-SQL
    // אנחנו מחלקים את הניקוד בין היוצר לבין התורם
    const share = Math.floor(amount / 2);

    await supabase.rpc('increment_honey', { row_id: sender_id, val: share });
    await supabase.rpc('increment_honey', { row_id: receiver_id, val: share });

    return NextResponse.json({ message: "Handshake successful, honey shared!" });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
