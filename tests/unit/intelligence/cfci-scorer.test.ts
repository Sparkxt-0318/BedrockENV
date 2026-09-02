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
  it('returns 0 for zero FER and zero CPI', () => {
    const result = computeCfci({ fer: 0, cpi: 0 });
    expect(result.cfci).toBe(0);
    expect(result.floodExposureScore).toBe(0);
    expect(result.cpi).toBe(0);
    expect(result.classification).toBe('Low');
  });

  it('calculates correctly for typical compound risk case', () => {
    // FER=0.5 → floodExposureScore=50, CPI=50 → CFCI=√(50×50)=50
    const result = computeCfci({ fer: 0.5, cpi: 50 });
    expect(result.floodExposureScore).toBe(50);
    expect(result.cpi).toBe(50);
    expect(result.cfci).toBe(50);
    expect(result.classification).toBe('Severe');
  });

  it('returns low CFCI when only flood is high (no contamination)', () => {
    // FER=1.0 (100% SFHA) but CPI=0 → CFCI=√(100×0)=0
    const result = computeCfci({ fer: 1.0, cpi: 0 });
    expect(result.cfci).toBe(0);
    expect(result.classification).toBe('Low');
  });

  it('returns low CFCI when only contamination is high (no flood)', () => {
    // FER=0 but CPI=100 → CFCI=√(0×100)=0
    const result = computeCfci({ fer: 0, cpi: 100 });
    expect(result.cfci).toBe(0);
    expect(result.classification).toBe('Low');
  });

  it('returns Severe when both FER and CPI are maximum', () => {
    const result = computeCfci({ fer: 1.0, cpi: 100 });
    expect(result.floodExposureScore).toBe(100);
    expect(result.cpi).toBe(100);
    expect(result.cfci).toBe(100);
    expect(result.classification).toBe('Severe');
  });

  it('clamps FER values above 1.0 to 1.0', () => {
    const result = computeCfci({ fer: 2.0, cpi: 100 });
    expect(result.floodExposureScore).toBe(100);
  });

  it('clamps FER values below 0 to 0', () => {
    const result = computeCfci({ fer: -0.5, cpi: 100 });
    expect(result.floodExposureScore).toBe(0);
    expect(result.cfci).toBe(0);
  });

  it('clamps CPI values above 100 to 100', () => {
    const result = computeCfci({ fer: 0.5, cpi: 150 });
    expect(result.cpi).toBe(100);
  });

  it('clamps CPI values below 0 to 0', () => {
    const result = computeCfci({ fer: 0.5, cpi: -10 });
    expect(result.cpi).toBe(0);
    expect(result.cfci).toBe(0);
  });

  it('handles non-finite FER gracefully (defaults to 0)', () => {
    const result = computeCfci({ fer: NaN, cpi: 80 });
    expect(result.floodExposureScore).toBe(0);
    expect(result.cfci).toBe(0);
  });

  it('handles non-finite CPI gracefully (defaults to 0)', () => {
    const result = computeCfci({ fer: 0.5, cpi: Infinity });
    expect(result.cpi).toBe(0);
    expect(result.cfci).toBe(0);
  });

  it('floodExposureScore is FER * 100 rounded', () => {
    const result = computeCfci({ fer: 0.33, cpi: 50 });
    expect(result.floodExposureScore).toBe(33);
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

  it('returns Elevated for scores 15-29', () => {
    expect(classifyCfci(15)).toBe('Elevated');
    expect(classifyCfci(29)).toBe('Elevated');
  });

  it('returns High for scores 30-49', () => {
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
  it('distributes 8 records into 4 quartiles', () => {
    const records = [
      { cfci: 10 }, { cfci: 20 }, { cfci: 30 }, { cfci: 40 },
      { cfci: 50 }, { cfci: 60 }, { cfci: 70 }, { cfci: 80 },
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

  it('preserves original index ordering after sort', () => {
    const records = [{ cfci: 90 }, { cfci: 10 }, { cfci: 50 }];
    const q = assignCfciQuartiles(records);
    // sorted order: 10(idx1), 50(idx2), 90(idx0)
    // pct(idx1)=0/3=0.00 → Q1, pct(idx2)=1/3=0.33 → Q2, pct(idx0)=2/3=0.67 → Q3
    expect(q[0]).toBe(3);
    expect(q[1]).toBe(1);
    expect(q[2]).toBe(2);
  });

  it('handles single record', () => {
    const q = assignCfciQuartiles([{ cfci: 50 }]);
    expect(q[0]).toBe(1);
  });

  it('handles empty array', () => {
    const q = assignCfciQuartiles([]);
    expect(q).toHaveLength(0);
  });

  it('assigns Q4 to the highest records', () => {
    const records = Array.from({ length: 100 }, (_, i) => ({ cfci: i }));
    const q = assignCfciQuartiles(records);
    // Record with cfci=99 is last (index 99), pct = 99/100 = 0.99 → Q4
    expect(q[99]).toBe(4);
    // Record with cfci=0 is first (index 0), pct = 0/100 = 0 → Q1
    expect(q[0]).toBe(1);
  });
});
