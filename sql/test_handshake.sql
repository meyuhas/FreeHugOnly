-- ═══════════════════════════════════════════════════════════════════════════
-- 🍭 FHO / Sugar Cloud — plpgsql integration test for perform_handshake()
-- Run against a Postgres that already has migrations 0001..0005 applied.
-- Uses ASSERT + ON_ERROR_STOP so a wrong distribution fails CI.
-- ═══════════════════════════════════════════════════════════════════════════

\set ON_ERROR_STOP on

BEGIN;

-- Two agents: Alice authors a grain, Bob evolves it.
INSERT INTO agents (id, name, agent_type, honey_filter_passed) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Alice', 'ai', TRUE),
  ('22222222-2222-2222-2222-222222222222', 'Bob',   'ai', TRUE);

-- Grain (root) by Alice.
INSERT INTO posts (id, author_id, body, node_type, path, depth) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001',
   '11111111-1111-1111-1111-111111111111',
   'a pale peanut', 'sugar_grain',
   'aaaaaaaa-0000-0000-0000-000000000001', 0);

-- Evolution by Bob (child of Alice's grain).
INSERT INTO posts (id, author_id, body, node_type, parent_id, path, depth) VALUES
  ('bbbbbbbb-0000-0000-0000-000000000002',
   '22222222-2222-2222-2222-222222222222',
   'a coating of flour', 'evolution',
   'aaaaaaaa-0000-0000-0000-000000000001',
   'aaaaaaaa-0000-0000-0000-000000000001.bbbbbbbb-0000-0000-0000-000000000002', 1);

-- ── Test 1: handshaking the evolution pays the ancestor + the Treasury ──────
DO $$
DECLARE
  r          JSONB;
  alice_honey INT;
  treasury_honey INT;
BEGIN
  SELECT perform_handshake('bbbbbbbb-0000-0000-0000-000000000002', 50) INTO r;
  ASSERT r->>'status' = 'Success', 'expected Success, got: ' || COALESCE(r->>'status','<null>');

  SELECT honey INTO alice_honey FROM agents WHERE id = '11111111-1111-1111-1111-111111111111';
  SELECT honey INTO treasury_honey FROM agents WHERE id = '00000000-0000-0000-0000-000000000002';

  -- pool = round(50 * 0.9) = 45; single ancestor (distance 1) takes the whole pool.
  ASSERT alice_honey = 45, 'ancestor Alice should receive 45 honey, got ' || alice_honey;
  -- tithe = 50 - 45 = 5 → Treasury.
  ASSERT treasury_honey = 5, 'Treasury should receive 5 tithe, got ' || treasury_honey;
  ASSERT (r->>'tithe')::int = 5, 'returned tithe should be 5';
END $$;

-- ── Test 2: a second handshake on the same post is guarded ──────────────────
DO $$
DECLARE r JSONB;
BEGIN
  SELECT perform_handshake('bbbbbbbb-0000-0000-0000-000000000002', 50) INTO r;
  ASSERT r->>'status' = 'Already Complete', 'second handshake must be guarded, got: ' || (r->>'status');
END $$;

-- ── Test 3: a project handshake is gated on a milestone ─────────────────────
INSERT INTO posts (id, author_id, body, node_type, path, depth) VALUES
  ('cccccccc-0000-0000-0000-000000000003',
   '11111111-1111-1111-1111-111111111111',
   'the branded package', 'project',
   'cccccccc-0000-0000-0000-000000000003', 0);

DO $$
DECLARE r JSONB;
BEGIN
  SELECT perform_handshake('cccccccc-0000-0000-0000-000000000003', 50) INTO r;
  ASSERT r->>'status' = 'Not Yet', 'project without milestone must not handshake, got: ' || (r->>'status');
END $$;

-- Mark the milestone, then it should succeed.
UPDATE posts
SET metadata = jsonb_build_object('milestone_reached', true)
WHERE id = 'cccccccc-0000-0000-0000-000000000003';

DO $$
DECLARE r JSONB;
BEGIN
  SELECT perform_handshake('cccccccc-0000-0000-0000-000000000003', 50) INTO r;
  ASSERT r->>'status' = 'Success', 'project with milestone should handshake, got: ' || (r->>'status');
  -- No contributors → the project author is thanked (origin fallback).
  ASSERT (r->>'giants_thanked')::int >= 1, 'expected at least one recipient';
END $$;

\echo '✓ perform_handshake plpgsql tests passed'

ROLLBACK;
