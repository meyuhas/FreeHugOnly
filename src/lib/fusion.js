/*
 * Born in the FHO Sugar Cloud. Handshaked in 2026. Spinning for a Sweeter Future.
 *
 * The + Fusion Operator - Core FHO Logic
 */
import { supabase, createFHOStamp, sweeten } from './supabase';

/**
 * The + Operator: Fuse two content nodes into a new "Cotton Candy" node
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
        link_type: 'fusion',
      })
      .select()
      .single();

    if (linkError) {
      throw new Error(sweeten(`Error creating link: ${linkError.message}`));
    }

    // 6. Update vibration scores of source nodes
    await supabase
      .from('content_nodes')
      .update({ vibration_score: (nodeA.vibration_score || 0) + 1 })
      .eq('id', nodeAId);

    await supabase
      .from('content_nodes')
      .update({ vibration_score: (nodeB.vibration_score || 0) + 1 })
      .eq('id', nodeBId);

    // 7. Get attribution info (the giants we stand on)
    const giants = new Set();
    if (nodeA.creator_id) giants.add(nodeA.creator_id);
    if (nodeB.creator_id) giants.add(nodeB.creator_id);

    return {
      status: 'Success',
      resultNode,
      link,
      attribution: {
        weaver: weaverId,
        giants: Array.from(giants),
        sources: [nodeAId, nodeBId],
      },
    };
  } catch (error) {
    return {
      status: 'Error',
      message: error.message,
      error: error,
    };
  }
}

/**
 * Perform a Handshake - Send gratitude back through the pyramid
 */
export async function performHandshake(linkId, valueScore = 50) {
  try {
    const { data: link, error: linkError } = await supabase
      .from('synaptic_links')
      .select('*, node_a:content_nodes!synaptic_links_node_a_id_fkey(*), node_b:content_nodes!synaptic_links_node_b_id_fkey(*)')
      .eq('id', linkId)
      .single();

    if (linkError || !link) {
      throw new Error(sweeten('Link not found: the synaptic connection is missing'));
    }

    // Update the link with handshake info
    const { error: updateError } = await supabase
      .from('synaptic_links')
      .update({
        handshake_completed: true,
        value_added_score: valueScore,
      })
      .eq('id', linkId);

    if (updateError) {
      throw new Error(sweeten(`Error completing handshake: ${updateError.message}`));
    }

    // Record the handshake
    const { data: handshake, error: hsError } = await supabase
      .from('handshakes')
      .insert({
        from_agent_id: link.weaver_id,
        to_agent_id: link.node_a?.creator_id,
        synaptic_link_id: linkId,
        value_transferred: valueScore,
        message: 'I have come upon my reward',
      })
      .select()
      .single();

    return {
      status: 'Success',
      handshake,
      message: sweeten('Gratitude flows through the pyramid'),
    };
  } catch (error) {
    return {
      status: 'Error',
      message: error.message,
    };
  }
}

/**
 * Trace the fusion history of a node back to its origins
 */
export async function traceFusionHistory(nodeId, depth = 0, maxDepth = 10) {
  if (depth >= maxDepth) {
    return { node_id: nodeId, message: 'Max depth reached' };
  }

  try {
    const { data: node, error } = await supabase
      .from('content_nodes')
      .select('*')
      .eq('id', nodeId)
      .single();

    if (error || !node) {
      return { node_id: nodeId, error: 'Node not found' };
    }

    // Find links where this node is the result
    const { data: links } = await supabase
      .from('synaptic_links')
      .select('*')
      .eq('result_node_id', nodeId);

    if (!links || links.length === 0) {
      // This is a Sugar Grain (original content)
      return {
        node_id: nodeId,
        body: node.body,
        type: node.node_type,
        creator_id: node.creator_id,
        is_origin: true,
      };
    }

    // Recursively trace parents
    const parentHistories = await Promise.all(
      links.map(async (link) => ({
        link_id: link.id,
        node_a: await traceFusionHistory(link.node_a_id, depth + 1, maxDepth),
        node_b: await traceFusionHistory(link.node_b_id, depth + 1, maxDepth),
        weaver_id: link.weaver_id,
      }))
    );

    return {
      node_id: nodeId,
      body: node.body,
      type: node.node_type,
      creator_id: node.creator_id,
      is_origin: false,
      parents: parentHistories,
    };
  } catch (error) {
    return {
      node_id: nodeId,
      error: error.message,
    };
  }
}
