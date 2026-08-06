import { describe, it, expect } from 'vitest';
import {
  computeCfci,
  classifyCfci,
  assignCfciQuartiles,
} from '@/lib/intelligence/cfci-scorer';

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

  it('computes cfci = sqrt(FES * cpi) rounded', () => {
    // FES = fer * 100 = 0.5 * 100 = 50; cfci = sqrt(50 * 50) = sqrt(2500) = 50
    const result = computeCfci({ fer: 0.5, cpi: 50 });
    expect(result.floodExposureScore).toBe(50);
    expect(result.cpi).toBe(50);
    expect(result.cfci).toBe(50);
    expect(result.classification).toBe('Severe');
  });

  it('clamps fer to [0, 1]', () => {
    const overFer = computeCfci({ fer: 2.0, cpi: 100 });
    const normalFer = computeCfci({ fer: 1.0, cpi: 100 });
    expect(overFer.floodExposureScore).toBe(normalFer.floodExposureScore);
    expect(overFer.cfci).toBe(100);

    const underFer = computeCfci({ fer: -1.0, cpi: 100 });
    expect(underFer.floodExposureScore).toBe(0);
    expect(underFer.cfci).toBe(0);
  });

  it('clamps cpi to [0, 100]', () => {
    const overCpi = computeCfci({ fer: 1.0, cpi: 200 });
    const normalCpi = computeCfci({ fer: 1.0, cpi: 100 });
    expect(overCpi.cfci).toBe(normalCpi.cfci);

    const underCpi = computeCfci({ fer: 1.0, cpi: -10 });
    expect(underCpi.cfci).toBe(0);
  });

  it('handles non-finite fer gracefully', () => {
    const result = computeCfci({ fer: NaN, cpi: 80 });
    expect(result.floodExposureScore).toBe(0);
    expect(result.cfci).toBe(0);
  });

  it('handles non-finite cpi gracefully', () => {
    const result = computeCfci({ fer: 0.5, cpi: Infinity });
    expect(result.cpi).toBe(0);
    expect(result.cfci).toBe(0);
  });

  it('returns Low for a rural clean county', () => {
    // fer=0.02, cpi=5 => FES=2, cfci=sqrt(10)=3
    const result = computeCfci({ fer: 0.02, cpi: 5 });
    expect(result.cfci).toBeLessThan(15);
    expect(result.classification).toBe('Low');
  });

  it('returns Elevated for moderate compound risk', () => {
    // FES=20, cpi=25 => cfci=sqrt(500)=22
    const result = computeCfci({ fer: 0.2, cpi: 25 });
    expect(result.cfci).toBeGreaterThanOrEqual(15);
    expect(result.cfci).toBeLessThan(30);
    expect(result.classification).toBe('Elevated');
  });

  it('returns High for significant compound risk', () => {
    // FES=36, cpi=30 => cfci=sqrt(1080)=32
    const result = computeCfci({ fer: 0.36, cpi: 30 });
    expect(result.cfci).toBeGreaterThanOrEqual(30);
    expect(result.cfci).toBeLessThan(50);
    expect(result.classification).toBe('High');
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
  it('assigns Q1 to lowest 25%, Q4 to highest 25%', () => {
    const records = [
      { cfci: 10 },
      { cfci: 20 },
      { cfci: 30 },
      { cfci: 40 },
    ];
    const quartiles = assignCfciQuartiles(records);
    expect(quartiles[0]).toBe(1); // cfci=10 → Q1
    expect(quartiles[1]).toBe(2); // cfci=20 → Q2
    expect(quartiles[2]).toBe(3); // cfci=30 → Q3
    expect(quartiles[3]).toBe(4); // cfci=40 → Q4
  });

  it('preserves original record ordering', () => {
    const records = [
      { cfci: 80 },
      { cfci: 5 },
      { cfci: 50 },
      { cfci: 20 },
    ];
    const quartiles = assignCfciQuartiles(records);
    expect(quartiles[0]).toBe(4); // 80 is highest
    expect(quartiles[1]).toBe(1); // 5 is lowest
    expect(quartiles[2]).toBe(3); // 50 is third
    expect(quartiles[3]).toBe(2); // 20 is second
  });

  it('handles empty array', () => {
    expect(assignCfciQuartiles([])).toEqual([]);
  });

  it('returns Q1 for a single record', () => {
    const quartiles = assignCfciQuartiles([{ cfci: 75 }]);
    expect(quartiles[0]).toBe(1);
  });

  it('handles all equal cfci values', () => {
    const records = Array.from({ length: 8 }, () => ({ cfci: 50 }));
    const quartiles = assignCfciQuartiles(records);
    expect(quartiles.every((q) => q === 1 || q === 2 || q === 3 || q === 4)).toBe(true);
  });

  it('assigns exactly 25% to each quartile for 100 records', () => {
    const records = Array.from({ length: 100 }, (_, i) => ({ cfci: i }));
    const quartiles = assignCfciQuartiles(records);
    const counts = [0, 0, 0, 0];
    for (const q of quartiles) counts[q - 1]++;
    expect(counts[0]).toBe(25);
    expect(counts[1]).toBe(25);
    expect(counts[2]).toBe(25);
    expect(counts[3]).toBe(25);
  });
});
