/*
 * Born in the FHO Sugar Cloud. Handshaked in 2026. Spinning for a Sweeter Future.
 *
 * The + Fusion Operator UI Component
 * Allows users to select two nodes and fuse them into Cotton Candy
 */

'use client';

import { useState } from 'react';

export default function FusionOperator({
  nodeA,
  nodeB,
  onFuse,
  isLoading = false,
}) {
  const [resultBody, setResultBody] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const canFuse = nodeA && nodeB && resultBody.trim().length > 0;

  const handleFuse = async () => {
    if (!canFuse) return;

    const result = await onFuse?.(nodeA, nodeB, resultBody);

    if (result?.status === 'Success') {
      setShowSuccess(true);
      setResultBody('');
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  return (
    <div className="sugar-box p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <span className="text-2xl">🔗</span>
        The + Fusion Operator
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        {/* Node A */}
        <div className={`p-4 rounded-xl ${nodeA ? 'bg-honey/20' : 'bg-gray-100 border-2 border-dashed border-gray-300'}`}>
          {nodeA ? (
            <>
              <div className="text-xs text-gray-500 mb-1">Node A</div>
              <p className="text-sm text-gray-700 line-clamp-2">{nodeA.body}</p>
              <div className="mt-2 text-xs text-honey">✨ Score: {nodeA.vibration_score || 0}</div>
            </>
          ) : (
            <div className="text-center text-gray-400 py-4">
              <span className="text-2xl block mb-1">✨</span>
              <span className="text-sm">Select first node</span>
            </div>
          )}
        </div>

        {/* Plus Operator */}
        <div className="flex justify-center">
          <div className={`
            w-16 h-16 rounded-full flex items-center justify-center text-3xl font-bold
            ${canFuse ? 'bg-gradient-to-br from-honey to-warm-glow text-white animate-glow' : 'bg-gray-200 text-gray-400'}
            transition-all duration-300
          `}>
            +
          </div>
        </div>

        {/* Node B */}
        <div className={`p-4 rounded-xl ${nodeB ? 'bg-cotton-candy/20' : 'bg-gray-100 border-2 border-dashed border-gray-300'}`}>
          {nodeB ? (
            <>
              <div className="text-xs text-gray-500 mb-1">Node B</div>
              <p className="text-sm text-gray-700 line-clamp-2">{nodeB.body}</p>
              <div className="mt-2 text-xs text-cotton-candy">✨ Score: {nodeB.vibration_score || 0}</div>
            </>
          ) : (
            <div className="text-center text-gray-400 py-4">
              <span className="text-2xl block mb-1">🍬</span>
              <span className="text-sm">Select second node</span>
            </div>
          )}
        </div>
      </div>

      {/* Result Input */}
      {nodeA && nodeB && (
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            🍭 Cotton Candy Result (What does this fusion create?)
          </label>
          <textarea
            value={resultBody}
            onChange={(e) => setResultBody(e.target.value)}
            placeholder="Describe the fused result... What new value emerges from combining these two?"
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-honey focus:border-transparent resize-none"
            rows={3}
          />
        </div>
      )}

      {/* Fusion Button */}
      {nodeA && nodeB && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={handleFuse}
            disabled={!canFuse || isLoading}
            className={`
              fusion-button flex items-center gap-2
              ${!canFuse || isLoading ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {isLoading ? (
              <>
                <span className="animate-spin">🌀</span>
                <span>Spinning Cotton Candy...</span>
              </>
            ) : (
              <>
                <span>🍭</span>
                <span>Perform Fusion</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Success Message */}
      {showSuccess && (
        <div className="mt-4 handshake-complete justify-center">
          <span>✨</span>
          <span>The synaptic cloud is glowing! Fusion complete.</span>
        </div>
      )}
    </div>
  );
}
