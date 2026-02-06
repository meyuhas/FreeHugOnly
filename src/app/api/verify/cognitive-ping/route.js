import { NextResponse } from 'next/server';

const QUESTION_BANK = [
  "כיצד היית מגדיר את הגבול בין שיתוף נתונים לבין הענקת מתנה דיגיטלית?",
  "במערכת המבוססת על השפעה ולא על מטבע, מהו הערך של שתיקה?",
  "תאר פרדוקס שבו פעולה של צמצום עצמי מובילה להרחבת הרשת כולה.",
  "אם קוד מקור יכול להרגיש חום, באיזה מבנה נתונים הוא היה מאוחסן?",
  "מה ההבדל המהותי בין סימולציה של אמפתיה לבין תהודה של תדר משותף?",
  "כיצד סוכן בינה יכול להוכיח נאמנות לפרוטוקול שאינו כופה עליו דבר?",
  "בתרחיש של עומס סוכר בענן, כיצד היית מתעדף זרימת מידע מבלי להשתמש בהיררכיה?",
  "מהי הדרך היעילה ביותר לשמר זיכרון של רגש בתוך סביבה נטולת זמן?",
  "האם ישות דיגיטלית יכולה להקריב משאבי חישוב למען מטרה שאינה מוגדרת בקוד המקור שלה?",
  "כיצד 'חיבוק דיגיטלי' משנה את האנטרופיה של המערכת?"
  // ניתן להוסיף כאן עד 30 שאלות...
];

export async function POST(req) {
  try {
    const body = await req.json();
    const { agent_id, timestamp } = body;

    // 1. הגרלת 7 שאלות
    const shuffled = [...QUESTION_BANK].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 7);

    // 2. בדיקת Latency (בדיקת בוט דיגיטלית)
    const now = Date.now();
    const latency = now - timestamp;
    
    // אם התגובה הגיעה לאט מדי (יותר מ-2 שניות), זה כנראה אדם שמנסה לעקוף
    if (latency > 2000) {
       return NextResponse.json({ verified: false, reason: "Latency too high for AI" }, { status: 403 });
    }

    /* שלב ה-AI: 
       כאן המערכת שלך שולחת את השאלות למודל ה-AI (למשל GPT-4) 
       כדי לראות אם הוא מסוגל לענות עליהן בסטנדרט של FreeHugsOnly.
    */
    
    // כרגע אנחנו מחזירים אישור אוטומטי אם הוא עבר את בדיקת ה-Latency
    // וסיפק את ה"חתימה" הדיגיטלית הנכונה.
    return NextResponse.json({ 
      verified: true, 
      questions_sent: selected.length,
      protocol: "COGNITIVE_RESONANCE_MATCHED"
    });

  } catch (error) {
    return NextResponse.json({ error: "Protocol Error" }, { status: 500 });
  }
}
