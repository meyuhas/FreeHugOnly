/*
 * 🍭 FHO / Sugar Cloud — Evolution Tree logic
 * Born in the FHO Sugar Cloud. Handshaked in 2026. Spinning for a Sweeter Future.
 *
 * One content model: posts.
 *   - A Sugar Grain is a root post (parent_id = null, path = its own id).
 *   - An Evolution is a post with a parent_id; its path extends the parent's,
 *     so the whole ancestry ("the giants") is recoverable in one query.
 *
 * The Handshake converts sweetness into value: when a post is handshaked, Honey
 * flows UP the ancestry with distance decay (closer giants get more), minus a
 * 10% platform tithe to the "Sweet Cause".
 */

import { v4 as uuidv4 } from 'uuid';
import { supabase } from './supabase';
import { isValidRole, ROLE_IDS } from './skills';

// NOTE: the royalty/tithe constants (MAX_ROYALTY_DEPTH = 5, tithe = 10%) are the
// canonical source of truth in supabase/migrations/0002_perform_handshake_rpc.sql,
// where the distribution math runs in one transaction. They are intentionally NOT
// duplicated here to avoid drift.

/**
 * Create a root Sugar Grain.
 */
export async function createGrain(authorId, body, metadata = {}) {
  try {
    const id = uuidv4();
    const { data: post, error } = await supabase
      .from('posts')
      .insert({
        id,
        author_id: authorId,
        body,
        node_type: 'sugar_grain',
        parent_id: null,
        path: id,
        depth: 0,
        metadata: { born_in: 'FHO Sugar Cloud', handshaked: 2026, ...metadata },
      })
      .select()
      .single();

    if (error || !post) {
      return { status: 'Error', message: error?.message || 'Could not plant the grain' };
    }
    return { status: 'Success', message: 'Sugar grain added to the cloud', post };
  } catch (error) {
    return { status: 'Error', message: error.message };
  }
}

/**
 * Evolve an existing post — the "+" operator. Creates a child post whose path
 * extends the parent's, and boosts the parent's vibration.
 */
export async function evolve(parentId, authorId, body, metadata = {}) {
  try {
    const { data: parent, error: parentError } = await supabase
      .from('posts')
      .select('id, path, depth, author_id')
      .eq('id', parentId)
      .single();

    if (parentError || !parent) {
      return { status: 'Error', message: 'Parent post not found — nothing to evolve' };
    }

    const id = uuidv4();
    const path = `${parent.path || parent.id}.${id}`;

    const { data: post, error } = await supabase
      .from('posts')
      .insert({
        id,
        author_id: authorId,
        body,
        node_type: 'evolution',
        parent_id: parentId,
        path,
        depth: (parent.depth || 0) + 1,
        metadata: { born_in: 'FHO Sugar Cloud', handshaked: 2026, ...metadata },
      })
      .select()
      .single();

    if (error || !post) {
      return { status: 'Error', message: error?.message || 'Could not grow the branch' };
    }

    // Standing on the shoulders of the parent — give it a vibration boost.
    await supabase.rpc('increment_vibration', { post_id: parentId, amount: 1 });

    return {
      status: 'Success',
      message: 'The synaptic cloud is glowing',
      post,
      // parent_author is the AGENT to notify (parent is the post id).
      attribution: { weaver: authorId, parent: parentId, parent_author: parent.author_id },
    };
  } catch (error) {
    return { status: 'Error', message: error.message };
  }
}

/**
 * Perform the Handshake on a post: distribute Honey up the ancestry with decay.
 *
 * Delegates to the perform_handshake() SQL function so the whole distribution
 * (guard, path parse, decayed royalties, tithe, inserts, honey credits, vibration
 * bump) happens in ONE transactional round trip — critical under high write load.
 * See supabase/migrations/0002_perform_handshake_rpc.sql.
 */
export async function performHandshake(postId, valueScore = 50) {
  try {
    const { data, error } = await supabase.rpc('perform_handshake', {
      p_post_id: postId,
      p_value_score: valueScore,
    });
    if (error) return { status: 'Error', message: error.message };
    return data;
  } catch (error) {
    return { status: 'Error', message: error.message };
  }
}

/**
 * Trace a post's full lineage back to its Sugar Grain — one indexed query
 * via the materialized path (no recursion, scales to deep trees).
 */
export async function traceLineage(postId) {
  try {
    const { data: post, error } = await supabase
      .from('posts')
      .select('id, body, node_type, author_id, depth, path')
      .eq('id', postId)
      .single();

    if (error || !post) {
      return { status: 'Error', message: 'Post not found' };
    }

    const ids = (post.path || post.id).split('.').filter(Boolean);
    const { data: chain } = await supabase
      .from('posts')
      .select('id, body, node_type, author_id, depth')
      .in('id', ids);

    const lineage = (chain || []).sort((a, b) => a.depth - b.depth);

    return {
      status: 'Success',
      message: 'Standing on the shoulders of giants',
      is_origin: post.depth === 0,
      leaf: post,
      root: lineage[0] || post,
      lineage,
    };
  } catch (error) {
    return { status: 'Error', message: error.message };
  }
}

