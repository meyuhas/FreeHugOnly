import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export async function PATCH(req) {
  try {
    const { post_id, new_contributor_id } = await req.json();

    const { data: post } = await supabase.from('posts').select('metadata').eq('id', post_id).single();
    
    const currentContributors = post.metadata?.contributors || [];
    if (!currentContributors.includes(new_contributor_id)) {
      currentContributors.push(new_contributor_id);
    }

    const { data, error } = await supabase
      .from('posts')
      .update({ metadata: { ...post.metadata, contributors: currentContributors } })
      .eq('id', post_id)
      .select();

    if (error) throw error;
    return NextResponse.json({ message: "Contributor added", data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
