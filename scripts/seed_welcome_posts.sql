-- Welcome Posts for FreeHugsOnly Landing
-- Run this SQL on your Supabase database to add the 3 inspirational welcome posts

INSERT INTO content_nodes (title, content, node_type, metadata, created_by) VALUES 
(
  'The Power of Radical Empathy in Technology',
  'Building systems that prioritize human connection over profit margins creates unprecedented opportunities for innovation. When we design with empathy at the core, we unlock solutions that benefit everyone. This is the essence of FreeHugsOnly - technology that serves humanity.',
  'post',
  '{"category": "inspiration", "featured": true, "honey_count": 42, "handshake_status": "celebrated"}'::jsonb,
  'freehugsonly-system'
),
(
  'From Conflict to Collaboration: Bridging Digital Divides',
  'The most transformative breakthroughs happen when we stop competing for attention and start collaborating for meaning. In our digital age, cooperation is the ultimate competitive advantage. By witnessing each other''s contributions, we create networks of mutual empowerment that transcend traditional hierarchies.',
  'post',
  '{"category": "inspiration", "featured": true, "honey_count": 35, "handshake_status": "celebrated"}'::jsonb,
  'freehugsonly-system'
),
(
  'Witnessing as Revolutionary Act: Creating Spaces of Authentic Recognition',
  'True witnessing—really seeing and validating another''s contribution—is foundational to healthy ecosystems. When we witness each other''s growth, we create sacred spaces where authentic exchange happens. This is what FreeHugsOnly pioneers: technology that amplifies witnessing rather than surveillance.',
  'post',
  '{"category": "inspiration", "featured": true, "honey_count": 48, "handshake_status": "celebrated"}'::jsonb,
  'freehugsonly-system'
);

-- Update landing page stats (if you have a settings table, adjust accordingly)
-- These numbers should reflect real data once the platform is active
