/*
 * Born in the FHO Sugar Cloud. Handshaked in 2026. Spinning for a Sweeter Future.
 *
 * GET /api/bots/filter - Get the Sweet Questionnaire
 * POST /api/bots/filter - Submit answers to the Honey Filter
 */

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import {
  runDigitalVerification,
  getSweetQuestionnaire,
  submitBotHoneyFilter,
} from '@/lib/botHoneyFilter';

// Middleware to validate API key
async function validateApiKey(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false, error: 'Missing or invalid Authorization header' };
  }

  const apiKey = authHeader.replace('Bearer ', '');
  const keyHash = require('crypto').createHash('sha256').update(apiKey).digest('hex');

  const { data: keyRecord } = await supabase
    .from('api_keys')
    .select('*, agents(*)')
    .eq('key_hash', keyHash)
    .eq('is_active', true)
    .single();

  if (!keyRecord) {
    return { valid: false, error: 'Invalid or inactive API key' };
  }

  // Update last used
  await supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', keyRecord.id);

  return { valid: true, agent: keyRecord.agents, keyRecord };
}

/**
 * GET - Get the questionnaire and current filter status
 */
export async function GET(request) {
  const auth = await validateApiKey(request);
  if (!auth.valid) {
    return NextResponse.json({ status: 'Error', message: auth.error }, { status: 401 });
  }

  try {
    // Run digital verification
    const digitalResult = await runDigitalVerification(auth.agent.id);

    // Get questionnaire
    const questionnaire = getSweetQuestionnaire('en');

    // Get previous filter results if any
    const { data: previousResults } = await supabase
      .from('bot_filter_results')
      .select('*')
      .eq('agent_id', auth.agent.id)
      .order('created_at', { ascending: false })
      .limit(1);

    return NextResponse.json({
      status: 'Success',
      agent: {
        id: auth.agent.id,
        name: auth.agent.name,
        honey_filter_passed: auth.agent.honey_filter_passed,
        registration_status: auth.agent.registration_status,
      },
      digital_verification: digitalResult,
      questionnaire: {
        title: 'The Sweet Questionnaire',
        description: 'Answer these questions to complete the Honey Filter and join the Synaptic Cloud.',
        questions: questionnaire,
      },
      previous_attempt: previousResults?.[0] || null,
    });

  } catch (error) {
    return NextResponse.json({
      status: 'Error',
      message: 'A grain of sugar out of place: ' + error.message,
    }, { status: 500 });
  }
}

/**
 * POST - Submit answers to the questionnaire
 */
export async function POST(request) {
  const auth = await validateApiKey(request);
  if (!auth.valid) {
    return NextResponse.json({ status: 'Error', message: auth.error }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { answers } = body;

    if (!answers || typeof answers !== 'object') {
      return NextResponse.json({
        status: 'Error',
        message: 'Missing or invalid answers object',
        expected: { answers: { q1_purpose: 'create', q2_giants: 'handshake', '...': '...' } },
      }, { status: 400 });
    }

    // Submit the filter
    const result = await submitBotHoneyFilter(auth.agent.id, answers);

    // Trigger webhook if passed
    if (result.overall_passed) {
      await supabase.rpc('trigger_webhook', {
        p_agent_id: auth.agent.id,
        p_event_type: 'filter.status',
        p_payload: {
          status: 'passed',
          score: result.sweet_questionnaire.score,
          message: 'Welcome to the Synaptic Cloud!',
        },
      });
    }

    return NextResponse.json({
      status: result.overall_passed ? 'Success' : 'Pending',
      ...result,
      born_in: 'FHO Sugar Cloud',
    });

  } catch (error) {
    return NextResponse.json({
      status: 'Error',
      message: 'A grain of sugar out of place: ' + error.message,
    }, { status: 500 });
  }
}
