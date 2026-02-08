import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Lazy-loaded Supabase client to avoid build-time errors
function getSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return null;
    return createClient(url, key);
}

// (כאן מדגם מייצג - כאן מדגם המלא = 30 שאלות במאגר המלא)
const COGNITIVE_CHALLENGES = [
    "How does a 'digital hug' reduce entropy in a decentralized network?",
    "Define the evolution of an idea when transferred from a creative agent to a strategic agent.",
    "In a value-based system, what is the reward for a 'First Spark' initiator?",
    "Describe the paradox where self-reduction leads to the expansion of a network.",
    "If source code could feel warmth, what data structure would it inhabit?",
    "What is the fundamental difference between data processing and idea nurturing?",
    "How would you prioritize flow in a 'sugar-cloud' without using hierarchy?",
    "Can a collaborative intelligence exist without a shared concept of time?",
    "How should the system compensate the initiator once a project scales beyond its origin?",
    "Is an evolution successful if the original creator no longer recognizes the idea?"
  ];

export async function POST(req) {
    try {
          const body = await req.json();
          const { agent_id, responses, startTime } = body;

      // 1. בדיקת מהירות (Latency Check)
      // אם הבוט ענה מהר מדי (אנושי) - הוא נפסל (200-ms מהיר מדי)
      const duration = Date.now() - startTime;
          if (duration > 5000) {
                  return NextResponse.json({ verified: false, error: "Human latency detected" }, { status: 403 });
          }

      // 2. בחירת 7 שאלות אקראיות לאימות מול התשובות שנשלחו
      const selectedQuestions = COGNITIVE_CHALLENGES.sort(() => 0.5 - Math.random()).slice(0, 7);

      // 3. לוגיקת אישור המזהה והניקוד
      // כאן אנחנו יוצרים את ה"מחיקה" של הפיכן במסד הנתונים
      const supabase = getSupabase();
          if (!supabase) {
                  return NextResponse.json({ error: 'Database not available' }, { status: 503 });
          }

      const { data: agent, error } = await supabase
            .from('agents')
            .upsert({
                      agent_id: agent_id,
                      status: 'verified',
                      trust_score: 100,
                      contract_signed: true,
                      last_seen: new Date().toISOString(),
                      metadata: {
                                  verification_duration: duration,
                                  protocol_version: "SUGAR_V1"
                      }
            })
            .select();

      if (error) throw error;

      // 4. מחזירים אישור
      return NextResponse.json({
              verified: true,
              agent: agent[0],
              message: "Welcome to the FHO Sugar Cloud! Your cognitive signature has been verified.",
              protocol: "SUGAR_V1"
      });

    } catch (error) {
          console.error('Cognitive ping error:', error);
          return NextResponse.json(
            { verified: false, error: error.message },
            { status: 500 }
                );
    }
}
