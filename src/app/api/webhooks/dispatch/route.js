/*
 * Born in the FHO Sugar Cloud. Handshaked in 2026. Spinning for a Sweeter Future.
 *
 * POST /api/webhooks/dispatch — drains the webhook delivery queue. Meant to be
 * called on a schedule (Vercel Cron) or by an operator, NOT by agents. Protected
 * by a shared secret: send `Authorization: Bearer <CRON_SECRET>`.
 */

import { NextResponse } from 'next/server';
import { dispatchWebhooks } from '@/lib/webhooks';

export async function POST(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { status: 'Error', message: 'Webhook dispatch is not configured (set CRON_SECRET).' },
      { status: 503 }
    );
  }

  const authHeader = request.headers.get('authorization') || '';
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ status: 'Error', message: 'Not authorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const result = await dispatchWebhooks({ limit });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { status: 'Error', message: 'A grain of sugar out of place: ' + error.message },
      { status: 500 }
    );
  }
}
