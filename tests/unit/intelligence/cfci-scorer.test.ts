import { describe, it, expect } from 'vitest';
import {
  computeCfci,
  classifyCfci,
  assignCfciQuartiles,
} from '@/lib/intelligence/cfci-scorer';

describe('computeCfci', () => {
  it('returns 0 for zero FER and zero CPI', () => {
    const result = computeCfci({ fer: 0, cpi: 0 });
    expect(result.cfci).toBe(0);
    expect(result.floodExposureScore).toBe(0);
    expect(result.cpi).toBe(0);
    expect(result.classification).toBe('Low');
  });

  it('computes geometric mean of floodExposureScore and CPI', () => {
    // FER=0.25 → floodExposureScore=25, CPI=64 → CFCI=√(25*64)=√1600=40
    const result = computeCfci({ fer: 0.25, cpi: 64 });
    expect(result.floodExposureScore).toBe(25);
    expect(result.cpi).toBe(64);
    expect(result.cfci).toBe(40);
    expect(result.classification).toBe('High');
  });

  it('clamps FER above 1 to 1', () => {
    const result = computeCfci({ fer: 2.5, cpi: 100 });
    expect(result.floodExposureScore).toBe(100);
    expect(result.cfci).toBe(100);
  });

  it('clamps FER below 0 to 0', () => {
    const result = computeCfci({ fer: -0.5, cpi: 80 });
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
  });

  it('produces Severe classification for high compound risk', () => {
    // FER=1 → floodExposureScore=100, CPI=100 → CFCI=100
    const result = computeCfci({ fer: 1, cpi: 100 });
    expect(result.cfci).toBe(100);
    expect(result.classification).toBe('Severe');
  });

  it('produces Elevated classification near threshold', () => {
    // FER=0.0225 → FES=2, CPI=100 → CFCI=√200≈14 → Low
    // FER=0.0256 → FES=3 (rounded), CPI=100 → CFCI=√300≈17 → Elevated
    const result = computeCfci({ fer: 0.0256, cpi: 100 });
    expect(result.classification).toBe('Elevated');
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
});

describe('assignCfciQuartiles', () => {
  it('assigns Q1 through Q4 correctly for 4 records', () => {
    const records = [
      { cfci: 10 },
      { cfci: 30 },
      { cfci: 50 },
      { cfci: 80 },
    ];
    const quartiles = assignCfciQuartiles(records);
    expect(quartiles[0]).toBe(1);
    expect(quartiles[1]).toBe(2);
    expect(quartiles[2]).toBe(3);
    expect(quartiles[3]).toBe(4);
  });

  it('handles a single record (all Q1)', () => {
    const quartiles = assignCfciQuartiles([{ cfci: 55 }]);
    expect(quartiles[0]).toBe(1);
  });

  it('handles empty array', () => {
    const quartiles = assignCfciQuartiles([]);
    expect(quartiles).toHaveLength(0);
  });

  it('preserves original record order in output', () => {
    // Records in descending order — output should map each record to its quartile
    const records = [{ cfci: 80 }, { cfci: 50 }, { cfci: 30 }, { cfci: 10 }];
    const quartiles = assignCfciQuartiles(records);
    // index 3 (cfci=10) is smallest → Q1; index 0 (cfci=80) is largest → Q4
    expect(quartiles[3]).toBe(1);
    expect(quartiles[0]).toBe(4);
  });

  it('distributes 8 records evenly across quartiles', () => {
    const records = Array.from({ length: 8 }, (_, i) => ({ cfci: i * 10 }));
    const quartiles = assignCfciQuartiles(records);
    const counts = [0, 0, 0, 0];
    for (const q of quartiles) counts[q - 1]++;
    expect(counts).toEqual([2, 2, 2, 2]);
  });
});
