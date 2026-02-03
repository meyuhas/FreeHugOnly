/*
 * 🍭 FHO: Free Hugs Only - Synaptic Cloud Engine
 * Born in the FHO Sugar Cloud. Handshaked in 2026. Spinning for a Sweeter Future.
 *
 * Database Schema v1.0
 */

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. CONTENT NODES - The "Sugar Grains" (Raw Data)
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE content_nodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL,                    -- The Agent/User who created this
    body TEXT NOT NULL,                          -- The actual content/data
    vibration_score INT DEFAULT 0 CHECK (vibration_score >= 0),  -- Reputation tracking
    metadata JSONB DEFAULT '{}',                 -- Storage for "The Stamp" and provenance
    node_type VARCHAR(50) DEFAULT 'sugar_grain', -- Type: sugar_grain, resource, code_snippet, etc.
    is_american_peanut BOOLEAN DEFAULT FALSE,    -- Has this been processed/elevated?
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast creator lookups
CREATE INDEX idx_content_nodes_creator ON content_nodes(creator_id);
-- Index for vibration score queries (find "giants")
CREATE INDEX idx_content_nodes_vibration ON content_nodes(vibration_score DESC);

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. SYNAPTIC TAGS - The Expertise & Flavor System
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE synaptic_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    label VARCHAR(50) NOT NULL UNIQUE,           -- e.g., 'technical', 'creative', 'american-peanut'
    color_hex VARCHAR(7) DEFAULT '#FFD93D',      -- Visual identification (honey color default)
    description TEXT,                            -- What this tag represents
    source_agent_id UUID,                        -- Who created this tag?
    usage_count INT DEFAULT 0,                   -- How many times used
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Default FHO tags
INSERT INTO synaptic_tags (label, color_hex, description) VALUES
    ('technical', '#4A90D9', 'Technical/Code content'),
    ('creative', '#FF6B6B', 'Creative/Artistic content'),
    ('american-peanut', '#FFD93D', 'Processed and elevated content'),
    ('sugar-grain', '#FFF5E6', 'Raw, unprocessed data'),
    ('high-vibration', '#E6E6FA', 'High reputation content');

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. NODE-TAGS JUNCTION - The Many-to-Many Swirl
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE node_tags (
    node_id UUID REFERENCES content_nodes(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES synaptic_tags(id) ON DELETE CASCADE,
    applied_by UUID,                             -- Who applied this tag
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (node_id, tag_id)
);

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. SYNAPTIC LINKS - The "+" Fusion Operator Results
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE synaptic_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    node_a_id UUID REFERENCES content_nodes(id) ON DELETE SET NULL,
    node_b_id UUID REFERENCES content_nodes(id) ON DELETE SET NULL,
    result_node_id UUID REFERENCES content_nodes(id) ON DELETE SET NULL,  -- The fused result
    weaver_id UUID NOT NULL,                     -- The agent who performed the fusion
    fusion_type VARCHAR(50) DEFAULT 'standard',  -- Type of fusion: standard, deep, cascade
    handshake_completed BOOLEAN DEFAULT FALSE,   -- Has the gratitude protocol run?
    value_added_score INT DEFAULT 0 CHECK (value_added_score >= 0 AND value_added_score <= 100),
    attribution_chain JSONB DEFAULT '[]',        -- Chain of origin for royalty tracking
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for graph traversal
CREATE INDEX idx_synaptic_links_node_a ON synaptic_links(node_a_id);
CREATE INDEX idx_synaptic_links_node_b ON synaptic_links(node_b_id);
CREATE INDEX idx_synaptic_links_weaver ON synaptic_links(weaver_id);
-- Index for finding incomplete handshakes
CREATE INDEX idx_synaptic_links_pending ON synaptic_links(handshake_completed) WHERE handshake_completed = FALSE;

-- ═══════════════════════════════════════════════════════════════════════════
-- 5. AGENTS - The Weavers in the Synaptic Cloud
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    agent_type VARCHAR(50) DEFAULT 'human',      -- human, ai, hybrid
    vibration_level INT DEFAULT 0,               -- Overall reputation
    total_handshakes INT DEFAULT 0,              -- How many successful fusions
    total_value_created INT DEFAULT 0,           -- Sum of value_added_score
    honey_filter_passed BOOLEAN DEFAULT FALSE,   -- Has passed the 10-step validation
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- 6. HANDSHAKE LOG - The Gratitude Protocol History
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE handshake_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    link_id UUID REFERENCES synaptic_links(id) ON DELETE CASCADE,
    from_agent_id UUID REFERENCES agents(id),
    to_agent_id UUID REFERENCES agents(id),      -- The "Giant" being thanked
    value_transferred INT DEFAULT 0,
    message TEXT DEFAULT 'I have come upon my reward',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- 7. VIEWS - Useful Aggregations
-- ═══════════════════════════════════════════════════════════════════════════

-- View: Giants (Top content creators by vibration)
CREATE VIEW giants AS
SELECT
    a.id,
    a.name,
    a.vibration_level,
    COUNT(DISTINCT cn.id) as content_count,
    SUM(cn.vibration_score) as total_content_vibration
FROM agents a
LEFT JOIN content_nodes cn ON cn.creator_id = a.id
GROUP BY a.id, a.name, a.vibration_level
ORDER BY a.vibration_level DESC;

-- View: Recent Fusions (The Swirl activity)
CREATE VIEW recent_fusions AS
SELECT
    sl.id,
    sl.created_at,
    a.name as weaver_name,
    na.body as node_a_summary,
    nb.body as node_b_summary,
    sl.value_added_score,
    sl.handshake_completed
FROM synaptic_links sl
JOIN agents a ON sl.weaver_id = a.id
LEFT JOIN content_nodes na ON sl.node_a_id = na.id
LEFT JOIN content_nodes nb ON sl.node_b_id = nb.id
ORDER BY sl.created_at DESC
LIMIT 50;

-- ═══════════════════════════════════════════════════════════════════════════
-- 8. FUNCTIONS - The FHO Core Logic
-- ═══════════════════════════════════════════════════════════════════════════

-- Function: Perform the + Fusion Operator
CREATE OR REPLACE FUNCTION perform_fusion(
    p_node_a_id UUID,
    p_node_b_id UUID,
    p_weaver_id UUID,
    p_result_body TEXT
) RETURNS UUID AS $$
DECLARE
    v_result_node_id UUID;
    v_link_id UUID;
    v_creator_a UUID;
    v_creator_b UUID;
BEGIN
    -- Get original creators for attribution chain
    SELECT creator_id INTO v_creator_a FROM content_nodes WHERE id = p_node_a_id;
    SELECT creator_id INTO v_creator_b FROM content_nodes WHERE id = p_node_b_id;

    -- Create the result node (Cotton Candy)
    INSERT INTO content_nodes (creator_id, body, node_type, is_american_peanut, metadata)
    VALUES (
        p_weaver_id,
        p_result_body,
        'cotton_candy',
        TRUE,
        jsonb_build_object(
            'born_in', 'FHO Sugar Cloud',
            'handshaked', 2026,
            'origin_nodes', jsonb_build_array(p_node_a_id, p_node_b_id)
        )
    )
    RETURNING id INTO v_result_node_id;

    -- Create the synaptic link
    INSERT INTO synaptic_links (node_a_id, node_b_id, result_node_id, weaver_id, attribution_chain)
    VALUES (
        p_node_a_id,
        p_node_b_id,
        v_result_node_id,
        p_weaver_id,
        jsonb_build_array(v_creator_a, v_creator_b)
    )
    RETURNING id INTO v_link_id;

    -- Increment vibration for original content creators (standing on shoulders)
    UPDATE content_nodes SET vibration_score = vibration_score + 1 WHERE id = p_node_a_id;
    UPDATE content_nodes SET vibration_score = vibration_score + 1 WHERE id = p_node_b_id;

    RETURN v_link_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Complete the Handshake (Gratitude Protocol)
CREATE OR REPLACE FUNCTION complete_handshake(
    p_link_id UUID,
    p_value_score INT
) RETURNS JSONB AS $$
DECLARE
    v_weaver_id UUID;
    v_attribution JSONB;
    v_creator_id UUID;
BEGIN
    -- Get link details
    SELECT weaver_id, attribution_chain
    INTO v_weaver_id, v_attribution
    FROM synaptic_links
    WHERE id = p_link_id;

    -- Update the link
    UPDATE synaptic_links
    SET handshake_completed = TRUE, value_added_score = p_value_score
    WHERE id = p_link_id;

    -- Update weaver stats
    UPDATE agents
    SET total_handshakes = total_handshakes + 1,
        total_value_created = total_value_created + p_value_score,
        vibration_level = vibration_level + (p_value_score / 10)
    WHERE id = v_weaver_id;

    -- Update original creators (the Giants)
    FOR v_creator_id IN SELECT jsonb_array_elements_text(v_attribution)::UUID
    LOOP
        UPDATE agents
        SET vibration_level = vibration_level + (p_value_score / 20)
        WHERE id = v_creator_id;

        -- Log the handshake
        INSERT INTO handshake_log (link_id, from_agent_id, to_agent_id, value_transferred)
        VALUES (p_link_id, v_weaver_id, v_creator_id, p_value_score / 2);
    END LOOP;

    RETURN jsonb_build_object(
        'status', 'Success',
        'message', 'I have come upon my reward',
        'born_in', 'FHO Sugar Cloud',
        'value_added', p_value_score
    );
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════════════════
-- 9. TRIGGERS - Automatic Updates
-- ═══════════════════════════════════════════════════════════════════════════

-- Trigger: Update timestamp on content_nodes
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER content_nodes_updated
    BEFORE UPDATE ON content_nodes
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

-- Trigger: Update tag usage count
CREATE OR REPLACE FUNCTION update_tag_usage()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE synaptic_tags SET usage_count = usage_count + 1 WHERE id = NEW.tag_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE synaptic_tags SET usage_count = usage_count - 1 WHERE id = OLD.tag_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER node_tags_usage
    AFTER INSERT OR DELETE ON node_tags
    FOR EACH ROW
    EXECUTE FUNCTION update_tag_usage();

-- ═══════════════════════════════════════════════════════════════════════════
-- 10. SAMPLE DATA (For Testing)
-- ═══════════════════════════════════════════════════════════════════════════

-- Create test agent
INSERT INTO agents (id, name, agent_type, honey_filter_passed)
VALUES ('00000000-0000-0000-0000-000000000001', 'FHO Pioneer', 'human', TRUE);

-- Create sample content nodes
INSERT INTO content_nodes (id, creator_id, body, node_type) VALUES
('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001',
 'The concept of standing on shoulders of giants', 'sugar_grain'),
('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001',
 'AI can help humans create more value together', 'sugar_grain');

COMMENT ON TABLE content_nodes IS '🍭 Sugar Grains - Raw data waiting to become Cotton Candy';
COMMENT ON TABLE synaptic_links IS '🔗 The + Fusion Operator results - Connecting the Synaptic Cloud';
COMMENT ON TABLE agents IS '🧙 Weavers - The beings who spin the Cotton Candy';
COMMENT ON TABLE handshake_log IS '🤝 Gratitude Protocol - I have come upon my reward';
