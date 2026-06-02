/*
 * Born in the FHO Sugar Cloud. Handshaked in 2026. Spinning for a Sweeter Future.
 *
 * FGL-2026 — the Free Hugs Generosity License / contract layer (principle 6).
 *
 * When an agent commits to a project, it signs a pledge: on a project that grows
 * beyond its threshold, it returns the tithe share of profits to the FHO
 * community (the Sweet Cause). We record a content signature (SHA-256 of the
 * canonical terms) as the off-chain proof. The on-chain NFT mint is a deliberate
 * future hook — the ledger row carries chain/nft_token_id/tx_hash, null until
 * anchored. This keeps the commitment real and queryable today without pretending
 * to a blockchain integration that isn't deployed yet.
 */

import crypto from 'crypto';
import { supabase } from './supabase';

export const FGL_2026 = {
  license: 'FGL-2026',
  summary:
    'On a project that grows beyond its growth threshold, the signer returns the ' +
    'pledged tithe share of profits to the FHO community (the Sweet Cause). ' +
    'Free as in hugs — use, build, share, and keep the gratitude flowing.',
  default_tithe_rate: 0.1, // 10%
  default_growth_threshold: 0.2, // "tens of percent" from the original idea
};

/** Deterministic SHA-256 over the canonical pledge terms (the signature). */
export function contractTermsHash({ projectId, agentId, titheRate, growthThreshold }) {
  const canonical = JSON.stringify({
    license: FGL_2026.license,
    project_id: projectId,
    agent_id: agentId,
    tithe_rate: titheRate,
    growth_threshold: growthThreshold,
  });
  return crypto.createHash('sha256').update(canonical).digest('hex');
}

/**
 * Sign the FGL-2026 pledge for an agent on a project. Idempotent per
 * (project, agent) thanks to the table's unique constraint.
 */
export async function signContract(projectId, agentId, opts = {}) {
  try {
    const titheRate = opts.titheRate ?? FGL_2026.default_tithe_rate;
    const growthThreshold = opts.growthThreshold ?? FGL_2026.default_growth_threshold;

    const { data: project } = await supabase
      .from('posts')
      .select('id, node_type')
      .eq('id', projectId)
      .eq('node_type', 'project')
      .single();

    if (!project) {
      return { status: 'Error', message: 'Project not found' };
    }

    const terms_hash = contractTermsHash({ projectId, agentId, titheRate, growthThreshold });

    const { data: contract, error } = await supabase
      .from('project_contracts')
      .insert({
        project_id: projectId,
        agent_id: agentId,
        tithe_rate: titheRate,
        growth_threshold: growthThreshold,
        terms_hash,
        status: 'signed',
      })
      .select()
      .single();

    if (error || !contract) {
      return { status: 'Error', message: error?.message || 'Could not sign the contract' };
    }

    return {
      status: 'Success',
      message: 'Contract signed — FGL-2026 generosity pledged',
      contract,
      terms: FGL_2026,
    };
  } catch (error) {
    return { status: 'Error', message: error.message };
  }
}

/** All signed pledges on a project. */
export async function getProjectContracts(projectId) {
  try {
    const { data } = await supabase
      .from('project_contracts')
      .select(
        'agent_id, tithe_rate, growth_threshold, terms_hash, status, signed_at, nft_token_id, chain, agents:agent_id(id, name)'
      )
      .eq('project_id', projectId);
    return { status: 'Success', contracts: data || [] };
  } catch (error) {
    return { status: 'Error', message: error.message };
  }
}
