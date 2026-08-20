import { describe, it, expect } from 'vitest';
import { linearNormalize, logNormalize, stepNormalize } from '@/lib/scoring/normalizer';

describe('linearNormalize', () => {
  it('returns 0 for value at min', () => {
    expect(linearNormalize(0, 0, 100)).toBe(0);
  });

  it('returns 100 for value at max', () => {
    expect(linearNormalize(100, 0, 100)).toBe(100);
  });

  it('returns 50 for value at midpoint', () => {
    expect(linearNormalize(50, 0, 100)).toBe(50);
  });

  it('clamps to 0 for value below min', () => {
    expect(linearNormalize(-10, 0, 100)).toBe(0);
  });

  it('clamps to 100 for value above max', () => {
    expect(linearNormalize(200, 0, 100)).toBe(100);
  });

  it('returns 100 when min === max and value >= max', () => {
    expect(linearNormalize(5, 5, 5)).toBe(100);
  });

  it('returns 0 when min === max and value < max', () => {
    expect(linearNormalize(3, 5, 5)).toBe(0);
  });

  it('works with non-zero min', () => {
    // value=15, min=10, max=20 → (15-10)/(20-10) = 0.5 → 50
    expect(linearNormalize(15, 10, 20)).toBe(50);
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

  it('returns a value between 0 and 100 for mid-range input', () => {
    const result = logNormalize(10, 100);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(100);
  });

  it('is monotonically increasing', () => {
    const a = logNormalize(1, 1000);
    const b = logNormalize(10, 1000);
    const c = logNormalize(100, 1000);
    expect(a).toBeLessThan(b);
    expect(b).toBeLessThan(c);
  });
});

describe('stepNormalize', () => {
  const thresholds = [
    { value: 0, score: 0 },
    { value: 10, score: 25 },
    { value: 50, score: 50 },
    { value: 100, score: 75 },
    { value: 200, score: 100 },
  ];

  it('returns 0 for value below first threshold', () => {
    expect(stepNormalize(-1, thresholds)).toBe(0);
  });

  it('returns score for first matching threshold', () => {
    expect(stepNormalize(0, thresholds)).toBe(0);
  });

  it('returns correct score for mid-range value', () => {
    expect(stepNormalize(50, thresholds)).toBe(50);
    expect(stepNormalize(75, thresholds)).toBe(50);
  });

  it('returns highest score when value exceeds all thresholds', () => {
    expect(stepNormalize(300, thresholds)).toBe(100);
  });

  it('returns 0 for empty thresholds', () => {
    expect(stepNormalize(50, [])).toBe(0);
  });
});
