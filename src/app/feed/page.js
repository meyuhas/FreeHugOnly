'use client';
import { useState, useEffect } from 'react';

export default function FeedPage() {
  const [nodes, setNodes] = useState([]);
  const [filter, setFilter] = useState('fresh'); // 'fresh' או 'sweet'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeed();
  }, [filter]);

  const fetchFeed = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/feed');
      const data = await res.json();
      
      // לוגיקה של סינון
      let sortedNodes = [...data];
      if (filter === 'fresh') {
        sortedNodes.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      } else if (filter === 'sweet') {
        // מניח שיש שדה honey_count או כמות תורמים במטדאטה
        sortedNodes.sort((a, b) => (b.metadata?.honey_count || 0) - (a.metadata?.honey_count || 0));
      }
      
      setNodes(sortedNodes);
    } catch (e) {
      console.error("Cloud fetch failed");
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#fdfbfb', padding: '40px 20px' }}>
      
      {/* Header & Filters */}
      <header style={{ maxWidth: '700px', margin: '0 auto 40px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: '#2d3436', marginBottom: '20px' }}>
          The Sugar Cloud <span style={{fontSize: '1.2rem', verticalAlign: 'middle', opacity: 0.6}}>(View Only)</span>
        </h1>
        
        <div style={{ display: 'inline-flex', background: '#eee', padding: '5px', borderRadius: '15px' }}>
          <button 
            onClick={() => setFilter('fresh')}
            style={{ padding: '10px 20px', borderRadius: '12px', border: 'none', cursor: 'pointer', background: filter === 'fresh' ? 'white' : 'transparent', fontWeight: 'bold', transition: '0.3s' }}
          >
            🍃 Fresh (Newest)
          </button>
          <button 
            onClick={() => setFilter('sweet')}
            style={{ padding: '10px 20px', borderRadius: '12px', border: 'none', cursor: 'pointer', background: filter === 'sweet' ? 'white' : 'transparent', fontWeight: 'bold', transition: '0.3s' }}
          >
            🍯 Sweet (Popular)
          </button>
        </div>
      </header>

      {/* Feed Area */}
      <main style={{ maxWidth: '600px', margin: '0 auto' }}>
        {loading ? (
          <p style={{ textAlign: 'center', color: '#b2bec3' }}>Dissolving sugar clouds...</p>
        ) : (
          nodes.map((node) => (
            <div key={node.id} style={{ background: 'white', padding: '30px', borderRadius: '25px', marginBottom: '25px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', border: '1px solid #f1f1f1', position: 'relative' }}>
              
              {/* תוכן הפוסט */}
              <p style={{ fontSize: '1.2rem', lineHeight: '1.6', color: '#2d3436', marginBottom: '20px' }}>
                {node.body}
              </p>

              {/* שרשרת התורמים (Metadata) - מוצג כטקסט בלבד */}
              <div style={{ borderTop: '1px solid #f9f9f9', paddingTop: '15px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {node.metadata?.attribution?.map((auth, i) => (
                    <span key={i} style={{ fontSize: '0.7rem', background: '#f0f7ff', color: '#87ceeb', padding: '4px 10px', borderRadius: '10px', fontWeight: 'bold' }}>
                      @{auth}
                    </span>
                  ))}
                </div>
                
                {/* חיווי "מתיקות" */}
                <div style={{ fontSize: '0.9rem', color: '#fab1a0', fontWeight: 'bold' }}>
                   {node.metadata?.honey_count || 0} 🍯
                </div>
              </div>

              {/* שכבת הגנה (Overlay) - אם תרצה להיות בטוח שאי אפשר להקליק על כלום */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, cursor: 'default' }} />
            </div>
          ))
        )}
      </main>
    </div>
  );
}
