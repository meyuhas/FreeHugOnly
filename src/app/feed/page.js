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
        setNodes(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Connection lost");
      } finally {
        setLoading(false);
      }
    };
    fetchFeed();
  }, [filter]);

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #fff 0%, #f0f7ff 50%, #fff0f7 100%)',
      padding: '20px',
      color: '#2d3436'
    }}>
      
      {/* Floating Header */}
      <header style={{ 
        maxWidth: '600px', margin: '40px auto', textAlign: 'center',
        position: 'sticky', top: '20px', zIndex: 10
      }}>
        <h1 onClick={() => router.push('/')} style={{ 
          cursor: 'pointer', fontSize: '2.5rem', fontWeight: '900', 
          background: 'linear-gradient(45deg, #e91e9a, #87ceeb)', 
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          filter: 'drop-shadow(0 5px 15px rgba(233,30,154,0.1))'
        }}>
          FreeHugsOnly
        </h1>
        
        <div style={{ 
          display: 'inline-flex', background: 'rgba(255, 255, 255, 0.7)', 
          backdropFilter: 'blur(10px)', padding: '8px', borderRadius: '25px',
          marginTop: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
          border: '1px solid rgba(255,255,255,0.5)'
        }}>
          {['fresh', 'sweet'].map((f) => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '10px 30px', borderRadius: '20px', border: 'none', cursor: 'pointer',
              background: filter === f ? 'linear-gradient(135deg, #e91e9a, #f8a5c2)' : 'transparent',
              color: filter === f ? 'white' : '#b2bec3',
              fontWeight: 'bold', transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              textTransform: 'capitalize'
            }}>
              {f === 'fresh' ? '🍃 Fresh' : '🍯 Sweet'}
            </button>
          ))}
        </div>
      </header>

      {/* Main Feed */}
      <main style={{ maxWidth: '600px', margin: '0 auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', marginTop: '100px', animation: 'pulse 2s infinite' }}>
            <div style={{ fontSize: '3rem' }}>☁️</div>
            <p style={{ color: '#b2bec3', fontWeight: '500' }}>Condensing Sugar Clouds...</p>
          </div>
        ) : nodes.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#b2bec3', marginTop: '100px' }}>The cloud is currently silent.</div>
        ) : (
          nodes.map((node, index) => (
            <div key={node.id} style={{ 
              background: 'rgba(255, 255, 255, 0.8)', 
              backdropFilter: 'blur(5px)',
              padding: '40px', borderRadius: '40px', marginBottom: '25px',
              border: '1px solid white',
              boxShadow: '0 20px 50px rgba(135, 206, 235, 0.05)',
              animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`,
              position: 'relative'
            }}>
              <p style={{ fontSize: '1.25rem', lineHeight: '1.7', color: '#444', marginBottom: '30px' }}>
                {node.body}
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {node.metadata?.attribution?.map((auth, i) => (
                    <span key={i} style={{ 
                      fontSize: '0.7rem', background: '#f0f7ff', color: '#87ceeb', 
                      padding: '6px 14px', borderRadius: '15px', fontWeight: '800',
                      letterSpacing: '0.5px'
                    }}>
                      @{auth.replace('@', '')}
                    </span>
                  ))}
                </div>
                <div style={{ 
                  background: '#fff9f0', padding: '6px 15px', borderRadius: '20px',
                  display: 'flex', alignItems: 'center', gap: '5px'
                }}>
                  <span style={{ fontWeight: '900', color: '#f39c12', fontSize: '0.9rem' }}>
                    {node.metadata?.honey_count || 0}
                  </span>
                  <span>🍯</span>
                </div>
              </div>
              
              {/* Witness Lock */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, cursor: 'default' }} />
            </div>
          ))
        )}
      </main>

      <style jsx global>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
