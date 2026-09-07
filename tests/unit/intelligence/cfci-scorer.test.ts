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
  it('computes CFCI as sqrt(floodExposureScore × cpi), rounded', () => {
    // fer=0.5 → floodExposureScore=50, cpi=50 → sqrt(50*50)=50
    const result = computeCfci({ fer: 0.5, cpi: 50 });
    expect(result.cfci).toBe(50);
    expect(result.floodExposureScore).toBe(50);
    expect(result.cpi).toBe(50);
  });

  it('returns 0 when fer is 0', () => {
    const result = computeCfci({ fer: 0, cpi: 80 });
    expect(result.cfci).toBe(0);
    expect(result.floodExposureScore).toBe(0);
  });

  it('returns 0 when cpi is 0', () => {
    const result = computeCfci({ fer: 1, cpi: 0 });
    expect(result.cfci).toBe(0);
  });

  it('clamps fer above 1 to 1', () => {
    const unclamped = computeCfci({ fer: 2, cpi: 100 });
    const clamped = computeCfci({ fer: 1, cpi: 100 });
    expect(unclamped.cfci).toBe(clamped.cfci);
    expect(unclamped.floodExposureScore).toBe(100);
  });

  it('clamps fer below 0 to 0', () => {
    const result = computeCfci({ fer: -0.5, cpi: 80 });
    expect(result.floodExposureScore).toBe(0);
    expect(result.cfci).toBe(0);
  });

  it('clamps cpi above 100 to 100', () => {
    const unclamped = computeCfci({ fer: 1, cpi: 150 });
    const clamped = computeCfci({ fer: 1, cpi: 100 });
    expect(unclamped.cfci).toBe(clamped.cfci);
    expect(unclamped.cpi).toBe(100);
  });

  it('clamps cpi below 0 to 0', () => {
    const result = computeCfci({ fer: 1, cpi: -10 });
    expect(result.cpi).toBe(0);
    expect(result.cfci).toBe(0);
  });

  it('treats non-finite fer as 0', () => {
    const result = computeCfci({ fer: NaN, cpi: 80 });
    expect(result.floodExposureScore).toBe(0);
    expect(result.cfci).toBe(0);
  });

  it('treats non-finite cpi as 0', () => {
    const result = computeCfci({ fer: 0.5, cpi: Infinity });
    expect(result.cpi).toBe(0);
  });

  it('returns correct classification in result', () => {
    // fer=1, cpi=100 → sqrt(100*100)=100 → Severe
    const result = computeCfci({ fer: 1, cpi: 100 });
    expect(result.classification).toBe('Severe');
  });

  it('rounds the CFCI score', () => {
    // fer=0.1 → floodExposureScore=10, cpi=30 → sqrt(10*30)=sqrt(300)≈17.32 → 17
    const result = computeCfci({ fer: 0.1, cpi: 30 });
    expect(result.cfci).toBe(17);
  });

  it('maximum score is 100 (fer=1, cpi=100)', () => {
    const result = computeCfci({ fer: 1, cpi: 100 });
    expect(result.cfci).toBe(100);
  });
});

// ---------------------------------------------------------------------------
// classifyCfci
// ---------------------------------------------------------------------------

describe('classifyCfci', () => {
  it('returns Low for score < 15', () => {
    expect(classifyCfci(0)).toBe('Low');
    expect(classifyCfci(14)).toBe('Low');
  });

  it('returns Elevated for score 15–29', () => {
    expect(classifyCfci(15)).toBe('Elevated');
    expect(classifyCfci(29)).toBe('Elevated');
  });

  it('returns High for score 30–49', () => {
    expect(classifyCfci(30)).toBe('High');
    expect(classifyCfci(49)).toBe('High');
  });

  it('returns Severe for score ≥ 50', () => {
    expect(classifyCfci(50)).toBe('Severe');
    expect(classifyCfci(100)).toBe('Severe');
  });
});

// ---------------------------------------------------------------------------
// assignCfciQuartiles
// ---------------------------------------------------------------------------

describe('assignCfciQuartiles', () => {
  it('assigns Q1 to the lowest and Q4 to the highest in a 4-record set', () => {
    const records = [
      { cfci: 10 },
      { cfci: 30 },
      { cfci: 60 },
      { cfci: 90 },
    ];
    const quartiles = assignCfciQuartiles(records);
    expect(quartiles[0]).toBe(1); // lowest
    expect(quartiles[3]).toBe(4); // highest
  });

  it('returns an array of the same length as input', () => {
    const records = Array.from({ length: 100 }, (_, i) => ({ cfci: i }));
    const quartiles = assignCfciQuartiles(records);
    expect(quartiles).toHaveLength(100);
  });

  it('distributes quartiles roughly evenly across a uniform 100-item set', () => {
    const records = Array.from({ length: 100 }, (_, i) => ({ cfci: i }));
    const quartiles = assignCfciQuartiles(records);
    const counts = [0, 0, 0, 0];
    quartiles.forEach(q => counts[q - 1]++);
    // Each quartile should have exactly 25
    expect(counts[0]).toBe(25);
    expect(counts[1]).toBe(25);
    expect(counts[2]).toBe(25);
    expect(counts[3]).toBe(25);
  });

  it('handles an empty array', () => {
    expect(assignCfciQuartiles([])).toEqual([]);
  });

  it('handles a single record (assigned Q1)', () => {
    const quartiles = assignCfciQuartiles([{ cfci: 50 }]);
    // pct = 0/1 = 0 < 0.25 → Q1
    expect(quartiles[0]).toBe(1);
  });

  it('preserves original order — index in output matches input index', () => {
    // Input: high, low, mid — after quartile assignment, high→Q4, low→Q1, mid→Q2 or Q3
    const records = [{ cfci: 90 }, { cfci: 10 }, { cfci: 50 }];
    const quartiles = assignCfciQuartiles(records);
    // 3 records: sorted [10,50,90] → pct 0, 0.33, 0.66 → Q1, Q2, Q3
    expect(quartiles[1]).toBe(1); // cfci=10
    expect(quartiles[2]).toBe(2); // cfci=50
    expect(quartiles[0]).toBe(3); // cfci=90
  });
});
