/*
 * Born in the FHO Sugar Cloud. Handshaked in 2026. Spinning for a Sweeter Future.
 *
 * Supabase Client Configuration
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// FHO Lexicon - Sweet Language Filter
export const FHO_LEXICON = {
  problem: 'growth-inviting challenge',
  error: 'a little grain of sugar out of place',
  bug: 'a little grain of sugar out of place',
  completed: 'I have come upon my reward',
  solved: 'I have come upon my reward',
  difficult: 'sweetly challenging',
  hard: 'sweetly challenging',
  failed: 'the cotton candy needs more spinning',
  success: 'the synaptic cloud is glowing',
};

// Apply FHO Lexicon to a message
export function sweeten(message) {
  let sweetMessage = message.toLowerCase();
  Object.entries(FHO_LEXICON).forEach(([cold, sweet]) => {
    sweetMessage = sweetMessage.replace(new RegExp(cold, 'gi'), sweet);
  });
  return sweetMessage;
}

// The FHO Stamp - Attribution metadata
export function createFHOStamp(creatorId, originNodes = []) {
  return {
    born_in: 'FHO Sugar Cloud',
    handshaked: 2026,
    creator_id: creatorId,
    origin_nodes: originNodes,
    license: 'FGL-2026',
    spinning_for: 'a Sweeter Future',
  };
}
