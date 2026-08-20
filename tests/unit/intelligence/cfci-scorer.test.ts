import { describe, it, expect } from 'vitest';
import { computeCfci, classifyCfci, assignCfciQuartiles } from '../../../lib/intelligence/cfci-scorer';

describe('computeCfci', () => {
  it('returns 0 for zero flood exposure', () => {
    const result = computeCfci({ fer: 0, cpi: 80 });
    expect(result.cfci).toBe(0);
    expect(result.floodExposureScore).toBe(0);
    expect(result.classification).toBe('Low');
  });

  it('returns 0 for zero contamination pressure', () => {
    const result = computeCfci({ fer: 0.5, cpi: 0 });
    expect(result.cfci).toBe(0);
    expect(result.classification).toBe('Low');
  });

  it('computes cfci = sqrt(floodExposureScore * cpi)', () => {
    // fer=0.64 → floodExposureScore=64; cpi=64 → cfci=sqrt(64*64)=64
    const result = computeCfci({ fer: 0.64, cpi: 64 });
    expect(result.cfci).toBe(64);
    expect(result.floodExposureScore).toBe(64);
    expect(result.cpi).toBe(64);
  });

  it('clamps fer above 1 to 1', () => {
    const result = computeCfci({ fer: 2, cpi: 100 });
    expect(result.floodExposureScore).toBe(100);
    expect(result.cfci).toBe(100);
  });

  it('clamps fer below 0 to 0', () => {
    const result = computeCfci({ fer: -0.5, cpi: 100 });
    expect(result.floodExposureScore).toBe(0);
    expect(result.cfci).toBe(0);
  });

  it('clamps cpi above 100 to 100', () => {
    const result = computeCfci({ fer: 1, cpi: 150 });
    expect(result.cpi).toBe(100);
  });

  it('treats NaN fer as 0', () => {
    const result = computeCfci({ fer: NaN, cpi: 80 });
    expect(result.floodExposureScore).toBe(0);
    expect(result.cfci).toBe(0);
  });

  it('treats NaN cpi as 0', () => {
    const result = computeCfci({ fer: 0.5, cpi: NaN });
    expect(result.cpi).toBe(0);
    expect(result.cfci).toBe(0);
  });

  it('returns Severe classification for high compound risk', () => {
    const result = computeCfci({ fer: 1, cpi: 100 });
    expect(result.classification).toBe('Severe');
    expect(result.cfci).toBe(100);
  });
});

describe('classifyCfci', () => {
  it('returns Low for cfci < 15', () => {
    expect(classifyCfci(0)).toBe('Low');
    expect(classifyCfci(14)).toBe('Low');
  });

  it('returns Elevated for 15 <= cfci < 30', () => {
    expect(classifyCfci(15)).toBe('Elevated');
    expect(classifyCfci(29)).toBe('Elevated');
  });

  it('returns High for 30 <= cfci < 50', () => {
    expect(classifyCfci(30)).toBe('High');
    expect(classifyCfci(49)).toBe('High');
  });

  it('returns Severe for cfci >= 50', () => {
    expect(classifyCfci(50)).toBe('Severe');
    expect(classifyCfci(100)).toBe('Severe');
  });
});

describe('assignCfciQuartiles', () => {
  it('assigns quartiles 1-4 to a sorted set of 4 records', () => {
    const records = [
      { cfci: 10 },
      { cfci: 30 },
      { cfci: 50 },
      { cfci: 80 },
    ];
    const quartiles = assignCfciQuartiles(records);
    expect(quartiles).toEqual([1, 2, 3, 4]);
  });

  it('handles a single record (assigned quartile 1)', () => {
    const quartiles = assignCfciQuartiles([{ cfci: 50 }]);
    expect(quartiles[0]).toBe(1);
  });

  it('returns array same length as input', () => {
    const records = Array.from({ length: 100 }, (_, i) => ({ cfci: i }));
    const quartiles = assignCfciQuartiles(records);
    expect(quartiles.length).toBe(100);
  });

  it('all quartile values are 1, 2, 3, or 4', () => {
    const records = Array.from({ length: 20 }, (_, i) => ({ cfci: i * 5 }));
    const quartiles = assignCfciQuartiles(records);
    for (const q of quartiles) {
      expect([1, 2, 3, 4]).toContain(q);
    }
  });

  it('preserves original index order', () => {
    // Highest cfci is index 0, so it should get quartile 4
    const records = [{ cfci: 100 }, { cfci: 0 }, { cfci: 50 }, { cfci: 25 }];
    const quartiles = assignCfciQuartiles(records);
    // Sorted order: index 1 (0), index 3 (25), index 2 (50), index 0 (100)
    // Q1=index1, Q2=index3, Q3=index2, Q4=index0
    expect(quartiles[0]).toBe(4);
    expect(quartiles[1]).toBe(1);
  });
});
