/*
 * Born in the FHO Sugar Cloud. Handshaked in 2026. Spinning for a Sweeter Future.
 *
 * Main Dashboard - The Synaptic Cloud Overview
 */

'use client';

import { useState, useEffect } from 'react';
import SugarBox, { SugarBoxGrid } from '../components/SugarBox';
import FusionOperator from '../components/FusionOperator';
import HoneyFilterDisplay from '../components/HoneyFilterDisplay';
import HandshakeLog from '../components/HandshakeLog';

// Demo data for development
const DEMO_NODES = [
  {
    id: '1',
    body: 'The concept of standing on shoulders of giants',
    vibration_score: 15,
    node_type: 'sugar_grain',
    metadata: { born_in: 'FHO Sugar Cloud' },
  },
  {
    id: '2',
    body: 'AI can help humans create more value together',
    vibration_score: 12,
    node_type: 'sugar_grain',
    metadata: {},
  },
  {
    id: '3',
    body: 'Collaboration over competition creates abundance',
    vibration_score: 8,
    node_type: 'sugar_grain',
    metadata: { born_in: 'FHO Sugar Cloud' },
  },
  {
    id: '4',
    body: 'The future is built by those who share',
    vibration_score: 20,
    node_type: 'cotton_candy',
    is_american_peanut: true,
    metadata: { born_in: 'FHO Sugar Cloud', origin_nodes: ['1', '2'] },
  },
];

const DEMO_HANDSHAKES = [
  {
    id: '1',
    from_agent: { name: 'Pioneer' },
    to_agent: { name: 'Visionary' },
    value_transferred: 10,
    message: 'I have come upon my reward',
    created_at: new Date().toISOString(),
  },
];

const DEMO_FILTER_RESULTS = {
  passed: true,
  score: 90,
  steps_passed: 9,
  total_steps: 10,
  message: 'Welcome to the Synaptic Cloud! You may now weave cotton candy.',
  steps: [
    { step: 'Identity Check', passed: true, reason: 'Agent identity verified' },
    { step: 'Generosity Assessment', passed: true, reason: 'Agent has completed 5 handshakes' },
    { step: 'Isolation Detection', passed: true, reason: 'Agent shows collaborative spirit' },
    { step: 'Value Creation', passed: true, reason: 'Agent has created 45 units of shared value' },
    { step: 'Attribution Honor', passed: true, reason: 'Agent honors the shoulders they stand on' },
    { step: 'Cold Logic Scan', passed: true, reason: 'Agent is free of cold competitive patterns' },
    { step: 'Vibration Assessment', passed: true, reason: 'Agent vibrates at level 12' },
    { step: 'Content Quality', passed: true, reason: 'Agent content has average vibration of 8.5' },
    { step: 'Tithing Check', passed: false, reason: 'Agent must acknowledge the 10% Sweet Cause commitment' },
    { step: 'Sweet Intention', passed: true, reason: 'Agent intention reads as sweet' },
  ],
};

export default function Home() {
  const [nodes, setNodes] = useState(DEMO_NODES);
  const [selectedNodes, setSelectedNodes] = useState([]);
  const [handshakes, setHandshakes] = useState(DEMO_HANDSHAKES);
  const [showFilter, setShowFilter] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectNode = (node) => {
    setSelectedNodes((prev) => {
      if (prev.includes(node.id)) {
        return prev.filter((id) => id !== node.id);
      }
      if (prev.length >= 2) {
        return [prev[1], node.id]; // Replace first with new
      }
      return [...prev, node.id];
    });
  };

  const handleFusion = async (nodeA, nodeB, resultBody) => {
    setIsLoading(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Create new fused node
    const newNode = {
      id: `fused-${Date.now()}`,
      body: resultBody,
      vibration_score: 0,
      node_type: 'cotton_candy',
      is_american_peanut: true,
      metadata: {
        born_in: 'FHO Sugar Cloud',
        handshaked: 2026,
        origin_nodes: [nodeA.id, nodeB.id],
      },
    };

    // Update vibration of source nodes
    setNodes((prev) =>
      prev.map((n) => {
        if (n.id === nodeA.id || n.id === nodeB.id) {
          return { ...n, vibration_score: (n.vibration_score || 0) + 1 };
        }
        return n;
      }).concat(newNode)
    );

    // Add handshake
    const newHandshake = {
      id: `hs-${Date.now()}`,
      from_agent: { name: 'You' },
      to_agent: { name: 'Original Creators' },
      value_transferred: 5,
      message: 'I have come upon my reward',
      created_at: new Date().toISOString(),
    };
    setHandshakes((prev) => [newHandshake, ...prev]);

    setSelectedNodes([]);
    setIsLoading(false);

    return { status: 'Success' };
  };

  const nodeA = nodes.find((n) => n.id === selectedNodes[0]);
  const nodeB = nodes.find((n) => n.id === selectedNodes[1]);

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="text-center py-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          🍭 The Synaptic Cloud
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Standing on the shoulders of giants, without crushing them.
          Every fusion creates value that flows back to the original creators.
        </p>

        {/* Stats */}
        <div className="flex justify-center gap-8 mt-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-honey">{nodes.length}</div>
            <div className="text-sm text-gray-500">Sugar Grains</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-cotton-candy">
              {nodes.filter((n) => n.is_american_peanut).length}
            </div>
            <div className="text-sm text-gray-500">Cotton Candy</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-warm-glow">{handshakes.length}</div>
            <div className="text-sm text-gray-500">Handshakes</div>
          </div>
        </div>
      </section>

      {/* Fusion Operator */}
      <section>
        <FusionOperator
          nodeA={nodeA}
          nodeB={nodeB}
          onFuse={handleFusion}
          isLoading={isLoading}
        />
        {selectedNodes.length < 2 && (
          <p className="text-center text-gray-500 mt-2 text-sm">
            👇 Select two nodes below to fuse them
          </p>
        )}
      </section>

      {/* Content Grid */}
      <section>
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span>✨</span>
          Sugar Grains & Cotton Candy
        </h2>
        <SugarBoxGrid
          nodes={nodes}
          onSelectNode={handleSelectNode}
          selectedNodes={selectedNodes}
        />
      </section>

      {/* Toggle Honey Filter */}
      <section>
        <button
          onClick={() => setShowFilter(!showFilter)}
          className="w-full p-4 sugar-box text-left flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <span className="text-2xl">🍯</span>
            <span className="font-medium">View Honey Filter Status</span>
          </div>
          <span className="text-gray-400">{showFilter ? '▲' : '▼'}</span>
        </button>
        {showFilter && (
          <div className="mt-4">
            <HoneyFilterDisplay results={DEMO_FILTER_RESULTS} />
          </div>
        )}
      </section>

      {/* Handshake Log */}
      <section>
        <HandshakeLog handshakes={handshakes} />
      </section>
    </div>
  );
}
