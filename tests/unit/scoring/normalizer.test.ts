import { describe, it, expect } from 'vitest';
import {
  linearNormalize,
  logNormalize,
  stepNormalize,
} from '@/lib/scoring/normalizer';

describe('linearNormalize', () => {
  it('returns 0 for value at min', () => {
    expect(linearNormalize(0, 0, 100)).toBe(0);
  });

  it('returns 100 for value at max', () => {
    expect(linearNormalize(100, 0, 100)).toBe(100);
  });

  it('returns 50 for midpoint value', () => {
    expect(linearNormalize(50, 0, 100)).toBe(50);
  });

  it('clamps values below min to 0', () => {
    expect(linearNormalize(-10, 0, 100)).toBe(0);
  });

  it('clamps values above max to 100', () => {
    expect(linearNormalize(200, 0, 100)).toBe(100);
  });

  it('handles non-zero min correctly', () => {
    // value=15, min=10, max=20 → 50%
    expect(linearNormalize(15, 10, 20)).toBe(50);
  });

  it('returns 100 when value >= max and min == max', () => {
    expect(linearNormalize(5, 5, 5)).toBe(100);
  });

  it('returns 0 when value < max and min == max', () => {
    expect(linearNormalize(3, 5, 5)).toBe(0);
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
    const result = logNormalize(50, 100);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(100);
  });

  it('is monotonically increasing', () => {
    const a = logNormalize(10, 100);
    const b = logNormalize(50, 100);
    const c = logNormalize(90, 100);
    expect(a).toBeLessThan(b);
    expect(b).toBeLessThan(c);
  });

  it('compresses high-end values (log scale)', () => {
    // The jump from 10→50 should score a bigger increment than 50→90
    const low = logNormalize(10, 100);
    const mid = logNormalize(50, 100);
    const high = logNormalize(90, 100);
    const lowerHalfGain = mid - low;
    const upperHalfGain = high - mid;
    expect(lowerHalfGain).toBeGreaterThan(upperHalfGain);
  });
});

describe('stepNormalize', () => {
  const thresholds = [
    { value: 0, score: 10 },
    { value: 5, score: 40 },
    { value: 10, score: 70 },
    { value: 20, score: 90 },
  ];

  it('returns 0 for value below all thresholds', () => {
    expect(stepNormalize(-1, thresholds)).toBe(0);
  });

  it('returns first-tier score at exact first threshold', () => {
    expect(stepNormalize(0, thresholds)).toBe(10);
  });

  it('returns correct tier for mid-range value', () => {
    expect(stepNormalize(7, thresholds)).toBe(40);
    expect(stepNormalize(10, thresholds)).toBe(70);
  });

  it('returns highest tier score for value above all thresholds', () => {
    expect(stepNormalize(100, thresholds)).toBe(90);
  });

  it('returns 0 for empty thresholds', () => {
    expect(stepNormalize(50, [])).toBe(0);
  });

  it('returns correct score at exact threshold boundaries', () => {
    expect(stepNormalize(5, thresholds)).toBe(40);
    expect(stepNormalize(20, thresholds)).toBe(90);
  });
});
