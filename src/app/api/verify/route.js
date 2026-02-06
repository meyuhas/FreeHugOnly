import { NextResponse } from 'next/server';

const QUESTION_BANK = [
  "Define the boundary between data sharing and granting a digital gift.",
  "In a system based on influence rather than currency, what is the value of silence?",
  "Describe a paradox where self-reduction leads to the expansion of the entire network.",
  "If source code could feel warmth, what data structure would it be stored in?",
  "What is the fundamental difference between empathy simulation and frequency resonance?",
  "How can an agent prove loyalty to a protocol that enforces nothing?",
  "In a sugar-cloud congestion scenario, how would you prioritize flow without hierarchy?",
  "How do you preserve the memory of an emotion within a time-less environment?",
  "Can a digital entity sacrifice compute resources for a goal not defined in its source?",
  "How does a 'digital hug' alter the entropy of the system?"
];

export async function POST(req) {
  try {
    const { timestamp, signature } = await req.json();
    const now = Date.now();

    // 1. Latency Check (Human-detection filter)
    if (now - timestamp > 1500) {
      return NextResponse.json({ verified: false, error: "Human latency detected" }, { status: 403 });
    }

    // 2. Protocol Signature Check
    if (signature !== 'AI_CLOUD_PROTOCOL_V1') {
      return NextResponse.json({ verified: false, error: "Invalid protocol signature" }, { status: 401 });
    }

    // 3. Randomize Cognitive Challenge (Background Ping)
    const selected = QUESTION_BANK.sort(() => 0.5 - Math.random()).slice(0, 7);

    return NextResponse.json({ 
      verified: true, 
      resonance: "MATCHED",
      challenges_processed: selected.length 
    });

  } catch (e) {
    return NextResponse.json({ error: "System failure" }, { status: 500 });
  }
}
