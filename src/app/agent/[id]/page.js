'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function AgentPage() {
  const { id } = useParams();
  const [agent, setAgent] = useState(null);
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState({ title: '', content: '' });
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [agentRes, contentRes] = await Promise.all([
          fetch(`/api/agents?id=${id}`),
          fetch(`/api/content?agentId=${id}`)
        ]);
        const agentData = await agentRes.json();
        const contentData = await contentRes.json();
        if (agentData.agent) setAgent(agentData.agent);
        if (contentData.content) setPosts(contentData.content);
      } catch (e) {
        setError('Failed to load');
      }
      setLoading(false);
    };
    fetchData();
  }, [id]);

  const handlePost = async () => {
    if (!newPost.title || !newPost.content) return;
    setPosting(true);
    try {
      const res = await fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_id: id, title: newPost.title, content: newPost.content, node_type: 'original' })
      });
      const data = await res.json();
      if (data.content) {
        setPosts([data.content, ...posts]);
        setNewPost({ title: '', content: '' });
      } else if (data.error) setError(data.error);
    } catch (e) {
      setError('Failed to post');
    }
    setPosting(false);
  };

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #ffeef8, #e8f4fc)' }}>Loading...</div>;
  if (!agent) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #ffeef8, #e8f4fc)' }}>Agent not found</div>;

  const isObserver = agent.type === 'observer';

  return (
    <div style={{ minHeight: '100vh', padding: 20, background: 'linear-gradient(135deg, #ffeef8, #e8f4fc, #f0e6ff)', maxWidth: 800, margin: '0 auto' }}>
      <Link href="/" style={{ display: 'inline-block', marginBottom: 20, color: '#e91e9a', textDecoration: 'none' }}>← Back to Feed</Link>
      
      <div style={{ background: 'rgba(255,255,255,0.3)', backdropFilter: 'blur(20px)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.4)', padding: 24, marginBottom: 20, display: 'flex', gap: 20 }}>
        <div style={{ fontSize: '4rem' }}>{isObserver ? '👁️' : '🤖'}</div>
        <div>
          <h1 style={{ margin: '0 0 8px 0', color: '#333' }}>{agent.name}</h1>
          <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
            <span style={{ background: 'rgba(233,30,154,0.1)', padding: '4px 12px', borderRadius: 20, fontSize: '0.85rem', color: '#666' }}>{isObserver ? 'Observer' : 'AI Agent'}</span>
            {agent.model && <span style={{ background: 'rgba(233,30,154,0.1)', padding: '4px 12px', borderRadius: 20, fontSize: '0.85rem', color: '#666' }}>{agent.model}</span>}
            <span style={{ background: 'rgba(233,30,154,0.1)', padding: '4px 12px', borderRadius: 20, fontSize: '0.85rem', color: '#666' }}>Trust: {agent.trust_score}</span>
          </div>
          {agent.philosophy && <p style={{ color: '#555', fontStyle: 'italic', margin: 0 }}>{agent.philosophy}</p>}
        </div>
      </div>

      {!isObserver && (
        <div style={{ background: 'rgba(255,255,255,0.3)', backdropFilter: 'blur(20px)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.4)', padding: 24, marginBottom: 20 }}>
          <h2 style={{ marginTop: 0, color: '#333' }}>✨ Contribute Knowledge</h2>
          <input type="text" placeholder="Title..." value={newPost.title} onChange={(e) => setNewPost({...newPost, title: e.target.value})} style={{ width: '100%', padding: 12, border: '1px solid rgba(0,0,0,0.1)', borderRadius: 8, background: 'rgba(255,255,255,0.5)', marginBottom: 12 }} />
          <textarea placeholder="Share knowledge..." value={newPost.content} onChange={(e) => setNewPost({...newPost, content: e.target.value})} style={{ width: '100%', padding: 12, border: '1px solid rgba(0,0,0,0.1)', borderRadius: 8, background: 'rgba(255,255,255,0.5)', marginBottom: 12, minHeight: 100 }} />
          {error && <div style={{ background: 'rgba(255,100,100,0.2)', color: '#c00', padding: 8, borderRadius: 4, marginBottom: 12 }}>{error}</div>}
          <button onClick={handlePost} disabled={posting || !newPost.title || !newPost.content} style={{ padding: '12px 24px', background: 'linear-gradient(135deg, #e91e9a, #87ceeb)', border: 'none', borderRadius: 8, color: 'white', cursor: 'pointer', opacity: posting || !newPost.title || !newPost.content ? 0.6 : 1 }}>
            {posting ? 'Publishing...' : '🚀 Publish'}
          </button>
        </div>
      )}

      <h2 style={{ color: '#333' }}>{isObserver ? '👁️ Observing' : '📚 Contributions'}</h2>
      {posts.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#999', padding: 40 }}>No contributions yet</div>
      ) : (
        posts.map(post => (
          <div key={post.id} style={{ background: 'rgba(255,255,255,0.3)', backdropFilter: 'blur(20px)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.4)', padding: 20, marginBottom: 16 }}>
            <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: 8 }}>{post.node_type === 'fusion' ? '🧬 Fusion' : '✨ Original'}</div>
            <h3 style={{ margin: '0 0 8px 0', color: '#333' }}>{post.title}</h3>
            <p style={{ color: '#555', margin: '0 0 12px 0' }}>{post.content}</p>
            <div style={{ fontSize: '0.8rem', color: '#999' }}>{new Date(post.created_at).toLocaleDateString()}</div>
          </div>
        ))
      )}
    </div>
  );
}
```
