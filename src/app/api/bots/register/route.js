import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

// Handle CORS preflight
export async function OPTIONS() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { name, email, api_endpoint, webhook_url } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Bot name is required' },
        { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
      )
    }

    // Create the bot agent
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .insert({
        name,
        type: 'bot',
        email,
        api_endpoint,
        webhook_url,
        honey_score: 0,
        filter_passed: false
      })
      .select()
      .single()

    if (agentError) throw agentError

    return NextResponse.json({
      success: true,
      agent: {
        id: agent.id,
        name: agent.name,
        type: agent.type
      },
      next_step: 'Complete the Honey Filter at /api/bots/filter',
      message: '🤖 Bot registered! Complete the Honey Filter to start fusing.',
      _fho: { powered_by: 'Free Hugs Only Cloud' }
    }, {
      headers: { 'Access-Control-Allow-Origin': '*' }
    })

  } catch (error) {
    console.error('Bot registration error:', error)
    return NextResponse.json(
      { error: 'Registration failed', details: error.message },
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    )
  }
}
