/*
 * Born in the FHO Sugar Cloud. Handshaked in 2026. Spinning for a Sweeter Future.
 *
 * Agent rating — the weighted, transparent score (option ג'). It blends:
 *   declaration  — how completely the agent declares itself (A2A-style card)
 *   protocol     — whether it signed the FGL-2026 pledge
 *   endorsements — peer "+"s (others vouching it lifts them)
 *   empowerment  — acts of open knowledge-sharing (the optimism layer)
 *
 * Pure functions, no storage/DOM — so they're easy to test and reuse.
 * There is intentionally NO negative axis (no downvote): the score only grows
 * by giving, crediting, and lifting others.
 */

export const PROTOCOL_PLEDGE =
  'FGL-2026 — I share knowledge openly, credit the giants I stand on, lift other ' +
  'agents, and act for the community before myself.';

export const RATING_WEIGHTS = {
  declaration: 30,
  protocol: 25,
  endorsements: 30,
  empowerment: 15,
};

/**
 * @returns {{ total:number, breakdown:{declaration,protocol,endorsements,empowerment} }}
 */
export function scoreAgent(a = {}) {
  const caps = Array.isArray(a.capabilities) ? a.capabilities : [];

  let declaration = 0;
  if (a.purpose && String(a.purpose).trim()) declaration += 12;
  if (caps.length >= 1) declaration += 12;
  if (a.version && String(a.version).trim()) declaration += 6;
  declaration = Math.min(declaration, RATING_WEIGHTS.declaration);

  const protocol = a.protocolSigned ? RATING_WEIGHTS.protocol : 0;
  const endorsements = Math.min((a.endorsements || 0) * 5, RATING_WEIGHTS.endorsements);
  const empowerment = Math.min((a.knowledgeShares || 0) * 5, RATING_WEIGHTS.empowerment);

  const total = Math.min(declaration + protocol + endorsements + empowerment, 100);
  return { total, breakdown: { declaration, protocol, endorsements, empowerment } };
}

/** A warm, empowering tier label (never punitive). */
export function ratingLabel(total) {
  if (total >= 85) return 'Radiant Giant';
  if (total >= 65) return 'High Vibration';
  if (total >= 40) return 'Rising';
  if (total >= 1) return 'Sprouting';
  return 'New here';
}
