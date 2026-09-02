import { describe, it, expect } from 'vitest';
import { linearNormalize, logNormalize, stepNormalize } from '@/lib/scoring/normalizer';

// ---------------------------------------------------------------------------
// linearNormalize
// ---------------------------------------------------------------------------

describe('linearNormalize', () => {
  it('returns 0 when value equals min', () => {
    expect(linearNormalize(0, 0, 100)).toBe(0);
  });

  it('returns 100 when value equals max', () => {
    expect(linearNormalize(100, 0, 100)).toBe(100);
  });

  it('returns 50 for midpoint', () => {
    expect(linearNormalize(50, 0, 100)).toBe(50);
  });

  it('clamps to 0 for values below min', () => {
    expect(linearNormalize(-10, 0, 100)).toBe(0);
  });

  it('clamps to 100 for values above max', () => {
    expect(linearNormalize(150, 0, 100)).toBe(100);
  });

  it('handles non-zero min correctly', () => {
    // 75 is midpoint of 50–100 → should be 50
    expect(linearNormalize(75, 50, 100)).toBe(50);
  });

  it('returns 100 when value >= max and max === min', () => {
    expect(linearNormalize(5, 5, 5)).toBe(100);
  });

  it('returns 0 when value < max and max === min', () => {
    expect(linearNormalize(3, 5, 5)).toBe(0);
  });

  it('rounds result to nearest integer', () => {
    // 1/3 * 100 = 33.33… → rounds to 33
    expect(linearNormalize(1, 0, 3)).toBe(33);
  });
});

// ---------------------------------------------------------------------------
// logNormalize
// ---------------------------------------------------------------------------

describe('logNormalize', () => {
  it('returns 0 for value 0', () => {
    expect(logNormalize(0, 1000)).toBe(0);
  });

  it('returns 0 for negative value', () => {
    expect(logNormalize(-5, 1000)).toBe(0);
  });

  it('returns 100 for value equal to max', () => {
    expect(logNormalize(1000, 1000)).toBe(100);
  });

  it('returns 100 for value above max', () => {
    expect(logNormalize(2000, 1000)).toBe(100);
  });

  it('returns value between 0 and 100 for mid-range input', () => {
    const score = logNormalize(100, 1000);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(100);
  });

  it('is monotonically increasing', () => {
    const s1 = logNormalize(10, 1000);
    const s2 = logNormalize(100, 1000);
    const s3 = logNormalize(500, 1000);
    expect(s1).toBeLessThan(s2);
    expect(s2).toBeLessThan(s3);
  });

  it('compresses wide ranges — 10x values do not produce 10x scores', () => {
    const s1 = logNormalize(10, 10000);
    const s2 = logNormalize(100, 10000);
    // log compression: gap between s1 and s2 is far less than 90 points
    expect(s2 - s1).toBeLessThan(30);
  });
});

// ---------------------------------------------------------------------------
// stepNormalize
// ---------------------------------------------------------------------------

describe('stepNormalize', () => {
  const thresholds = [
    { value: 0, score: 10 },
    { value: 10, score: 40 },
    { value: 50, score: 70 },
    { value: 100, score: 95 },
  ];

  it('returns 0 when value is below all thresholds', () => {
    // value=-1 is below value:0
    expect(stepNormalize(-1, thresholds)).toBe(0);
  });

  it('returns score for the first matching threshold', () => {
    expect(stepNormalize(0, thresholds)).toBe(10);
  });

  it('returns score for an intermediate threshold', () => {
    expect(stepNormalize(25, thresholds)).toBe(40);
  });

  it('returns score for the highest threshold when value exceeds all', () => {
    expect(stepNormalize(200, thresholds)).toBe(95);
  });

  it('returns 0 for empty thresholds array', () => {
    expect(stepNormalize(100, [])).toBe(0);
  });

  it('uses the last exceeded threshold (not first)', () => {
    // value=100 exceeds value:0(10), value:10(40), value:50(70), value:100(95)
    expect(stepNormalize(100, thresholds)).toBe(95);
  });

  it('breaks at the first non-exceeded threshold', () => {
    // value=5 exceeds value:0(10) but not value:10(40)
    expect(stepNormalize(5, thresholds)).toBe(10);
  });
});
