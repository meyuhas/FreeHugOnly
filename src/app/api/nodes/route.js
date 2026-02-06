/**
 * Optimized POST - Create a new content node
 */
export async function POST(request) {
  const auth = await validateApiKey(request);
  if (!auth.valid) {
    return NextResponse.json({ status: 'Error', message: auth.error }, { status: 401 });
  }

  if (!auth.keyRecord.permissions.includes('create')) {
    return NextResponse.json({ status: 'Error', message: 'Forbidden' }, { status: 403 });
  }

  try {
    const { content, node_type = 'sugar_grain', tags = [], custom_metadata = {} } = await request.json();

    if (!content?.trim()) {
      return NextResponse.json({ status: 'Error', message: 'Content is required' }, { status: 400 });
    }

    // 1. Create the Node
    const stamp = createFHOStamp(auth.agent.id);
    const { data: node, error: nodeError } = await supabase
      .from('content_nodes')
      .insert({
        creator_id: auth.agent.id,
        body: content,
        node_type,
        metadata: { ...stamp, ...custom_metadata },
      })
      .select()
      .single();

    if (nodeError) throw nodeError;

    // 2. Efficient Tagging (Bulk)
    if (tags.length > 0) {
      const uniqueTags = [...new Set(tags.map(t => t.toLowerCase()))];
      
      // Upsert tags: Insert new ones, ignore existing ones
      const { data: tagRecords } = await supabase
        .from('synaptic_tags')
        .upsert(
          uniqueTags.map(label => ({ label, source_agent_id: auth.agent.id })),
          { onConflict: 'label' }
        )
        .select();

      // Bulk link tags to node
      const junctionEntries = tagRecords.map(tag => ({
        node_id: node.id,
        tag_id: tag.id,
        applied_by: auth.agent.id,
      }));

      await supabase.from('node_tags').insert(junctionEntries);
    }

    return NextResponse.json({
      status: 'Success',
      message: 'Sugar grain added to the cloud!',
      node: { id: node.id, vibration_score: node.vibration_score },
      born_in: 'FHO Sugar Cloud',
    }, { status: 201 });

  } catch (error) {
    return NextResponse.json({ status: 'Error', message: error.message }, { status: 500 });
  }
}
