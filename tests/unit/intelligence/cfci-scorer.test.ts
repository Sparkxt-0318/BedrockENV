import { describe, it, expect } from 'vitest';
import {
  computeCfci,
  classifyCfci,
  assignCfciQuartiles,
  type CfciInputs,
} from '@/lib/intelligence/cfci-scorer';

describe('computeCfci', () => {
  it('computes CFCI as sqrt(floodExposureScore × cpi), rounded', () => {
    // fer=0.5 → floodExposureScore=50, cpi=50 → cfci=sqrt(50*50)=50
    const result = computeCfci({ fer: 0.5, cpi: 50 });
    expect(result.cfci).toBe(50);
    expect(result.floodExposureScore).toBe(50);
    expect(result.cpi).toBe(50);
  });

  it('returns 0 when fer is 0 (no flood exposure)', () => {
    const result = computeCfci({ fer: 0, cpi: 80 });
    expect(result.cfci).toBe(0);
    expect(result.floodExposureScore).toBe(0);
  });

  it('returns 0 when cpi is 0 (no contamination pressure)', () => {
    const result = computeCfci({ fer: 0.9, cpi: 0 });
    expect(result.cfci).toBe(0);
    expect(result.cpi).toBe(0);
  });

  it('clamps fer above 1 to 1', () => {
    const result = computeCfci({ fer: 1.5, cpi: 100 });
    expect(result.floodExposureScore).toBe(100);
    expect(result.cfci).toBe(100);
  });

  it('clamps fer below 0 to 0', () => {
    const result = computeCfci({ fer: -0.3, cpi: 80 });
    expect(result.floodExposureScore).toBe(0);
    expect(result.cfci).toBe(0);
  });

  it('clamps cpi above 100 to 100', () => {
    const result = computeCfci({ fer: 1, cpi: 200 });
    expect(result.cpi).toBe(100);
    expect(result.cfci).toBe(100);
  });

  it('clamps cpi below 0 to 0', () => {
    const result = computeCfci({ fer: 0.5, cpi: -10 });
    expect(result.cpi).toBe(0);
    expect(result.cfci).toBe(0);
  });

  it('handles non-finite fer gracefully (treats as 0)', () => {
    const result = computeCfci({ fer: NaN, cpi: 50 });
    expect(result.floodExposureScore).toBe(0);
    expect(result.cfci).toBe(0);
  });

  it('handles non-finite cpi gracefully (treats as 0)', () => {
    const result = computeCfci({ fer: 0.5, cpi: Infinity });
    expect(result.cfci).toBe(0);
  });

  it('rounds the cfci result', () => {
    // fer=0.1 → fes=10, cpi=30 → sqrt(10*30)=sqrt(300)≈17.32 → 17
    const result = computeCfci({ fer: 0.1, cpi: 30 });
    expect(result.cfci).toBe(17);
  });

  it('includes classification in the result', () => {
    const result = computeCfci({ fer: 0.8, cpi: 80 });
    expect(result.classification).toBeDefined();
  });

  it('computes high severity case correctly', () => {
    // fer=0.8 → fes=80, cpi=80 → sqrt(6400)=80
    const result = computeCfci({ fer: 0.8, cpi: 80 });
    expect(result.cfci).toBe(80);
    expect(result.classification).toBe('Severe');
  });
});

describe('classifyCfci', () => {
  it('returns "Severe" for cfci >= 50', () => {
    expect(classifyCfci(50)).toBe('Severe');
    expect(classifyCfci(75)).toBe('Severe');
    expect(classifyCfci(100)).toBe('Severe');
  });

  it('returns "High" for cfci 30-49', () => {
    expect(classifyCfci(30)).toBe('High');
    expect(classifyCfci(40)).toBe('High');
    expect(classifyCfci(49)).toBe('High');
  });

  it('returns "Elevated" for cfci 15-29', () => {
    expect(classifyCfci(15)).toBe('Elevated');
    expect(classifyCfci(22)).toBe('Elevated');
    expect(classifyCfci(29)).toBe('Elevated');
  });

  it('returns "Low" for cfci < 15', () => {
    expect(classifyCfci(0)).toBe('Low');
    expect(classifyCfci(7)).toBe('Low');
    expect(classifyCfci(14)).toBe('Low');
  });
});

describe('assignCfciQuartiles', () => {
  it('assigns Q1-Q4 evenly across 4 records', () => {
    const records = [
      { cfci: 10 },
      { cfci: 30 },
      { cfci: 50 },
      { cfci: 70 },
    ];
    const quartiles = assignCfciQuartiles(records);
    expect(quartiles).toHaveLength(4);
    // sorted ascending: 10(idx0)→Q1, 30(idx1)→Q2, 50(idx2)→Q3, 70(idx3)→Q4
    expect(quartiles[0]).toBe(1);
    expect(quartiles[1]).toBe(2);
    expect(quartiles[2]).toBe(3);
    expect(quartiles[3]).toBe(4);
  });

  it('assigns all Q1 when there is only one record', () => {
    const quartiles = assignCfciQuartiles([{ cfci: 50 }]);
    expect(quartiles).toEqual([1]);
  });

  it('handles empty array', () => {
    const quartiles = assignCfciQuartiles([]);
    expect(quartiles).toEqual([]);
  });

  it('preserves original order of records (not sorted output)', () => {
    // Input out of order: highest first, lowest last
    const records = [{ cfci: 80 }, { cfci: 20 }, { cfci: 50 }, { cfci: 5 }];
    const quartiles = assignCfciQuartiles(records);
    // sorted by cfci: 5→Q1, 20→Q2, 50→Q3, 80→Q4
    // original indices: 5 is at index 3, 20 at 1, 50 at 2, 80 at 0
    expect(quartiles[3]).toBe(1); // cfci=5 was at index 3
    expect(quartiles[1]).toBe(2); // cfci=20 was at index 1
    expect(quartiles[2]).toBe(3); // cfci=50 was at index 2
    expect(quartiles[0]).toBe(4); // cfci=80 was at index 0
  });

  it('distributes quartiles correctly for 8 records', () => {
    const records = Array.from({ length: 8 }, (_, i) => ({ cfci: i * 10 }));
    const quartiles = assignCfciQuartiles(records);
    // pct thresholds: Q1 < 0.25, Q2 < 0.5, Q3 < 0.75, Q4 >= 0.75
    // records 0,1 → Q1; 2,3 → Q2; 4,5 → Q3; 6,7 → Q4
    expect(quartiles[0]).toBe(1);
    expect(quartiles[1]).toBe(1);
    expect(quartiles[2]).toBe(2);
    expect(quartiles[3]).toBe(2);
    expect(quartiles[4]).toBe(3);
    expect(quartiles[5]).toBe(3);
    expect(quartiles[6]).toBe(4);
    expect(quartiles[7]).toBe(4);
  });
});
