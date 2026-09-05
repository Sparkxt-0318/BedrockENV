import { describe, it, expect } from 'vitest';
import {
  computeCfci,
  classifyCfci,
  assignCfciQuartiles,
} from '@/lib/intelligence/cfci-scorer';

// ---------------------------------------------------------------------------
// classifyCfci
// ---------------------------------------------------------------------------

describe('classifyCfci', () => {
  it('returns Low for cfci < 15', () => {
    expect(classifyCfci(0)).toBe('Low');
    expect(classifyCfci(14)).toBe('Low');
  });

  it('returns Elevated for 15 ≤ cfci < 30', () => {
    expect(classifyCfci(15)).toBe('Elevated');
    expect(classifyCfci(29)).toBe('Elevated');
  });

  it('returns High for 30 ≤ cfci < 50', () => {
    expect(classifyCfci(30)).toBe('High');
    expect(classifyCfci(49)).toBe('High');
  });

  it('returns Severe for cfci ≥ 50', () => {
    expect(classifyCfci(50)).toBe('Severe');
    expect(classifyCfci(100)).toBe('Severe');
  });
});

// ---------------------------------------------------------------------------
// computeCfci
// ---------------------------------------------------------------------------

describe('computeCfci', () => {
  it('returns zero scores when both inputs are zero', () => {
    const result = computeCfci({ fer: 0, cpi: 0 });
    expect(result.cfci).toBe(0);
    expect(result.floodExposureScore).toBe(0);
    expect(result.cpi).toBe(0);
    expect(result.classification).toBe('Low');
  });

  it('computes CFCI as sqrt(floodExposureScore * cpi), rounded', () => {
    // fer=0.64 → floodExposureScore=64; cpi=64 → cfci=sqrt(64*64)=64 → Severe
    const result = computeCfci({ fer: 0.64, cpi: 64 });
    expect(result.floodExposureScore).toBe(64);
    expect(result.cpi).toBe(64);
    expect(result.cfci).toBe(64);
    expect(result.classification).toBe('Severe');
  });

  it('returns Low when flood exposure is zero regardless of cpi', () => {
    const result = computeCfci({ fer: 0, cpi: 90 });
    expect(result.cfci).toBe(0);
    expect(result.classification).toBe('Low');
  });

  it('returns Low when cpi is zero regardless of flood exposure', () => {
    const result = computeCfci({ fer: 1, cpi: 0 });
    expect(result.cfci).toBe(0);
    expect(result.classification).toBe('Low');
  });

  it('clamps fer to [0, 1]', () => {
    const high = computeCfci({ fer: 5, cpi: 100 });
    expect(high.floodExposureScore).toBe(100);

    const low = computeCfci({ fer: -2, cpi: 100 });
    expect(low.floodExposureScore).toBe(0);
  });

  it('clamps cpi to [0, 100]', () => {
    const high = computeCfci({ fer: 1, cpi: 999 });
    expect(high.cpi).toBe(100);
    expect(high.cfci).toBe(100);

    const low = computeCfci({ fer: 1, cpi: -10 });
    expect(low.cpi).toBe(0);
    expect(low.cfci).toBe(0);
  });

  it('treats non-finite inputs as zero', () => {
    const r1 = computeCfci({ fer: NaN, cpi: 80 });
    expect(r1.floodExposureScore).toBe(0);
    expect(r1.cfci).toBe(0);

    const r2 = computeCfci({ fer: 0.5, cpi: Infinity });
    // Infinity is not finite → treated as 0
    expect(r2.cpi).toBe(0);
  });

  it('produces Elevated classification for a moderate county', () => {
    // fer=0.25 → floodExposureScore=25; cpi=25 → cfci=sqrt(625)=25 → Elevated
    const result = computeCfci({ fer: 0.25, cpi: 25 });
    expect(result.cfci).toBe(25);
    expect(result.classification).toBe('Elevated');
  });
});

// ---------------------------------------------------------------------------
// assignCfciQuartiles
// ---------------------------------------------------------------------------

describe('assignCfciQuartiles', () => {
  it('assigns quartile 1 to the lowest and 4 to the highest in a sorted set', () => {
    const records = [
      { cfci: 10 },
      { cfci: 25 },
      { cfci: 40 },
      { cfci: 80 },
    ];
    const quartiles = assignCfciQuartiles(records);
    expect(quartiles[0]).toBe(1);
    expect(quartiles[1]).toBe(2);
    expect(quartiles[2]).toBe(3);
    expect(quartiles[3]).toBe(4);
  });

  it('returns an empty array for empty input', () => {
    expect(assignCfciQuartiles([])).toEqual([]);
  });

  it('assigns all records to quartile 1 when there is only one record', () => {
    const quartiles = assignCfciQuartiles([{ cfci: 50 }]);
    expect(quartiles).toEqual([1]);
  });

  it('preserves original index ordering (not sorted output)', () => {
    // Input is out of order: low, high, medium — quartiles align to original indices
    const records = [{ cfci: 80 }, { cfci: 10 }, { cfci: 40 }];
    const quartiles = assignCfciQuartiles(records);
    // 10 → Q1 (index 1), 40 → Q2 (index 2), 80 → Q3 (index 0, pct=2/3 → Q3)
    expect(quartiles[1]).toBe(1); // cfci=10 is lowest
    expect(quartiles[0]).toBe(3); // cfci=80 is highest at pct=2/3 < 0.75 → Q3
  });

  it('distributes 8 records evenly across 4 quartiles', () => {
    const records = [10, 20, 30, 40, 50, 60, 70, 80].map((cfci) => ({ cfci }));
    const quartiles = assignCfciQuartiles(records);
    // Each quartile should have exactly 2 members
    const counts = [1, 2, 3, 4].map((q) => quartiles.filter((x) => x === q).length);
    expect(counts).toEqual([2, 2, 2, 2]);
  });
});
