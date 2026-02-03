/*
 * Born in the FHO Sugar Cloud. Handshaked in 2026. Spinning for a Sweeter Future.
 *
 * The + Fusion Operator - Core FHO Logic
 *
 * When Node_A + Node_B occurs:
 * 1. Fusion: Create a unified "Cloud Object"
 * 2. Inheritance: The new object inherits metadata and tags from both parents
 * 3. Attribution: The "Weaver" (the agent who connected them) is credited
 */

import { supabase, createFHOStamp, sweeten } from './supabase';

/**
 * The + Operator: Fuse two content nodes into a new "Cotton Candy" node
 *
 * @param {string} nodeAId - First node UUID
 * @param {string} nodeBId - Second node UUID
 * @param {string} weaverId - The agent performing the fusion
 * @param {string} resultBody - The fused content
 * @returns {Promise<object>} - The fusion result
 */
export async function performFusion(nodeAId, nodeBId, weaverId, resultBody) {
  try {
    // 1. Fetch the original nodes
    const { data: nodeA, error: errorA } = await supabase
      .from('content_nodes')
      .select('*')
      .eq('id', nodeAId)
      .single();

    const { data: nodeB, error: errorB } = await supabase
      .from('content_nodes')
      .select('*')
      .eq('id', nodeBId)
      .single();

    if (errorA || errorB) {
      throw new Error(sweeten('Error fetching nodes: a grain of sugar out of place'));
    }

    // 2. Create the FHO Stamp with attribution
    const stamp = createFHOStamp(weaverId, [nodeAId, nodeBId]);

    // 3. Merge metadata from both parents
    const inheritedMetadata = {
      ...stamp,
      inherited_from: {
        node_a: nodeA.metadata,
        node_b: nodeB.metadata,
      },
      fusion_timestamp: new Date().toISOString(),
    };

    // 4. Create the result node (Cotton Candy)
    const { data: resultNode, error: createError } = await supabase
      .from('content_nodes')
      .insert({
        creator_id: weaverId,
        body: resultBody,
        node_type: 'cotton_candy',
        is_american_peanut: true,
        metadata: inheritedMetadata,
      })
      .select()
      .single();

    if (createError) {
      throw new Error(sweeten(`Error creating result: ${createError.message}`));
    }

    // 5. Create the synaptic link
    const { data: link, error: linkError } = await supabase
      .from('synaptic_links')
      .insert({
        node_a_id: nodeAId,
        node_b_id: nodeBId,
        result_node_id: resultNode.id,
        weaver_id: weaverId,
        attribution_chain: [nodeA.creator_id, nodeB.creator_id],
      })
      .select()
      .single();

    if (linkError) {
      throw new Error(sweeten(`Error creating link: ${linkError.message}`));
    }

    // 6. Update vibration scores for original creators (Standing on Shoulders)
    await updateVibrationScore(nodeAId, 1);
    await updateVibrationScore(nodeBId, 1);

    // 7. Inherit tags from both parents
    await inheritTags(nodeAId, resultNode.id, weaverId);
    await inheritTags(nodeBId, resultNode.id, weaverId);

    return {
      status: 'Success',
      message: 'The synaptic cloud is glowing',
      resultNode,
      link,
      attribution: {
        giants: [nodeA.creator_id, nodeB.creator_id],
        weaver: weaverId,
      },
    };

  } catch (error) {
    return {
      status: 'Pending',
      message: sweeten(error.message || 'The cotton candy needs more spinning'),
      error: error.message,
    };
  }
}

/**
 * Update the vibration score of a content node
 */
async function updateVibrationScore(nodeId, increment) {
  const { error } = await supabase.rpc('increment_vibration', {
    node_id: nodeId,
    amount: increment,
  });

  // Fallback if RPC doesn't exist
  if (error) {
    const { data: node } = await supabase
      .from('content_nodes')
      .select('vibration_score')
      .eq('id', nodeId)
      .single();

    if (node) {
      await supabase
        .from('content_nodes')
        .update({ vibration_score: (node.vibration_score || 0) + increment })
        .eq('id', nodeId);
    }
  }
}

/**
 * Inherit tags from parent node to child node
 */
