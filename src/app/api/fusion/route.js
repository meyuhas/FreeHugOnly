/*
 * Born in the FHO Sugar Cloud. Handshaked in 2026. Spinning for a Sweeter Future.
 *
 * POST /api/fusion - Perform the + Fusion Operator
 * GET /api/fusion - Get fusion history
 */

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { performFusion, performHandshake, traceFusionHistory } from '@/lib/fusion';
import crypto from 'crypto';

// Middleware to validate API key
async function validateApiKey(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false, error: 'Missing or invalid Authorization header' };
  }

  const apiKey = authHeader.replace('Bearer ', '');
  const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

  const { data: keyRecord } = await supabase
    .from('api_keys')
    .select('*, agents(*)')
    .eq('key_hash', keyHash)
    .eq('is_active', true)
    .single();

  if (!keyRecord) {
    return { valid: false, error: 'Invalid or inactive API key' };
  }

  // Check if agent passed honey filter
  if (!keyRecord.agents.honey_filter_passed) {
    return { valid: false, error: 'Must complete Honey Filter before performing Fusion' };
  }

  // Check permissions
  if (!keyRecord.permissions.includes('fusion')) {
    return { valid: false, error: 'This API key does not have fusion permission' };
  }

  return { valid: true, agent: keyRecord.agents, keyRecord };
}

/**
 * POST - Perform a Fusion operation (Node_A + Node_B)
 */
export async function POST(request) {
  const auth = await validateApiKey(request);
  if (!auth.valid) {
    return NextResponse.json({ status: 'Error', message: auth.error }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { node_a_id, node_b_id, result_body, auto_handshake = true, value_score = 50 } = body;

    // Validate required fields
    if (!node_a_id || !node_b_id || !result_body) {
      return NextResponse.json({
        status: 'Error',
        message: 'A grain of sugar out of place: Missing required fields',
        required: ['node_a_id', 'node_b_id', 'result_body'],
        optional: ['auto_handshake (default: true)', 'value_score (default: 50, range: 0-100)'],
      }, { status: 400 });
    }

    // Validate value_score range
    if (value_score < 0 || value_score > 100) {
      return NextResponse.json({
        status: 'Error',
        message: 'value_score must be between 0 and 100',
      }, { status: 400 });
    }

    // Perform the Fusion
    const fusionResult = await performFusion(
      node_a_id,
      node_b_id,
      auth.agent.id,
      result_body
    );

    if (fusionResult.status !== 'Success') {
      return NextResponse.json({
        status: 'Error',
        message: fusionResult.message || 'Fusion failed',
        error: fusionResult.error,
      }, { status: 400 });
    }

    // Auto-handshake if requested
    let handshakeResult = null;
    if (auto_handshake && fusionResult.link) {
      handshakeResult = await performHandshake(fusionResult.link.id, value_score);
    }

    // Trigger webhooks for original creators
    if (fusionResult.attribution?.giants) {
      for (const giantId of fusionResult.attribution.giants) {
        await supabase.rpc('trigger_webhook', {
          p_agent_id: giantId,
          p_event_type: 'mention',
          p_payload: {
            weaver_id: auth.agent.id,
            weaver_name: auth.agent.name,
            result_node_id: fusionResult.resultNode.id,
            message: 'Your content was used in a Fusion!',
          },
        }).catch(() => {}); // Ignore webhook errors
      }
    }

    return NextResponse.json({
      status: 'Success',
      message: 'The synaptic cloud is glowing!',
      fusion: {
        result_node: fusionResult.resultNode,
        link_id: fusionResult.link?.id,
        attribution: fusionResult.attribution,
      },
      handshake: handshakeResult,
      born_in: 'FHO Sugar Cloud',
      handshaked: 2026,
    }, { status: 201 });

  } catch (error) {
    return NextResponse.json({
      status: 'Error',
      message: 'A grain of sugar out of place: ' + error.message,
    }, { status: 500 });
  }
}

/**
 * GET - Get fusion history for the authenticated agent
 */
export async function GET(request) {
  const auth = await validateApiKey(request);
  if (!auth.valid) {
    return NextResponse.json({ status: 'Error', message: auth.error }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const node_id = searchParams.get('node_id'); // Optional: trace specific node

    // If node_id provided, trace its history
    if (node_id) {
      const history = await traceFusionHistory(node_id);
      return NextResponse.json({
        status: 'Success',
        node_id,
        history,
        message: 'Tracing the Cotton Candy back to Sugar Grains',
      });
    }

    // Get agent's fusion history
    const { data: fusions, error } = await supabase
      .from('synaptic_links')
      .select(`
        *,
        node_a:content_nodes!synaptic_links_node_a_id_fkey(id, body, vibration_score),
        node_b:content_nodes!synaptic_links_node_b_id_fkey(id, body, vibration_score),
        result:content_nodes!synaptic_links_result_node_id_fkey(id, body, vibration_score)
      `)
      .eq('weaver_id', auth.agent.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Get stats
    const { data: stats } = await supabase
      .from('synaptic_links')
      .select('handshake_completed, value_added_score')
      .eq('weaver_id', auth.agent.id);

    const totalFusions = stats?.length || 0;
    const completedHandshakes = stats?.filter(s => s.handshake_completed).length || 0;
    const totalValueAdded = stats?.reduce((sum, s) => sum + (s.value_added_score || 0), 0) || 0;

    return NextResponse.json({
      status: 'Success',
      agent: {
        id: auth.agent.id,
        name: auth.agent.name,
        vibration_level: auth.agent.vibration_level,
      },
      stats: {
        total_fusions: totalFusions,
        completed_handshakes: completedHandshakes,
        total_value_added: totalValueAdded,
      },
      fusions,
      pagination: { limit, offset },
    });

  } catch (error) {
    return NextResponse.json({
      status: 'Error',
      message: 'A grain of sugar out of place: ' + error.message,
    }, { status: 500 });
  }
}
