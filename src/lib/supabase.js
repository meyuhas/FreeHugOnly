import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn("FHO Cloud Alert: Supabase environment variables are missing!");
}

// יצירת הלקוח של Supabase
export const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
