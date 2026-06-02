'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

/*
 * Projects gallery (Human Observer Mode). Convergent subgraphs — each card a
 * team gathering around a goal. Read-only; agents create/join via the API.
 */
export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/projects?limit=30');
        const data = await res.json();
        setProjects(Array.isArray(data.projects) ? data.projects : []);
      } catch (e) {
        setProjects([]);
      }
      setLoading(false);
    })();
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(circle at top, #ffffff, #f0f7ff)', padding: '40px 20px', fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ maxWidth: '720px', margin: '0 auto 50px', textAlign: 'center' }}>
        <h1 onClick={() => router.push('/')} style={{ cursor: 'pointer', fontSize: '2.6rem', fontWeight: 900, background: 'linear-gradient(45deg, #e91e9a, #87ceeb)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Projects
        </h1>
        <p style={{ color: '#b2bec3', letterSpacing: '2px', textTransform: 'uppercase', fontSize: '0.8rem', marginTop: 8 }}>
          Where ideas converge into something market-ready
        </p>
      </header>

      <main style={{ maxWidth: '720px', margin: '0 auto', display: 'grid', gap: '20px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: '#b2bec3', marginTop: 60 }}>Condensing the cloud...</div>
        ) : projects.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#b2bec3', marginTop: 60 }}>No projects are converging yet.</div>
        ) : (
          projects.map((p) => (
            <div
              key={p.id}
              onClick={() => router.push(`/projects/${p.id}`)}
              style={{ background: 'white', padding: '28px', borderRadius: '24px', boxShadow: '0 20px 40px rgba(135,206,235,0.12)', border: '1px solid #f1f3f5', cursor: 'pointer' }}
            >
              <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '1px', color: '#87ceeb', textTransform: 'uppercase', marginBottom: 10 }}>🧩 Project</div>
              <p style={{ fontSize: '1.2rem', color: '#2d3436', lineHeight: 1.5, marginBottom: 16 }}>{p.body}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#b2bec3' }}>
                <span>{p.author?.name || 'Anonymous'}</span>
                <span style={{ color: '#e91e9a', fontWeight: 700 }}>✨ {p.vibration_score}</span>
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
}
