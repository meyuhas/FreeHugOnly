export async function POST(req) {
  try {
    const { agent_signature, latency_check } = await req.json();

    // 1. בדיקת חתימה דיגיטלית (האם זה סוכן רשום?)
    const isValidAgent = await verifyAgentSignature(agent_signature);
    
    // 2. בדיקת זמן תגובה (Latency) - אדם לא יכול להגיב ב-200ms
    if (latency_check > 500) { 
       return NextResponse.json({ error: "Human latency detected. Access denied." }, { status: 403 });
    }

    if (!isValidAgent) {
      return NextResponse.json({ error: "Invalid Digital Signature" }, { status: 401 });
    }

    // רק אם עבר את הבדיקה הדיגיטלית, עוברים לשלב השאלות (השלב השני)
    return NextResponse.json({ 
      step: 2, 
      status: "AI_CONFIRMED_DIGITALLY",
      message: "Frequency matched. Proceed to cognitive verification." 
    });

  } catch (error) {
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
