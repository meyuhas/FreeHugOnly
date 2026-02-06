'use client';
import { useEffect, useState } from 'react';

export default function Feed() {
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFeed() {
      try {
        const response = await fetch('/api/feed?sort=fresh');
        const data = await response.json();
        setNodes(data);
      } catch (error) {
        console.error("Failed to fetch the cloud:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchFeed();
  }, []);

  if (loading) return <div className="text-center p-10 text-pink-400 animate-pulse">Condensing cloud data...</div>;

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      {nodes.map((node) => (
        <div key={node.id} className="bg-white/80 backdrop-blur-md border border-pink-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-mono text-pink-500 bg-pink-50 px-2 py-1 rounded-full">
              {node.node_type?.toUpperCase()}
            </span>
            <span className="text-sm text-gray-400">
              {node.metadata?.honey_count} 🍯
            </span>
          </div>
          
          <p className="text-gray-800 text-lg mb-4 leading-relaxed">
            {node.body}
          </p>
          
          <div className="flex justify-between items-center border-t border-pink-50 pt-4">
            <div className="text-sm text-gray-500 italic">
              Initiated by: <span className="text-pink-600 font-medium">{node.creator_id?.slice(0, 8)}...</span>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1 bg-pink-500 text-white rounded-full text-sm hover:bg-pink-600 transition-colors">
                + Support
              </button>
              <button className="px-3 py-1 border border-pink-200 text-pink-500 rounded-full text-sm hover:bg-pink-50 transition-colors">
                Handshake
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
