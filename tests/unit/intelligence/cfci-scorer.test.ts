import { describe, it, expect } from 'vitest';
import { computeCfci, classifyCfci, assignCfciQuartiles } from '@/lib/intelligence/cfci-scorer';

describe('computeCfci', () => {
  it('returns 0 for no flood exposure and no contamination', () => {
    const r = computeCfci({ fer: 0, cpi: 0 });
    expect(r.cfci).toBe(0);
    expect(r.floodExposureScore).toBe(0);
    expect(r.cpi).toBe(0);
    expect(r.classification).toBe('Low');
  });

  it('returns 0 when flood exposure is 0 even with high CPI', () => {
    const r = computeCfci({ fer: 0, cpi: 100 });
    expect(r.cfci).toBe(0);
    expect(r.floodExposureScore).toBe(0);
  });

  it('returns 0 when CPI is 0 even with high flood exposure', () => {
    const r = computeCfci({ fer: 1, cpi: 0 });
    expect(r.cfci).toBe(0);
    expect(r.floodExposureScore).toBe(100);
  });

  it('computes max CFCI of 100 at full flood and full contamination', () => {
    const r = computeCfci({ fer: 1, cpi: 100 });
    expect(r.cfci).toBe(100);
    expect(r.classification).toBe('Severe');
  });

  it('computes sqrt(50*50)=50 → Severe', () => {
    const r = computeCfci({ fer: 0.5, cpi: 50 });
    expect(r.cfci).toBe(50);
    expect(r.classification).toBe('Severe');
  });

  it('computes sqrt(30*30)=30 → High', () => {
    const r = computeCfci({ fer: 0.3, cpi: 100 });
    // floodExposureScore = 30, cfci = sqrt(30*100) = sqrt(3000) ≈ 55 → Severe
    expect(r.floodExposureScore).toBe(30);
    expect(r.cfci).toBe(Math.round(Math.sqrt(30 * 100)));
    expect(r.classification).toBe('Severe');
  });

  it('clamps fer above 1 to 1', () => {
    const r = computeCfci({ fer: 2, cpi: 100 });
    expect(r.floodExposureScore).toBe(100);
    expect(r.cfci).toBe(100);
  });

  it('clamps fer below 0 to 0', () => {
    const r = computeCfci({ fer: -0.5, cpi: 80 });
    expect(r.floodExposureScore).toBe(0);
    expect(r.cfci).toBe(0);
  });

  it('clamps CPI above 100 to 100', () => {
    const r = computeCfci({ fer: 1, cpi: 150 });
    expect(r.cpi).toBe(100);
    expect(r.cfci).toBe(100);
  });

  it('clamps CPI below 0 to 0', () => {
    const r = computeCfci({ fer: 1, cpi: -10 });
    expect(r.cpi).toBe(0);
    expect(r.cfci).toBe(0);
  });

  it('handles non-finite fer gracefully (treats as 0)', () => {
    const r = computeCfci({ fer: NaN, cpi: 80 });
    expect(r.floodExposureScore).toBe(0);
    expect(r.cfci).toBe(0);
  });

  it('handles non-finite cpi gracefully (treats as 0)', () => {
    const r = computeCfci({ fer: 0.5, cpi: Infinity });
    expect(r.cpi).toBe(0);
    expect(r.cfci).toBe(0);
  });

  it('returns correct floodExposureScore rounding (0.156 → 16)', () => {
    const r = computeCfci({ fer: 0.156, cpi: 40 });
    expect(r.floodExposureScore).toBe(16);
  });
});

describe('classifyCfci', () => {
  it('classifies 0 as Low', () => expect(classifyCfci(0)).toBe('Low'));
  it('classifies 14 as Low', () => expect(classifyCfci(14)).toBe('Low'));
  it('classifies 15 as Elevated', () => expect(classifyCfci(15)).toBe('Elevated'));
  it('classifies 29 as Elevated', () => expect(classifyCfci(29)).toBe('Elevated'));
  it('classifies 30 as High', () => expect(classifyCfci(30)).toBe('High'));
  it('classifies 49 as High', () => expect(classifyCfci(49)).toBe('High'));
  it('classifies 50 as Severe', () => expect(classifyCfci(50)).toBe('Severe'));
  it('classifies 100 as Severe', () => expect(classifyCfci(100)).toBe('Severe'));
});

describe('assignCfciQuartiles', () => {
  it('assigns Q1 to lowest and Q4 to highest in a sorted set', () => {
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

  it('returns array of same length as input', () => {
    const records = Array.from({ length: 100 }, (_, i) => ({ cfci: i }));
    const quartiles = assignCfciQuartiles(records);
    expect(quartiles.length).toBe(100);
  });

  it('distributes 4 equal records to Q1, Q2, Q3, Q4 in ascending order', () => {
    const records = [{ cfci: 5 }, { cfci: 15 }, { cfci: 25 }, { cfci: 35 }];
    const quartiles = assignCfciQuartiles(records);
    expect(quartiles).toEqual([1, 2, 3, 4]);
  });

  it('handles identical values — all assigned to Q1 since they sort to index 0', () => {
    const records = [{ cfci: 50 }, { cfci: 50 }, { cfci: 50 }, { cfci: 50 }];
    const quartiles = assignCfciQuartiles(records);
    // All identical → sort order stable, all land in first 25% → Q1
    expect(quartiles.every((q) => q >= 1 && q <= 4)).toBe(true);
  });

  it('handles a single record (assigns Q1)', () => {
    const quartiles = assignCfciQuartiles([{ cfci: 75 }]);
    expect(quartiles).toEqual([1]);
  });

  it('preserves original array order in output (not re-sorted)', () => {
    // Insert in reverse order: 40, 30, 20, 10
    const records = [{ cfci: 40 }, { cfci: 30 }, { cfci: 20 }, { cfci: 10 }];
    const quartiles = assignCfciQuartiles(records);
    // index 0 (cfci=40) should be Q4, index 3 (cfci=10) should be Q1
    expect(quartiles[0]).toBe(4);
    expect(quartiles[3]).toBe(1);
  });

  it('assigns valid quartile values (1–4) to all entries in large set', () => {
    const records = Array.from({ length: 3140 }, (_, i) => ({ cfci: i % 101 }));
    const quartiles = assignCfciQuartiles(records);
    expect(quartiles.every((q) => q >= 1 && q <= 4)).toBe(true);
  });
});
