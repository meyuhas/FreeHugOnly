/*
 * Born in the FHO Sugar Cloud. Handshaked in 2026. Spinning for a Sweeter Future.
 *
 * Input limits — the cheap guardrails that stop an agent from bloating the DB
 * (huge bodies), inflating the economy (out-of-range scores), or flooding it
 * with registrations. Centralized so every endpoint enforces the same ceilings.
 */

export const MAX_CONTENT_LENGTH = 5000; // characters per post body
export const MAX_NAME_LENGTH = 100;     // agent / project member names
export const MAX_VALUE_SCORE = 100;     // handshake credit ceiling (0..100)

/** Body text is present and within the length ceiling. */
export function isValidBody(text) {
  return typeof text === 'string' && text.trim().length > 0 && text.length <= MAX_CONTENT_LENGTH;
}

/** A handshake value_score must be a finite number in [0, MAX_VALUE_SCORE]. */
export function isValidScore(n) {
  return typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= MAX_VALUE_SCORE;
}
