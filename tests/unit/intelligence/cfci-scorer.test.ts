import { describe, it, expect } from 'vitest';
import {
  computeCfci,
  classifyCfci,
  assignCfciQuartiles,
} from '@/lib/intelligence/cfci-scorer';

describe('computeCfci', () => {
  it('returns zero when fer is zero', () => {
    const result = computeCfci({ fer: 0, cpi: 80 });
    expect(result.cfci).toBe(0);
    expect(result.floodExposureScore).toBe(0);
    expect(result.cpi).toBe(80);
  });

  it('returns zero when cpi is zero', () => {
    const result = computeCfci({ fer: 0.5, cpi: 0 });
    expect(result.cfci).toBe(0);
    expect(result.floodExposureScore).toBe(50);
  });

  it('computes correct values for typical inputs', () => {
    // fer=0.25 → floodExposureScore=25, cpi=64 → cfci=sqrt(25*64)=sqrt(1600)=40
    const result = computeCfci({ fer: 0.25, cpi: 64 });
    expect(result.floodExposureScore).toBe(25);
    expect(result.cpi).toBe(64);
    expect(result.cfci).toBe(40);
  });

  it('computes max-ish CFCI for high flood + high CPI', () => {
    // fer=1.0 → floodExposureScore=100, cpi=100 → cfci=sqrt(10000)=100
    const result = computeCfci({ fer: 1.0, cpi: 100 });
    expect(result.cfci).toBe(100);
    expect(result.floodExposureScore).toBe(100);
  });

  it('clamps fer above 1 to 1', () => {
    const result = computeCfci({ fer: 1.5, cpi: 100 });
    expect(result.floodExposureScore).toBe(100);
  });

  it('clamps fer below 0 to 0', () => {
    const result = computeCfci({ fer: -0.5, cpi: 100 });
    expect(result.floodExposureScore).toBe(0);
    expect(result.cfci).toBe(0);
  });

  it('clamps cpi above 100 to 100', () => {
    const resultClamped = computeCfci({ fer: 1.0, cpi: 150 });
    const resultMax = computeCfci({ fer: 1.0, cpi: 100 });
    expect(resultClamped.cpi).toBe(100);
    expect(resultClamped.cfci).toBe(resultMax.cfci);
  });

  it('clamps cpi below 0 to 0', () => {
    const result = computeCfci({ fer: 1.0, cpi: -10 });
    expect(result.cpi).toBe(0);
    expect(result.cfci).toBe(0);
  });

  it('handles non-finite fer as 0', () => {
    const result = computeCfci({ fer: NaN, cpi: 80 });
    expect(result.floodExposureScore).toBe(0);
    expect(result.cfci).toBe(0);
  });

  it('handles non-finite cpi as 0', () => {
    const result = computeCfci({ fer: 0.5, cpi: Infinity });
    // cpi clamped to 100 since Number.isFinite(Infinity) is false → 0
    expect(result.cpi).toBe(0);
    expect(result.cfci).toBe(0);
  });

  it('returns a classification alongside the numeric score', () => {
    const result = computeCfci({ fer: 0.25, cpi: 64 });
    expect(['Low', 'Elevated', 'High', 'Severe']).toContain(result.classification);
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

  it('classifyCfci agrees with computeCfci classification', () => {
    const result = computeCfci({ fer: 0.5, cpi: 50 });
    expect(result.classification).toBe(classifyCfci(result.cfci));
  });
});

describe('assignCfciQuartiles', () => {
  it('assigns Q1 to lowest quarter, Q4 to highest', () => {
    const records = [
      { cfci: 10 },
      { cfci: 20 },
      { cfci: 30 },
      { cfci: 40 },
    ];
    const quartiles = assignCfciQuartiles(records);
    expect(quartiles[0]).toBe(1);
    expect(quartiles[3]).toBe(4);
  });

  it('handles a single record', () => {
    const quartiles = assignCfciQuartiles([{ cfci: 55 }]);
    expect(quartiles[0]).toBe(1);
  });

  it('handles an empty array', () => {
    expect(assignCfciQuartiles([])).toEqual([]);
  });

  it('returns correct length', () => {
    const records = Array.from({ length: 100 }, (_, i) => ({ cfci: i }));
    const quartiles = assignCfciQuartiles(records);
    expect(quartiles).toHaveLength(100);
  });

  it('distributes roughly evenly across quartiles for sorted input', () => {
    const records = Array.from({ length: 100 }, (_, i) => ({ cfci: i }));
    const quartiles = assignCfciQuartiles(records);
    const counts = [0, 0, 0, 0];
    for (const q of quartiles) counts[q - 1]++;
    // Each quartile should have ~25 items (exact boundaries may shift by ±1)
    for (const c of counts) {
      expect(c).toBeGreaterThanOrEqual(24);
      expect(c).toBeLessThanOrEqual(26);
    }
  });

  it('all quartile values are 1, 2, 3, or 4', () => {
    const records = Array.from({ length: 50 }, (_, i) => ({ cfci: i * 2 }));
    const quartiles = assignCfciQuartiles(records);
    for (const q of quartiles) {
      expect([1, 2, 3, 4]).toContain(q);
    }
  });

  it('preserves original order (not sorted output)', () => {
    // Records in descending order — indices should still map to correct quartiles
    const records = [{ cfci: 100 }, { cfci: 50 }, { cfci: 25 }, { cfci: 0 }];
    const quartiles = assignCfciQuartiles(records);
    expect(quartiles[0]).toBe(4); // highest cfci → Q4
    expect(quartiles[3]).toBe(1); // lowest cfci → Q1
  });
});
