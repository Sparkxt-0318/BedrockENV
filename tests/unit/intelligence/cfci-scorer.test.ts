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
  it('returns 0 for zero flood exposure', () => {
    const result = computeCfci({ fer: 0, cpi: 80 });
    expect(result.cfci).toBe(0);
    expect(result.floodExposureScore).toBe(0);
  });

  it('returns 0 for zero contamination pressure', () => {
    const result = computeCfci({ fer: 0.5, cpi: 0 });
    expect(result.cfci).toBe(0);
  });

  it('computes CFCI = round(sqrt(FER*100 × CPI))', () => {
    // fer=0.64 → floodExposureScore=64; cpi=64 → cfci=round(sqrt(64*64))=64
    const result = computeCfci({ fer: 0.64, cpi: 64 });
    expect(result.floodExposureScore).toBe(64);
    expect(result.cfci).toBe(64);
  });

  it('clamps FER above 1 to 1', () => {
    const result = computeCfci({ fer: 1.5, cpi: 100 });
    expect(result.floodExposureScore).toBe(100);
    expect(result.cfci).toBe(100);
  });

  it('clamps FER below 0 to 0', () => {
    const result = computeCfci({ fer: -0.3, cpi: 80 });
    expect(result.floodExposureScore).toBe(0);
    expect(result.cfci).toBe(0);
  });

  it('clamps CPI above 100 to 100', () => {
    const result = computeCfci({ fer: 1, cpi: 150 });
    expect(result.cfci).toBe(100);
  });

  it('clamps CPI below 0 to 0', () => {
    const result = computeCfci({ fer: 1, cpi: -10 });
    expect(result.cfci).toBe(0);
  });

  it('treats non-finite FER as 0', () => {
    const result = computeCfci({ fer: NaN, cpi: 80 });
    expect(result.floodExposureScore).toBe(0);
    expect(result.cfci).toBe(0);
  });

  it('treats non-finite CPI as 0', () => {
    const result = computeCfci({ fer: 0.5, cpi: Infinity });
    expect(result.cfci).toBe(0);
  });

  it('echoes back the clamped CPI in the result', () => {
    const result = computeCfci({ fer: 0.25, cpi: 40 });
    expect(result.cpi).toBe(40);
  });

  it('attaches a classification', () => {
    const result = computeCfci({ fer: 0.64, cpi: 64 });
    expect(['Low', 'Elevated', 'High', 'Severe']).toContain(result.classification);
  });

  it('a real-world example: modest flood + heavy contamination stays below Severe', () => {
    // Port Arthur-style: FER ~20%, CPI ~70 → sqrt(20*70) ≈ 37 → High
    const result = computeCfci({ fer: 0.2, cpi: 70 });
    expect(result.cfci).toBe(37);
    expect(result.classification).toBe('High');
  });

  it('rural coastal county: high flood, low contamination stays Low-to-Elevated', () => {
    // FER=0.6, CPI=10 → sqrt(60*10) ≈ 24 → Elevated
    const result = computeCfci({ fer: 0.6, cpi: 10 });
    expect(result.cfci).toBe(24);
    expect(result.classification).toBe('Elevated');
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

  it('boundary: exactly 30', () => {
    expect(classifyCfci(30)).toBe('High');
  });

  it('boundary: exactly 15', () => {
    expect(classifyCfci(15)).toBe('Elevated');
  });

  it('boundary: exactly 50', () => {
    expect(classifyCfci(50)).toBe('Severe');
  });
});

// ---------------------------------------------------------------------------
// assignCfciQuartiles
// ---------------------------------------------------------------------------

describe('assignCfciQuartiles', () => {
  it('assigns Q1/Q2/Q3/Q4 to an evenly distributed set of 4', () => {
    const records = [{ cfci: 10 }, { cfci: 30 }, { cfci: 60 }, { cfci: 90 }];
    const quartiles = assignCfciQuartiles(records);
    expect(quartiles).toEqual([1, 2, 3, 4]);
  });

  it('returns an array the same length as the input', () => {
    const records = Array.from({ length: 100 }, (_, i) => ({ cfci: i }));
    const quartiles = assignCfciQuartiles(records);
    expect(quartiles).toHaveLength(100);
  });

  it('assigns Q1 to the lowest-scoring counties', () => {
    const records = Array.from({ length: 100 }, (_, i) => ({ cfci: i }));
    const quartiles = assignCfciQuartiles(records);
    expect(quartiles[0]).toBe(1);
    expect(quartiles[24]).toBe(1);
  });

  it('assigns Q4 to the highest-scoring counties', () => {
    const records = Array.from({ length: 100 }, (_, i) => ({ cfci: i }));
    const quartiles = assignCfciQuartiles(records);
    expect(quartiles[75]).toBe(4);
    expect(quartiles[99]).toBe(4);
  });

  it('handles a single-element array', () => {
    const result = assignCfciQuartiles([{ cfci: 42 }]);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(1);
  });

  it('handles ties — tied records are distributed by position across quartiles', () => {
    // With 4 identical records the algorithm assigns Q1/Q2/Q3/Q4 by sorted index
    const records = [{ cfci: 50 }, { cfci: 50 }, { cfci: 50 }, { cfci: 50 }];
    const quartiles = assignCfciQuartiles(records);
    expect(new Set(quartiles).size).toBe(4);
    expect(quartiles.sort()).toEqual([1, 2, 3, 4]);
  });

  it('does not mutate the input array', () => {
    const records = [{ cfci: 90 }, { cfci: 10 }, { cfci: 50 }];
    const copy = records.map(r => ({ ...r }));
    assignCfciQuartiles(records);
    expect(records).toEqual(copy);
  });

  it('output values are all valid quartile numbers (1-4)', () => {
    const records = Array.from({ length: 200 }, (_, i) => ({ cfci: i % 101 }));
    const quartiles = assignCfciQuartiles(records);
    for (const q of quartiles) {
      expect([1, 2, 3, 4]).toContain(q);
    }
  });
});
