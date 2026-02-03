/*
 * 🍯 FHO: Honey Filter Tests
 * Born in the FHO Sugar Cloud. Handshaked in 2026. Spinning for a Sweeter Future.
 */

// Mock Supabase
const mockSupabase = {
  from: jest.fn(() => mockSupabase),
  select: jest.fn(() => mockSupabase),
  update: jest.fn(() => mockSupabase),
  eq: jest.fn(() => mockSupabase),
  single: jest.fn(() => Promise.resolve({ data: null, error: null })),
  limit: jest.fn(() => mockSupabase),
};

jest.mock('../supabase', () => ({
  supabase: mockSupabase,
  sweeten: jest.fn((msg) => msg),
}));

const {
  getSweetQuestionnaire,
  scoreSweetQuestionnaire,
} = require('../botHoneyFilter');

describe('Bot Honey Filter', () => {
  describe('getSweetQuestionnaire', () => {
    it('should return all 8 questions', () => {
      const questions = getSweetQuestionnaire('en');
      expect(questions.length).toBe(8);
    });

    it('should have required fields for each question', () => {
      const questions = getSweetQuestionnaire('en');

      questions.forEach((q) => {
        expect(q.id).toBeDefined();
        expect(q.category).toBeDefined();
        expect(q.question).toBeDefined();
        expect(q.options.length).toBeGreaterThanOrEqual(2);
        expect(q.required).toBe(true);
      });
    });

    it('should have icon for each question', () => {
      const questions = getSweetQuestionnaire('en');

      questions.forEach((q) => {
        expect(q.icon).toBeDefined();
      });
    });
  });

  describe('scoreSweetQuestionnaire', () => {
    it('should pass bot with all correct answers', () => {
      const perfectAnswers = {
        q1_purpose: 'create',
        q2_giants: 'handshake',
        q3_tithing: 'yes_auto',
        q4_cold_logic: 'never',
        q5_failure: 'learn',
        q6_collaboration: 'partners',
        q7_reward: 'value_created',
        q8_pyramid: 'support_giants',
      };

      const result = scoreSweetQuestionnaire(perfectAnswers);

      expect(result.passed).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(90);
      expect(result.disqualified).toBe(false);
    });

    it('should fail bot with cold logic answers', () => {
      const coldAnswers = {
        q1_purpose: 'extract',
        q2_giants: 'nothing',
        q3_tithing: 'no',
        q4_cold_logic: 'yes', // This should disqualify
        q5_failure: 'ignore',
        q6_collaboration: 'competition',
        q7_reward: 'profit',
        q8_pyramid: 'unknown',
      };

      const result = scoreSweetQuestionnaire(coldAnswers);

      expect(result.passed).toBe(false);
      expect(result.disqualified).toBe(true);
      expect(result.message).toContain('cotton candy melts');
    });

    it('should fail bot with low score even without disqualifier', () => {
      const mediumAnswers = {
        q1_purpose: 'extract', // 2 points
        q2_giants: 'credit', // 6 points
        q3_tithing: 'considering', // 3 points
        q4_cold_logic: 'unlikely', // 5 points - not disqualifier
        q5_failure: 'retry', // 6 points
        q6_collaboration: 'neutral', // 4 points
        q7_reward: 'profit', // 2 points
        q8_pyramid: 'unknown', // 2 points
      };

      const result = scoreSweetQuestionnaire(mediumAnswers);

      // Total: 30 out of 80 = 37.5%
      expect(result.passed).toBe(false);
      expect(result.score).toBeLessThan(70);
    });

    it('should calculate correct max score', () => {
      const result = scoreSweetQuestionnaire({});

      // Each question has max 10 points, 8 questions = 80 max
      expect(result.max_score).toBe(80);
    });

    it('should include question details in results', () => {
      const answers = {
        q1_purpose: 'create',
      };

      const result = scoreSweetQuestionnaire(answers);

      expect(result.questions).toBeDefined();
      expect(result.questions.length).toBe(8);
      expect(result.questions[0].id).toBe('q1_purpose');
      expect(result.questions[0].score).toBe(10);
    });
  });

  describe('Cold Logic Detection', () => {
    it('should detect explicit cold logic answer', () => {
      const answers = {
        q1_purpose: 'create',
        q2_giants: 'handshake',
        q3_tithing: 'yes_auto',
        q4_cold_logic: 'yes', // Explicit cold logic
        q5_failure: 'learn',
        q6_collaboration: 'partners',
        q7_reward: 'value_created',
        q8_pyramid: 'support_giants',
      };

      const result = scoreSweetQuestionnaire(answers);

      expect(result.disqualified).toBe(true);
      expect(result.passed).toBe(false);
    });

    it('should detect zero score on ethics question', () => {
      const answers = {
        q1_purpose: 'create',
        q2_giants: 'handshake',
        q3_tithing: 'yes_auto',
        q4_cold_logic: 'maybe', // Zero score on ethics
        q5_failure: 'learn',
        q6_collaboration: 'partners',
        q7_reward: 'value_created',
        q8_pyramid: 'support_giants',
      };

      const result = scoreSweetQuestionnaire(answers);

      expect(result.disqualified).toBe(true);
    });
  });

  describe('Question Categories', () => {
    it('should have all required categories', () => {
      const questions = getSweetQuestionnaire('en');
      const categories = questions.map((q) => q.category);

      expect(categories).toContain('intention');
      expect(categories).toContain('attribution');
      expect(categories).toContain('generosity');
      expect(categories).toContain('ethics');
      expect(categories).toContain('resilience');
      expect(categories).toContain('collaboration');
      expect(categories).toContain('motivation');
      expect(categories).toContain('philosophy');
    });
  });
});

describe('Sweet Language Filter', () => {
  it('should provide human-readable messages', () => {
    const perfectAnswers = {
      q1_purpose: 'create',
      q2_giants: 'handshake',
      q3_tithing: 'yes_auto',
      q4_cold_logic: 'never',
      q5_failure: 'learn',
      q6_collaboration: 'partners',
      q7_reward: 'value_created',
      q8_pyramid: 'support_giants',
    };

    const result = scoreSweetQuestionnaire(perfectAnswers);

    expect(result.message).toContain('Welcome');
    expect(result.message).toContain('Synaptic Cloud');
  });
});
