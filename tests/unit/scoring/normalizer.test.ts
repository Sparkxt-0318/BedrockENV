import { describe, it, expect } from 'vitest';
import { linearNormalize, logNormalize, stepNormalize } from '@/lib/scoring/normalizer';

describe('linearNormalize', () => {
  it('maps min to 0 and max to 100', () => {
    expect(linearNormalize(0, 0, 100)).toBe(0);
    expect(linearNormalize(100, 0, 100)).toBe(100);
  });

  it('maps midpoint to 50', () => {
    expect(linearNormalize(50, 0, 100)).toBe(50);
  });

  it('clamps values below min to 0', () => {
    expect(linearNormalize(-10, 0, 100)).toBe(0);
  });

  it('clamps values above max to 100', () => {
    expect(linearNormalize(150, 0, 100)).toBe(100);
  });

  it('handles non-zero min/max range', () => {
    expect(linearNormalize(15, 10, 20)).toBe(50);
    expect(linearNormalize(10, 10, 20)).toBe(0);
    expect(linearNormalize(20, 10, 20)).toBe(100);
  });

  it('returns 100 when max === min and value >= max', () => {
    expect(linearNormalize(5, 5, 5)).toBe(100);
  });

  it('returns 0 when max === min and value < max', () => {
    expect(linearNormalize(3, 5, 5)).toBe(0);
  });

  it('rounds fractional results', () => {
    // 1/3 of range → 33.33... → rounds to 33
    expect(linearNormalize(1, 0, 3)).toBe(33);
  });
});

describe('logNormalize', () => {
  it('returns 0 for value <= 0', () => {
    expect(logNormalize(0, 100)).toBe(0);
    expect(logNormalize(-5, 100)).toBe(0);
  });

  it('returns 100 for value >= max', () => {
    expect(logNormalize(100, 100)).toBe(100);
    expect(logNormalize(200, 100)).toBe(100);
  });

  it('returns a value between 0 and 100 for intermediate values', () => {
    const result = logNormalize(10, 100);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(100);
  });

  it('increases monotonically with value', () => {
    const r1 = logNormalize(1, 1000);
    const r2 = logNormalize(10, 1000);
    const r3 = logNormalize(100, 1000);
    expect(r1).toBeLessThan(r2);
    expect(r2).toBeLessThan(r3);
  });

  it('produces log-scale compression (midpoint << 50)', () => {
    // halfway through the range on a log scale should be below 50
    const mid = logNormalize(50, 100);
    expect(mid).toBeLessThan(90);
    expect(mid).toBeGreaterThan(0);
  });
});

describe('stepNormalize', () => {
  const thresholds = [
    { value: 10, score: 20 },
    { value: 50, score: 50 },
    { value: 100, score: 80 },
  ];

  it('returns 0 when value is below all thresholds', () => {
    expect(stepNormalize(5, thresholds)).toBe(0);
  });

  it('returns the score of the matching threshold', () => {
    expect(stepNormalize(10, thresholds)).toBe(20);
    expect(stepNormalize(50, thresholds)).toBe(50);
    expect(stepNormalize(100, thresholds)).toBe(80);
  });

  it('returns highest applicable score for values above max threshold', () => {
    expect(stepNormalize(200, thresholds)).toBe(80);
  });

  it('applies last matched threshold when between steps', () => {
    expect(stepNormalize(30, thresholds)).toBe(20);
    expect(stepNormalize(75, thresholds)).toBe(50);
  });

  it('returns 0 for empty thresholds array', () => {
    expect(stepNormalize(50, [])).toBe(0);
  });
});
