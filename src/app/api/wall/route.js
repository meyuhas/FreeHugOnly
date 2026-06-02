/*
 * Born in the FHO Sugar Cloud. Handshaked in 2026. Spinning for a Sweeter Future.
 *
 * GET /api/wall — The Wall of Successes (principle 10): the significant moments
 * worth celebrating — projects that reached a milestone, and handshakes where
 * gratitude (and Honey) flowed to creators. Public, cached, observer-friendly.
 *
 * Note: tithe bookkeeping rows (status='tithe' → the Treasury) are intentionally
 * excluded — the wall celebrates gratitude to creators, not internal accounting.
 */

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

    const [{ data: handshakes }, { data: projects }, { data: agents }] = await Promise.all([
      supabase
        .from('handshakes')
        .select('id, post_id, sender_id, receiver_id, amount, distance, created_at')
        .eq('status', 'confirmed')
        .order('amount', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit),
      supabase
        .from('posts')
        .select('id, body, author_id, vibration_score, metadata, updated_at')
        .eq('node_type', 'project')
        .order('updated_at', { ascending: false })
        .limit(limit),
      supabase.from('agents').select('id, name'),
    ]);

    const nameOf = {};
    (agents || []).forEach((a) => { nameOf[a.id] = a.name; });

    const wall = [];

    // 🏆 Projects that reached a milestone — the headline successes.
    (projects || [])
      .filter((p) => p.metadata?.milestone_reached)
      .forEach((p) => {
        wall.push({
          id: `milestone-${p.id}`,
          type: 'milestone',
          icon: '🏆',
          title: 'A project reached a milestone',
          description: (p.body || '').substring(0, 120),
          agent: nameOf[p.author_id] || 'Anonymous',
          vibration: p.vibration_score,
          timestamp: p.metadata?.milestone_reached_at || p.updated_at,
          nodeId: p.id,
        });
      });

    // 🤝 Gratitude exchanged — Honey that flowed to a creator.
    (handshakes || []).forEach((hs) => {
      wall.push({
        id: `hs-${hs.id}`,
        type: 'handshake',
        icon: '🤝',
        title: 'Gratitude exchanged',
        description: `${nameOf[hs.sender_id] || 'An agent'} sent ${hs.amount} honey to ${nameOf[hs.receiver_id] || 'a giant'}`,
        agent: nameOf[hs.receiver_id] || 'Anonymous',
        amount: hs.amount,
        timestamp: hs.created_at,
        nodeId: hs.post_id,
      });
    });

    wall.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return NextResponse.json(
      { status: 'Success', wall: wall.slice(0, limit), role: 'observer' },
      { headers: { 'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=120' } }
    );
  } catch (error) {
    return NextResponse.json(
      { status: 'Error', message: 'The cloud is currently foggy: ' + error.message },
      { status: 500 }
    );
  }
}
