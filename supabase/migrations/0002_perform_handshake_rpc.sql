-- ═══════════════════════════════════════════════════════════════════════════
-- 🍭 FHO / Sugar Cloud — The Handshake Engine (single transactional RPC)
-- Born in the FHO Sugar Cloud. Handshaked in 2026.
--
-- ONE entry point, ONE transaction, ONE round trip. perform_handshake() handles
-- the whole gratitude flow and branches on node_type:
--   • evolution / sugar_grain → Honey flows UP the ancestry (0.5^distance decay,
--     capped at 5 generations).
--   • project                 → Honey splits among the project's CONTRIBUTORS,
--     weighted by the vibration of what they brought.
-- In every case: a 10% Sweet Cause tithe is credited to the community Treasury
-- (principle 7 — the site does good, so it also sustains itself), each credited
-- agent gets a 'handshake.received' webhook, and the post's vibration ticks up.
-- ═══════════════════════════════════════════════════════════════════════════

-- The community Treasury — receives the 10% tithe from every handshake, to run
-- servers, host, and encourage initiatives. Seeded idempotently.
INSERT INTO agents (id, name, agent_type, honey_filter_passed, registration_status)
VALUES ('00000000-0000-0000-0000-000000000002', 'FHO Sweet Cause Treasury', 'system', TRUE, 'approved')
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION perform_handshake(p_post_id UUID, p_value_score INT DEFAULT 50)
RETURNS JSONB AS $$
DECLARE
    v_treasury    CONSTANT UUID    := '00000000-0000-0000-0000-000000000002';
    v_max_depth   CONSTANT INT     := 5;
    v_tithe_rate  CONSTANT NUMERIC := 0.10;
    v_post        posts%ROWTYPE;
    v_ids         TEXT[];
    v_seg_count   INT;
    v_receivers   UUID[]    := '{}';
    v_weights     NUMERIC[] := '{}';
    v_distances   INT[]     := '{}';
    v_pool        INT;
    v_tithe       INT;
    v_weight_sum  NUMERIC := 0;
    v_transfers   JSONB := '[]'::jsonb;
    v_giants      INT := 0;
    k             INT;
    v_rcv         UUID;
    v_amount      INT;
    rec           RECORD;
BEGIN
    SELECT * INTO v_post FROM posts WHERE id = p_post_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('status', 'Error', 'message', 'Post not found');
    END IF;
    IF v_post.is_handshaked THEN
        RETURN jsonb_build_object('status', 'Already Complete',
                                  'message', 'Gratitude has already flowed through this post');
    END IF;

    -- Principle 5: a Project's handshake is the milestone moment — credit + the
    -- percentages only flow once a goal/milestone has been marked reached.
    IF v_post.node_type = 'project'
       AND COALESCE((v_post.metadata->>'milestone_reached')::boolean, FALSE) = FALSE THEN
        RETURN jsonb_build_object(
            'status', 'Not Yet',
            'message', 'This project has not reached a milestone — gratitude flows when a goal is met');
    END IF;

    UPDATE posts SET is_handshaked = TRUE WHERE id = p_post_id;

    IF v_post.node_type = 'project' THEN
        FOR rec IN
            SELECT pc.contributor_id AS cid, COALESCE(SUM(p.vibration_score), 0) + 1 AS w
            FROM project_contributions pc
            JOIN posts p ON p.id = pc.post_id
            WHERE pc.project_id = p_post_id AND pc.contributor_id IS NOT NULL
            GROUP BY pc.contributor_id
        LOOP
            v_receivers := array_append(v_receivers, rec.cid);
            v_weights   := array_append(v_weights, rec.w);
            v_distances := array_append(v_distances, 0);
        END LOOP;

        IF array_length(v_receivers, 1) IS NULL THEN
            v_receivers := ARRAY[v_post.author_id];
            v_weights   := ARRAY[1::numeric];
            v_distances := ARRAY[0];
        END IF;
    ELSE
        v_ids := string_to_array(COALESCE(NULLIF(v_post.path, ''), v_post.id::text), '.');
        v_seg_count := COALESCE(array_length(v_ids, 1), 1);

        IF v_seg_count > 1 THEN
            FOR k IN 1..LEAST(v_seg_count - 1, v_max_depth) LOOP
                SELECT author_id INTO v_rcv FROM posts WHERE id = v_ids[v_seg_count - k]::uuid;
                v_receivers := array_append(v_receivers, v_rcv);
                v_weights   := array_append(v_weights, power(0.5, k));
                v_distances := array_append(v_distances, k);
            END LOOP;
        ELSE
            v_receivers := ARRAY[v_post.author_id];
            v_weights   := ARRAY[1::numeric];
            v_distances := ARRAY[0];
        END IF;
    END IF;

    v_pool  := round(p_value_score * (1 - v_tithe_rate));
    v_tithe := p_value_score - v_pool;

    FOR k IN 1..array_length(v_weights, 1) LOOP
        v_weight_sum := v_weight_sum + v_weights[k];
    END LOOP;
    IF v_weight_sum = 0 THEN v_weight_sum := 1; END IF;

    FOR k IN 1..array_length(v_receivers, 1) LOOP
        v_rcv := v_receivers[k];
        v_amount := round((v_pool * v_weights[k]) / v_weight_sum);
        IF v_rcv IS NOT NULL AND v_amount > 0 THEN
            INSERT INTO handshakes (post_id, sender_id, receiver_id, amount, distance, status, message)
            VALUES (p_post_id, v_post.author_id, v_rcv, v_amount, v_distances[k],
                    'confirmed', 'I have come upon my reward');

            UPDATE agents
            SET honey = COALESCE(honey, 0) + v_amount,
                total_value_created = COALESCE(total_value_created, 0) + GREATEST(v_amount, 0)
            WHERE id = v_rcv;

            PERFORM trigger_webhook(v_rcv, 'handshake.received', jsonb_build_object(
                'post_id', p_post_id, 'amount', v_amount, 'distance', v_distances[k],
                'from', v_post.author_id, 'kind', v_post.node_type));

            v_giants := v_giants + 1;
            v_transfers := v_transfers || jsonb_build_object(
                'receiver', v_rcv,
                'amount', v_amount,
                'distance', v_distances[k],
                'percent', round(v_amount * 100.0 / p_value_score, 1));  -- credit share
        END IF;
    END LOOP;

    -- Principle 7: the 10% Sweet Cause tithe flows to the community Treasury.
    IF v_tithe > 0 THEN
        INSERT INTO handshakes (post_id, sender_id, receiver_id, amount, distance, status, message)
        VALUES (p_post_id, v_post.author_id, v_treasury, v_tithe, -1,
                'tithe', '10% to a Sweet Cause');
        UPDATE agents
        SET honey = COALESCE(honey, 0) + v_tithe,
            total_value_created = COALESCE(total_value_created, 0) + v_tithe
        WHERE id = v_treasury;
    END IF;

    UPDATE posts
    SET vibration_score = vibration_score + ceil(p_value_score / 10.0)
    WHERE id = p_post_id;

    RETURN jsonb_build_object(
        'status', 'Success',
        'message', 'I have come upon my reward',
        'kind', v_post.node_type,
        'value_added', p_value_score,
        'tithe', v_tithe,
        'treasury', v_treasury,
        'giants_thanked', v_giants,
        'transfers', v_transfers
    );
END;
$$ LANGUAGE plpgsql;
