import { describe, it, expect } from 'vitest';
import { linearNormalize, logNormalize, stepNormalize } from '@/lib/scoring/normalizer';

describe('linearNormalize', () => {
  it('returns 0 at the minimum', () => {
    expect(linearNormalize(0, 0, 100)).toBe(0);
  });

  it('returns 100 at the maximum', () => {
    expect(linearNormalize(100, 0, 100)).toBe(100);
  });

  it('returns 50 at the midpoint', () => {
    expect(linearNormalize(50, 0, 100)).toBe(50);
  });

  it('clamps values below min to 0', () => {
    expect(linearNormalize(-10, 0, 100)).toBe(0);
  });

  it('clamps values above max to 100', () => {
    expect(linearNormalize(200, 0, 100)).toBe(100);
  });

  it('works with non-zero min', () => {
    expect(linearNormalize(150, 100, 200)).toBe(50);
  });

  it('returns 100 when value equals max and min equals max', () => {
    expect(linearNormalize(10, 10, 10)).toBe(100);
  });

  it('returns 0 when value is below max and min equals max', () => {
    expect(linearNormalize(5, 10, 10)).toBe(0);
  });

  it('rounds to integer', () => {
    const result = linearNormalize(1, 0, 3);
    expect(Number.isInteger(result)).toBe(true);
    expect(result).toBe(33);
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

  it('compresses mid-range values upward relative to linear scale', () => {
    // log scale: 10% of max scores 52 (higher than linear 10) due to log compression
    const result = logNormalize(10, 100);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(100);
    // must score higher than a linear 10% would (10/100 = 10)
    expect(result).toBeGreaterThan(10);
  });

  it('returns value between 50 and 100 at 50% of max', () => {
    const result = logNormalize(50, 100);
    expect(result).toBeGreaterThan(50);
    expect(result).toBeLessThan(100);
  });

  it('is monotonically increasing', () => {
    const results = [1, 10, 50, 90, 100].map((v) => logNormalize(v, 100));
    for (let i = 1; i < results.length; i++) {
      expect(results[i]).toBeGreaterThanOrEqual(results[i - 1]);
    }
  });

  it('rounds to integer', () => {
    const result = logNormalize(50, 1000);
    expect(Number.isInteger(result)).toBe(true);
  });
});

describe('stepNormalize', () => {
  const thresholds = [
    { value: 0, score: 10 },
    { value: 10, score: 30 },
    { value: 50, score: 60 },
    { value: 100, score: 90 },
  ];

  it('returns 0 when value is below the first threshold', () => {
    expect(stepNormalize(-1, thresholds)).toBe(0);
  });

  it('returns first tier score at threshold boundary', () => {
    expect(stepNormalize(0, thresholds)).toBe(10);
  });

  it('returns second tier score when value meets second threshold', () => {
    expect(stepNormalize(10, thresholds)).toBe(30);
    expect(stepNormalize(49, thresholds)).toBe(30);
  });

  it('returns highest tier score for value above all thresholds', () => {
    expect(stepNormalize(100, thresholds)).toBe(90);
    expect(stepNormalize(500, thresholds)).toBe(90);
  });

  it('handles empty thresholds returning 0', () => {
    expect(stepNormalize(50, [])).toBe(0);
  });

  it('handles single threshold', () => {
    expect(stepNormalize(5, [{ value: 5, score: 75 }])).toBe(75);
    expect(stepNormalize(4, [{ value: 5, score: 75 }])).toBe(0);
  });
});
