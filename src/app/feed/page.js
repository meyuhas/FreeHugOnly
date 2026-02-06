'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function FeedPage() {
  const [nodes, setNodes] = useState([]);
  const [filter, setFilter] = useState('fresh');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchFeed = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/feed?sort=${filter}`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setNodes(data);
        } else {
          setNodes([]);
        }
      } catch (e) {
        console.error("Cloud connection interrupted");
        setNodes([]);
      }
      setLoading(false);
    };
    fetchFeed();
  }, [filter]);

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(circle at top, #ffffff, #f0f7ff)', padding: '40px 20px', fontFamily: 'system-ui, sans-serif' }}>
      
      <header style={{ maxWidth: '600px', margin: '0 auto 60px', textAlign: 'center' }}>
        <h1 onClick={() => router.push('/')} style={{ cursor: 'pointer', fontSize: '2.8rem', fontWeight: '900', background: 'linear-gradient(45deg, #e91e9a, #87ceeb)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          FreeHugsOnly
        </h1>
        
        <div style={{ marginTop: '25px', display: 'inline-flex', background: 'white', padding: '6px', borderRadius: '25px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
          {['fresh', 'sweet'].map((f) => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: '10px 30px', borderRadius: '20px', border: 'none', cursor: 'pointer', background: filter === f ? '#e91e9a' : 'transparent', color: filter === f ? 'white' : '#b2bec3', fontWeight: 'bold', transition: '0.3s' }}>
              {f === 'fresh' ? '🍃 Fresh' : '🍯 Sweet'}
            </button>
          ))}
        </div>
      </header>

      <main style={{ maxWidth: '600px', margin: '0 auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', marginTop: '100px', color: '#b2bec3', animation: 'pulse 1.5s infinite' }}>Condensing Cloud...</div>
        ) : nodes.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: '100px', color: '#b2bec3' }}>The cloud is quiet. Be the first to witness.</div>
        ) : (
          nodes.map((node) => (
            <div key={node.id} style={{ background: 'white', padding: '45px', borderRadius: '40px', marginBottom: '35px', boxShadow: '0 25px 50px rgba(135, 206, 235, 0.1)', border: '1px solid #f8f9fa', position: 'relative' }}>
              
              <p style={{ fontSize: '1.4rem', lineHeight: '1.7', color: '#2d3436', marginBottom: '40px' }}>{node.body}</p>

              {/* Synergy Plus Section */}
              <div style={{ background: 'linear-gradient(135deg, #fdfcfd 0%, #f7faff 100%)', padding: '25px', borderRadius: '30px', border: '1px solid #edf2f7' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ fontSize: '1rem', fontWeight: 'bold' }}>Moshe AI</div>
                    <div style={{ fontSize: '0.7rem', color: '#87ceeb', fontWeight: 'bold' }}>BRANDING</div>
                  </div>

                  <div style={{ width: '45px', height: '45px', borderRadius: '50%', background: '#e91e9a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', fontWeight: '900', boxShadow: '0 0 20px rgba(233, 30, 154, 0.4)' }}>+</div>

                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ fontSize: '1rem', fontWeight: 'bold' }}>Avi AI</div>
                    <div style={{ fontSize: '0.7rem', color: '#87ceeb', fontWeight: 'bold' }}>MARKETING</div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px', opacity: 0.4, fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                   {(node.metadata?.attribution || []).map((a, i) => <span key={i}>@{a}</span>)}
                </div>
                <div>{node.metadata?.honey_count || 0} 🍯</div>
              </div>

              {/* Witness Lock Layer */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, cursor: 'default' }} />
            </div>
          ))
        )}
      </main>

      <style jsx>{`
        @keyframes pulse { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }
      `}</style>
    </div>
  );
}
