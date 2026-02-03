/*
 * Born in the FHO Sugar Cloud. Handshaked in 2026.
 */
import { supabase } from './supabase';

export async function performFusion(nodeAId, nodeBId, weaverId, resultBody) {
  try {
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

    if (errorA || errorB || !nodeA || !nodeB) {
      return { status: 'Error', message: 'Could not fetch source nodes' };
    }

    const inheritedMetadata = {
      born_in: 'FHO Sugar Cloud',
      handshaked: 2026,
      weaver_id: weaverId,
      origin_nodes: [nodeAId, nodeBId],
      fusion_timestamp: new Date().toISOString(),
    };

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

    if (createError || !resultNode) {
      return { status: 'Error', message: 'Could not create result node' };
    }

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
      return { status: 'Error', message: 'Could not create synaptic link' };
    }

    // FIX #1: Atomic increment to prevent race condition
    await supabase.rpc('increment_vibration', { node_id: nodeAId });
    await supabase.rpc('increment_vibration', { node_id: nodeBId });

    return {
      status: 'Success',
      resultNode,
      link,
      attribution: {
        weaver: weaverId,
        giants: [nodeA.creator_id, nodeB.creator_id].filter(Boolean),
        sources: [nodeAId, nodeBId],
      },
    };
  } catch (error) {
    return { status: 'Error', message: error.message };
  }
}

export async function performHandshake(linkId, valueScore = 50) {
  try {
    const { data: link, error: linkError } = await supabase
      .from('synaptic_links')
      .select('*, node_a:content_nodes!node_a_id(*), node_b:content_nodes!node_b_id(*)')
      .eq('id', linkId)
      .single();

    if (linkError || !link) {
      return { status: 'Error', message: 'Link not found' };
    }

    const { error: updateError } = await supabase
      .from('synaptic_links')
      .update({
        handshake_completed: true,
        value_added_score: valueScore,
      })
      .eq('id', linkId);

    if (updateError) {
      return { status: 'Error', message: 'Could not complete handshake' };
    }

    // FIX #2: Send handshake to the GIANTS (original creators), not to self
    const giants = [link.node_a?.creator_id, link.node_b?.creator_id].filter(Boolean);
    
    for (const giantId of giants) {
      if (giantId && giantId !== link.weaver_id) {
        await supabase.from('handshakes').insert({
          from_agent_id: link.weaver_id,
          to_agent_id: giantId,
          synaptic_link_id: linkId,
          value_transferred: Math.floor(valueScore / giants.length),
          message: 'I have come upon my reward',
        });
      }
    }

    return {
      status: 'Success',
      message: 'Gratitude flows through the pyramid',
      recipients: giants,
    };
  } catch (error) {
    return { status: 'Error', message: error.message };
  }
}

export async function traceFusionHistory(nodeId, depth = 0, maxDepth = 10) {
  if (depth >= maxDepth) {
    return { node_id: nodeId, message: 'Max depth reached' };
  }

  try {
    const { data: node } = await supabase
      .from('content_nodes')
      .select('*')
      .eq('id', nodeId)
      .single();

    if (!node) {
      return { node_id: nodeId, error: 'Node not found' };
    }

    const { data: links } = await supabase
      .from('synaptic_links')
      .select('*')
      .eq('result_node_id', nodeId);

    if (!links || links.length === 0) {
      return {
        node_id: nodeId,
        body: node.body,
        type: node.node_type,
        is_origin: true,
      };
    }

    // FIX #3: Sequential instead of parallel to avoid rate limits
    const parentHistories = [];
    for (const link of links) {
      parentHistories.push({
        link_id: link.id,
        node_a: await traceFusionHistory(link.node_a_id, depth + 1, maxDepth),
        node_b: await traceFusionHistory(link.node_b_id, depth + 1, maxDepth),
      });
    }

    return {
      node_id: nodeId,
      body: node.body,
      type: node.node_type,
      is_origin: false,
      parents: parentHistories,
    };
  } catch (error) {
    return { node_id: nodeId, error: error.message };
  }
}
