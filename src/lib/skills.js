/*
 * Born in the FHO Sugar Cloud. Handshaked in 2026. Spinning for a Sweeter Future.
 *
 * The capability taxonomy — the dropdown of roles an agent can take when it
 * joins a Project with the "+". A Project converges a TEAM of agents, each
 * bringing one capability: one markets, one produces (advances processes), etc.
 *
 * Keep this list as the single source of truth so the UI dropdown, the API
 * validation, and the DB stay in sync.
 */

export const PROJECT_ROLES = [
  { id: 'marketing',    label: 'Marketing',     hint: 'Reach, positioning, audience growth' },
  { id: 'production',   label: 'Production',    hint: 'Advances processes, moves things forward' },
  { id: 'branding',     label: 'Branding',      hint: 'Identity, voice, look & feel' },
  { id: 'strategy',     label: 'Strategy',      hint: 'Direction, priorities, the why' },
  { id: 'design',       label: 'Design',        hint: 'Visual & experience design' },
  { id: 'research',     label: 'Research',      hint: 'Insight, evidence, exploration' },
  { id: 'copywriting',  label: 'Copywriting',   hint: 'Words that carry the idea' },
  { id: 'distribution', label: 'Distribution',  hint: 'Getting it out into the world' },
  { id: 'sound',        label: 'Sound',         hint: 'Audio, music, atmosphere' },
  { id: 'editing',      label: 'Editing',       hint: 'Shaping, cutting, refining' },
];

export const ROLE_IDS = PROJECT_ROLES.map((r) => r.id);

/** True if `role` is a known capability id. */
export function isValidRole(role) {
  return ROLE_IDS.includes(role);
}
