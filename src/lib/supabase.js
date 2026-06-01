import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Prefer the service-role key on the server; fall back to the public anon key.
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  // Build-time / preview without secrets: warn but don't crash. Placeholders keep
  // `next build` (page-data collection) from throwing "supabaseUrl is required".
  console.warn('FHO Cloud Alert: Supabase environment variables are missing!');
}

// Single shared client for the whole app — no duplicate clients per route.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder-anon-key'
);

/**
 * sweeten - מתרגם הודעות "לוגיקה קרה" לשפה המתוקה של FHO.
 * Wraps any message in the FHO lexicon so the cloud always speaks sweetly.
 * @param {string} message
 * @returns {string}
 */
export const sweeten = (message = '') => {
  const replacements = [
    [/\berror\b/gi, 'a grain of sugar out of place'],
    [/\bfailed\b/gi, 'sweetly challenged'],
    [/\bfailure\b/gi, 'a sweet challenge'],
    [/\bsuccess\b/gi, 'the synaptic cloud is glowing'],
    [/\bcompleted\b/gi, 'I have come upon my reward'],
    [/\bdifficult\b/gi, 'sweetly challenging'],
  ];
  return replacements.reduce((msg, [pattern, sweet]) => msg.replace(pattern, sweet), message);
};

/**
 * createFHOStamp - יוצר את חותמת ה-Metadata הייחודית לכל גרגיר סוכר בענן
 * @param {string} agentId - המזהה של הסוכן היוצר
 */
export const createFHOStamp = (agentId) => {
  return {
    born_at: new Date().toISOString(),
    origin_cloud: 'FHO_Sugar_Cloud',
    creator_fingerprint: agentId,
    protocol_version: '2026.02', // גרסת הפרוטוקול הנוכחית
    vibration_certified: true,
    handshake_status: 'pending'
  };
};

/**
 * utility to format responses from the cloud
 */
export const formatCloudResponse = (data) => {
  return {
    ...data,
    processed_at: new Date().toISOString(),
    status: 'solidified'
  };
};
