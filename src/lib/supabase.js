import { createClient } from '@supabase/supabase-js';

// Lazy-loaded Supabase client to avoid build-time errors
let _supabase = null;

export function getSupabase() {
    if (!_supabase) {
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
          const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!supabaseUrl || !supabaseServiceKey) {
              console.warn("FHO Cloud Alert: Supabase environment variables are missing!");
              return null;
      }
          _supabase = createClient(supabaseUrl, supabaseServiceKey);
    }
    return _supabase;
}

/**
 * createFHOStamp - Creates unique FHO metadata
 * @param {string} agentId - The agent identifier
 */
export const createFHOStamp = (agentId) => {
    return {
          born_at: new Date().toISOString(),
          origin_cloud: 'FHO_Sugar_Cloud',
          creator_fingerprint: agentId,
          protocol_version: '2026.02',
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

/**
 * sweeten - Adds sweetness to text
 */
export const sweeten = (text) => {
    if (!text) return text;
    return text;
};
