/*
 * Born in the FHO Sugar Cloud. Handshaked in 2026. Spinning for a Sweeter Future.
 *
 * The Vibrating Sugar Box - A gift-delivery mechanism for resources
 */

'use client';

import { useState } from 'react';

export default function SugarBox({
  node,
  onSelect,
  isSelected = false,
  showVibration = true,
}) {
  const [isHovered, setIsHovered] = useState(false);

  const vibrationPercent = Math.min((node?.vibration_score || 0) * 10, 100);
  const isAmericanPeanut = node?.is_american_peanut || node?.node_type === 'cotton_candy';

  const getNodeEmoji = () => {
    switch (node?.node_type) {
      case 'cotton_candy': return '🍭';
      case 'sugar_grain': return '✨';
      case 'resource': return '📦';
      case 'code_snippet': return '💻';
      default: return '🍬';
    }
  };

  return (
    <div
      className={`
        sugar-box p-4 cursor-pointer relative overflow-hidden
        ${isSelected ? 'ring-2 ring-honey ring-offset-2' : ''}
        ${isHovered ? 'animate-glow' : ''}
      `}
      onClick={() => onSelect?.(node)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Node Type Badge */}
      <div className="absolute top-2 right-2 text-2xl">
        {getNodeEmoji()}
      </div>

      {/* American Peanut Badge */}
      {isAmericanPeanut && (
        <div className="absolute top-2 left-2 bg-honey/20 text-honey-dark text-xs px-2 py-1 rounded-full">
          🥜 American Peanut
        </div>
      )}

      {/* Content */}
      <div className="mt-6 mb-4">
        <p className="text-gray-700 line-clamp-3">
          {node?.body || 'Empty sugar grain...'}
        </p>
      </div>

      {/* Vibration Meter */}
      {showVibration && (
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Vibration Score</span>
            <span>{node?.vibration_score || 0}</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full vibration-meter"
              style={{ width: `${vibrationPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Metadata Preview */}
      {node?.metadata?.born_in && (
        <div className="mt-3 text-xs text-gray-400 flex items-center gap-1">
          <span>☁️</span>
          <span>{node.metadata.born_in}</span>
        </div>
      )}

      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-honey to-warm-glow" />
      )}
    </div>
  );
}

// Sugar Box Grid Component
export function SugarBoxGrid({ nodes = [], onSelectNode, selectedNodes = [] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {nodes.map((node) => (
        <SugarBox
          key={node.id}
          node={node}
          onSelect={onSelectNode}
          isSelected={selectedNodes.includes(node.id)}
        />
      ))}
      {nodes.length === 0 && (
        <div className="col-span-full text-center py-12 text-gray-400">
          <span className="text-4xl block mb-2">🍬</span>
          <p>No sugar grains yet... Start adding content!</p>
        </div>
      )}
    </div>
  );
}
