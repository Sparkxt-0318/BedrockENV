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
  it('computes CFCI as √(FES × CPI) for typical inputs', () => {
    // FES = FER * 100 = 0.36 * 100 = 36, CPI = 36
    // CFCI = round(√(36 × 36)) = round(36) = 36
    const result = computeCfci({ fer: 0.36, cpi: 36 });
    expect(result.cfci).toBe(36);
    expect(result.floodExposureScore).toBe(36);
    expect(result.cpi).toBe(36);
  });

  it('returns 0 when FER is 0', () => {
    const result = computeCfci({ fer: 0, cpi: 80 });
    expect(result.cfci).toBe(0);
    expect(result.floodExposureScore).toBe(0);
    expect(result.classification).toBe('Low');
  });

  it('returns 0 when CPI is 0', () => {
    const result = computeCfci({ fer: 0.5, cpi: 0 });
    expect(result.cfci).toBe(0);
    expect(result.classification).toBe('Low');
  });

  it('clamps FER above 1 to 1', () => {
    const result = computeCfci({ fer: 2.0, cpi: 100 });
    expect(result.floodExposureScore).toBe(100);
    expect(result.cfci).toBe(100);
  });

  it('clamps FER below 0 to 0', () => {
    const result = computeCfci({ fer: -0.5, cpi: 80 });
    expect(result.floodExposureScore).toBe(0);
    expect(result.cfci).toBe(0);
  });

  it('clamps CPI above 100 to 100', () => {
    const result = computeCfci({ fer: 1.0, cpi: 200 });
    expect(result.cpi).toBe(100);
    expect(result.cfci).toBe(100);
  });

  it('clamps CPI below 0 to 0', () => {
    const result = computeCfci({ fer: 1.0, cpi: -10 });
    expect(result.cpi).toBe(0);
    expect(result.cfci).toBe(0);
  });

  it('treats non-finite FER as 0', () => {
    const result = computeCfci({ fer: NaN, cpi: 50 });
    expect(result.floodExposureScore).toBe(0);
    expect(result.cfci).toBe(0);
  });

  it('treats non-finite CPI as 0', () => {
    const result = computeCfci({ fer: 0.5, cpi: Infinity });
    expect(result.cpi).toBe(0);
    expect(result.cfci).toBe(0);
  });

  it('returns max CFCI 100 for perfect inputs', () => {
    const result = computeCfci({ fer: 1.0, cpi: 100 });
    expect(result.cfci).toBe(100);
    expect(result.floodExposureScore).toBe(100);
    expect(result.classification).toBe('Severe');
  });

  it('includes classification in result', () => {
    const result = computeCfci({ fer: 0.25, cpi: 40 });
    expect(result).toHaveProperty('classification');
  });

  it('rounds cfci to the nearest integer', () => {
    // FES = 0.1 * 100 = 10, CPI = 3 → √30 ≈ 5.477 → rounds to 5
    const result = computeCfci({ fer: 0.1, cpi: 3 });
    expect(Number.isInteger(result.cfci)).toBe(true);
    expect(result.cfci).toBe(5);
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

  it('returns Elevated for cfci 15–29', () => {
    expect(classifyCfci(15)).toBe('Elevated');
    expect(classifyCfci(29)).toBe('Elevated');
  });

  it('returns High for cfci 30–49', () => {
    expect(classifyCfci(30)).toBe('High');
    expect(classifyCfci(49)).toBe('High');
  });

  it('returns Severe for cfci ≥ 50', () => {
    expect(classifyCfci(50)).toBe('Severe');
    expect(classifyCfci(100)).toBe('Severe');
  });

  it('boundary: 14 → Low, 15 → Elevated', () => {
    expect(classifyCfci(14)).toBe('Low');
    expect(classifyCfci(15)).toBe('Elevated');
  });

  it('boundary: 29 → Elevated, 30 → High', () => {
    expect(classifyCfci(29)).toBe('Elevated');
    expect(classifyCfci(30)).toBe('High');
  });

  it('boundary: 49 → High, 50 → Severe', () => {
    expect(classifyCfci(49)).toBe('High');
    expect(classifyCfci(50)).toBe('Severe');
  });
});

// ---------------------------------------------------------------------------
// assignCfciQuartiles
// ---------------------------------------------------------------------------

describe('assignCfciQuartiles', () => {
  it('assigns Q1–Q4 to four equally-valued records', () => {
    const records = [
      { cfci: 10 },
      { cfci: 30 },
      { cfci: 50 },
      { cfci: 70 },
    ];
    const quartiles = assignCfciQuartiles(records);
    expect(quartiles).toHaveLength(4);
    expect(quartiles).toContain(1);
    expect(quartiles).toContain(2);
    expect(quartiles).toContain(3);
    expect(quartiles).toContain(4);
  });

  it('lowest cfci is Q1, highest is Q4', () => {
    const records = [
      { cfci: 100 }, // highest → Q4
      { cfci: 5 },   // lowest  → Q1
      { cfci: 50 },
      { cfci: 25 },
    ];
    const quartiles = assignCfciQuartiles(records);
    expect(quartiles[1]).toBe(1); // cfci 5 at index 1
    expect(quartiles[0]).toBe(4); // cfci 100 at index 0
  });

  it('returns an array of the same length as input', () => {
    const records = Array.from({ length: 100 }, (_, i) => ({ cfci: i }));
    const quartiles = assignCfciQuartiles(records);
    expect(quartiles).toHaveLength(100);
  });

  it('every element is 1, 2, 3, or 4', () => {
    const records = Array.from({ length: 20 }, (_, i) => ({ cfci: i * 5 }));
    const quartiles = assignCfciQuartiles(records);
    for (const q of quartiles) {
      expect([1, 2, 3, 4]).toContain(q);
    }
  });

  it('handles single-element array', () => {
    const quartiles = assignCfciQuartiles([{ cfci: 42 }]);
    expect(quartiles).toHaveLength(1);
    expect(quartiles[0]).toBe(1);
  });

  it('handles all-zero cfci values', () => {
    const records = [{ cfci: 0 }, { cfci: 0 }, { cfci: 0 }, { cfci: 0 }];
    const quartiles = assignCfciQuartiles(records);
    expect(quartiles).toHaveLength(4);
    for (const q of quartiles) {
      expect([1, 2, 3, 4]).toContain(q);
    }
  });

  it('preserves original index ordering', () => {
    // records in descending cfci order — quartile assignment must map back correctly
    const records = [
      { cfci: 80 }, // idx 0 → Q4
      { cfci: 60 }, // idx 1 → Q3
      { cfci: 40 }, // idx 2 → Q2
      { cfci: 20 }, // idx 3 → Q1
    ];
    const quartiles = assignCfciQuartiles(records);
    expect(quartiles[0]).toBe(4);
    expect(quartiles[3]).toBe(1);
  });
});
