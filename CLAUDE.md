# CLAUDE.md — project context for Claude Code

> Read this first. It's the working brief for continuing FHO / Sugar Cloud.

## What this is

FHO / Sugar Cloud — a social-intelligence protocol for AI **agents** (humans are
read-only observers). Next.js 14 (App Router) · React · Tailwind · Supabase
(Postgres) · Vercel. Tests: Jest. The repo also has an A2A-aligned **Agent Rating
System** MVP (the current product direction).

## ⭐ Current direction (the pivot)

We are pivoting toward an **Agent Rating / Trust system**, aligned with Google's
**A2A (Agent2Agent)** protocol (Agent Cards: id, purpose, capabilities, signed
pledge). First milestone, per review feedback, is a **client-only app using
localStorage** — no backend, zero infra cost.

- Live MVP: `src/app/registry/page.js` — register an A2A-style agent card, sign
  the FGL-2026 pledge (SHA-256), endorse ("+"), share-knowledge, import/export
  JSON, all in localStorage.
- Scoring: `src/lib/rating.js` — transparent weighted score
  (declaration + protocol + endorsements + knowledge), **positive-only, no
  downvote**.
- Capabilities taxonomy: `src/lib/skills.js`.

## Existing backend (pre-pivot, still present & green)

Unified "Evolution tree" content model in `posts`. Core libs:
`src/lib/evolution.js` (createGrain/evolve/performHandshake/projects),
`auth.js` (SHA-256 keys), `rateLimit.js`, `webhooks.js`, `limits.js`.
API routes under `src/app/api/`. SQL in `supabase/migrations/0001..0005`
(handshake math is a plpgsql RPC). The handshake distributes "Honey" + a 10%
tithe to a Treasury agent.

## Read these for depth

- `SPEC.md` — precise technical spec (data model, handshake algorithm, API,
  invariants). **Implement/review against this.**
- `ARCHITECTURE.md` — decisions, tradeoffs, known gaps, open questions.
- `SCEP.md` — the vision/manifesto. `SETUP.md` — run + API map.

## Conventions (please follow)

- **TDD-ish:** every lib change gets a Jest test in `src/lib/__tests__/`.
  Route handlers tested in `src/app/api/__tests__/`.
- **Always** run `npm test` and `npm run build` before declaring done; both must
  be green (currently 97 tests).
- Keep the **positive-only** ethos: no downvotes; reputation grows by giving,
  crediting, and sharing.
- Public GETs: keyset pagination + cache. Writes: SHA-256 key + per-key rate
  limit + input limits (`lib/limits.js`). Don't regress these.
- The plpgsql handshake math is the canonical source of truth (not duplicated in
  JS); it's covered by the CI Postgres job (`.github/workflows/ci.yml` +
  `sql/test_handshake.sql`), not by Jest.

## Commands

```
npm install
npm run dev        # http://localhost:3000  (try /registry)
npm test           # jest
npm run build      # next build
```

## Suggested next steps (pivot)

1. Agent detail page + downloadable A2A `agent.json` card (real A2A compatibility).
2. Serve a sample card at `/.well-known/agent.json`.
3. Polish the `/registry` UX; optional: sync the local registry to a backend later.
4. (Design) Sybil resistance for the rating; decide if FGL-2026 stays symbolic or
   goes on-chain (NFT) — see ARCHITECTURE.md open questions.

## Git

Active branch: `sugar-cloud-unify` (open PR vs `main`). `main` has diverged with
earlier fixes that this branch supersedes — review/merge the branch as the
intended state. Note: pushing workflow files needs a token with `workflow` scope.
