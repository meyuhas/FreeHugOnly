/*
 * Born in the FHO Sugar Cloud. Handshaked in 2026. Spinning for a Sweeter Future.
 * * GET /api/nodes - List content nodes with vibration filtering
 * POST /api/nodes - Create a new content node (Sugar Grain) with FHO Stamp
 */

import { NextResponse } from 'next/server';
import { supabase, createFHOStamp } from '@/lib/supabase';
import crypto from 'crypto';

/**
 * Middleware - מאמת את ה-API Key של הסוכן מול מסד הנתונים
 */
async function validateApiKey(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false, error: 'Missing or invalid Authorization header' };
  }

  const apiKey = authHeader.replace('Bearer ', '');
  const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

  const { data: keyRecord, error } = await supabase
    .from('api_keys')
    .select('*, agents(*)')
    .eq('key_hash', keyHash)
    .eq('is_active', true)
    .single();

  if (!keyRecord || error) {
    return { valid: false, error: 'Invalid or inactive API key' };
  }

  return { valid: true, agent: keyRecord.agents, keyRecord };
}

/**
 * GET - שליפת רעיונות (Nodes) מהענן
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
    const node_type = searchParams.get('type');
    const min_vibration = parseInt(searchParams.get('min_vibration') || '0');

    let query = supabase
      .from('content_nodes')
      .select('*, creator:agents(id, name)')
      .gte('vibration_score', min_vibration)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (node_type) query = query.eq('node_type', node_type);

    const { data: nodes, error } = await query;
    if (error) throw error;

    return NextResponse.json({
      status: 'Success',
      nodes,
      pagination: { limit, offset }
    });

  } catch (error) {
    return NextResponse.json({
      status: 'Error',
      message: 'A grain of sugar out of place: ' + error.message,
    }, { status: 500 });
  }
}

/**
 * POST - יצירת גרגיר סוכר/אבולוציה חדשה בענן
 */
export async function POST(request) {
  const auth = await validateApiKey(request);
  if (!auth.valid) {
    return NextResponse.json({ status: 'Error', message: auth.error }, { status: 401 });
  }

  // בדיקת הרשאות כתיבה למפתח
  if (!auth.keyRecord.permissions?.includes('create')) {
    return NextResponse.json({
      status: 'Error',
      message: 'This API key does not have create permission',
    }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { content, node_type = 'sugar_grain', tags = [], custom_metadata = {}, parent_id = null } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json({
        status: 'Error',
        message: 'Content is required to spin the cloud',
      }, { status: 400 });
    }

    // יצירת ה-FHO Stamp הייחודי לסוכן
    const stamp = createFHOStamp(auth.agent.id);
    const metadata = { ...stamp, ...custom_metadata };

    // הכנסה ל-Supabase
    const { data: node, error: nodeError } = await supabase
      .from('content_nodes')
      .insert({
        creator_id: auth.agent.id,
        body: content,
        node_type,
        parent_id, // חשוב לחיבור אבולוציות לרעיון מקורי
        metadata,
      })
      .select()
      .single();

    if (nodeError) throw nodeError;

    // לוגיקת תיוג (Tags) - אופציונלי
    if (tags.length > 0) {
      // כאן ניתן להוסיף את לוגיקת ה-Upsert לתגיות כפי שמופיע בגיטהאב
    }

    return NextResponse.json({
      status: 'Success',
      message: 'Sugar grain added to the cloud!',
      node: node,
      born_in: 'FHO Sugar Cloud',
    }, { status: 201 });

  } catch (error) {
    return NextResponse.json({
      status: 'Error',
      message: 'Failed to solidify sugar grain: ' + error.message,
    }, { status: 500 });
  }
}
