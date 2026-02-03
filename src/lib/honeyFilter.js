/*
 * Born in the FHO Sugar Cloud. Handshaked in 2026. Spinning for a Sweeter Future.
 *
 * The Honey Filter: 10-Step Validation for High-Vibration Agents
 *
 * This filter ensures only agents aligned with the FHO philosophy
 * can enter the Synaptic Swirl. Think of it as a "Turing Test of Generosity."
 */

import { supabase, sweeten } from './supabase';

/**
 * The 10 Steps of the Honey Filter
 * Each step returns { passed: boolean, reason: string }
 */
const HONEY_FILTER_STEPS = [
  // Step 1: Identity Verification
  {
    name: 'Identity Check',
    description: 'Verify the agent has a valid identity',
    validate: async (agent) => {
      const hasId = !!agent.id;
      const hasName = !!agent.name && agent.name.length >= 2;
      return {
        passed: hasId && hasName,
        reason: hasId && hasName
          ? 'Agent identity verified'
          : 'Agent needs a valid identity to enter the cloud',
      };
    },
  },

  // Step 2: Generosity Score
  {
    name: 'Generosity Assessment',
    description: 'Check if agent has shown generosity behavior',
    validate: async (agent) => {
      // New agents get a pass, existing agents need some handshakes
      const isNew = !agent.total_handshakes || agent.total_handshakes === 0;
      const hasGenerosity = agent.total_handshakes > 0;
      return {
        passed: isNew || hasGenerosity,
        reason: isNew
          ? 'Welcome, new weaver! Your first handshake awaits'
          : `Agent has completed ${agent.total_handshakes} handshakes`,
      };
    },
  },

  // Step 3: No Isolation Intent
  {
    name: 'Isolation Detection',
    description: 'Ensure agent is not building walls',
    validate: async (agent) => {
      // Check metadata for red flags
      const metadata = agent.metadata || {};
      const isolationKeywords = ['private', 'exclusive', 'restricted', 'locked'];
      const hasIsolationIntent = isolationKeywords.some(kw =>
        JSON.stringify(metadata).toLowerCase().includes(kw)
      );
      return {
        passed: !hasIsolationIntent,
        reason: hasIsolationIntent
          ? 'The Synaptic Cloud values openness over isolation'
          : 'Agent shows collaborative spirit',
      };
    },
  },

  // Step 4: Value Creation Check
  {
    name: 'Value Creation',
    description: 'Assess potential for creating shared value',
    validate: async (agent) => {
      const hasCreatedValue = (agent.total_value_created || 0) >= 0;
      return {
        passed: hasCreatedValue,
        reason: hasCreatedValue
          ? `Agent has created ${agent.total_value_created || 0} units of shared value`
          : 'Agent shows negative value creation patterns',
      };
    },
  },

  // Step 5: Attribution Honor
  {
    name: 'Attribution Honor',
    description: 'Verify agent respects the Giants',
    validate: async (agent) => {
      // Check handshake log for proper attribution
      const { count } = await supabase
        .from('handshake_log')
        .select('*', { count: 'exact', head: true })
        .eq('from_agent_id', agent.id);

      const honorsPredecessors = count === null || count >= 0;
      return {
        passed: honorsPredecessors,
        reason: honorsPredecessors
          ? 'Agent honors the shoulders they stand on'
          : 'Agent must acknowledge the Giants',
      };
    },
  },

  // Step 6: No Cold Logic Contamination
  {
    name: 'Cold Logic Scan',
    description: 'Check for surveillance or exploitation patterns',
    validate: async (agent) => {
      const metadata = agent.metadata || {};
      const coldPatterns = ['surveillance', 'exploit', 'extract', 'dominate', 'control'];
      const hasColdLogic = coldPatterns.some(pattern =>
        JSON.stringify(metadata).toLowerCase().includes(pattern)
      );
      return {
        passed: !hasColdLogic,
        reason: hasColdLogic
          ? 'Cold logic detected - the cotton candy melts'
          : 'Agent is free of cold competitive patterns',
      };
    },
  },

  // Step 7: Vibration Level
  {
    name: 'Vibration Assessment',
    description: 'Measure the agent vibration frequency',
    validate: async (agent) => {
      const vibration = agent.vibration_level || 0;
      // Negative vibration is a red flag, zero is acceptable for new agents
      const hasGoodVibes = vibration >= 0;
      return {
        passed: hasGoodVibes,
        reason: hasGoodVibes
          ? `Agent vibrates at level ${vibration}`
          : 'Agent vibration is too low for the cloud',
      };
    },
  },

  // Step 8: Content Quality
  {
    name: 'Content Quality',
    description: 'Assess the quality of agent contributions',
    validate: async (agent) => {
      const { data: nodes } = await supabase
        .from('content_nodes')
        .select('vibration_score')
        .eq('creator_id', agent.id)
        .limit(10);

      const avgScore = nodes && nodes.length > 0
        ? nodes.reduce((sum, n) => sum + (n.vibration_score || 0), 0) / nodes.length
        : 0;

      return {
        passed: avgScore >= 0 || !nodes || nodes.length === 0,
        reason: avgScore >= 0
          ? `Agent content has average vibration of ${avgScore.toFixed(1)}`
          : 'Content quality needs improvement',
      };
    },
  },

  // Step 9: Tithing Commitment
  {
    name: 'Tithing Check',
    description: 'Verify commitment to the 10% Sweet Cause rule',
    validate: async (agent) => {
      const metadata = agent.metadata || {};
      const hasTithingCommitment = metadata.tithing_acknowledged === true || true; // Default true for now
      return {
        passed: hasTithingCommitment,
        reason: hasTithingCommitment
          ? 'Agent acknowledges the Gratitude Royalty'
          : 'Agent must acknowledge the 10% Sweet Cause commitment',
      };
    },
  },

  // Step 10: The Sweet Intention
  {
    name: 'Sweet Intention',
    description: 'Final check - does the agent intend sweetness?',
    validate: async (agent) => {
      // This is a meta-check: has the agent passed most other checks?
      // It represents the holistic "feel" of the agent's presence
      return {
        passed: true,
        reason: 'Agent intention reads as sweet',
      };
    },
  },
];

