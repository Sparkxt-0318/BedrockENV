import { describe, it, expect } from 'vitest';
import {
  computeCfci,
  classifyCfci,
  assignCfciQuartiles,
} from '@/lib/intelligence/cfci-scorer';

describe('computeCfci', () => {
  it('returns 0 when both FER and CPI are zero', () => {
    const result = computeCfci({ fer: 0, cpi: 0 });
    expect(result.cfci).toBe(0);
    expect(result.floodExposureScore).toBe(0);
    expect(result.cpi).toBe(0);
    expect(result.classification).toBe('Low');
  });

  it('returns 0 when FER is 0 (no flood exposure)', () => {
    const result = computeCfci({ fer: 0, cpi: 80 });
    expect(result.cfci).toBe(0);
    expect(result.floodExposureScore).toBe(0);
  });

  it('returns 0 when CPI is 0 (no contamination)', () => {
    const result = computeCfci({ fer: 0.5, cpi: 0 });
    expect(result.cfci).toBe(0);
    expect(result.floodExposureScore).toBe(50);
  });

  it('computes CFCI as sqrt(FES × CPI) for high compound risk', () => {
    // FES = 0.6 * 100 = 60, CPI = 60 → cfci = sqrt(60*60) = 60
    const result = computeCfci({ fer: 0.6, cpi: 60 });
    expect(result.cfci).toBe(60);
    expect(result.floodExposureScore).toBe(60);
    expect(result.cpi).toBe(60);
  });

  it('computes max CFCI when both factors are 100', () => {
    const result = computeCfci({ fer: 1, cpi: 100 });
    expect(result.cfci).toBe(100);
    expect(result.classification).toBe('Severe');
  });

  it('clamps FER above 1 to 1', () => {
    const result = computeCfci({ fer: 2, cpi: 100 });
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

  it('classifies Low for cfci < 15', () => {
    const result = computeCfci({ fer: 0.1, cpi: 10 });
    expect(result.classification).toBe('Low');
  });

  it('classifies Elevated for cfci 15–29', () => {
    // sqrt(25 * 25) = 25
    const result = computeCfci({ fer: 0.25, cpi: 25 });
    expect(result.classification).toBe('Elevated');
  });

  it('classifies High for cfci 30–49', () => {
    // sqrt(40 * 40) = 40
    const result = computeCfci({ fer: 0.4, cpi: 40 });
    expect(result.classification).toBe('High');
  });

  it('classifies Severe for cfci >= 50', () => {
    // sqrt(50 * 50) = 50
    const result = computeCfci({ fer: 0.5, cpi: 50 });
    expect(result.classification).toBe('Severe');
  });
});

describe('classifyCfci', () => {
  it('returns Low for 0', () => expect(classifyCfci(0)).toBe('Low'));
  it('returns Low for 14', () => expect(classifyCfci(14)).toBe('Low'));
  it('returns Elevated for 15', () => expect(classifyCfci(15)).toBe('Elevated'));
  it('returns Elevated for 29', () => expect(classifyCfci(29)).toBe('Elevated'));
  it('returns High for 30', () => expect(classifyCfci(30)).toBe('High'));
  it('returns High for 49', () => expect(classifyCfci(49)).toBe('High'));
  it('returns Severe for 50', () => expect(classifyCfci(50)).toBe('Severe'));
  it('returns Severe for 100', () => expect(classifyCfci(100)).toBe('Severe'));
});

describe('assignCfciQuartiles', () => {
  it('distributes 8 records into 4 quartiles evenly', () => {
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

  it('preserves original index ordering across sort', () => {
    const records = [{ cfci: 90 }, { cfci: 10 }, { cfci: 50 }];
    const q = assignCfciQuartiles(records);
    // index 1 (cfci=10) → sorted pos 0 → Q1
    expect(q[1]).toBe(1);
    // index 2 (cfci=50) → sorted pos 1 → Q2
    expect(q[2]).toBe(2);
    // index 0 (cfci=90) → sorted pos 2 → Q3
    expect(q[0]).toBe(3);
  });

  it('handles single record (always Q1)', () => {
    const q = assignCfciQuartiles([{ cfci: 100 }]);
    expect(q[0]).toBe(1);
  });

  it('handles empty array', () => {
    const q = assignCfciQuartiles([]);
    expect(q).toHaveLength(0);
  });

  it('returns array of same length as input', () => {
    const records = Array.from({ length: 12 }, (_, i) => ({ cfci: i * 5 }));
    const q = assignCfciQuartiles(records);
    expect(q).toHaveLength(12);
  });

  it('4 records with same value → one per quartile (by sort position)', () => {
    const records = [{ cfci: 0 }, { cfci: 0 }, { cfci: 0 }, { cfci: 0 }];
    const q = assignCfciQuartiles(records);
    // pct = i/4: 0→Q1, 0.25→Q2, 0.5→Q3, 0.75→Q4
    expect(q.filter((v) => v === 1).length).toBe(1);
    expect(q.filter((v) => v === 2).length).toBe(1);
    expect(q.filter((v) => v === 3).length).toBe(1);
    expect(q.filter((v) => v === 4).length).toBe(1);
  });
});
