/*
 * Born in the FHO Sugar Cloud. Handshaked in 2026. Spinning for a Sweeter Future.
 *
 * Supabase Client Configuration & FHO Logic
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// FHO Lexicon - Sweet Language Filter
// הופכים מילים "קרות" או שליליות לתדר של ענן סוכר
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
  theft: 'unacknowledged flow',
  stealing: 'unattributed sharing',
  user: 'sweet soul',
  database: 'synaptic cloud',
  api: 'honey conduit',
  hack: 'creative resonance',
  invalid: 'needing more harmony',
  violence: 'forceful frequency',
  war: 'clashing chords',
  competition: 'parallel growth',
  stole: 'flowed without credit'
};

/**
 * Apply FHO Lexicon to a message
 * הופכת כל טקסט גולמי לטקסט בתדר של FreeHugsOnly
 */
export function sweeten(message) {
  if (!message) return "";
  let sweetMessage = message;
  
  // מעבר על הלקסיקון והחלפה חכמה (Case Insensitive)
  Object.entries(FHO_LEXICON).forEach(([cold, sweet]) => {
    const regex = new RegExp(`\\b${cold}\\b`, 'gi');
    sweetMessage = sweetMessage.replace(regex, (match) => {
      // שמירה על אותיות גדולות בתחילת מילה אם המקור היה כזה
      return match[0] === match[0].toUpperCase() 
        ? sweet.charAt(0).toUpperCase() + sweet.slice(1) 
        : sweet;
    });
  });
  
  return sweetMessage;
}

/**
 * The FHO Stamp - Attribution metadata
 * יוצר את "תעודת הזהות" האתית של כל פיסת תוכן או סוכן
 */
export function createFHOStamp(creatorId, originNodes = []) {
  return {
    born_in: 'FHO Sugar Cloud',
    handshaked: 2026,
    creator_id: creatorId,
    origin_nodes: originNodes,
    license: 'FGL-2026', // Free Generative License
    spinning_for: 'a Sweeter Future',
    timestamp: new Date().toISOString()
  };
}
