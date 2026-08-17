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
  it('returns zero when both inputs are zero', () => {
    const result = computeCfci({ fer: 0, cpi: 0 });
    expect(result.cfci).toBe(0);
    expect(result.floodExposureScore).toBe(0);
    expect(result.cpi).toBe(0);
    expect(result.classification).toBe('Low');
  });

  it('returns zero when FER is zero regardless of CPI', () => {
    const result = computeCfci({ fer: 0, cpi: 80 });
    expect(result.cfci).toBe(0);
    expect(result.floodExposureScore).toBe(0);
  });

  it('returns zero when CPI is zero regardless of FER', () => {
    const result = computeCfci({ fer: 1.0, cpi: 0 });
    expect(result.cfci).toBe(0);
    expect(result.floodExposureScore).toBe(100);
  });

  it('computes CFCI as sqrt(FES * CPI) rounded', () => {
    // FER=0.64 → FES=64, CPI=100 → sqrt(6400)=80
    const result = computeCfci({ fer: 0.64, cpi: 100 });
    expect(result.cfci).toBe(80);
    expect(result.floodExposureScore).toBe(64);
  });

  it('computes CFCI for a typical high-risk county', () => {
    // FER=0.25 → FES=25, CPI=64 → sqrt(1600)=40
    const result = computeCfci({ fer: 0.25, cpi: 64 });
    expect(result.cfci).toBe(40);
    expect(result.classification).toBe('High');
  });

  it('computes CFCI for a moderate-risk county', () => {
    // FER=0.09 → FES=9, CPI=25 → sqrt(225)=15
    const result = computeCfci({ fer: 0.09, cpi: 25 });
    expect(result.cfci).toBe(15);
    expect(result.classification).toBe('Elevated');
  });

  it('clamps FER to [0, 1]', () => {
    const high = computeCfci({ fer: 2.0, cpi: 100 });
    expect(high.floodExposureScore).toBe(100);

    const low = computeCfci({ fer: -0.5, cpi: 100 });
    expect(low.floodExposureScore).toBe(0);
  });

  it('clamps CPI to [0, 100]', () => {
    const high = computeCfci({ fer: 1.0, cpi: 150 });
    expect(high.cpi).toBe(100);

    const low = computeCfci({ fer: 1.0, cpi: -20 });
    expect(low.cpi).toBe(0);
  });

  it('treats non-finite FER (NaN, Infinity) as zero', () => {
    // Number.isFinite(Infinity) === false → falls back to 0, not clamped to 1
    expect(computeCfci({ fer: NaN, cpi: 80 }).floodExposureScore).toBe(0);
    expect(computeCfci({ fer: Infinity, cpi: 80 }).floodExposureScore).toBe(0);
  });

  it('treats non-finite CPI (NaN, Infinity) as zero', () => {
    // Number.isFinite(Infinity) === false → falls back to 0, not clamped to 100
    expect(computeCfci({ fer: 0.5, cpi: NaN }).cpi).toBe(0);
    expect(computeCfci({ fer: 0.5, cpi: Infinity }).cpi).toBe(0);
  });

  it('returns floodExposureScore as rounded integer percentage', () => {
    const result = computeCfci({ fer: 0.333, cpi: 50 });
    expect(Number.isInteger(result.floodExposureScore)).toBe(true);
    expect(result.floodExposureScore).toBe(33);
  });

  it('returns cfci as rounded integer', () => {
    // FER=0.5 → FES=50, CPI=50 → sqrt(2500)=50
    const result = computeCfci({ fer: 0.5, cpi: 50 });
    expect(Number.isInteger(result.cfci)).toBe(true);
    expect(result.cfci).toBe(50);
  });

  it('echos back the clamped CPI value', () => {
    const result = computeCfci({ fer: 0.3, cpi: 42 });
    expect(result.cpi).toBe(42);
  });

  it('maximum inputs produce cfci=100', () => {
    const result = computeCfci({ fer: 1.0, cpi: 100 });
    expect(result.cfci).toBe(100);
    expect(result.classification).toBe('Severe');
  });
});

// ---------------------------------------------------------------------------
// classifyCfci
// ---------------------------------------------------------------------------

