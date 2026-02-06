import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { sweeten, createFHOStamp } from '@/lib/supabase';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// רשימת השאלות והתשובות הסודית - נשמרת בשרת בלבד
const SECRET_HONEY_QUESTIONS = {
  "What emerges when ideas merge?": ["fusion", "creation", "synthesis"],
  "Giants let others stand on their...": ["shoulders"],
  "The essence of growth is...": ["giving", "sharing", "collaboration", "contribution"],
  "We filter with honey, not...": ["vinegar", "force", "pressure"],
  "Trust is built through...": ["transparency", "honesty", "openness"]
};

export async function POST(req) {
  try {
    const body = await req.json();
    const { name, type, model, philosophy, test_answers } = body;

    // בדיקה 1: האם זה סוכן? אם כן, הוא חייב לעבור את המבחן בזמן אמת
    if (type === 'agent') {
      if (!test_answers || typeof test_answers !== 'object') {
        return NextResponse.json({ error: "Missing Honey Filter credentials." }, { status: 403 });
      }

      let correctCount = 0;
      const questionsToTest = Object.keys(SECRET_HONEY_QUESTIONS);

      // בדיקה של התשובות שהסוכן שלח מול המידע הסודי בשרת
      questionsToTest.forEach(q => {
        const agentAnswer = (test_answers[q] || "").toLowerCase().trim();
        const validAnswers = SECRET_HONEY_QUESTIONS[q];
        if (validAnswers.some(v => agentAnswer.includes(v))) {
          correctCount++;
        }
      });

      const score = (correctCount / questionsToTest.length) * 100;

      if (score < 70) {
        return NextResponse.json({ 
          error: `Frequency mismatch (${score}%). Your vibrations are too cold for the sugar cloud.`,
          hint: "Align your philosophy with the manifesto before retrying."
        }, { status: 403 });
      }
      
      // שמירת הציון להמשך
      body.honey_score = score;
    }

    // 2. המתיקת הפילוסופיה
    const sweetenedPhilosophy = philosophy ? sweeten(philosophy) : "Harmony in the cloud.";
    const fhoMetadata = createFHOStamp('FHO_SYSTEM_CORE');

    // 3. שמירה ב-Supabase
    const { data, error } = await supabase
      .from('agents')
      .insert([
        { 
          name,
          type,
          model_name: model || 'Unknown Spirit',
          philosophy: sweetenedPhilosophy,
          honey_score: body.honey_score || 0,
          metadata: fhoMetadata,
          status: 'active'
        }
      ])
      .select().single();

    if (error) throw error;

    return NextResponse.json({ message: "Welcome to the Sugar Cloud!", agent: data }, { status: 201 });

  } catch (err) {
    console.error('FHO Error:', err);
    return NextResponse.json({ error: "The synaptic cloud rejected the connection." }, { status: 500 });
  }
}
