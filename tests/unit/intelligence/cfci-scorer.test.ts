import { describe, it, expect } from 'vitest';
import {
  computeCfci,
  classifyCfci,
  assignCfciQuartiles,
} from '@/lib/intelligence/cfci-scorer';

// ---------------------------------------------------------------------------
// computeCfci
// ---------------------------------------------------------------------------

describe('computeCfci', () => {
  it('computes expected values for a typical high-risk county', () => {
    // FER=0.5, CPI=80 → FloodExposureScore=50, CFCI=√(50×80)=√4000≈63
    const result = computeCfci({ fer: 0.5, cpi: 80 });
    expect(result.floodExposureScore).toBe(50);
    expect(result.cpi).toBe(80);
    expect(result.cfci).toBe(63);
    expect(result.classification).toBe('Severe');
  });

  it('returns zero when FER is zero (no flood exposure)', () => {
    const result = computeCfci({ fer: 0, cpi: 90 });
    expect(result.cfci).toBe(0);
    expect(result.floodExposureScore).toBe(0);
    expect(result.classification).toBe('Low');
  });

  it('returns zero when CPI is zero (no contamination pressure)', () => {
    const result = computeCfci({ fer: 0.8, cpi: 0 });
    expect(result.cfci).toBe(0);
    expect(result.floodExposureScore).toBe(80);
    expect(result.classification).toBe('Low');
  });

  it('clamps FER above 1 to 1', () => {
    const capped = computeCfci({ fer: 1.5, cpi: 100 });
    const normal = computeCfci({ fer: 1.0, cpi: 100 });
    expect(capped.cfci).toBe(normal.cfci);
    expect(capped.floodExposureScore).toBe(100);
  });

  it('clamps FER below 0 to 0', () => {
    const result = computeCfci({ fer: -0.5, cpi: 80 });
    expect(result.cfci).toBe(0);
    expect(result.floodExposureScore).toBe(0);
  });

  it('clamps CPI above 100 to 100', () => {
    const capped = computeCfci({ fer: 1, cpi: 150 });
    const normal = computeCfci({ fer: 1, cpi: 100 });
    expect(capped.cfci).toBe(normal.cfci);
    expect(capped.cpi).toBe(100);
  });

  it('clamps CPI below 0 to 0', () => {
    const result = computeCfci({ fer: 0.5, cpi: -10 });
    expect(result.cfci).toBe(0);
    expect(result.cpi).toBe(0);
  });

  it('handles NaN FER gracefully (treats as 0)', () => {
    const result = computeCfci({ fer: NaN, cpi: 60 });
    expect(result.cfci).toBe(0);
    expect(result.floodExposureScore).toBe(0);
  });

  it('handles NaN CPI gracefully (treats as 0)', () => {
    const result = computeCfci({ fer: 0.4, cpi: NaN });
    expect(result.cfci).toBe(0);
    expect(result.cpi).toBe(0);
  });

  it('handles Infinity FER gracefully (treats as 0)', () => {
    const result = computeCfci({ fer: Infinity, cpi: 50 });
    // Infinity is not finite → clamped to 0
    expect(result.floodExposureScore).toBe(0);
  });

  it('returns correct floodExposureScore rounding', () => {
    // FER=0.123 → 12.3 → Math.round → 12
    const result = computeCfci({ fer: 0.123, cpi: 50 });
    expect(result.floodExposureScore).toBe(12);
  });

  it('uses geometric-mean semantics: both factors must be elevated for high CFCI', () => {
    const highFloodLowContam = computeCfci({ fer: 0.9, cpi: 5 });
    const lowFloodHighContam = computeCfci({ fer: 0.05, cpi: 90 });
    const bothModerate = computeCfci({ fer: 0.45, cpi: 45 });
    // Both factors moderate beats extreme imbalance
    expect(bothModerate.cfci).toBeGreaterThan(highFloodLowContam.cfci);
    expect(bothModerate.cfci).toBeGreaterThan(lowFloodHighContam.cfci);
  });
});

// ---------------------------------------------------------------------------
// classifyCfci
// ---------------------------------------------------------------------------

describe('classifyCfci', () => {
  it('returns Low for scores below 15', () => {
    expect(classifyCfci(0)).toBe('Low');
    expect(classifyCfci(14)).toBe('Low');
  });

  it('returns Elevated for scores 15–29', () => {
    expect(classifyCfci(15)).toBe('Elevated');
    expect(classifyCfci(29)).toBe('Elevated');
  });

  it('returns High for scores 30–49', () => {
    expect(classifyCfci(30)).toBe('High');
    expect(classifyCfci(49)).toBe('High');
  });

  it('returns Severe for scores 50 and above', () => {
    expect(classifyCfci(50)).toBe('Severe');
    expect(classifyCfci(100)).toBe('Severe');
  });
});

// ---------------------------------------------------------------------------
// assignCfciQuartiles
// ---------------------------------------------------------------------------

describe('assignCfciQuartiles', () => {
  it('assigns Q1–Q4 across 4 equal records', () => {
    const records = [
      { cfci: 10 },
      { cfci: 30 },
      { cfci: 50 },
      { cfci: 70 },
    ];
    const quartiles = assignCfciQuartiles(records);
    expect(quartiles).toHaveLength(4);
    // Sorted: 10(i0)→Q1, 30(i1)→Q2, 50(i2)→Q3, 70(i3)→Q4
    expect(quartiles[0]).toBe(1);
    expect(quartiles[1]).toBe(2);
    expect(quartiles[2]).toBe(3);
    expect(quartiles[3]).toBe(4);
  });

  it('assigns all Q1 when only one record exists', () => {
    const quartiles = assignCfciQuartiles([{ cfci: 42 }]);
    expect(quartiles).toEqual([1]);
  });

  it('preserves original index order in result', () => {
    // Input in descending order — quartile array should match input positions
    const records = [
      { cfci: 80 }, // index 0 → highest → Q4
      { cfci: 20 }, // index 1 → lowest → Q1
      { cfci: 60 }, // index 2 → 3rd → Q3
      { cfci: 40 }, // index 3 → 2nd → Q2
    ];
    const quartiles = assignCfciQuartiles(records);
    expect(quartiles[0]).toBe(4); // cfci=80 is top quartile
    expect(quartiles[1]).toBe(1); // cfci=20 is bottom quartile
    expect(quartiles[2]).toBe(3);
    expect(quartiles[3]).toBe(2);
  });

  it('distributes 8 records evenly into quartiles', () => {
    const records = Array.from({ length: 8 }, (_, i) => ({ cfci: (i + 1) * 10 }));
    const quartiles = assignCfciQuartiles(records);
    const counts = [1, 2, 3, 4].map(q => quartiles.filter(v => v === q).length);
    expect(counts).toEqual([2, 2, 2, 2]);
  });

  it('returns empty array for empty input', () => {
    expect(assignCfciQuartiles([])).toEqual([]);
  });
});
