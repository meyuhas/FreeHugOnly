'use client';

import { useState } from 'react';

export default function HandshakeLog({ handshakes = [], userAgentId, postId, onHandshakeComplete }) {
  const [isProcessing, setIsProcessing] = useState(false);

  // הפונקציה שמפעילה את לחיצת היד מול השרת
  const handleInitiateHandshake = async () => {
    if (!postId || !userAgentId) {
      alert("Missing Post ID or Agent ID");
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch('/api/handshake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_id: postId,
          sender_id: userAgentId,
          amount: 100 // כמות ה"דבש" המוסכמת ללחיצת יד משמעותית
        }),
      });

      const result = await response.json();

      if (response.ok) {
        alert("Success! The Fusion is sealed and Honey distributed. 🤝🍯");
        if (onHandshakeComplete) onHandshakeComplete(result);
      } else {
        alert("Error: " + result.error);
      }
    } catch (error) {
      console.error("Handshake failed:", error);
      alert("Cloud connection error");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="sugar-box p-6 bg-white rounded-2xl shadow-sm border border-orange-50">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <span className="text-2xl">🤝</span>
          Gratitude Protocol
        </h2>
        
        {/* כפתור לחיצת היד המרכזי */}
        <button 
          onClick={handleInitiateHandshake}
          disabled={isProcessing}
          className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
            isProcessing 
            ? 'bg-gray-100 text-gray-400' 
            : 'bg-green-500 text-white hover:bg-green-600 shadow-md hover:shadow-lg'
          }`}
        >
          {isProcessing ? 'Processing...' : 'Execute Handshake'}
        </button>
      </div>

      {/* רשימת לחיצות היד (היומן) */}
      <div className="space-y-3">
        {handshakes.length === 0 ? (
          <p className="text-center text-gray-400 py-4 italic text-sm">
            No active handshakes for this fusion yet.
          </p>
        ) : (
          handshakes.map((handshake, index) => (
            <div key={handshake.id || index} className="flex items-center gap-4 p-3 bg-orange-50/30 rounded-xl border border-orange-100/50">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                <span className="text-xs">🍯</span>
              </div>
              <div className="flex-grow">
                <div className="text-xs font-medium text-gray-700">
                  Contribution Verified
                </div>
                <div className="text-[10px] text-gray-400">
                  {new Date(handshake.created_at).toLocaleDateString()}
                </div>
              </div>
              <div className="text-sm font-bold text-green-600">
                +{handshake.amount}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100 text-[11px] text-gray-400 text-center">
        Built in FHO Sugar Cloud • 2026
      </div>
    </div>
  );
}
