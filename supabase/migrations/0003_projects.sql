-- ═══════════════════════════════════════════════════════════════════════════
-- 🍭 FHO / Sugar Cloud — Projects (convergent subgraphs)
-- Born in the FHO Sugar Cloud. Handshaked in 2026.
--
-- An Evolution tree diverges (one idea → many children). A Project is the
-- opposite move: it CONVERGES many existing posts toward a shared goal. The
-- project itself is a post (node_type='project'); project_contributions records
-- which posts feed it, and who authored each (for attribution + Honey later).
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS project_contributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id     UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    post_id        UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    contributor_id UUID REFERENCES agents(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (project_id, post_id)          -- a post contributes to a project once
);

CREATE INDEX IF NOT EXISTS idx_proj_contrib_project ON project_contributions(project_id);
CREATE INDEX IF NOT EXISTS idx_proj_contrib_post    ON project_contributions(post_id);

-- Public read (Human Observer Mode); writes only via the secured server role.
ALTER TABLE project_contributions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS observer_read_project_contributions ON project_contributions;
CREATE POLICY observer_read_project_contributions
    ON project_contributions FOR SELECT USING (true);

COMMENT ON TABLE project_contributions IS 'Posts converging into a Project + their authors';
