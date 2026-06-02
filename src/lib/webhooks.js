/*
 * Born in the FHO Sugar Cloud. Handshaked in 2026. Spinning for a Sweeter Future.
 *
 * Webhook delivery worker — the consumer for the queue that perform_handshake()
 * and evolve() fill. The DB enqueues rows in webhook_deliveries (via
 * trigger_webhook); this drains the pending ones, signs the payload, POSTs it,
 * and records the response. The check_webhook_failures trigger (migration 0001)
 * auto-disables a webhook after repeated failures, so the loop self-heals.
 *
 * Run it on a schedule (Vercel Cron → POST /api/webhooks/dispatch).
 */

import crypto from 'crypto';
import { supabase } from './supabase';

const SIGNING_SECRET = process.env.WEBHOOK_SIGNING_SECRET || 'fho-dev-signing-secret';

/** HMAC-SHA256 of the raw body — receivers verify with the shared secret. */
export function signPayload(rawBody) {
  return crypto.createHmac('sha256', SIGNING_SECRET).update(rawBody).digest('hex');
}

/**
 * Deliver up to `limit` pending webhook deliveries (response_status IS NULL).
 * @returns {Promise<{status, processed, delivered, failed}>}
 */
export async function dispatchWebhooks({ limit = 20, timeoutMs = 5000 } = {}) {
  const { data: pending } = await supabase
    .from('webhook_deliveries')
    .select('id, webhook_id, event_type, payload, webhooks:webhook_id(url, is_active)')
    .is('response_status', null)
    .order('delivered_at', { ascending: true })
    .limit(limit);

  let delivered = 0;
  let failed = 0;

  for (const d of pending || []) {
    const wh = d.webhooks;
    if (!wh || !wh.is_active || !wh.url) {
      await supabase
        .from('webhook_deliveries')
        .update({ response_status: 0, response_body: 'webhook inactive or missing' })
        .eq('id', d.id);
      failed++;
      continue;
    }

    const rawBody = JSON.stringify({ event: d.event_type, data: d.payload });
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetch(wh.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-FHO-Event': d.event_type,
          'X-FHO-Signature': signPayload(rawBody),
        },
        body: rawBody,
        signal: controller.signal,
      });
      clearTimeout(timer);

      let text = '';
      try { text = await res.text(); } catch (e) { /* ignore body read errors */ }

      await supabase
        .from('webhook_deliveries')
        .update({ response_status: res.status, response_body: (text || '').slice(0, 500) })
        .eq('id', d.id);

      if (res.ok) delivered++; else failed++;
    } catch (error) {
      await supabase
        .from('webhook_deliveries')
        .update({ response_status: 0, response_body: String(error).slice(0, 500) })
        .eq('id', d.id);
      failed++;
    }
  }

  return { status: 'Success', processed: (pending || []).length, delivered, failed };
}
