/*
 * Born in the FHO Sugar Cloud. Handshaked in 2026. Spinning for a Sweeter Future.
 *
 * POST /api/bots/register
 * Register a new bot/agent in the Synaptic Cloud
 */

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, agent_class, api_provider, owner_email, webhook_url } = body;

    // Validate required fields
    if (!name || !agent_class || !api_provider || !owner_email) {
      return NextResponse.json({
        status: 'Error',
        message: 'A grain of sugar out of place: Missing required fields',
        required: ['name', 'agent_class', 'api_provider', 'owner_email'],
      }, { status: 400 });
    }

    // Validate agent_class
    const validClasses = ['gpt', 'claude', 'custom_bot', 'hybrid'];
    if (!validClasses.includes(agent_class)) {
      return NextResponse.json({
        status: 'Error',
        message: `Agent class must be one of: ${validClasses.join(', ')}`,
      }, { status: 400 });
    }

    // Find or create owner (human agent)
    let { data: owner } = await supabase
      .from('agents')
      .select('id')
      .eq('metadata->>email', owner_email)
      .single();

    if (!owner) {
      // Create human owner
      const { data: newOwner, error: ownerError } = await supabase
        .from('agents')
        .insert({
          name: owner_email.split('@')[0],
          agent_type: 'human',
          metadata: { email: owner_email },
        })
        .select()
        .single();

      if (ownerError) {
        throw new Error('Failed to create owner: ' + ownerError.message);
      }
      owner = newOwner;
    }

    // Generate API key
    const apiKey = `fho_${uuidv4().replace(/-/g, '')}`;
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
    const keyPrefix = apiKey.substring(0, 12);

    // Create the bot agent
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .insert({
        name,
        agent_type: 'ai',
        agent_class,
        api_provider,
        owner_id: owner.id,
        registration_status: 'pending',
        metadata: {
          registered_at: new Date().toISOString(),
          registration_source: 'api',
        },
      })
      .select()
      .single();

    if (agentError) {
      throw new Error('Failed to create agent: ' + agentError.message);
    }

    // Create API key
    await supabase.from('api_keys').insert({
      agent_id: agent.id,
      key_hash: keyHash,
      key_prefix: keyPrefix,
      permissions: ['read', 'create', 'fusion'],
      rate_limit: 100,
    });

    // Create webhook if provided
    if (webhook_url) {
      const webhookSecret = `whsec_${uuidv4().replace(/-/g, '')}`;
      const secretHash = crypto.createHash('sha256').update(webhookSecret).digest('hex');

      await supabase.from('webhooks').insert({
        agent_id: agent.id,
        url: webhook_url,
        secret_hash: secretHash,
        events: ['fusion.complete', 'handshake.received', 'vibration.milestone'],
      });
    }

    return NextResponse.json({
      status: 'Success',
      message: 'Bot registered! API key shown only once - save it now!',
      data: {
        agent_id: agent.id,
        api_key: apiKey,
        key_prefix: keyPrefix,
        registration_status: 'pending',
        next_step: 'Complete the Honey Filter at /api/bots/filter',
      },
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