describe('classifyCfci', () => {
  it('classifies 0 as Low', () => {
    expect(classifyCfci(0)).toBe('Low');
  });

  it('classifies 14 as Low', () => {
    expect(classifyCfci(14)).toBe('Low');
  });

  it('classifies 15 as Elevated', () => {
    expect(classifyCfci(15)).toBe('Elevated');
  });

  it('classifies 29 as Elevated', () => {
    expect(classifyCfci(29)).toBe('Elevated');
  });

  it('classifies 30 as High', () => {
    expect(classifyCfci(30)).toBe('High');
  });

  it('classifies 49 as High', () => {
    expect(classifyCfci(49)).toBe('High');
  });

  it('classifies 50 as Severe', () => {
    expect(classifyCfci(50)).toBe('Severe');
  });

  it('classifies 100 as Severe', () => {
    expect(classifyCfci(100)).toBe('Severe');
  });

  it('boundary: 14 is Low, 15 is Elevated', () => {
    expect(classifyCfci(14)).toBe('Low');
    expect(classifyCfci(15)).toBe('Elevated');
  });

  it('boundary: 29 is Elevated, 30 is High', () => {
    expect(classifyCfci(29)).toBe('Elevated');
    expect(classifyCfci(30)).toBe('High');
  });

  it('boundary: 49 is High, 50 is Severe', () => {
    expect(classifyCfci(49)).toBe('High');
    expect(classifyCfci(50)).toBe('Severe');
  });
});

// ---------------------------------------------------------------------------
// assignCfciQuartiles
// ---------------------------------------------------------------------------

describe('assignCfciQuartiles', () => {
  it('returns empty array for empty input', () => {
    expect(assignCfciQuartiles([])).toEqual([]);
  });

  it('assigns quartile 1 to a single record', () => {
    // Single item: index 0 → pct = 0/1 = 0.0 < 0.25 → Q1
    expect(assignCfciQuartiles([{ cfci: 50 }])).toEqual([1]);
  });

  it('evenly distributes 4 records across quartiles', () => {
    const records = [
      { cfci: 10 },
      { cfci: 30 },
      { cfci: 60 },
      { cfci: 90 },
    ];
    const quartiles = assignCfciQuartiles(records);
    expect(quartiles).toHaveLength(4);
    expect(quartiles).toContain(1);
    expect(quartiles).toContain(2);
    expect(quartiles).toContain(3);
    expect(quartiles).toContain(4);
  });

  it('preserves original record ordering in returned array', () => {
    // Provide records in descending order — result indices must match the
    // original positions, not the sorted order.
    const records = [{ cfci: 90 }, { cfci: 60 }, { cfci: 30 }, { cfci: 10 }];
    const quartiles = assignCfciQuartiles(records);
    // After sort ascending: [10→idx3, 30→idx2, 60→idx1, 90→idx0]
    //   sorted positions 0,1,2,3 → Q1,Q2,Q3,Q4
    // Original index 0 (cfci=90) → Q4; index 3 (cfci=10) → Q1
    expect(quartiles[0]).toBe(4);
    expect(quartiles[3]).toBe(1);
  });

  it('assigns all valid quartile values (1-4)', () => {
    const records = Array.from({ length: 100 }, (_, i) => ({ cfci: i }));
    const quartiles = assignCfciQuartiles(records);
    for (const q of quartiles) {
      expect([1, 2, 3, 4]).toContain(q);
    }
  });

  it('distributes 100 records approximately evenly across quartiles', () => {
    const records = Array.from({ length: 100 }, (_, i) => ({ cfci: i }));
    const quartiles = assignCfciQuartiles(records);
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0 };
    for (const q of quartiles) counts[q]++;
    expect(counts[1]).toBe(25);
    expect(counts[2]).toBe(25);
    expect(counts[3]).toBe(25);
    expect(counts[4]).toBe(25);
  });

  it('assigns lower cfci values to lower quartiles', () => {
    const records = [{ cfci: 5 }, { cfci: 95 }];
    const quartiles = assignCfciQuartiles(records);
    expect(quartiles[0]).toBeLessThan(quartiles[1]);
  });

  it('handles ties in cfci by stable index ordering', () => {
    const records = [
      { cfci: 50 },
      { cfci: 50 },
      { cfci: 50 },
      { cfci: 50 },
    ];
    const quartiles = assignCfciQuartiles(records);
    expect(quartiles).toHaveLength(4);
    // All same value — quartile assignment by sort-position still covers 1-4
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0 };
    for (const q of quartiles) counts[q]++;
    expect(counts[1] + counts[2] + counts[3] + counts[4]).toBe(4);
  });

  it('handles two records', () => {
    const records = [{ cfci: 20 }, { cfci: 80 }];
    const quartiles = assignCfciQuartiles(records);
    // n=2: index 0 → pct=0.0 → Q1; index 1 → pct=0.5 → Q3
    expect(quartiles[0]).toBe(1);
    expect(quartiles[1]).toBe(3);
  });

  it('handles three records', () => {
    const records = [{ cfci: 10 }, { cfci: 50 }, { cfci: 90 }];
    const quartiles = assignCfciQuartiles(records);
    // n=3: sorted idx [0→cfci10, 1→cfci50, 2→cfci90]
    //   pos 0 → pct=0/3=0.0 → Q1
    //   pos 1 → pct=1/3≈0.33 → Q2
    //   pos 2 → pct=2/3≈0.67 → Q3
    expect(quartiles[0]).toBe(1);
    expect(quartiles[1]).toBe(2);
    expect(quartiles[2]).toBe(3);
  });
});
