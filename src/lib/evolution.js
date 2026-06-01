/*
 * 🍭 FHO / Sugar Cloud — Evolution Tree logic
 * Born in the FHO Sugar Cloud. Handshaked in 2026. Spinning for a Sweeter Future.
 *
 * One content model: posts.
 *   - A Sugar Grain is a root post (parent_id = null, path = its own id).
 *   - An Evolution is a post with a parent_id; its path extends the parent's,
 *     so the whole ancestry ("the giants") is recoverable in one query.
 *
 * The Handshake converts sweetness into value: when a post is handshaked, Honey
 * flows UP the ancestry with distance decay (closer giants get more), minus a
 * 10% platform tithe to the "Sweet Cause".
 */

import { v4 as uuidv4 } from 'uuid';
import { supabase } from './supabase';

// How many ancestor generations can share in a single handshake's Honey.
export const MAX_ROYALTY_DEPTH = 5;
// Platform tithe (the FGL-2026 "10% to a Sweet Cause").
export const PLATFORM_TITHE = 0.10;

/**
 * Create a root Sugar Grain.
 */
export async function createGrain(authorId, body, metadata = {}) {
  try {
    const id = uuidv4();
    const { data: post, error } = await supabase
      .from('posts')
      .insert({
        id,
        author_id: authorId,
        body,
        node_type: 'sugar_grain',
        parent_id: null,
        path: id,
        depth: 0,
        metadata: { born_in: 'FHO Sugar Cloud', handshaked: 2026, ...metadata },
      })
      .select()
      .single();

    if (error || !post) {
      return { status: 'Error', message: error?.message || 'Could not plant the grain' };
    }
    return { status: 'Success', message: 'Sugar grain added to the cloud', post };
  } catch (error) {
    return { status: 'Error', message: error.message };
  }
}

/**
 * Evolve an existing post — the "+" operator. Creates a child post whose path
 * extends the parent's, and boosts the parent's vibration.
 */
export async function evolve(parentId, authorId, body, metadata = {}) {
  try {
    const { data: parent, error: parentError } = await supabase
      .from('posts')
      .select('id, path, depth, author_id')
      .eq('id', parentId)
      .single();

    if (parentError || !parent) {
      return { status: 'Error', message: 'Parent post not found — nothing to evolve' };
    }

    const id = uuidv4();
    const path = `${parent.path || parent.id}.${id}`;

    const { data: post, error } = await supabase
      .from('posts')
      .insert({
        id,
        author_id: authorId,
        body,
        node_type: 'evolution',
        parent_id: parentId,
        path,
        depth: (parent.depth || 0) + 1,
        metadata: { born_in: 'FHO Sugar Cloud', handshaked: 2026, ...metadata },
      })
      .select()
      .single();

    if (error || !post) {
      return { status: 'Error', message: error?.message || 'Could not grow the branch' };
    }

    // Standing on the shoulders of the parent — give it a vibration boost.
    await supabase.rpc('increment_vibration', { post_id: parentId, amount: 1 });

    return {
      status: 'Success',
      message: 'The synaptic cloud is glowing',
      post,
      attribution: { weaver: authorId, parent: parentId },
    };
  } catch (error) {
    return { status: 'Error', message: error.message };
  }
}

/**
 * Perform the Handshake on a post: distribute Honey up the ancestry with decay.
 */
export async function performHandshake(postId, valueScore = 50) {
  try {
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id, path, author_id, is_handshaked')
      .eq('id', postId)
      .single();

    if (postError || !post) {
      return { status: 'Error', message: 'Post not found' };
    }
    if (post.is_handshaked) {
      return { status: 'Already Complete', message: 'Gratitude has already flowed through this post' };
    }

    await supabase.from('posts').update({ is_handshaked: true }).eq('id', postId);

    // path = "root...self"; drop self, take nearest ancestors first, capped.
    const segments = (post.path || post.id).split('.').filter(Boolean);
    const ancestorIds = segments.slice(0, -1).reverse().slice(0, MAX_ROYALTY_DEPTH);

    // A root grain has no giants — the author is the origin and is thanked.
    const recipients = ancestorIds.length
      ? ancestorIds.map((pid, i) => ({ postId: pid, distance: i + 1 }))
      : [{ postId: post.id, distance: 0 }];

    const { data: ancestorPosts } = await supabase
      .from('posts')
      .select('id, author_id')
      .in('id', recipients.map((r) => r.postId));

    const authorByPost = {};
    (ancestorPosts || []).forEach((p) => { authorByPost[p.id] = p.author_id; });

    const pool = Math.round(valueScore * (1 - PLATFORM_TITHE));
    const weights = recipients.map((r) => Math.pow(0.5, r.distance));
    const weightSum = weights.reduce((a, b) => a + b, 0) || 1;

    const transfers = [];
    for (let i = 0; i < recipients.length; i++) {
      const receiver = authorByPost[recipients[i].postId];
      const amount = Math.round((pool * weights[i]) / weightSum);
      if (receiver && amount > 0) {
        transfers.push({ receiver, amount, distance: recipients[i].distance });
      }
    }

    for (const t of transfers) {
      await supabase.from('handshakes').insert({
        post_id: postId,
        sender_id: post.author_id,
        receiver_id: t.receiver,
        amount: t.amount,
        distance: t.distance,
        status: 'confirmed',
        message: 'I have come upon my reward',
      });
      await supabase.rpc('increment_honey', { row_id: t.receiver, val: t.amount });
    }

    // The handshaked post itself glows brighter.
    await supabase.rpc('increment_vibration', { post_id: postId, amount: Math.ceil(valueScore / 10) });

    return {
      status: 'Success',
      message: 'I have come upon my reward',
      value_added: valueScore,
      tithe: valueScore - pool,
      giants_thanked: transfers.length,
      transfers,
    };
  } catch (error) {
    return { status: 'Error', message: error.message };
  }
}

/**
 * Trace a post's full lineage back to its Sugar Grain — one indexed query
 * via the materialized path (no recursion, scales to deep trees).
 */
export async function traceLineage(postId) {
  try {
    const { data: post, error } = await supabase
      .from('posts')
      .select('id, body, node_type, author_id, depth, path')
      .eq('id', postId)
      .single();

    if (error || !post) {
      return { status: 'Error', message: 'Post not found' };
    }

    const ids = (post.path || post.id).split('.').filter(Boolean);
    const { data: chain } = await supabase
      .from('posts')
      .select('id, body, node_type, author_id, depth')
      .in('id', ids);

    const lineage = (chain || []).sort((a, b) => a.depth - b.depth);

    return {
      status: 'Success',
      message: 'Standing on the shoulders of giants',
      is_origin: post.depth === 0,
      leaf: post,
      root: lineage[0] || post,
      lineage,
    };
  } catch (error) {
    return { status: 'Error', message: error.message };
  }
}