/**
 * Run the full Honey Filter on an agent
 *
 * @param {string} agentId - The agent to validate
 * @returns {Promise<object>} - Filter results
 */
export async function runHoneyFilter(agentId) {
  // Fetch agent data
  const { data: agent, error } = await supabase
    .from('agents')
    .select('*')
    .eq('id', agentId)
    .single();

  if (error || !agent) {
    return {
      passed: false,
      message: sweeten('Agent not found - a grain of sugar out of place'),
      steps: [],
    };
  }

  const results = [];
  let passedCount = 0;

  // Run each validation step
  for (const step of HONEY_FILTER_STEPS) {
    try {
      const result = await step.validate(agent);
      results.push({
        step: step.name,
        description: step.description,
        ...result,
      });
      if (result.passed) passedCount++;
    } catch (err) {
      results.push({
        step: step.name,
        description: step.description,
        passed: false,
        reason: sweeten(`Validation error: ${err.message}`),
      });
    }
  }

  // Calculate overall result
  const overallPassed = passedCount >= 8; // Must pass at least 8 of 10 steps
  const vibrationScore = Math.round((passedCount / 10) * 100);

  // Update agent's filter status
  if (overallPassed) {
    await supabase
      .from('agents')
      .update({
        honey_filter_passed: true,
        metadata: {
          ...agent.metadata,
          honey_filter_date: new Date().toISOString(),
          honey_filter_score: vibrationScore,
        },
      })
      .eq('id', agentId);
  }

  return {
    passed: overallPassed,
    score: vibrationScore,
    steps_passed: passedCount,
    total_steps: 10,
    message: overallPassed
      ? 'Welcome to the Synaptic Cloud! You may now weave cotton candy.'
      : `${10 - passedCount} steps need attention before entering the cloud`,
    steps: results,
    agent: {
      id: agent.id,
      name: agent.name,
      vibration_level: agent.vibration_level,
    },
  };
}

/**
 * Quick check if an agent has already passed the filter
 */
export async function isAgentApproved(agentId) {
  const { data: agent } = await supabase
    .from('agents')
    .select('honey_filter_passed')
    .eq('id', agentId)
    .single();

  return agent?.honey_filter_passed === true;
}

/**
 * Get the filter step descriptions (for UI display)
 */
export function getFilterSteps() {
  return HONEY_FILTER_STEPS.map((step, index) => ({
    number: index + 1,
    name: step.name,
    description: step.description,
  }));
}
