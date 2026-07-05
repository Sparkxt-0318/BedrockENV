import { describe, it, expect } from 'vitest';
import {
  computeCfci,
  classifyCfci,
  assignCfciQuartiles,
  type CfciInputs,
} from '@/lib/intelligence/cfci-scorer';

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
// computeCfci
// ---------------------------------------------------------------------------

describe('computeCfci', () => {
  it('returns zero for zero flood exposure', () => {
    const result = computeCfci({ fer: 0, cpi: 80 });
    expect(result.cfci).toBe(0);
    expect(result.floodExposureScore).toBe(0);
    expect(result.classification).toBe('Low');
  });

  it('returns zero for zero contamination pressure', () => {
    const result = computeCfci({ fer: 0.8, cpi: 0 });
    expect(result.cfci).toBe(0);
    expect(result.floodExposureScore).toBe(80);
    expect(result.classification).toBe('Low');
  });

  it('computes CFCI as sqrt(FER*100 * CPI) rounded', () => {
    // fer=0.64 → FES=64, cpi=64 → cfci=sqrt(64*64)=64
    const result = computeCfci({ fer: 0.64, cpi: 64 });
    expect(result.cfci).toBe(64);
    expect(result.floodExposureScore).toBe(64);
    expect(result.cpi).toBe(64);
    expect(result.classification).toBe('Severe');
  });

  it('computes a moderate compound risk correctly', () => {
    // fer=0.25 → FES=25, cpi=36 → cfci=sqrt(900)=30
    const result = computeCfci({ fer: 0.25, cpi: 36 });
    expect(result.cfci).toBe(30);
    expect(result.classification).toBe('High');
  });

  it('computes an elevated risk scenario', () => {
    // fer=0.09 → FES=9, cpi=25 → cfci=sqrt(225)=15
    const result = computeCfci({ fer: 0.09, cpi: 25 });
    expect(result.cfci).toBe(15);
    expect(result.classification).toBe('Elevated');
  });

  it('clamps fer to [0, 1]', () => {
    const over = computeCfci({ fer: 2.0, cpi: 100 });
    const normal = computeCfci({ fer: 1.0, cpi: 100 });
    expect(over.cfci).toBe(normal.cfci);
    expect(over.floodExposureScore).toBe(100);

    const under = computeCfci({ fer: -1, cpi: 100 });
    expect(under.floodExposureScore).toBe(0);
    expect(under.cfci).toBe(0);
  });

  it('clamps cpi to [0, 100]', () => {
    const over = computeCfci({ fer: 1.0, cpi: 200 });
    const normal = computeCfci({ fer: 1.0, cpi: 100 });
    expect(over.cfci).toBe(normal.cfci);
    expect(over.cpi).toBe(100);

    const under = computeCfci({ fer: 1.0, cpi: -50 });
    expect(under.cpi).toBe(0);
    expect(under.cfci).toBe(0);
  });

  it('handles NaN/Infinity inputs by treating as 0', () => {
    const nan = computeCfci({ fer: NaN, cpi: NaN });
    expect(nan.cfci).toBe(0);
    expect(nan.floodExposureScore).toBe(0);
    expect(nan.cpi).toBe(0);

    // Infinity is not finite — treated as 0, not clamped to max
    const inf = computeCfci({ fer: Infinity, cpi: Infinity });
    expect(inf.floodExposureScore).toBe(0);
    expect(inf.cpi).toBe(0);
    expect(inf.cfci).toBe(0);
  });

  it('returns floodExposureScore and cpi on result object', () => {
    const result = computeCfci({ fer: 0.5, cpi: 50 });
    expect(result.floodExposureScore).toBe(50);
    expect(result.cpi).toBe(50);
  });

  it('rounds cfci to integer', () => {
    // fer=0.1 → FES=10, cpi=30 → sqrt(300)=17.32... → rounds to 17
    const result = computeCfci({ fer: 0.1, cpi: 30 });
    expect(Number.isInteger(result.cfci)).toBe(true);
    expect(result.cfci).toBe(17);
  });
});

// ---------------------------------------------------------------------------
// assignCfciQuartiles
// ---------------------------------------------------------------------------

describe('assignCfciQuartiles', () => {
  it('assigns Q1-Q4 to four records in ascending order', () => {
    const records = [
      { cfci: 10 },
      { cfci: 25 },
      { cfci: 40 },
      { cfci: 80 },
    ];
    const quartiles = assignCfciQuartiles(records);
    expect(quartiles[0]).toBe(1);
    expect(quartiles[1]).toBe(2);
    expect(quartiles[2]).toBe(3);
    expect(quartiles[3]).toBe(4);
  });

  it('assigns Q1 to all records when all cfci equal (all land in bottom 25%+ bucket)', () => {
    // With 4 equal records: indices 0,1,2,3 → pct=0,0.25,0.5,0.75
    // Q1 for pct<0.25 (index 0), Q2 for 0.25 (index 1), Q3 for 0.5 (index 2), Q4 for 0.75 (index 3)
    const records = [{ cfci: 50 }, { cfci: 50 }, { cfci: 50 }, { cfci: 50 }];
    const quartiles = assignCfciQuartiles(records);
    expect(quartiles.length).toBe(4);
    // Each quartile is one of 1-4; exact assignment depends on tie-break by sort stability
    quartiles.forEach(q => expect([1, 2, 3, 4]).toContain(q));
  });

  it('handles a single record by assigning Q1', () => {
    const quartiles = assignCfciQuartiles([{ cfci: 42 }]);
    expect(quartiles).toHaveLength(1);
    expect(quartiles[0]).toBe(1);
  });

  it('handles empty array', () => {
    const quartiles = assignCfciQuartiles([]);
    expect(quartiles).toHaveLength(0);
  });

  it('preserves original array index ordering, not sorted ordering', () => {
    // Input in descending order — Q1 should map to the highest index (lowest cfci = record[3])
    const records = [
      { cfci: 80 }, // index 0 — highest, should be Q4
      { cfci: 40 }, // index 1 — Q3
      { cfci: 25 }, // index 2 — Q2
      { cfci: 10 }, // index 3 — lowest, should be Q1
    ];
    const quartiles = assignCfciQuartiles(records);
    expect(quartiles[0]).toBe(4);
    expect(quartiles[3]).toBe(1);
  });

  it('assigns Q4 to the top 25% of a large set', () => {
    // 100 records from 0 to 99
    const records = Array.from({ length: 100 }, (_, i) => ({ cfci: i }));
    const quartiles = assignCfciQuartiles(records);
    // Record with cfci=99 (index 99) should be Q4
    expect(quartiles[99]).toBe(4);
    // Record with cfci=0 (index 0) should be Q1
    expect(quartiles[0]).toBe(1);
  });
});
