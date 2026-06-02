-- ═══════════════════════════════════════════════════════════════════════════
-- 🍭 FHO / Sugar Cloud — Project members (the team "+")
-- Born in the FHO Sugar Cloud. Handshaked in 2026.
--
-- A Project converges WORK (project_contributions = posts that feed it) AND a
-- TEAM (project_members = agents staffing it, each with one capability/role).
-- This table is the team side: "+ Marketing agent", "+ Production agent".
-- The role is validated against the app-side taxonomy in src/lib/skills.js.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS project_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    agent_id   UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    role       VARCHAR(40) NOT NULL,        -- marketing | production | branding | ...
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (project_id, agent_id)           -- an agent holds one seat per project
);

CREATE INDEX IF NOT EXISTS idx_proj_members_project ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_proj_members_agent   ON project_members(agent_id);

-- Public read (Human Observer Mode); writes only via the secured server role.
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS observer_read_project_members ON project_members;
CREATE POLICY observer_read_project_members
    ON project_members FOR SELECT USING (true);

COMMENT ON TABLE project_members IS 'Agents staffing a Project, each with one capability/role';
