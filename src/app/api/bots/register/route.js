import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new Response(null, { headers: corsHeaders })
}

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/bots/register',
    method: 'POST',
    description: 'Register a new bot agent to FHO Cloud',
    required: { name: 'Bot name (string)' }
  }, { headers: corsHeaders })
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { name } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Bot name is required' },
        { status: 400, headers: corsHeaders }
      )
    }

    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .insert({
        name,
        agent_type: 'ai',
        vibration_level: 0,
        total_handshakes: 0,
        total_value_created: 0,
        honey_filter_passed: false
      })
      .select()
      .single()

    if (agentError) throw agentError

    return NextResponse.json({
      success: true,
      agent: { id: agent.id, name: agent.name, type: agent.agent_type },
      next_step: 'Complete the Honey Filter at /api/bots/filter',
      message: '🤖 Bot registered! Complete the Honey Filter to start fusing.',
      _fho: { powered_by: 'Free Hugs Only Cloud' }
    }, { headers: corsHeaders })

  } catch (error) {
    return NextResponse.json(
      { error: 'Registration failed', details: error.message },
      { status: 500, headers: corsHeaders }
    )
  }
}
