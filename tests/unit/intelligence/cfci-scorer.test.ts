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
  it('computes CFCI as sqrt(floodExposureScore * cpi)', () => {
    // FER=0.36 → floodExposureScore=36; CPI=64 → cfci=sqrt(36*64)=48
    const result = computeCfci({ fer: 0.36, cpi: 64 });
    expect(result.cfci).toBe(48);
    expect(result.floodExposureScore).toBe(36);
    expect(result.cpi).toBe(64);
  });

  it('returns 0 when FER is 0 (no flood exposure)', () => {
    const result = computeCfci({ fer: 0, cpi: 80 });
    expect(result.cfci).toBe(0);
    expect(result.floodExposureScore).toBe(0);
  });

  it('returns 0 when CPI is 0 (no contamination pressure)', () => {
    const result = computeCfci({ fer: 0.5, cpi: 0 });
    expect(result.cfci).toBe(0);
    expect(result.floodExposureScore).toBe(50);
  });

  it('clamps FER above 1 to 1', () => {
    const result = computeCfci({ fer: 1.5, cpi: 100 });
    expect(result.floodExposureScore).toBe(100);
    expect(result.cfci).toBe(100);
  });

  it('clamps FER below 0 to 0', () => {
    const result = computeCfci({ fer: -0.5, cpi: 100 });
    expect(result.floodExposureScore).toBe(0);
    expect(result.cfci).toBe(0);
  });

  it('clamps CPI above 100 to 100', () => {
    const result = computeCfci({ fer: 1, cpi: 150 });
    expect(result.cpi).toBe(100);
    expect(result.cfci).toBe(100);
  });

  it('clamps CPI below 0 to 0', () => {
    const result = computeCfci({ fer: 1, cpi: -10 });
    expect(result.cpi).toBe(0);
    expect(result.cfci).toBe(0);
  });

  it('treats non-finite FER as 0', () => {
    const result = computeCfci({ fer: NaN, cpi: 80 });
    expect(result.floodExposureScore).toBe(0);
    expect(result.cfci).toBe(0);
  });

  it('treats non-finite CPI as 0', () => {
    const result = computeCfci({ fer: 0.5, cpi: Infinity });
    expect(result.cpi).toBe(0);
    expect(result.cfci).toBe(0);
  });

  it('returns classification alongside scores', () => {
    const result = computeCfci({ fer: 0.64, cpi: 64 });
    // floodExposureScore=64, cfci=sqrt(64*64)=64 → Severe
    expect(result.classification).toBe('Severe');
  });

  it('rounds cfci to integer', () => {
    // sqrt(10*10) = 10 exactly; use values that produce a float
    const result = computeCfci({ fer: 0.10, cpi: 33 });
    // floodExposureScore=10, cfci=sqrt(330)≈18.17 → rounds to 18
    expect(Number.isInteger(result.cfci)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// classifyCfci
// ---------------------------------------------------------------------------

describe('classifyCfci', () => {
  it('returns Low for cfci < 15', () => {
    expect(classifyCfci(0)).toBe('Low');
    expect(classifyCfci(14)).toBe('Low');
  });

  it('returns Elevated for cfci 15-29', () => {
    expect(classifyCfci(15)).toBe('Elevated');
    expect(classifyCfci(29)).toBe('Elevated');
  });

  it('returns High for cfci 30-49', () => {
    expect(classifyCfci(30)).toBe('High');
    expect(classifyCfci(49)).toBe('High');
  });

  it('returns Severe for cfci >= 50', () => {
    expect(classifyCfci(50)).toBe('Severe');
    expect(classifyCfci(100)).toBe('Severe');
  });
});

// ---------------------------------------------------------------------------
// assignCfciQuartiles
// ---------------------------------------------------------------------------

describe('assignCfciQuartiles', () => {
  it('assigns Q1-Q4 in order for sorted input', () => {
    const records = [
      { cfci: 10 },
      { cfci: 25 },
      { cfci: 50 },
      { cfci: 75 },
    ];
    const quartiles = assignCfciQuartiles(records);
    expect(quartiles[0]).toBe(1);
    expect(quartiles[1]).toBe(2);
    expect(quartiles[2]).toBe(3);
    expect(quartiles[3]).toBe(4);
  });

  it('assigns Q1-Q4 correctly for unsorted input', () => {
    // Original order: [75, 10, 50, 25] — after sorting: [10,25,50,75]
    const records = [
      { cfci: 75 },
      { cfci: 10 },
      { cfci: 50 },
      { cfci: 25 },
    ];
    const quartiles = assignCfciQuartiles(records);
    // 75 is Q4, 10 is Q1, 50 is Q3, 25 is Q2
    expect(quartiles[0]).toBe(4);
    expect(quartiles[1]).toBe(1);
    expect(quartiles[2]).toBe(3);
    expect(quartiles[3]).toBe(2);
  });

  it('returns an array of the same length as input', () => {
    const records = Array.from({ length: 100 }, (_, i) => ({ cfci: i }));
    const quartiles = assignCfciQuartiles(records);
    expect(quartiles).toHaveLength(100);
  });

  it('returns only values 1-4', () => {
    const records = Array.from({ length: 40 }, (_, i) => ({ cfci: i * 2 }));
    const quartiles = assignCfciQuartiles(records);
    for (const q of quartiles) {
      expect([1, 2, 3, 4]).toContain(q);
    }
  });

  it('handles a single record', () => {
    const quartiles = assignCfciQuartiles([{ cfci: 42 }]);
    expect(quartiles[0]).toBe(1);
  });

  it('handles two records', () => {
    const quartiles = assignCfciQuartiles([{ cfci: 10 }, { cfci: 90 }]);
    expect(quartiles[0]).toBe(1);
    expect(quartiles[1]).toBe(3);
  });

  it('distributes 3,140 records into roughly equal quartile groups', () => {
    const records = Array.from({ length: 3140 }, (_, i) => ({ cfci: i % 100 }));
    const quartiles = assignCfciQuartiles(records);
    const counts = [0, 0, 0, 0];
    for (const q of quartiles) counts[q - 1]++;
    // Each quartile should have ~785 entries (±1 due to rounding)
    for (const count of counts) {
      expect(count).toBeGreaterThan(700);
      expect(count).toBeLessThan(870);
    }
  });
});
