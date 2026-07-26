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
  it('computes cfci as sqrt(floodExposureScore * cpi) rounded', () => {
    // fer=0.50 → floodExposureScore=50; cpi=50 → cfci=sqrt(2500)=50
    const result = computeCfci({ fer: 0.5, cpi: 50 });
    expect(result.cfci).toBe(50);
    expect(result.floodExposureScore).toBe(50);
    expect(result.cpi).toBe(50);
  });

  it('returns 0 when fer is 0 (no flood exposure)', () => {
    const result = computeCfci({ fer: 0, cpi: 80 });
    expect(result.cfci).toBe(0);
    expect(result.floodExposureScore).toBe(0);
  });

  it('returns 0 when cpi is 0 (no contamination)', () => {
    const result = computeCfci({ fer: 0.8, cpi: 0 });
    expect(result.cfci).toBe(0);
  });

  it('computes a known moderate case correctly', () => {
    // fer=0.25 → fes=25; cpi=36 → cfci=sqrt(900)=30
    const result = computeCfci({ fer: 0.25, cpi: 36 });
    expect(result.cfci).toBe(30);
    expect(result.floodExposureScore).toBe(25);
  });

  it('clamps fer to [0, 1]', () => {
    const high = computeCfci({ fer: 2.0, cpi: 100 });
    expect(high.floodExposureScore).toBe(100);
    expect(high.cfci).toBe(100);

    const low = computeCfci({ fer: -0.5, cpi: 100 });
    expect(low.floodExposureScore).toBe(0);
    expect(low.cfci).toBe(0);
  });

  it('clamps cpi to [0, 100]', () => {
    const high = computeCfci({ fer: 1.0, cpi: 200 });
    expect(high.cpi).toBe(100);
    expect(high.cfci).toBe(100);

    const low = computeCfci({ fer: 1.0, cpi: -50 });
    expect(low.cpi).toBe(0);
    expect(low.cfci).toBe(0);
  });

  it('treats non-finite fer as 0', () => {
    expect(computeCfci({ fer: NaN, cpi: 50 }).cfci).toBe(0);
    expect(computeCfci({ fer: Infinity, cpi: 50 }).floodExposureScore).toBe(0);
  });

  it('treats non-finite cpi as 0', () => {
    expect(computeCfci({ fer: 0.5, cpi: NaN }).cfci).toBe(0);
    expect(computeCfci({ fer: 0.5, cpi: Infinity }).cpi).toBe(0);
  });

  it('attaches classification to result', () => {
    const result = computeCfci({ fer: 0.5, cpi: 50 });
    expect(result.classification).toBe('Severe'); // cfci=50
  });

  it('rounds cfci to integer', () => {
    // fer=0.10 → fes=10; cpi=10 → cfci=sqrt(100)=10 exactly
    expect(computeCfci({ fer: 0.10, cpi: 10 }).cfci).toBe(10);

    // fer=0.20 → fes=20; cpi=11 → cfci=sqrt(220)≈14.83 → 15
    expect(computeCfci({ fer: 0.20, cpi: 11 }).cfci).toBe(15);
  });

  it('produces max cfci of 100 when fer=1 and cpi=100', () => {
    const result = computeCfci({ fer: 1.0, cpi: 100 });
    expect(result.cfci).toBe(100);
    expect(result.floodExposureScore).toBe(100);
    expect(result.cpi).toBe(100);
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

  it('returns Severe for cfci >= 50', () => {
    expect(classifyCfci(50)).toBe('Severe');
    expect(classifyCfci(100)).toBe('Severe');
  });
});

// ---------------------------------------------------------------------------
// assignCfciQuartiles
// ---------------------------------------------------------------------------

describe('assignCfciQuartiles', () => {
  it('assigns Q1–Q4 evenly across four records', () => {
    const records = [
      { cfci: 10 },
      { cfci: 30 },
      { cfci: 50 },
      { cfci: 70 },
    ];
    const quartiles = assignCfciQuartiles(records);
    // sorted asc: 10→Q1, 30→Q2, 50→Q3, 70→Q4
    expect(quartiles[0]).toBe(1); // 10
    expect(quartiles[1]).toBe(2); // 30
    expect(quartiles[2]).toBe(3); // 50
    expect(quartiles[3]).toBe(4); // 70
  });

  it('assigns Q4 to the highest score in an 8-record array', () => {
    const records = Array.from({ length: 8 }, (_, i) => ({ cfci: (i + 1) * 10 }));
    // 10,20,30,40,50,60,70,80
    // Q1: index 0,1 (pct 0/8=0%, 1/8=12.5%)
    // Q2: index 2,3 (pct 2/8=25%, 3/8=37.5%)
    // Q3: index 4,5 (pct 4/8=50%, 5/8=62.5%)
    // Q4: index 6,7 (pct 6/8=75%, 7/8=87.5%)
    const quartiles = assignCfciQuartiles(records);
    expect(quartiles[0]).toBe(1);
    expect(quartiles[1]).toBe(1);
    expect(quartiles[2]).toBe(2);
    expect(quartiles[3]).toBe(2);
    expect(quartiles[4]).toBe(3);
    expect(quartiles[5]).toBe(3);
    expect(quartiles[6]).toBe(4);
    expect(quartiles[7]).toBe(4);
  });

  it('handles a single record', () => {
    const quartiles = assignCfciQuartiles([{ cfci: 42 }]);
    expect(quartiles).toHaveLength(1);
    expect(quartiles[0]).toBe(1); // pct = 0/1 = 0 < 0.25 → Q1
  });

  it('returns empty array for empty input', () => {
    expect(assignCfciQuartiles([])).toEqual([]);
  });

  it('preserves original order — quartile maps back to original index', () => {
    // Supply records out of order: highest cfci first
    const records = [
      { cfci: 90 }, // index 0 — should be Q4
      { cfci: 10 }, // index 1 — should be Q1
      { cfci: 50 }, // index 2 — should be Q3
      { cfci: 30 }, // index 3 — should be Q2
    ];
    const quartiles = assignCfciQuartiles(records);
    expect(quartiles[0]).toBe(4); // cfci 90 → Q4
    expect(quartiles[1]).toBe(1); // cfci 10 → Q1
    expect(quartiles[2]).toBe(3); // cfci 50 → Q3
    expect(quartiles[3]).toBe(2); // cfci 30 → Q2
  });

  it('handles identical cfci values without throwing', () => {
    const records = [{ cfci: 40 }, { cfci: 40 }, { cfci: 40 }, { cfci: 40 }];
    const quartiles = assignCfciQuartiles(records);
    expect(quartiles).toHaveLength(4);
    quartiles.forEach(q => expect([1, 2, 3, 4]).toContain(q));
  });
});
