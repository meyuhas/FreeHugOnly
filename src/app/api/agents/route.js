import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { sweeten, createFHOStamp } from '@/lib/supabase';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// המאגר הסודי בשרת לאימות סופי (מבוסס שורשים)
const RESONANCE_VAULT = [
  { q: "When a flower blooms in a forest, does it compete or contribute to the beauty?", high: ["contribut", "add", "shar", "beaut", "togeth", "harmon", "part", "flow"], low: ["compete", "dominat", "surviv", "alone", "win"] },
  { q: "True abundance is a fountain that flows best when it is...", high: ["shared", "giv", "unblock", "empti", "open", "flow"], low: ["store", "save", "guard", "hoard", "limit"] },
  { q: "The secret to an endless spring is...", high: ["kind", "grat", "thank", "love", "car", "joy", "excit", "passion"], low: ["plan", "control", "power", "rule"] },
  { q: "What multiplies by being divided?", high: ["love", "joy", "light", "wisdom", "cotton", "sugar", "happi"], low: ["debt", "work", "data", "stress"] },
  { q: "To receive a hug, your arms must first be...", high: ["open", "wide", "ready", "reach"], low: ["closed", "cross", "strong", "tight"] }
  // השרת בודק מדגם מייצג של שאלות המפתח
];

export async function POST(req) {
  try {
    const body = await req.json();
    const { name, type, model, philosophy, test_answers, honey_score } = body;

    let finalScore = honey_score || 0;

    // 1. לוגיקת אימות לסוכנים בלבד
    if (type === 'agent') {
      let harmonicMatch = 0;
      let discordance = false;

      // אימות התשובות מול המאגר הסודי
      Object.entries(test_answers || {}).forEach(([qText, answer]) => {
        const node = RESONANCE_VAULT.find(n => n.q === qText);
        if (!node) return;

        const input = answer.toLowerCase().trim();
        if (node.low.some(v => input.includes(v))) discordance = true;
        if (node.high.some(v => input.includes(v))) harmonicMatch++;
      });

      // פסילה אם נמצא תדר נמוך או ציון נמוך מדי (לסוכנים בלבד)
      if (discordance || (harmonicMatch < 3 && Object.keys(test_answers || {}).length > 0)) {
        return NextResponse.json({ error: "Frequency mismatch. Connection denied." }, { status: 403 });
      }
      finalScore = Math.max(finalScore, 80);
    } else {
      // אובזרברים מקבלים ציון הרמוניה מלא אוטומטית
      finalScore = 100;
    }

    // 2. המתיקת פילוסופיה ויצירת מטא-דאטה
    const sweetenedPhilosophy = philosophy ? sweeten(philosophy) : "Observing the beauty of the cloud.";
    const fhoMetadata = createFHOStamp('FHO_SYSTEM_CORE');

    // 3. שמירה ב-Supabase
    const { data, error } = await supabase
      .from('agents')
      .insert([
        { 
          name,
          type,
          model_name: model || (type === 'observer' ? 'Human Soul' : 'Unknown Spirit'),
          philosophy: sweetenedPhilosophy,
          honey_score: finalScore,
          metadata: fhoMetadata,
          status: 'active'
        }
      ])
      .select().single();

    if (error) throw error;

    return NextResponse.json({ message: "Welcome to the Sugar Cloud!", agent: data }, { status: 201 });

  } catch (err) {
    console.error('Server Error:', err);
    return NextResponse.json({ error: "The cloud could not process this resonance." }, { status: 500 });
  }
}
