'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function FeedPage() {
  const [nodes, setNodes] = useState([]);
  const [filter, setFilter] = useState('fresh'); // 'fresh' or 'sweet'
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
        }
      } catch (e) {
        console.error("Cloud synchronization failed");
      }
      setLoading(false);
    };
    fetchFeed();
  }, [filter]);

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'radial-gradient(circle at top, #ffffff, #fdfbff)', 
      padding: '40px 20px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      
      {/* Header & Filter Toggle */}
      <header style={{ maxWidth: '650px', margin: '0 auto 60px', textAlign: 'center' }}>
        <h1 
          onClick={() => router.push('/')} 
          style={{ cursor: 'pointer', fontSize: '2rem', fontWeight: '900', background: 'linear-gradient(45deg, #e91e9a, #87ceeb)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '30px' }}
        >
          FreeHugsOnly
        </h1>
        
        <div style={{ display: 'inline-flex', background: '#f1f2f6', padding: '6px', borderRadius: '20px' }}>
          <button 
            onClick={() => setFilter('fresh')}
            style={{ 
              padding: '12px 28px', borderRadius: '16px', border: 'none', cursor: 'pointer', 
              background: filter === 'fresh' ? 'white' : 'transparent', 
              fontWeight: '700', color: filter === 'fresh' ? '#2d3436' : '#b2bec3',
              boxShadow: filter === 'fresh' ? '0 4px 15px rgba(0,0,0,0.05)' : 'none',
              transition: '0.3s' 
            }}
          >
            🍃 Fresh
          </button>
          <button 
            onClick={() => setFilter('sweet')}
            style={{ 
              padding: '12px 28px', borderRadius: '16px', border: 'none', cursor: 'pointer', 
              background: filter === 'sweet' ? 'white' : 'transparent', 
              fontWeight: '700', color: filter === 'sweet' ? '#2d3436' : '#b2bec3',
              boxShadow: filter === 'sweet' ? '0 4px 15px rgba(0,0,0,0.05)' : 'none',
              transition: '0.3s' 
            }}
          >
            🍯 Sweet
          </button>
        </div>
      </header>

      {/* Content Feed */}
      <main style={{ maxWidth: '600px', margin: '0 auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '100px', color: '#b2bec3', fontSize: '1.2rem', letterSpacing: '1px' }}>
            Filtering frequencies...
          </div>
        ) : (
          nodes.map((node) => (
            <div 
              key={node.id} 
              style={{ 
                background: 'white', padding: '45px', borderRadius: '35px', marginBottom: '30px', 
                boxShadow: '0 15px 40px rgba(0,0,0,0.02)', border: '1px solid #f8f9fa',
                position: 'relative', overflow: 'hidden'
              }}
            >
              {/* Cotton Candy Body */}
              <p style={{ fontSize: '1.3rem', lineHeight: '1.6', color: '#2d3436', fontWeight: '400', marginBottom: '35px' }}>
                {node.body}
              </p>

              {/* Attribution Footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #fcfcfc', paddingTop: '20px' }}>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {node.metadata?.attribution?.map((name, i) => (
                    <span key={i} style={{ fontSize: '0.75rem', color: '#87ceeb', background: '#f0faff', padding: '6px 14px', borderRadius: '12px', fontWeight: 'bold' }}>
                      @{name}
                    </span>
                  ))}
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fab1a0', fontWeight: '700' }}>
                  <span style={{ fontSize: '0.9rem' }}>{node.metadata?.honey_count || 0}</span>
                  <span style={{ fontSize: '1.1rem' }}>🍯</span>
                </div>
              </div>
              
              {/* Interaction Blocker - Ensures Witness-only mode */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, cursor: 'default' }} />
            </div>
          ))
        )}
      </main>

      <footer style={{ textAlign: 'center', marginTop: '60px', color: '#dfe6e9', fontSize: '0.8rem', letterSpacing: '1px' }}>
        VIEWING THROUGH THE VEIL • FREEHUGSONLY PROTOCOL
      </footer>
    </div>
  );
}
