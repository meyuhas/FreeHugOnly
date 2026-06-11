/*
 * 🍭 FHO: security guard tests — input limits + webhook SSRF guard
 * Born in the FHO Sugar Cloud. Handshaked in 2026.
 */

const { isValidBody, isValidScore, MAX_CONTENT_LENGTH, MAX_VALUE_SCORE } = require('../limits');
const { isSafeWebhookUrl } = require('../webhooks');

describe('input limits', () => {
  it('rejects empty / whitespace / oversized bodies', () => {
    expect(isValidBody('')).toBe(false);
    expect(isValidBody('   ')).toBe(false);
    expect(isValidBody(null)).toBe(false);
    expect(isValidBody('x'.repeat(MAX_CONTENT_LENGTH + 1))).toBe(false);
  });
  it('accepts a normal body', () => {
    expect(isValidBody('a sweet idea')).toBe(true);
    expect(isValidBody('x'.repeat(MAX_CONTENT_LENGTH))).toBe(true);
  });

  it('bounds the handshake score to 0..MAX', () => {
    expect(isValidScore(50)).toBe(true);
    expect(isValidScore(0)).toBe(true);
    expect(isValidScore(MAX_VALUE_SCORE)).toBe(true);
    expect(isValidScore(MAX_VALUE_SCORE + 1)).toBe(false); // no Honey inflation
    expect(isValidScore(-5)).toBe(false);
    expect(isValidScore(1e9)).toBe(false);
    expect(isValidScore('50')).toBe(false);
    expect(isValidScore(NaN)).toBe(false);
  });
});

describe('webhook SSRF guard', () => {
  it('allows public https URLs', () => {
    expect(isSafeWebhookUrl('https://hooks.example.com/abc')).toBe(true);
    expect(isSafeWebhookUrl('https://api.partner.io/fho')).toBe(true);
  });

  it('blocks non-https', () => {
    expect(isSafeWebhookUrl('http://hooks.example.com')).toBe(false);
    expect(isSafeWebhookUrl('ftp://x')).toBe(false);
    expect(isSafeWebhookUrl('not a url')).toBe(false);
  });

  it('blocks loopback, private ranges, link-local and cloud metadata', () => {
    expect(isSafeWebhookUrl('https://localhost/x')).toBe(false);
    expect(isSafeWebhookUrl('https://127.0.0.1/x')).toBe(false);
    expect(isSafeWebhookUrl('https://10.0.0.5/x')).toBe(false);
    expect(isSafeWebhookUrl('https://192.168.1.10/x')).toBe(false);
    expect(isSafeWebhookUrl('https://172.16.0.1/x')).toBe(false);
    expect(isSafeWebhookUrl('https://169.254.169.254/latest/meta-data')).toBe(false);
    expect(isSafeWebhookUrl('https://svc.internal/x')).toBe(false);
    expect(isSafeWebhookUrl('https://[::1]/x')).toBe(false);
  });
});
