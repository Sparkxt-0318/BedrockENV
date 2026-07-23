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
  it('returns 0 when FER is 0 (no flood exposure)', () => {
    const result = computeCfci({ fer: 0, cpi: 80 });
    expect(result.cfci).toBe(0);
    expect(result.floodExposureScore).toBe(0);
    expect(result.cpi).toBe(80);
    expect(result.classification).toBe('Low');
  });

  it('returns 0 when CPI is 0 (no contamination)', () => {
    const result = computeCfci({ fer: 1, cpi: 0 });
    expect(result.cfci).toBe(0);
    expect(result.floodExposureScore).toBe(100);
    expect(result.cpi).toBe(0);
  });

  it('computes CFCI as sqrt(FES * CPI) rounded', () => {
    // fer=0.25 → FES=25, cpi=64 → CFCI = sqrt(25*64) = sqrt(1600) = 40
    const result = computeCfci({ fer: 0.25, cpi: 64 });
    expect(result.cfci).toBe(40);
    expect(result.floodExposureScore).toBe(25);
  });

  it('computes maximum CFCI (fer=1, cpi=100 → cfci=100)', () => {
    const result = computeCfci({ fer: 1, cpi: 100 });
    expect(result.cfci).toBe(100);
    expect(result.floodExposureScore).toBe(100);
    expect(result.classification).toBe('Severe');
  });

  it('clamps FER above 1.0 to 1.0', () => {
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

  it('handles non-finite FER gracefully (treats as 0)', () => {
    const result = computeCfci({ fer: NaN, cpi: 80 });
    expect(result.floodExposureScore).toBe(0);
    expect(result.cfci).toBe(0);
  });

  it('handles non-finite CPI gracefully (treats as 0)', () => {
    const result = computeCfci({ fer: 0.5, cpi: Infinity });
    expect(result.cpi).toBe(0);
    expect(result.cfci).toBe(0);
  });

  it('returns Elevated classification for cfci=20', () => {
    // fer ≈ 0.04, cpi=100 → cfci = sqrt(4*100) = 20
    const result = computeCfci({ fer: 0.04, cpi: 100 });
    expect(result.cfci).toBe(20);
    expect(result.classification).toBe('Elevated');
  });

  it('returns High classification for cfci=36', () => {
    // fer=0.36, cpi=36 → cfci = sqrt(36*36) = 36
    const result = computeCfci({ fer: 0.36, cpi: 36 });
    expect(result.cfci).toBe(36);
    expect(result.classification).toBe('High');
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

  it('returns Severe for cfci ≥ 50', () => {
    expect(classifyCfci(50)).toBe('Severe');
    expect(classifyCfci(100)).toBe('Severe');
  });
});

// ---------------------------------------------------------------------------
// assignCfciQuartiles
// ---------------------------------------------------------------------------

describe('assignCfciQuartiles', () => {
  it('distributes 8 records into 4 quartiles evenly', () => {
    const records = [
      { cfci: 5 }, { cfci: 15 }, { cfci: 25 }, { cfci: 35 },
      { cfci: 45 }, { cfci: 55 }, { cfci: 65 }, { cfci: 75 },
    ];
    const q = assignCfciQuartiles(records);
    expect(q[0]).toBe(1);
    expect(q[1]).toBe(1);
    expect(q[2]).toBe(2);
    expect(q[3]).toBe(2);
    expect(q[4]).toBe(3);
    expect(q[5]).toBe(3);
    expect(q[6]).toBe(4);
    expect(q[7]).toBe(4);
  });

  it('preserves original index ordering when records are unsorted', () => {
    const records = [{ cfci: 90 }, { cfci: 10 }, { cfci: 50 }];
    const q = assignCfciQuartiles(records);
    // cfci=90 → sorted index 2 of 3 → pct=0.67 → Q3
    // cfci=10 → sorted index 0 of 3 → pct=0.00 → Q1
    // cfci=50 → sorted index 1 of 3 → pct=0.33 → Q2
    expect(q[0]).toBe(3);
    expect(q[1]).toBe(1);
    expect(q[2]).toBe(2);
  });

  it('handles single record (Q1)', () => {
    const q = assignCfciQuartiles([{ cfci: 70 }]);
    expect(q[0]).toBe(1);
  });

  it('handles empty array', () => {
    const q = assignCfciQuartiles([]);
    expect(q).toHaveLength(0);
  });

  it('returns array of same length as input', () => {
    const records = Array.from({ length: 20 }, (_, i) => ({ cfci: i * 5 }));
    const q = assignCfciQuartiles(records);
    expect(q).toHaveLength(20);
    // All values should be 1, 2, 3, or 4
    expect(q.every((v) => v >= 1 && v <= 4)).toBe(true);
  });

  it('all-zero cfci records are distributed positionally across quartiles', () => {
    // Quartile assignment is purely rank-based, not value-based.
    // 3 records of equal value → positions 0, 1, 2 → Q1, Q2, Q3.
    const records = [{ cfci: 0 }, { cfci: 0 }, { cfci: 0 }];
    const q = assignCfciQuartiles(records);
    expect(q.every((v) => v >= 1 && v <= 4)).toBe(true);
    expect(q).toHaveLength(3);
  });
});
