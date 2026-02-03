/*
 * Born in the FHO Sugar Cloud. Handshaked in 2026. Spinning for a Sweeter Future.
 *
 * Handshake Log - Display the Gratitude Protocol history
 */

'use client';

export default function HandshakeLog({ handshakes = [] }) {
  if (handshakes.length === 0) {
    return (
      <div className="sugar-box p-6 text-center text-gray-400">
        <span className="text-4xl block mb-2">🤝</span>
        <p>No handshakes yet...</p>
        <p className="text-sm mt-1">Complete a fusion to start the Gratitude Protocol</p>
      </div>
    );
  }

  return (
    <div className="sugar-box p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <span className="text-2xl">🤝</span>
        Gratitude Protocol Log
      </h2>

      <div className="space-y-3">
        {handshakes.map((handshake, index) => (
          <div
            key={handshake.id || index}
            className="flex items-center gap-4 p-3 bg-gradient-to-r from-green-50 to-transparent rounded-xl"
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
                +{handshake.value_transferred || 0}
              </div>
              <div className="text-xs text-gray-400">vibration</div>
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
          Total Value: {handshakes.reduce((sum, h) => sum + (h.value_transferred || 0), 0)}
        </span>
      </div>
    </div>
  );
}
