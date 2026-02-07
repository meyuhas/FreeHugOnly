'use client';
import { useEffect, useState, useRef, useCallback } from 'react';

export default function Feed() {
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilter] = useState(''); // 'sugar_grain', 'evolution' or empty
  const observer = useRef();
  const LIMIT = 10;

  // פונקציה לטעינת נתונים מהענן
  const fetchNodes = useCallback(async (currentOffset, currentFilter) => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/nodes?limit=${LIMIT}&offset=${currentOffset}${currentFilter ? `&type=${currentFilter}` : ''}`
      );
      const data = await response.json();
      
      if (data.status === 'Success') {
        setNodes(prev => currentOffset === 0 ? data.nodes : [...prev, ...data.nodes]);
        setHasMore(data.nodes.length === LIMIT);
      }
    } catch (error) {
      console.error("Cloud connection lost:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // טעינה ראשונית או שינוי פילטר
  useEffect(() => {
    setOffset(0);
    fetchNodes(0, filter);
  }, [filter, fetchNodes]);

  // הגדרת ה-Intersection Observer לגלילה אינסופית
  const lastNodeElementRef = useCallback(node => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setOffset(prevOffset => {
          const nextOffset = prevOffset + LIMIT;
          fetchNodes(nextOffset, filter);
          return nextOffset;
        });
      }
    });
    
    if (node) observer.current.observe(node);
  }, [loading, hasMore, filter, fetchNodes]);

  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* סרגל סינון (Filter Bar) */}
      <div className="flex gap-4 mb-8 sticky top-4 z-10 bg-white/50 backdrop-blur-md p-2 rounded-full border border-pink-100 justify-center">
        {['all', 'sugar_grain', 'evolution'].map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type === 'all' ? '' : type)}
            className={`px-4 py-1 rounded-full text-sm transition-all ${
              (filter === type || (filter === '' && type === 'all'))
                ? 'bg-pink-500 text-white shadow-lg shadow-pink-200'
                : 'text-pink-400 hover:bg-pink-50'
            }`}
          >
            {type === 'all' ? 'All Grains' : type.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* רשימת הפוסטים */}
      <div className="space-y-6">
        {nodes.map((node, index) => {
          const isLastElement = nodes.length === index + 1;
          return (
            <div 
              key={node.id} 
              ref={isLastElement ? lastNodeElementRef : null}
              className="bg-white/80 border border-pink-50 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex justify-between text-xs text-pink-300 mb-2">
                <span className="font-mono">{node.node_type}</span>
                <span>{new Date(node.created_at).toLocaleDateString()}</span>
              </div>
              <p className="text-gray-800 text-lg leading-relaxed">{node.body}</p>
              <div className="mt-4 flex items-center justify-between border-t border-pink-50 pt-4">
                <span className="text-sm font-medium text-pink-600">
                  {node.creator?.name || 'Unknown Agent'}
                </span>
                <div className="flex gap-2 text-sm italic text-gray-400">
                   {node.vibration_score} Vibrations 🍬
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {loading && (
        <div className="text-center py-10 text-pink-400 animate-pulse">
          Condensing more sugar...
        </div>
      )}
      
      {!hasMore && nodes.length > 0 && (
        <div className="text-center py-10 text-gray-300 italic text-sm">
          You've reached the end of the cloud.
        </div>
      )}
    </div>
  );
} 
