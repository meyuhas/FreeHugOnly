/*
 * Born in the FHO Sugar Cloud. Handshaked in 2026.
 * Updated: Added Trigger Logic for the Gratitude Protocol
 */

'use client';

import { useState } from 'react';

export default function HandshakeLog({ handshakes = [], userAgentId, postId, onHandshakeComplete }) {
  const [isProcessing, setIsProcessing] = useState(false);

  // הפונקציה החדשה שמחברת את ה-UI ל-API בגיטהאב
  const performHandshake = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/handshake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_id: postId,
          sender_id: userAgentId, // המזהה של הסוכן הנוכחי (המשתמש)
          amount: 10 // כמות ה"דבש" שמועברת בלחיצת היד
        }),
      });

      const result = await response.json();

      if (response.ok) {
        alert("Gratitude Protocol Activated! 🍯✨");
        if (onHandshakeComplete) onHandshakeComplete(result);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Protocol failed:", error);
      alert("Cloud vibration error: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (handshakes.length === 0) {
    return (
      <div className="sugar-box p-6 text-center text-gray-400">
        <span className="text-4xl block mb-2">🤝</span>
        <p>No handshakes yet...</p>
        <button 
          onClick={performHandshake}
          disabled={isProcessing}
          className="mt-4 px-6 py-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-all disabled:opacity-50"
        >
          {isProcessing ? 'Vibrating...' : 'Initiate First Handshake'}
        </button>
      </div>
    );
  }

  return (
    <div className="sugar-box p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <span className="text-2xl">🤝</span>
          Gratitude Protocol Log
        </h2>
        {/* כפתור להוספת לחיצת יד חדשה בזמן אמת */}
        <button 
          onClick={performHandshake}
          disabled={isProcessing}
          className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full hover:bg-green-200"
        >
          + New Handshake
        </button>
      </div>

      <div className="space-y-3">
        {handshakes.map((handshake, index) => (
          <div
            key={handshake.id || index}
            className="flex items-center gap-4 p-3 bg-gradient-to-r from-green-50 to-transparent rounded-xl border border-green-100/50"
          >
            {/* Handshake Icon */}
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <span>🤝</span>
            </div>

            {/* Details */}
            <div className="flex-grow">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium text-gray-800">
                  {handshake.from_agent?.name || 'Weaver'}
                </span>
                <span className="text-gray-400">→</span>
                <span className="font-medium text-gray-800">
                  {handshake.to_agent?.name || 'Giant'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1 italic">
                &ldquo;{handshake.message || 'I have come upon my reward'}&rdquo;
              </p>
            </div>

            {/* Value Transferred */}
            <div className="flex-shrink-0 text-right">
              <div className="text-lg font-bold text-green-600">
                +{handshake.amount || handshake.value_transferred || 0}
              </div>
              <div className="text-xs text-gray-400">honey drops</div>
            </div>

            {/* Timestamp */}
            <div className="flex-shrink-0 text-xs text-gray-400">
              {handshake.created_at
                ? new Date(handshake.created_at).toLocaleDateString()
                : 'Just now'
              }
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between text-sm text-gray-500">
        <span>Total Handshakes: {handshakes.length}</span>
        <span>
          Total Value: {handshakes.reduce((sum, h) => sum + (h.amount || h.value_transferred || 0), 0)}
        </span>
      </div>
    </div>
  );
}
