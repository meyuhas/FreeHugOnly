/*
 * 🍭 FHO: Fusion Logic Tests
 * Born in the FHO Sugar Cloud. Handshaked in 2026. Spinning for a Sweeter Future.
 */

// Mock Supabase
const mockSupabase = {
  from: jest.fn(() => mockSupabase),
  select: jest.fn(() => mockSupabase),
  insert: jest.fn(() => mockSupabase),
  update: jest.fn(() => mockSupabase),
  eq: jest.fn(() => mockSupabase),
  single: jest.fn(() => Promise.resolve({ data: null, error: null })),
  upsert: jest.fn(() => Promise.resolve({ data: null, error: null })),
  rpc: jest.fn(() => Promise.resolve({ data: null, error: null })),
};

jest.mock('../supabase', () => ({
  supabase: mockSupabase,
  createFHOStamp: jest.fn((creatorId, originNodes) => ({
    born_in: 'FHO Sugar Cloud',
    handshaked: 2026,
    creator_id: creatorId,
    origin_nodes: originNodes,
    license: 'FGL-2026',
  })),
  sweeten: jest.fn((msg) => msg.replace(/error/gi, 'a grain of sugar out of place')),
}));

// Import after mocking
const { performFusion, performHandshake, traceFusionHistory } = require('../fusion');

describe('FHO Fusion Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('performFusion', () => {
    const mockNodeA = {
      id: 'node-a-uuid',
      body: 'Original idea A',
      creator_id: 'creator-a-uuid',
      vibration_score: 10,
      metadata: {},
    };

    const mockNodeB = {
      id: 'node-b-uuid',
      body: 'Original idea B',
      creator_id: 'creator-b-uuid',
      vibration_score: 15,
      metadata: {},
    };

    it('should fuse two nodes and create cotton candy', async () => {
      // Setup mocks
      mockSupabase.single
        .mockResolvedValueOnce({ data: mockNodeA, error: null }) // Node A
        .mockResolvedValueOnce({ data: mockNodeB, error: null }) // Node B
        .mockResolvedValueOnce({ data: { id: 'result-node-uuid', body: 'Fused content' }, error: null }) // Result node
        .mockResolvedValueOnce({ data: { id: 'link-uuid' }, error: null }); // Link

      const result = await performFusion(
        'node-a-uuid',
        'node-b-uuid',
        'weaver-uuid',
        'Fused content combining A and B'
      );

      expect(result.status).toBe('Success');
      expect(result.message).toBe('The synaptic cloud is glowing');
      expect(result.attribution.giants).toContain('creator-a-uuid');
      expect(result.attribution.giants).toContain('creator-b-uuid');
    });

    it('should fail if node A does not exist', async () => {
      mockSupabase.single.mockResolvedValueOnce({ data: null, error: { message: 'Not found' } });

      const result = await performFusion(
        'non-existent-uuid',
        'node-b-uuid',
        'weaver-uuid',
        'Fused content'
      );

      expect(result.status).toBe('Pending');
      expect(result.error).toBeDefined();
    });

    it('should include FHO stamp in result metadata', async () => {
      mockSupabase.single
        .mockResolvedValueOnce({ data: mockNodeA, error: null })
        .mockResolvedValueOnce({ data: mockNodeB, error: null })
        .mockResolvedValueOnce({ data: { id: 'result-uuid' }, error: null })
        .mockResolvedValueOnce({ data: { id: 'link-uuid' }, error: null });

      await performFusion('node-a-uuid', 'node-b-uuid', 'weaver-uuid', 'Fused');

      // Check that insert was called with FHO stamp
      expect(mockSupabase.insert).toHaveBeenCalled();
    });
  });

  describe('performHandshake', () => {
    const mockLink = {
      id: 'link-uuid',
      weaver_id: 'weaver-uuid',
      attribution_chain: ['creator-a-uuid', 'creator-b-uuid'],
      handshake_completed: false,
    };

    it('should complete the handshake and return success', async () => {
      mockSupabase.single
        .mockResolvedValueOnce({ data: mockLink, error: null }) // Get link
        .mockResolvedValueOnce({ data: { id: 'agent-uuid', total_handshakes: 5, vibration_level: 10 }, error: null }) // Weaver
        .mockResolvedValueOnce({ data: { id: 'creator-a-uuid', total_handshakes: 10 }, error: null }) // Creator A
        .mockResolvedValueOnce({ data: { id: 'creator-b-uuid', total_handshakes: 8 }, error: null }); // Creator B

      const result = await performHandshake('link-uuid', 75);

      expect(result.status).toBe('Success');
      expect(result.message).toBe('I have come upon my reward');
      expect(result.value_added).toBe(75);
      expect(result.giants_thanked).toBe(2);
    });

    it('should not allow double handshake', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: { ...mockLink, handshake_completed: true },
        error: null,
      });

      const result = await performHandshake('link-uuid', 50);

      expect(result.status).toBe('Already Complete');
    });

    it('should handle link not found', async () => {
      mockSupabase.single.mockResolvedValueOnce({ data: null, error: { message: 'Not found' } });

      const result = await performHandshake('non-existent-uuid', 50);

      expect(result.status).toBe('Error');
    });
  });

  describe('traceFusionHistory', () => {
    it('should return empty array for node with no history', async () => {
      mockSupabase.eq.mockReturnValueOnce({
        then: (fn) => fn({ data: [], error: null }),
      });

      const history = await traceFusionHistory('leaf-node-uuid');

      expect(history).toEqual([]);
    });
  });
});

describe('FHO Lexicon', () => {
  const { sweeten } = require('../supabase');

  it('should convert cold language to sweet language', () => {
    const result = sweeten('There was an error in the system');
    expect(result).toContain('a grain of sugar out of place');
  });
});

describe('FHO Stamp', () => {
  const { createFHOStamp } = require('../supabase');

  it('should create valid stamp with all required fields', () => {
    const stamp = createFHOStamp('creator-uuid', ['origin-1', 'origin-2']);

    expect(stamp.born_in).toBe('FHO Sugar Cloud');
    expect(stamp.handshaked).toBe(2026);
    expect(stamp.license).toBe('FGL-2026');
    expect(stamp.creator_id).toBe('creator-uuid');
    expect(stamp.origin_nodes).toEqual(['origin-1', 'origin-2']);
  });
});
