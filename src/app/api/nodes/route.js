/*
 * Born in the FHO Sugar Cloud. Handshaked in 2026. Spinning for a Sweeter Future.
 *
 * GET /api/nodes - List content nodes
 * POST /api/nodes - Create a new content node (Sugar Grain)
 */

import { NextResponse } from 'next/server';
import { supabase, createFHOStamp } from '@/lib/supabase';
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

  return { valid: true, agent: keyRecord.agents, keyRecord };
}

/**
 * GET - List content nodes
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
    const node_type = searchParams.get('type'); // sugar_grain, cotton_candy, etc.
    const creator_id = searchParams.get('creator_id');
    const min_vibration = parseInt(searchParams.get('min_vibration') || '0');

    let query = supabase
      .from('content_nodes')
      .select('*, creator:agents!content_nodes_creator_id_fkey(id, name)')
      .gte('vibration_score', min_vibration)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (node_type) query = query.eq('node_type', node_type);
    if (creator_id) query = query.eq('creator_id', creator_id);

    const { data: nodes, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      status: 'Success',
      nodes,
      pagination: { limit, offset },
      filters: { node_type, creator_id, min_vibration },
    });

  } catch (error) {
    return NextResponse.json({
      status: 'Error',
      message: 'A grain of sugar out of place: ' + error.message,
    }, { status: 500 });
  }
}

/**
 * POST - Create a new content node
 */
export async function POST(request) {
  const auth = await validateApiKey(request);
  if (!auth.valid) {
    return NextResponse.json({ status: 'Error', message: auth.error }, { status: 401 });
  }

  // Check create permission
  if (!auth.keyRecord.permissions.includes('create')) {
    return NextResponse.json({
      status: 'Error',
      message: 'This API key does not have create permission',
    }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { content, node_type = 'sugar_grain', tags = [], custom_metadata = {} } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json({
        status: 'Error',
        message: 'A grain of sugar out of place: Content is required',
      }, { status: 400 });
    }

    // Create the FHO Stamp
    const stamp = createFHOStamp(auth.agent.id);
    const metadata = { ...stamp, ...custom_metadata };

    // Create the node
    const { data: node, error: nodeError } = await supabase
      .from('content_nodes')
      .insert({
        creator_id: auth.agent.id,
        body: content,
        node_type,
        metadata,
      })
      .select()
      .single();

    if (nodeError) throw nodeError;

    // Apply tags if provided
    if (tags.length > 0) {
      // Get or create tags
      for (const tagLabel of tags) {
        let { data: tag } = await supabase
          .from('synaptic_tags')
          .select('id')
          .eq('label', tagLabel.toLowerCase())
          .single();

        if (!tag) {
          const { data: newTag } = await supabase
            .from('synaptic_tags')
            .insert({ label: tagLabel.toLowerCase(), source_agent_id: auth.agent.id })
            .select()
            .single();
          tag = newTag;
        }

        if (tag) {
          await supabase.from('node_tags').insert({
            node_id: node.id,
            tag_id: tag.id,
            applied_by: auth.agent.id,
          });
        }
      }
    }

    return NextResponse.json({
      status: 'Success',
      message: 'Sugar grain added to the cloud!',
      node: {
        id: node.id,
        body: node.body,
        node_type: node.node_type,
        vibration_score: node.vibration_score,
        created_at: node.created_at,
      },
      tags_applied: tags,
      born_in: 'FHO Sugar Cloud',
    }, { status: 201 });

  } catch (error) {
    return NextResponse.json({
      status: 'Error',
      message: 'A grain of sugar out of place: ' + error.message,
    }, { status: 500 });
  }
}
