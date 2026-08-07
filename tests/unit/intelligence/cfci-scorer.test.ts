import { describe, it, expect } from 'vitest';
import {
  computeCfci,
  classifyCfci,
  assignCfciQuartiles,
} from '@/lib/intelligence/cfci-scorer';

describe('computeCfci', () => {
  it('computes CFCI as sqrt(FloodExposureScore × CPI)', () => {
    // fer=0.5 → floodExposureScore=50; cpi=80 → cfci=round(√4000)=63
    const result = computeCfci({ fer: 0.5, cpi: 80 });
    expect(result.floodExposureScore).toBe(50);
    expect(result.cfci).toBe(63);
    expect(result.cpi).toBe(80);
  });

  it('returns cfci=100 for fer=1, cpi=100', () => {
    const result = computeCfci({ fer: 1, cpi: 100 });
    expect(result.floodExposureScore).toBe(100);
    expect(result.cfci).toBe(100);
  });

  it('returns cfci=0 when flood exposure is zero', () => {
    const result = computeCfci({ fer: 0, cpi: 80 });
    expect(result.floodExposureScore).toBe(0);
    expect(result.cfci).toBe(0);
  });

  it('returns cfci=0 when contamination pressure is zero', () => {
    const result = computeCfci({ fer: 0.5, cpi: 0 });
    expect(result.cfci).toBe(0);
  });

  it('returns cfci=0 when both inputs are zero', () => {
    const result = computeCfci({ fer: 0, cpi: 0 });
    expect(result.cfci).toBe(0);
  });

  it('clamps fer above 1 to 1', () => {
    const clamped = computeCfci({ fer: 1.5, cpi: 100 });
    const normal = computeCfci({ fer: 1, cpi: 100 });
    expect(clamped.cfci).toBe(normal.cfci);
    expect(clamped.floodExposureScore).toBe(100);
  });

  it('clamps fer below 0 to 0', () => {
    const result = computeCfci({ fer: -0.5, cpi: 100 });
    expect(result.floodExposureScore).toBe(0);
    expect(result.cfci).toBe(0);
  });

  it('clamps cpi above 100 to 100', () => {
    const clamped = computeCfci({ fer: 1, cpi: 150 });
    const normal = computeCfci({ fer: 1, cpi: 100 });
    expect(clamped.cfci).toBe(normal.cfci);
  });

  it('treats non-finite fer as 0', () => {
    expect(computeCfci({ fer: NaN, cpi: 80 }).cfci).toBe(0);
    expect(computeCfci({ fer: Infinity, cpi: 80 }).floodExposureScore).toBe(0);
  });

  it('treats non-finite cpi as 0', () => {
    expect(computeCfci({ fer: 0.5, cpi: NaN }).cfci).toBe(0);
    expect(computeCfci({ fer: 0.5, cpi: Infinity }).cfci).toBe(0);
  });

  it('includes classification in result', () => {
    const low = computeCfci({ fer: 0.01, cpi: 5 });
    expect(low.classification).toBe('Low');

    const severe = computeCfci({ fer: 0.9, cpi: 90 });
    expect(severe.classification).toBe('Severe');
  });
});

describe('classifyCfci', () => {
  it('returns Low for cfci < 15', () => {
    expect(classifyCfci(0)).toBe('Low');
    expect(classifyCfci(14)).toBe('Low');
  });

  it('returns Elevated for cfci 15–29', () => {
    expect(classifyCfci(15)).toBe('Elevated');
    expect(classifyCfci(29)).toBe('Elevated');
  });

  it('returns High for cfci 30–49', () => {
    expect(classifyCfci(30)).toBe('High');
    expect(classifyCfci(49)).toBe('High');
  });

  it('returns Severe for cfci >= 50', () => {
    expect(classifyCfci(50)).toBe('Severe');
    expect(classifyCfci(100)).toBe('Severe');
  });
});

describe('assignCfciQuartiles', () => {
  it('returns empty array for empty input', () => {
    expect(assignCfciQuartiles([])).toEqual([]);
  });

  it('assigns Q1–Q4 across 4 records sorted by cfci', () => {
    const records = [
      { cfci: 80 },
      { cfci: 10 },
      { cfci: 50 },
      { cfci: 30 },
    ];
    const quartiles = assignCfciQuartiles(records);
    // sorted: 10(idx1)→Q1, 30(idx3)→Q2, 50(idx2)→Q3, 80(idx0)→Q4
    expect(quartiles[1]).toBe(1); // cfci=10 → Q1
    expect(quartiles[3]).toBe(2); // cfci=30 → Q2
    expect(quartiles[2]).toBe(3); // cfci=50 → Q3
    expect(quartiles[0]).toBe(4); // cfci=80 → Q4
  });

  it('assigns all Q1 when only one record exists', () => {
    expect(assignCfciQuartiles([{ cfci: 42 }])).toEqual([1]);
  });

  it('returns an array of the same length as input', () => {
    const records = Array.from({ length: 100 }, (_, i) => ({ cfci: i }));
    const quartiles = assignCfciQuartiles(records);
    expect(quartiles).toHaveLength(100);
    expect(quartiles.every((q) => q >= 1 && q <= 4)).toBe(true);
  });

  it('distributes into four roughly equal buckets for 100 records', () => {
    const records = Array.from({ length: 100 }, (_, i) => ({ cfci: i }));
    const quartiles = assignCfciQuartiles(records);
    const counts = [0, 0, 0, 0];
    quartiles.forEach((q) => counts[q - 1]++);
    // Each bucket should be ~25 records
    counts.forEach((c) => expect(c).toBeGreaterThanOrEqual(20));
  });
});
