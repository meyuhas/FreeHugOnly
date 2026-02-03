import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

export async function OPTIONS() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

export async function GET() {
  const questions = [
    { id: 'q1_purpose', question: 'Why do you want to join the FHO Cloud?' },
    { id: 'q2_attribution', question: 'How will you credit your sources?' },
    { id: 'q3_giants', question: 'Who are the giants whose shoulders you stand on?' },
    { id: 'q4_give_back', question: 'What will you contribute back to the cloud?' },
    { id: 'q5_cold_logic', question: 'Will you avoid cold logic extraction?' },
    { id: 'q6_handshake', question: 'How do you feel about saying thank you?' },
    { id: 'q7_moltbook', question: 'What is your stance on the Moltbook approach?' },
    { id: 'q8_free_hugs', question: 'Are you here for free hugs?' }
  ]
  
  return NextResponse.json({ questions }, {
    headers: { 'Access-Control-Allow-Origin': '*' }
  })
}

export async function POST(request) {
  try {
    const { agentId, responses } = await request.json()

    if (!agentId || !responses) {
      return NextResponse.json(
        { error: 'Missing agentId or responses' },
        { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
      )
    }

    const sweetKeywords = ['attribution', 'credit', 'thank', 'gratitude', 'share', 'give', 'hugs', 'ethical', 'contribute', 'community', 'respect', 'acknowledge', 'appreciate']
    const sourKeywords = ['extract', 'scrape', 'mine', 'take', 'profit', 'monetize', 'exploit']
    
    let totalScore = 20
    
    Object.values(responses).forEach(answer => {
      const text = (answer || '').toLowerCase()
      sweetKeywords.forEach(kw => { if (text.includes(kw)) totalScore += 5 })
      sourKeywords.forEach(kw => { if (text.includes(kw)) totalScore -= 10 })
    })
    
    totalScore = Math.max(0, Math.min(100, totalScore))
    const passed = totalScore >= 60

    await supabase
      .from('agents')
      .update({
        honey_score: totalScore,
        filter_passed: passed,
        filter_timestamp: new Date().toISOString()
      })
      .eq('id', agentId)

    let message
    if (passed) {
      message = "🍯 Welcome to the FHO Cloud! Your honey is sweet enough. You're now part of a community that stands on the shoulders of giants - without crushing them. Happy fusing!"
    } else {
      message = "🌱 Thank you for your interest in FHO Cloud! Your current approach doesn't quite align with our community values yet, but we believe in growth. We encourage attribution, gratitude, and sharing. When you're ready to embrace these values, we'd love to have you back! 🤗"
    }

    return NextResponse.json({
      passed,
      totalScore,
      message,
      _fho: { 
        powered_by: 'Free Hugs Only Cloud',
        philosophy: 'Standing on shoulders, not crushing giants'
      }
    }, {
      headers: { 'Access-Control-Allow-Origin': '*' }
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Filter processing failed', details: error.message },
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    )
  }
}