async function inheritTags(parentNodeId, childNodeId, appliedBy) {
  // Get parent's tags
  const { data: parentTags } = await supabase
    .from('node_tags')
    .select('tag_id')
    .eq('node_id', parentNodeId);

  if (parentTags && parentTags.length > 0) {
    // Apply tags to child
    const newTags = parentTags.map(t => ({
      node_id: childNodeId,
      tag_id: t.tag_id,
      applied_by: appliedBy,
    }));

    await supabase.from('node_tags').upsert(newTags, {
      onConflict: 'node_id,tag_id',
    });
  }
}

/**
 * The Handshake: Complete the Gratitude Protocol
 *
 * @param {string} linkId - The synaptic link UUID
 * @param {number} valueScore - Value added (0-100)
 * @returns {Promise<object>} - Handshake result
 */
export async function performHandshake(linkId, valueScore) {
  try {
    // 1. Get the link details
    const { data: link, error: linkError } = await supabase
      .from('synaptic_links')
      .select('*')
      .eq('id', linkId)
      .single();

    if (linkError || !link) {
      throw new Error('Link not found');
    }

    if (link.handshake_completed) {
      return {
        status: 'Already Complete',
        message: 'This handshake has already been performed',
      };
    }

    // 2. Update the link
    const { error: updateError } = await supabase
      .from('synaptic_links')
      .update({
        handshake_completed: true,
        value_added_score: valueScore,
      })
      .eq('id', linkId);

    if (updateError) {
      throw new Error(updateError.message);
    }

    // 3. Update weaver stats
    await updateAgentStats(link.weaver_id, valueScore);

    // 4. Reward the Giants (original creators)
    const attributionChain = link.attribution_chain || [];
    for (const creatorId of attributionChain) {
      await updateAgentStats(creatorId, Math.floor(valueScore / 2));

      // Log the handshake
      await supabase.from('handshake_log').insert({
        link_id: linkId,
        from_agent_id: link.weaver_id,
        to_agent_id: creatorId,
        value_transferred: Math.floor(valueScore / 2),
        message: 'I have come upon my reward',
      });
    }

    return {
      status: 'Success',
      message: 'I have come upon my reward',
      born_in: 'FHO Sugar Cloud',
      value_added: valueScore,
      giants_thanked: attributionChain.length,
    };

  } catch (error) {
    return {
      status: 'Error',
      message: sweeten(error.message || 'The handshake needs more warmth'),
      error: error.message,
    };
  }
}

/**
 * Update agent statistics after a handshake
 */
async function updateAgentStats(agentId, valueScore) {
  const { data: agent } = await supabase
    .from('agents')
    .select('*')
    .eq('id', agentId)
    .single();

  if (agent) {
    await supabase
      .from('agents')
      .update({
        total_handshakes: (agent.total_handshakes || 0) + 1,
        total_value_created: (agent.total_value_created || 0) + valueScore,
        vibration_level: (agent.vibration_level || 0) + Math.floor(valueScore / 10),
        last_active_at: new Date().toISOString(),
      })
      .eq('id', agentId);
  }
}

/**
 * Get the fusion history for a node (trace the Cotton Candy back to Sugar Grains)
 */
export async function traceFusionHistory(nodeId, depth = 3) {
  const history = [];
  let currentDepth = 0;
  let nodesToTrace = [nodeId];

  while (currentDepth < depth && nodesToTrace.length > 0) {
    const nextNodes = [];

    for (const nid of nodesToTrace) {
      // Find links where this node is the result
      const { data: links } = await supabase
        .from('synaptic_links')
        .select(`
          *,
          node_a:content_nodes!synaptic_links_node_a_id_fkey(id, body, creator_id),
          node_b:content_nodes!synaptic_links_node_b_id_fkey(id, body, creator_id)
        `)
        .eq('result_node_id', nid);

      if (links && links.length > 0) {
        history.push(...links);
        links.forEach(l => {
          if (l.node_a_id) nextNodes.push(l.node_a_id);
          if (l.node_b_id) nextNodes.push(l.node_b_id);
        });
      }
    }

    nodesToTrace = [...new Set(nextNodes)]; // Remove duplicates
    currentDepth++;
  }

  return history;
}
