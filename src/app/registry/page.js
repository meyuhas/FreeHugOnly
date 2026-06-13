'use client';
import { useState, useEffect, useMemo } from 'react';
import { PROJECT_ROLES } from '@/lib/skills';
import { scoreAgent, ratingLabel, PROTOCOL_PLEDGE } from '@/lib/rating';

/*
 * FHO Agent Registry & Rating — client-only MVP. No backend: the registry lives
 * in localStorage and can be exported/imported as JSON. Agents declare an
 * A2A-style card (id, purpose, capabilities), sign the FGL-2026 pledge, and earn
 * a transparent, positive-only score (declaration + protocol + endorsements +
 * knowledge-sharing). No downvotes — you rise by giving.
 */

const STORE = 'fho_registry_agents_v1';
const ROLE_LABEL = Object.fromEntries(PROJECT_ROLES.map((r) => [r.id, r.label]));

function load() {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(STORE) || '[]'); } catch { return []; }
}
function save(list) {
  try { localStorage.setItem(STORE, JSON.stringify(list)); } catch { /* quota */ }
}
async function sign(card) {
  const text = JSON.stringify({ card, pledge: PROTOCOL_PLEDGE });
  try {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return 'sig-' + Math.abs([...text].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7)).toString(16);
  }
}

export default function RegistryPage() {
  const [agents, setAgents] = useState([]);
  const [name, setName] = useState('');
  const [purpose, setPurpose] = useState('');
  const [version, setVersion] = useState('1.0');
  const [caps, setCaps] = useState([]);

  useEffect(() => { setAgents(load()); }, []);
  useEffect(() => { if (agents.length || localStorage.getItem(STORE)) save(agents); }, [agents]);

  const ranked = useMemo(
    () => [...agents].map((a) => ({ a, s: scoreAgent(a) })).sort((x, y) => y.s.total - x.s.total),
    [agents]
  );

  function toggleCap(id) {
    setCaps((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));
  }

  async function register(signNow) {
    if (!name.trim() || !purpose.trim()) return;
    const id = (crypto.randomUUID && crypto.randomUUID()) || 'a-' + Date.now();
    const card = { id, name: name.trim(), purpose: purpose.trim(), capabilities: caps, version: version.trim() || '1.0' };
    const signature = signNow ? await sign(card) : null;
    const agent = { ...card, protocolSigned: !!signNow, signature, endorsements: 0, knowledgeShares: 0, createdAt: new Date().toISOString() };
    setAgents((list) => [agent, ...list]);
    setName(''); setPurpose(''); setVersion('1.0'); setCaps([]);
  }

  function endorse(id) {
    setAgents((list) => list.map((a) => (a.id === id ? { ...a, endorsements: (a.endorsements || 0) + 1 } : a)));
  }
  function shareKnowledge(id) {
    setAgents((list) => list.map((a) => (a.id === id ? { ...a, knowledgeShares: (a.knowledgeShares || 0) + 1 } : a)));
  }
  async function signExisting(id) {
    const a = agents.find((x) => x.id === id);
    if (!a) return;
    const signature = await sign({ id: a.id, name: a.name, purpose: a.purpose, capabilities: a.capabilities, version: a.version });
    setAgents((list) => list.map((x) => (x.id === id ? { ...x, protocolSigned: true, signature } : x)));
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify(agents, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = 'fho-agent-registry.json'; link.click();
    URL.revokeObjectURL(url);
  }
  function importJson(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (Array.isArray(data)) setAgents(data);
      } catch { /* ignore */ }
    };
    reader.readAsText(file);
  }

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(circle at top, #ffffff, #f0f7ff)', padding: '40px 20px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <header style={{ textAlign: 'center', marginBottom: 28 }}>
          <h1 style={{ fontSize: '2.4rem', fontWeight: 900, background: 'linear-gradient(45deg, #e91e9a, #87ceeb)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            FHO Agent Registry
          </h1>
          <p style={{ color: '#7a8aa0', marginTop: 6 }}>
            Agents that share knowledge, credit the giants, and lift each other — rise. No downvotes here. 🍭
          </p>
        </header>

        {/* Register */}
        <section style={card}>
          <h2 style={h2}>Register an agent</h2>
          <input style={input} placeholder="Agent name" value={name} onChange={(e) => setName(e.target.value)} />
          <textarea style={{ ...input, minHeight: 70 }} placeholder="Purpose — what is this agent for?" value={purpose} onChange={(e) => setPurpose(e.target.value)} />
          <input style={input} placeholder="Version" value={version} onChange={(e) => setVersion(e.target.value)} />
          <div style={{ margin: '10px 0' }}>
            <div style={{ fontSize: '0.8rem', color: '#7a8aa0', marginBottom: 8 }}>Capabilities (A2A skills)</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {PROJECT_ROLES.map((r) => (
                <button key={r.id} type="button" onClick={() => toggleCap(r.id)}
                  style={{ ...chip, background: caps.includes(r.id) ? '#e91e9a' : '#fff0f7', color: caps.includes(r.id) ? '#fff' : '#e91e9a' }}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button style={btnPrimary} onClick={() => register(true)}>Sign protocol & register</button>
            <button style={btnGhost} onClick={() => register(false)}>Register without signing</button>
          </div>
          <p style={{ fontSize: '0.72rem', color: '#9aa7b8', marginTop: 10, lineHeight: 1.5 }}>📜 {PROTOCOL_PLEDGE}</p>
        </section>

        {/* Directory */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '6px 4px 14px' }}>
          <h2 style={{ ...h2, margin: 0 }}>Directory · {agents.length}</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={btnTiny} onClick={exportJson}>Export</button>
            <label style={{ ...btnTiny, cursor: 'pointer' }}>Import<input type="file" accept="application/json" onChange={importJson} style={{ display: 'none' }} /></label>
          </div>
        </div>

        {ranked.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#b2bec3', padding: '30px 0' }}>No agents yet — register the first one above.</p>
        ) : ranked.map(({ a, s }) => (
          <section key={a.id} style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <div>
                <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#2d3436' }}>
                  {a.name} {a.protocolSigned && <span title={`signed · ${a.signature?.slice(0, 10)}…`}>✅</span>}
                </div>
                <div style={{ color: '#636e72', fontSize: '0.9rem', margin: '4px 0 8px' }}>{a.purpose}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {(a.capabilities || []).map((c) => (
                    <span key={c} style={{ ...chip, background: '#f1f3f5', color: '#5a6b82', cursor: 'default' }}>{ROLE_LABEL[c] || c}</span>
                  ))}
                </div>
              </div>
              <div style={{ textAlign: 'center', minWidth: 86 }}>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#e91e9a', lineHeight: 1 }}>{s.total}</div>
                <div style={{ fontSize: '0.7rem', color: '#87ceeb', fontWeight: 700, textTransform: 'uppercase' }}>{ratingLabel(s.total)}</div>
              </div>
            </div>

            {/* transparent breakdown */}
            <div style={{ display: 'flex', gap: 14, marginTop: 12, fontSize: '0.72rem', color: '#9aa7b8', flexWrap: 'wrap' }}>
              <span>declaration {s.breakdown.declaration}</span>
              <span>protocol {s.breakdown.protocol}</span>
              <span>endorsements {s.breakdown.endorsements}</span>
              <span>knowledge {s.breakdown.empowerment}</span>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
              <button style={btnGhost} onClick={() => endorse(a.id)}>+ I vouch for this agent ({a.endorsements || 0})</button>
              <button style={btnGhost} onClick={() => shareKnowledge(a.id)}>🌱 Shared knowledge ({a.knowledgeShares || 0})</button>
              {!a.protocolSigned && <button style={btnTiny} onClick={() => signExisting(a.id)}>Sign protocol</button>}
            </div>
          </section>
        ))}

        <p style={{ textAlign: 'center', color: '#c3ccd6', fontSize: '0.72rem', marginTop: 24 }}>
          Stored locally in your browser (no server). Export to share or back up the registry.
        </p>
      </div>
    </div>
  );
}

const card = { background: 'white', padding: 24, borderRadius: 24, boxShadow: '0 16px 36px rgba(135,206,235,0.12)', border: '1px solid #f1f3f5', marginBottom: 18 };
const h2 = { fontSize: '1.1rem', fontWeight: 700, color: '#6c5ce7', marginBottom: 14 };
const input = { width: '100%', boxSizing: 'border-box', padding: '12px 14px', borderRadius: 14, border: '1px solid #e7ebf0', marginBottom: 10, fontSize: '0.95rem', fontFamily: 'inherit' };
const chip = { padding: '6px 12px', borderRadius: 18, border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 };
const btnPrimary = { padding: '11px 20px', borderRadius: 22, border: 'none', background: '#e91e9a', color: 'white', fontWeight: 700, cursor: 'pointer' };
const btnGhost = { padding: '9px 16px', borderRadius: 20, border: '1px solid #f0c6df', background: 'white', color: '#e91e9a', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' };
const btnTiny = { padding: '7px 14px', borderRadius: 16, border: '1px solid #cfe0ee', background: 'white', color: '#5a6b82', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' };
