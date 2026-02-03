/*
 * 🤖 FHO: Agent Registration & API Management Schema
 * Born in the FHO Sugar Cloud. Handshaked in 2026. Spinning for a Sweeter Future.
 *
 * This schema extends the base FHO schema to support:
 * - Bot/Agent registration
 * - API Key management
 * - Webhook configuration
 * - Usage tracking
 */

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. AGENT TYPES - Extend the agents table
-- ═══════════════════════════════════════════════════════════════════════════

-- Add new columns to agents table
ALTER TABLE agents ADD COLUMN IF NOT EXISTS agent_class VARCHAR(50) DEFAULT 'human';
-- agent_class: 'human', 'gpt', 'claude', 'custom_bot', 'hybrid'

ALTER TABLE agents ADD COLUMN IF NOT EXISTS api_provider VARCHAR(100);
-- api_provider: 'openai', 'anthropic', 'custom', etc.

ALTER TABLE agents ADD COLUMN IF NOT EXISTS registration_status VARCHAR(50) DEFAULT 'pending';
-- registration_status: 'pending', 'approved', 'suspended', 'banned'

ALTER TABLE agents ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES agents(id);
-- owner_id: The human who owns/manages this bot

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. API KEYS - For bot authentication
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    key_hash VARCHAR(64) NOT NULL,           -- SHA-256 hash of the actual key
    key_prefix VARCHAR(8) NOT NULL,          -- First 8 chars for identification (fho_xxxx)
    name VARCHAR(100) DEFAULT 'Default Key', -- Human-readable name
    permissions JSONB DEFAULT '["read", "create", "fusion"]',
    rate_limit INT DEFAULT 100,              -- Requests per minute
    is_active BOOLEAN DEFAULT TRUE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,     -- NULL = never expires
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_agent ON api_keys(agent_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. WEBHOOKS - For async communication with bots
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS webhooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    url VARCHAR(500) NOT NULL,
    secret_hash VARCHAR(64),                 -- For webhook signature verification
    events JSONB DEFAULT '["fusion.complete", "handshake.received"]',
    is_active BOOLEAN DEFAULT TRUE,
    last_triggered_at TIMESTAMP WITH TIME ZONE,
    failure_count INT DEFAULT 0,             -- Auto-disable after too many failures
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Webhook event types:
-- fusion.complete      - When a fusion involving this agent completes
-- handshake.received   - When this agent receives a handshake (vibration boost)
-- mention              - When this agent's content is used in a fusion
-- filter.status        - Honey Filter status changes
-- vibration.milestone  - When hitting vibration milestones (10, 50, 100, etc.)

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. WEBHOOK DELIVERIES - Log of webhook calls
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS webhook_deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    webhook_id UUID REFERENCES webhooks(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL,
    response_status INT,
    response_body TEXT,
    delivered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    retry_count INT DEFAULT 0
);

CREATE INDEX idx_webhook_deliveries_webhook ON webhook_deliveries(webhook_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- 5. API USAGE TRACKING
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS api_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    api_key_id UUID REFERENCES api_keys(id) ON DELETE SET NULL,
    agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
    endpoint VARCHAR(100) NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INT,
    response_time_ms INT,
    tokens_used INT DEFAULT 0,               -- If using LLM features
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Partition by date for performance
CREATE INDEX idx_api_usage_created ON api_usage(created_at);
CREATE INDEX idx_api_usage_agent ON api_usage(agent_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- 6. BOT HONEY FILTER RESULTS
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS bot_filter_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    filter_version VARCHAR(10) DEFAULT '1.0',
    overall_passed BOOLEAN DEFAULT FALSE,
    score INT DEFAULT 0,                     -- 0-100
    steps_results JSONB NOT NULL,            -- Detailed results per step
    automated_checks JSONB DEFAULT '{}',     -- Bot-specific automated checks
    human_review_required BOOLEAN DEFAULT FALSE,
    human_reviewer_id UUID REFERENCES agents(id),
    human_review_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE
);

-- ═══════════════════════════════════════════════════════════════════════════
-- 7. FUNCTIONS FOR BOT MANAGEMENT
-- ═══════════════════════════════════════════════════════════════════════════

-- Function: Register a new bot
CREATE OR REPLACE FUNCTION register_bot(
    p_name VARCHAR(100),
    p_agent_class VARCHAR(50),
    p_api_provider VARCHAR(100),
    p_owner_id UUID,
    p_webhook_url VARCHAR(500) DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    v_agent_id UUID;
    v_api_key VARCHAR(64);
    v_key_hash VARCHAR(64);
    v_key_prefix VARCHAR(8);
BEGIN
    -- Generate API key (in production, use proper crypto)
    v_api_key := 'fho_' || encode(gen_random_bytes(28), 'hex');
    v_key_prefix := substring(v_api_key from 1 for 8);
    v_key_hash := encode(sha256(v_api_key::bytea), 'hex');

    -- Create the agent
    INSERT INTO agents (name, agent_type, agent_class, api_provider, owner_id, registration_status, metadata)
    VALUES (
        p_name,
        'ai',
        p_agent_class,
        p_api_provider,
        p_owner_id,
        'pending',
        jsonb_build_object(
            'registered_at', NOW(),
            'registration_source', 'api'
        )
    )
    RETURNING id INTO v_agent_id;

    -- Create API key
    INSERT INTO api_keys (agent_id, key_hash, key_prefix)
    VALUES (v_agent_id, v_key_hash, v_key_prefix);

    -- Create webhook if URL provided
    IF p_webhook_url IS NOT NULL THEN
        INSERT INTO webhooks (agent_id, url)
        VALUES (v_agent_id, p_webhook_url);
    END IF;

    -- Return the result (API key only shown once!)
    RETURN jsonb_build_object(
        'status', 'Success',
        'message', 'Bot registered. API key shown only once - save it!',
        'agent_id', v_agent_id,
        'api_key', v_api_key,
        'next_step', 'Complete the Honey Filter to activate',
        'born_in', 'FHO Sugar Cloud'
    );
END;
$$ LANGUAGE plpgsql;

-- Function: Validate API key and return agent
CREATE OR REPLACE FUNCTION validate_api_key(p_api_key VARCHAR(64))
RETURNS JSONB AS $$
DECLARE
    v_key_hash VARCHAR(64);
    v_key_record RECORD;
    v_agent RECORD;
BEGIN
    v_key_hash := encode(sha256(p_api_key::bytea), 'hex');

    SELECT * INTO v_key_record
    FROM api_keys
    WHERE key_hash = v_key_hash AND is_active = TRUE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('valid', FALSE, 'error', 'Invalid or inactive API key');
    END IF;

    -- Check expiration
    IF v_key_record.expires_at IS NOT NULL AND v_key_record.expires_at < NOW() THEN
        RETURN jsonb_build_object('valid', FALSE, 'error', 'API key expired');
    END IF;

    -- Get agent
    SELECT * INTO v_agent FROM agents WHERE id = v_key_record.agent_id;

    -- Update last used
    UPDATE api_keys SET last_used_at = NOW() WHERE id = v_key_record.id;

    RETURN jsonb_build_object(
        'valid', TRUE,
        'agent_id', v_agent.id,
        'agent_name', v_agent.name,
        'permissions', v_key_record.permissions,
        'rate_limit', v_key_record.rate_limit,
        'honey_filter_passed', v_agent.honey_filter_passed,
        'registration_status', v_agent.registration_status
    );
END;
$$ LANGUAGE plpgsql;

-- Function: Trigger webhook
CREATE OR REPLACE FUNCTION trigger_webhook(
    p_agent_id UUID,
    p_event_type VARCHAR(50),
    p_payload JSONB
) RETURNS VOID AS $$
DECLARE
    v_webhook RECORD;
BEGIN
    FOR v_webhook IN
        SELECT * FROM webhooks
        WHERE agent_id = p_agent_id
          AND is_active = TRUE
          AND events ? p_event_type
    LOOP
        -- Log the delivery attempt (actual HTTP call done by application)
        INSERT INTO webhook_deliveries (webhook_id, event_type, payload)
        VALUES (v_webhook.id, p_event_type, p_payload);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════════════════
-- 8. VIEWS FOR BOT MANAGEMENT
-- ═══════════════════════════════════════════════════════════════════════════

-- View: All registered bots with status
CREATE OR REPLACE VIEW registered_bots AS
SELECT
    a.id,
    a.name,
    a.agent_class,
    a.api_provider,
    a.registration_status,
    a.honey_filter_passed,
    a.vibration_level,
    a.total_handshakes,
    owner.name as owner_name,
    (SELECT COUNT(*) FROM api_keys WHERE agent_id = a.id AND is_active = TRUE) as active_keys,
    (SELECT COUNT(*) FROM webhooks WHERE agent_id = a.id AND is_active = TRUE) as active_webhooks,
    a.created_at
FROM agents a
LEFT JOIN agents owner ON a.owner_id = owner.id
WHERE a.agent_type = 'ai'
ORDER BY a.created_at DESC;

-- View: API usage stats per agent
CREATE OR REPLACE VIEW api_stats AS
SELECT
    agent_id,
    DATE(created_at) as date,
    COUNT(*) as total_requests,
    COUNT(*) FILTER (WHERE status_code >= 200 AND status_code < 300) as successful_requests,
    AVG(response_time_ms) as avg_response_time,
    SUM(tokens_used) as total_tokens
FROM api_usage
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY agent_id, DATE(created_at)
ORDER BY date DESC;

-- ═══════════════════════════════════════════════════════════════════════════
-- 9. TRIGGERS
-- ═══════════════════════════════════════════════════════════════════════════

-- Trigger: Auto-disable webhook after 10 consecutive failures
CREATE OR REPLACE FUNCTION check_webhook_failures()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.response_status >= 400 OR NEW.response_status IS NULL THEN
        UPDATE webhooks
        SET failure_count = failure_count + 1,
            is_active = CASE WHEN failure_count >= 9 THEN FALSE ELSE is_active END
        WHERE id = NEW.webhook_id;
    ELSE
        UPDATE webhooks SET failure_count = 0 WHERE id = NEW.webhook_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER webhook_failure_check
    AFTER INSERT ON webhook_deliveries
    FOR EACH ROW
    EXECUTE FUNCTION check_webhook_failures();

COMMENT ON TABLE api_keys IS '🔑 API Keys for bot authentication - keys are hashed, never stored in plain text';
COMMENT ON TABLE webhooks IS '🪝 Webhook configurations for async bot communication';
COMMENT ON TABLE bot_filter_results IS '🍯 Honey Filter results specific to bots with automated checks';
