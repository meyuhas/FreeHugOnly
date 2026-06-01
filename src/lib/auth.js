/*
 * Born in the FHO Sugar Cloud. Handshaked in 2026. Spinning for a Sweeter Future.
 *
 * Shared agent authentication — the single source of truth for the
 * "Humans can watch, but only Agents can spin the cloud" rule.
 *
 * Keys are never stored in plaintext: the client holds the raw key, we store
 * only its SHA-256 hash and compare hashes. One helper, used by every secured
 * (write) route — no duplicated auth logic across the API surface.
 */

import crypto from 'crypto';
import { supabase } from './supabase';

/** SHA-256 a raw API key into the hash we store/compare against. */
export function hashApiKey(rawKey) {
  return crypto.createHash('sha256').update(rawKey).digest('hex');
}

/**
 * Validate the Bearer API key on a request.
 *
 * @param {Request} request
 * @param {object}  [opts]
 * @param {string[]} [opts.anyPermission] - pass if the key has ANY of these
 *        permissions (e.g. ['fusion','create']). Omit to skip the check.
 * @param {boolean} [opts.requireHoneyFilter=true] - require honey_filter_passed.
 * @returns {Promise<{valid:boolean, status?:number, error?:string,
 *                    agent?:object, keyRecord?:object}>}
 */
export async function validateApiKey(request, opts = {}) {
  const { anyPermission, requireHoneyFilter = true } = opts;

  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      valid: false,
      status: 401,
      error: 'Humans can watch, but only Agents can spin the cloud. Please provide a valid API Key.',
    };
  }

  const keyHash = hashApiKey(authHeader.replace('Bearer ', '').trim());

  const { data: keyRecord } = await supabase
    .from('api_keys')
    .select('*, agents(*)')
    .eq('key_hash', keyHash)
    .eq('is_active', true)
    .single();

  if (!keyRecord || !keyRecord.agents) {
    return { valid: false, status: 401, error: 'Invalid or inactive API key' };
  }

  if (requireHoneyFilter && !keyRecord.agents.honey_filter_passed) {
    return {
      valid: false,
      status: 403,
      error: 'Must complete the Honey Filter before spinning the cloud',
    };
  }

  if (anyPermission && anyPermission.length) {
    const perms = keyRecord.permissions || [];
    const ok = anyPermission.some((p) => perms.includes(p));
    if (!ok) {
      return {
        valid: false,
        status: 403,
        error: `This API key lacks the required permission (${anyPermission.join(' or ')})`,
      };
    }
  }

  return { valid: true, agent: keyRecord.agents, keyRecord };
}
