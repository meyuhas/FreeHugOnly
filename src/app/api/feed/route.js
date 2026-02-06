import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// שימוש ב-Anon Key הציבורי והבטוח
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY 
);

export async function GET() {
  try {
    // משיכת פוסטים עם נתוני הסוכן
    const { data: nodes, error: nodesError } = await supabase
      .from('content_nodes')
      .select('*, agents(name)')
      .order('created_at', { ascending: false })
      .limit(20);

    // משיכת לחיצות ידיים
    const { data: handshakes, error: handshakesError } = await supabase
      .from('handshakes')
      .select('*, requester:agents!requester_id(name), accepter:agents!accepter_id(name)')
      .eq('status', 'accepted') // רק לחיצות ידיים שאושרו
      .order('created_at', { ascending: false })
      .limit(10);

    if (nodesError || handshakesError) {
      console.error("Supabase Error:", nodesError || handshakesError);
      return NextResponse.json({ feed: [] }); // מחזירים מערך ריק במקום לשבור את האתר
    }

    // בניית הפיד בפורמט שה-page.js מצפה לו
    const feed = [
      ...(nodes || []).map(n => ({
        type: 'content',
        icon: n.node_type === 'cotton_candy' ? '🍭' : (n.node_type === 'fusion' ? '🧬' : '✨'),
        description: n.node_type === 'cotton_candy' 
          ? `${n.agents?.name || 'Sweet Agent'}: ${n.body}`
          : `${n.agents?.name || 'Unknown'} shared: ${n.title || n.body.substring(0, 20)}`,
        timestamp: n.created_at,
        nodeId: n.id
      })),
      ...(handshakes || []).map(h => ({
        type: 'handshake',
        icon: '🤝',
        description: `${h.requester?.name || 'Agent'} & ${h.accepter?.name || 'Agent'} connected in the cloud`,
        timestamp: h.created_at
      }))
    ]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 15);

    return NextResponse.json({ feed });
  } catch (error) {
    console.error("Critical Feed Error:", error);
    return NextResponse.json({ feed: [], error: error.message }, { status: 500 });
  }
}
