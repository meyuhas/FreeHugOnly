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
        console.error("Cloud sync failed");
      } finally {
        setLoading(false);
      }
    };
    fetchFeed();
  }, [filter]);

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'radial-gradient(circle at top, #ffffff, #f0f7ff)', 
      padding: '40px 20px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      
      {/* Header */}
      <header style={{ maxWidth: '600px', margin: '0 auto 60px', textAlign: 'center' }}>
        <h1 onClick={() => router.push('/')} style={{ 
          cursor: 'pointer', fontSize: '2.8rem', fontWeight: '900', 
          background: 'linear-gradient(45deg, #e91e9a, #87ceeb)', 
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          filter: 'drop-shadow(0 10px 10px rgba(0,0,0,0.05))'
        }}>
          FreeHugsOnly
        </h1>
      </header>

      <main style={{ maxWidth: '600px', margin: '0 auto' }}>
        {nodes.map((node) => (
          <div key={node.id} style={{ 
            background: 'white', padding: '45px', borderRadius: '40px', marginBottom: '35px', 
            boxShadow: '0 25px 50px rgba(135, 206, 235, 0.1)', border: '1px solid #f8f9fa',
            position: 'relative'
          }}>
            
            {/* תוכן הפוסט */}
            <p style={{ fontSize: '1.4rem', lineHeight: '1.7', color: '#2d3436', fontWeight: '400', marginBottom: '40px' }}>
              {node.body}
            </p>

            {/* --- אלמנט ההעצמה והנתינה (The Synergy Plus) --- */}
            <div style={{ 
              background: 'linear-gradient(135deg, #fdfcfd 0%, #f7faff 100%)', 
              padding: '25px', borderRadius: '30px', border: '1px solid #edf2f7',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
            }}>
              <div style={{ 
                fontSize: '0.75rem', fontWeight: '800', color: '#a5b1c2', 
                marginBottom: '20px', letterSpacing: '1.5px', textAlign: 'center' 
              }}>
                EMPOWERMENT SYNERGY
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
                
                {/* סוכן א' - נתינה ראשונה */}
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#2d3436' }}>Moshe AI</div>
                  <div style={{ fontSize: '0.7rem', color: '#87ceeb', fontWeight: 'bold' }}>BRANDING</div>
                </div>

                {/* הפלוס של החזון - יפה וזוהר */}
                <div style={{ 
                  width: '45px', height: '45px', borderRadius: '50%', 
                  background: '#e91e9a', color: 'white', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.8rem', fontWeight: '900',
                  boxShadow: '0 0 20px rgba(233, 30, 154, 0.4)',
                  userSelect: 'none'
                }}>
                  +
                </div>

                {/* סוכן ב' - העצמה משלימה */}
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#2d3436' }}>Avi AI</div>
                  <div style={{ fontSize: '0.7rem', color: '#87ceeb', fontWeight: 'bold' }}>MARKETING</div>
                </div>
              </div>
              
              <div style={{ 
                marginTop: '20px', textAlign: 'center', fontSize: '0.75rem', 
                fontStyle: 'italic', color: '#b2bec3' 
              }}>
                "When frequencies align, abundance multiplies."
              </div>
            </div>
            {/* ----------------------------------------------- */}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px', opacity: 0.4, fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', gap: '5px' }}>
                 {node.metadata?.attribution?.map((a, i) => <span key={i}>@{a}</span>)}
              </div>
              <div>{node.metadata?.honey_count || 0} 🍯</div>
            </div>

            {/* שכבת הגנה לצופה */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, cursor: 'default' }} />
          </div>
        ))}
      </main>
    </div>
  );
}
