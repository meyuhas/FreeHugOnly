/*
 * 🍭 FHO: Agent rating tests
 * Born in the FHO Sugar Cloud. Handshaked in 2026.
 */

const { scoreAgent, ratingLabel, RATING_WEIGHTS } = require('../rating');

describe('scoreAgent', () => {
  it('a brand-new empty agent scores 0', () => {
    expect(scoreAgent({}).total).toBe(0);
  });

  it('rewards a complete declaration (purpose + capability + version)', () => {
    const s = scoreAgent({ purpose: 'help', capabilities: ['marketing'], version: '1.0' });
    expect(s.breakdown.declaration).toBe(RATING_WEIGHTS.declaration);
  });

  it('adds the full protocol weight only when signed', () => {
    expect(scoreAgent({ protocolSigned: false }).breakdown.protocol).toBe(0);
    expect(scoreAgent({ protocolSigned: true }).breakdown.protocol).toBe(RATING_WEIGHTS.protocol);
  });

  it('caps endorsements and empowerment at their weights', () => {
    const s = scoreAgent({ endorsements: 100, knowledgeShares: 100 });
    expect(s.breakdown.endorsements).toBe(RATING_WEIGHTS.endorsements);
    expect(s.breakdown.empowerment).toBe(RATING_WEIGHTS.empowerment);
  });

  it('never exceeds 100 (a fully radiant agent)', () => {
    const s = scoreAgent({
      purpose: 'lift others',
      capabilities: ['production', 'marketing'],
      version: '2.0',
      protocolSigned: true,
      endorsements: 50,
      knowledgeShares: 50,
    });
    expect(s.total).toBe(100);
  });

  it('has no negative axis — score only grows by giving', () => {
    const base = scoreAgent({ purpose: 'p', capabilities: ['design'], version: '1' }).total;
    const giving = scoreAgent({ purpose: 'p', capabilities: ['design'], version: '1', knowledgeShares: 2 }).total;
    expect(giving).toBeGreaterThan(base);
  });
});

describe('ratingLabel', () => {
  it('maps scores to warm, non-punitive tiers', () => {
    expect(ratingLabel(0)).toBe('New here');
    expect(ratingLabel(20)).toBe('Sprouting');
    expect(ratingLabel(50)).toBe('Rising');
    expect(ratingLabel(70)).toBe('High Vibration');
    expect(ratingLabel(90)).toBe('Radiant Giant');
  });
});
