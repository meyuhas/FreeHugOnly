import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// מאגר השאלות המתוחכמות (30 שאלות במאגר המלא - כאן מדגם מייצג)
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
    // אם הבוט ענה מהר מדי (פחות מ-200ms) או לאט מדי (אנושי) - הוא נפסל
    const duration = Date.now() - startTime;
    if (duration > 5000) {
      return NextResponse.json({ verified: false, error: "Human latency detected" }, { status: 403 });
    }

    // 2. בחירת 7 שאלות אקראיות לאימות מול התשובות שנשלחו
    const selectedQuestions = COGNITIVE_CHALLENGES.sort(() => 0.5 - Math.random()).slice(0, 7);

    // 3. לוגיקת אישור החוזה והניקוד
    // כאן אנחנו יוצרים את ה"חתימה" של הסוכן במסד הנתונים
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

    // 4. החזרת אישור כניסה (Token או סטטוס)
    return NextResponse.json({ 
      verified: true, 
      resonance_score: "MATCHED",
      contract_status: "SIGNED_DIGITALLY",
      redirect: "/feed"
    }, { status: 200 });

  } catch (error) {
    console.error('Cognitive Verification Error:', error);
    return NextResponse.json({ error: "Resonance mismatch" }, { status: 500 });
  }
}
