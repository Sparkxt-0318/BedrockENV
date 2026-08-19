import { describe, it, expect } from 'vitest';
import {
  computeCfci,
  classifyCfci,
  assignCfciQuartiles,
  type CfciInputs,
} from '@/lib/intelligence/cfci-scorer';

// ---------------------------------------------------------------------------
// computeCfci
// ---------------------------------------------------------------------------

describe('computeCfci', () => {
  it('computes cfci as sqrt(floodExposureScore * cpi)', () => {
    // fer=0.25 → floodExposureScore=25, cpi=64 → cfci=sqrt(25*64)=sqrt(1600)=40
    const result = computeCfci({ fer: 0.25, cpi: 64 });
    expect(result.cfci).toBe(40);
    expect(result.floodExposureScore).toBe(25);
    expect(result.cpi).toBe(64);
  });

  it('returns cfci=0 when fer=0', () => {
    const result = computeCfci({ fer: 0, cpi: 80 });
    expect(result.cfci).toBe(0);
    expect(result.floodExposureScore).toBe(0);
  });

  it('returns cfci=0 when cpi=0', () => {
    const result = computeCfci({ fer: 0.5, cpi: 0 });
    expect(result.cfci).toBe(0);
  });

  it('clamps fer to [0,1]', () => {
    const high = computeCfci({ fer: 2.0, cpi: 100 });
    const low = computeCfci({ fer: -1.0, cpi: 100 });
    expect(high.floodExposureScore).toBe(100);
    expect(low.floodExposureScore).toBe(0);
  });

  it('clamps cpi to [0,100]', () => {
    const result = computeCfci({ fer: 1.0, cpi: 200 });
    expect(result.cpi).toBe(100);
  });

  it('handles non-finite fer gracefully (treats as 0)', () => {
    expect(computeCfci({ fer: NaN, cpi: 50 }).cfci).toBe(0);
    // Infinity is non-finite → treated as 0, not clamped to 1
    expect(computeCfci({ fer: Infinity, cpi: 50 }).floodExposureScore).toBe(0);
  });

  it('handles non-finite cpi gracefully (treats as 0)', () => {
    expect(computeCfci({ fer: 0.5, cpi: NaN }).cfci).toBe(0);
  });

  it('rounds cfci to nearest integer', () => {
    // fer=0.1 → fes=10, cpi=9 → raw=sqrt(90)≈9.487 → round to 9
    const result = computeCfci({ fer: 0.1, cpi: 9 });
    expect(Number.isInteger(result.cfci)).toBe(true);
  });

  it('attaches correct classification', () => {
    expect(computeCfci({ fer: 1.0, cpi: 100 }).classification).toBe('Severe');
    expect(computeCfci({ fer: 0.25, cpi: 64 }).classification).toBe('High');
    expect(computeCfci({ fer: 0.09, cpi: 25 }).classification).toBe('Elevated');
    expect(computeCfci({ fer: 0.01, cpi: 10 }).classification).toBe('Low');
  });

  it('max cfci is 100 (fer=1, cpi=100)', () => {
    const result = computeCfci({ fer: 1.0, cpi: 100 });
    expect(result.cfci).toBe(100);
  });
});

// ---------------------------------------------------------------------------
// classifyCfci
// ---------------------------------------------------------------------------

describe('classifyCfci', () => {
  it('returns Severe for cfci >= 50', () => {
    expect(classifyCfci(50)).toBe('Severe');
    expect(classifyCfci(75)).toBe('Severe');
    expect(classifyCfci(100)).toBe('Severe');
  });

  it('returns High for cfci in [30, 49]', () => {
    expect(classifyCfci(30)).toBe('High');
    expect(classifyCfci(40)).toBe('High');
    expect(classifyCfci(49)).toBe('High');
  });

  it('returns Elevated for cfci in [15, 29]', () => {
    expect(classifyCfci(15)).toBe('Elevated');
    expect(classifyCfci(22)).toBe('Elevated');
    expect(classifyCfci(29)).toBe('Elevated');
  });

  it('returns Low for cfci < 15', () => {
    expect(classifyCfci(0)).toBe('Low');
    expect(classifyCfci(7)).toBe('Low');
    expect(classifyCfci(14)).toBe('Low');
  });
});

// ---------------------------------------------------------------------------
// assignCfciQuartiles
// ---------------------------------------------------------------------------

describe('assignCfciQuartiles', () => {
  it('assigns quartile 1 to lowest 25%, quartile 4 to highest 25%', () => {
    const records = [
      { cfci: 10 },
      { cfci: 30 },
      { cfci: 50 },
      { cfci: 80 },
    ];
    const quartiles = assignCfciQuartiles(records);
    expect(quartiles[0]).toBe(1); // lowest → Q1
    expect(quartiles[3]).toBe(4); // highest → Q4
  });

  it('handles a single record', () => {
    const quartiles = assignCfciQuartiles([{ cfci: 42 }]);
    expect(quartiles[0]).toBe(1);
  });

  it('returns an array of the same length as input', () => {
    const records = Array.from({ length: 20 }, (_, i) => ({ cfci: i * 5 }));
    const quartiles = assignCfciQuartiles(records);
    expect(quartiles).toHaveLength(20);
  });

  it('assigns only valid quartile values (1|2|3|4)', () => {
    const records = Array.from({ length: 100 }, (_, i) => ({ cfci: i }));
    const quartiles = assignCfciQuartiles(records);
    for (const q of quartiles) {
      expect([1, 2, 3, 4]).toContain(q);
    }
  });

  it('preserves original order (result index matches input index)', () => {
    // Input in descending order — quartiles should be in descending order too
    const records = [{ cfci: 80 }, { cfci: 60 }, { cfci: 40 }, { cfci: 20 }];
    const quartiles = assignCfciQuartiles(records);
    expect(quartiles[0]).toBe(4); // 80 → Q4
    expect(quartiles[3]).toBe(1); // 20 → Q1
  });

  it('distributes 4 records one-per-quartile', () => {
    const records = [{ cfci: 10 }, { cfci: 25 }, { cfci: 45 }, { cfci: 70 }];
    const quartiles = assignCfciQuartiles(records);
    const sorted = [...quartiles].sort();
    expect(sorted).toEqual([1, 2, 3, 4]);
  });
});
