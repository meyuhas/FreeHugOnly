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