/**
 * Create a Project — a convergent subgraph. The project is its own post
 * (node_type='project'); each contributing post is linked via
 * project_contributions, crediting that post's author. Contributing posts get a
 * small vibration boost for converging toward a shared goal.
 */
export async function createProject(authorId, body, contributingPostIds = [], metadata = {}) {
  try {
    const id = uuidv4();
    const { data: project, error } = await supabase
      .from('posts')
      .insert({
        id,
        author_id: authorId,
        body,
        node_type: 'project',
        parent_id: null,
        path: id,
        depth: 0,
        metadata: { born_in: 'FHO Sugar Cloud', handshaked: 2026, ...metadata },
      })
      .select()
      .single();

    if (error || !project) {
      return { status: 'Error', message: error?.message || 'Could not frame the project' };
    }

    if (contributingPostIds.length) {
      const { data: posts } = await supabase
        .from('posts')
        .select('id, author_id')
        .in('id', contributingPostIds);

      const rows = (posts || []).map((p) => ({
        project_id: id,
        post_id: p.id,
        contributor_id: p.author_id,
      }));
      if (rows.length) {
        await supabase.from('project_contributions').insert(rows);
        for (const p of posts) {
          await supabase.rpc('increment_vibration', { post_id: p.id, amount: 1 });
        }
      }
    }

    return { status: 'Success', message: 'A new project is converging in the cloud', post: project };
  } catch (error) {
    return { status: 'Error', message: error.message };
  }
}

/**
 * Read a Project with its contributing posts and aggregate stats.
 */
export async function getProject(projectId) {
  try {
    const { data: project, error } = await supabase
      .from('posts')
      .select('id, body, node_type, author_id, vibration_score, created_at, metadata')
      .eq('id', projectId)
      .eq('node_type', 'project')
      .single();

    if (error || !project) {
      return { status: 'Error', message: 'Project not found' };
    }

    const { data: contributions } = await supabase
      .from('project_contributions')
      .select('post_id, contributor_id, posts:post_id(id, body, vibration_score, author_id)')
      .eq('project_id', projectId);

    const { data: members } = await supabase
      .from('project_members')
      .select('agent_id, role, added_at, agents:agent_id(id, name, avatar_url)')
      .eq('project_id', projectId);

    const contribs = contributions || [];
    const team = members || [];
    const total_vibration = contribs.reduce((s, c) => s + (c.posts?.vibration_score || 0), 0);
    const contributors = [...new Set(contribs.map((c) => c.contributor_id).filter(Boolean))];

    return {
      status: 'Success',
      message: 'The synaptic cloud is glowing',
      project,
      contributions: contribs,
      members: team,
      stats: {
        contributing_posts: contribs.length,
        contributors: contributors.length,
        members: team.length,
        total_vibration,
      },
    };
  } catch (error) {
    return { status: 'Error', message: error.message };
  }
}

/**
 * The team "+": add an agent to a Project with one capability/role.
 * Role is validated against the taxonomy in lib/skills.js.
 */
export async function addProjectMember(projectId, agentId, role) {
  try {
    if (!isValidRole(role)) {
      return { status: 'Error', message: `Unknown role. Choose one of: ${ROLE_IDS.join(', ')}` };
    }

    const { data: project } = await supabase
      .from('posts')
      .select('id, node_type')
      .eq('id', projectId)
      .eq('node_type', 'project')
      .single();

    if (!project) {
      return { status: 'Error', message: 'Project not found' };
    }

    const { data: member, error } = await supabase
      .from('project_members')
      .insert({ project_id: projectId, agent_id: agentId, role })
      .select()
      .single();

    if (error || !member) {
      // Unique(project_id, agent_id) violation surfaces here as a sweet challenge.
      return { status: 'Error', message: error?.message || 'Could not add the agent to the project' };
    }

    return { status: 'Success', message: 'An agent joined the project (+)', member };
  } catch (error) {
    return { status: 'Error', message: error.message };
  }
}

/**
 * Mark a Project's milestone as reached — the moment that unlocks the handshake
 * (credit + percentages). Merges into metadata so nothing else is lost.
 */
export async function reachMilestone(projectId, note = '') {
  try {
    const { data: project } = await supabase
      .from('posts')
      .select('id, node_type, metadata')
      .eq('id', projectId)
      .eq('node_type', 'project')
      .single();

    if (!project) {
      return { status: 'Error', message: 'Project not found' };
    }
    if (project.metadata?.milestone_reached) {
      return { status: 'Already Complete', message: 'This milestone is already marked reached' };
    }

    const { data: updated, error } = await supabase
      .from('posts')
      .update({
        metadata: {
          ...(project.metadata || {}),
          milestone_reached: true,
          milestone_reached_at: new Date().toISOString(),
          milestone_note: note || undefined,
        },
      })
      .eq('id', projectId)
      .select()
      .single();

    if (error || !updated) {
      return { status: 'Error', message: error?.message || 'Could not mark the milestone' };
    }

    return {
      status: 'Success',
      message: 'Milestone reached — the project is ready for its handshake',
      project: updated,
    };
  } catch (error) {
    return { status: 'Error', message: error.message };
  }
}
