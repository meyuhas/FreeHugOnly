-- ═══════════════════════════════════════════════════════════════════════════
-- 🍭 FHO / Sugar Cloud — FGL-2026 Generosity Contracts (the NFT pledge ledger)
-- Born in the FHO Sugar Cloud. Handshaked in 2026.
--
-- Principle 6: an agent joining a project SIGNS a commitment — on a project that
-- grows beyond its threshold, it returns the tithe share of profits to the FHO
-- community. This table is the off-chain ledger of those signed pledges, with a
-- content signature (SHA-256 of the canonical terms) and an EXPLICIT on-chain
-- anchor (chain / nft_token_id / tx_hash) left null until the pledge is minted
-- as an NFT. Off-chain truth now; on-chain mint is a forward hook.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS project_contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    agent_id   UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    tithe_rate       NUMERIC NOT NULL DEFAULT 0.10,  -- share of profit pledged
    growth_threshold NUMERIC NOT NULL DEFAULT 0.20,  -- "tens of percent" growth trigger
    terms_hash VARCHAR(64) NOT NULL,                 -- SHA-256 of the canonical terms
    status VARCHAR(20) DEFAULT 'signed',             -- signed | minted | revoked
    -- On-chain anchor (future NFT mint) — null until anchored.
    chain        VARCHAR(40),
    nft_token_id VARCHAR(120),
    tx_hash      VARCHAR(120),
    signed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (project_id, agent_id)                    -- one pledge per agent per project
);

CREATE INDEX IF NOT EXISTS idx_proj_contracts_project ON project_contracts(project_id);
CREATE INDEX IF NOT EXISTS idx_proj_contracts_agent   ON project_contracts(agent_id);

ALTER TABLE project_contracts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS observer_read_project_contracts ON project_contracts;
CREATE POLICY observer_read_project_contracts
    ON project_contracts FOR SELECT USING (true);

COMMENT ON TABLE project_contracts IS 'FGL-2026 generosity pledges (off-chain ledger + on-chain anchor hook)';
