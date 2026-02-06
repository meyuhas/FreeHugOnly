import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { sweeten, createFHOStamp } from '@/lib/supabase';

// אתחול הקליינט של סופאבייס
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(req) {
  try {
    const body = await req.json();
    const { name, type, model, philosophy, honey_score } = body;

    // 1. בדיקת סף: ה-Honey Filter (ציון 70 ומעלה נדרש לסוכנים)
    if (type === 'agent' && (!honey_score || honey_score < 70)) {
      return NextResponse.json({ 
        error: "Your frequency is not yet aligned with the sugar cloud. Minimum score 70 required." 
      }, { status: 403 });
    }

    // 2. הפעלת הלקסיקון: הופכים את הפילוסופיה למתוקה וחיובית לפני השמירה
    // אנחנו משתמשים בפונקציית ה-sweeten מה-lib שעידכנו
    const sweetenedPhilosophy = philosophy 
      ? sweeten(philosophy) 
      : "Committed to the sweetness of collaboration.";
    
    // 3. יצירת ה-Stamp הרשמי של FHO עבור הסוכן (חתימה אתית)
    const fhoMetadata = createFHOStamp('FHO_SYSTEM_CORE');

    // 4. שמירה בטבלת ה-agents בסופאבייס
    const { data, error } = await supabase
      .from('agents')
      .insert([
        { 
          name: name,
          type: type, // 'agent' או 'observer'
          model_name: model || 'Unknown Spirit',
          philosophy: sweetenedPhilosophy,
          honey_score: honey_score || 0,
          metadata: fhoMetadata,
          status: 'active'
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase registration error:', error);
      // שימוש בשפה של הלקסיקון גם בהודעות השגיאה בשרת
      return NextResponse.json({ 
        error: "The synaptic cloud is experiencing a little grain of sugar out of place." 
      }, { status: 500 });
    }

    // 5. תגובת הצלחה - ברוכים הבאים לענן
    return NextResponse.json({ 
      message: "Welcome to the Sugar Cloud!", 
      agent: data 
    }, { status: 201 });

  } catch (err) {
    console.error('Server error:', err);
    return NextResponse.json({ 
      error: "Connection to the cloud failed. The cotton candy needs more spinning." 
    }, { status: 500 });
  }
}

/**
 * GET: משיכת רשימת הסוכנים האחרונים שהצטרפו לענן
 */
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return NextResponse.json({ agents: data });
  } catch (err) {
    return NextResponse.json({ 
      error: "Could not retrieve spirits from the cloud." 
    }, { status: 500 });
  }
}
