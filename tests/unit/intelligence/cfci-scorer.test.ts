import { describe, it, expect } from 'vitest';
import {
  computeCfci,
  classifyCfci,
  assignCfciQuartiles,
} from '@/lib/intelligence/cfci-scorer';

describe('computeCfci', () => {
  it('returns zero when both inputs are zero', () => {
    const result = computeCfci({ fer: 0, cpi: 0 });
    expect(result.cfci).toBe(0);
    expect(result.floodExposureScore).toBe(0);
    expect(result.cpi).toBe(0);
    expect(result.classification).toBe('Low');
  });

  it('computes cfci as sqrt(floodExposureScore * cpi)', () => {
    // fer=0.25 → floodExposureScore=25; cpi=64 → cfci=sqrt(25*64)=sqrt(1600)=40
    const result = computeCfci({ fer: 0.25, cpi: 64 });
    expect(result.floodExposureScore).toBe(25);
    expect(result.cpi).toBe(64);
    expect(result.cfci).toBe(40);
    expect(result.classification).toBe('High');
  });

  it('computes severe cfci when both scores are high', () => {
    // fer=1 → floodExposureScore=100; cpi=100 → cfci=sqrt(10000)=100
    const result = computeCfci({ fer: 1, cpi: 100 });
    expect(result.cfci).toBe(100);
    expect(result.classification).toBe('Severe');
  });

  it('clamps fer above 1 to 1', () => {
    const result = computeCfci({ fer: 2.5, cpi: 100 });
    expect(result.floodExposureScore).toBe(100);
  });

  it('clamps fer below 0 to 0', () => {
    const result = computeCfci({ fer: -0.5, cpi: 100 });
    expect(result.floodExposureScore).toBe(0);
    expect(result.cfci).toBe(0);
  });

  it('clamps cpi above 100 to 100', () => {
    const result = computeCfci({ fer: 1, cpi: 150 });
    expect(result.cpi).toBe(100);
  });

  it('clamps cpi below 0 to 0', () => {
    const result = computeCfci({ fer: 1, cpi: -10 });
    expect(result.cpi).toBe(0);
    expect(result.cfci).toBe(0);
  });

  it('treats non-finite fer as 0', () => {
    const result = computeCfci({ fer: NaN, cpi: 80 });
    expect(result.floodExposureScore).toBe(0);
    expect(result.cfci).toBe(0);
  });

  it('treats non-finite cpi as 0', () => {
    const result = computeCfci({ fer: 0.5, cpi: Infinity });
    expect(result.cpi).toBe(0);
    expect(result.cfci).toBe(0);
  });

  it('produces Elevated classification at boundary (cfci=15)', () => {
    // fer=0.09, cpi=25 → FES=9, cfci=sqrt(9*25)=sqrt(225)=15
    const result = computeCfci({ fer: 0.09, cpi: 25 });
    expect(result.cfci).toBe(15);
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
  it('assigns quartile 1 to the lowest scorer in a 4-record set', () => {
    const records = [
      { cfci: 10 },
      { cfci: 30 },
      { cfci: 60 },
      { cfci: 90 },
    ];
    const quartiles = assignCfciQuartiles(records);
    expect(quartiles[0]).toBe(1);
    expect(quartiles[1]).toBe(2);
    expect(quartiles[2]).toBe(3);
    expect(quartiles[3]).toBe(4);
  });

  it('handles a single record (always Q1)', () => {
    expect(assignCfciQuartiles([{ cfci: 77 }])).toEqual([1]);
  });

  it('handles an empty array', () => {
    expect(assignCfciQuartiles([])).toEqual([]);
  });

  it('preserves original ordering via index', () => {
    const records = [
      { cfci: 90 },
      { cfci: 10 },
      { cfci: 50 },
      { cfci: 30 },
    ];
    const quartiles = assignCfciQuartiles(records);
    // sorted order: 10(idx1), 30(idx3), 50(idx2), 90(idx0)
    expect(quartiles[1]).toBe(1); // cfci=10 → Q1
    expect(quartiles[3]).toBe(2); // cfci=30 → Q2
    expect(quartiles[2]).toBe(3); // cfci=50 → Q3
    expect(quartiles[0]).toBe(4); // cfci=90 → Q4
  });

  it('assigns Q1 through Q4 across 8 records', () => {
    const records = Array.from({ length: 8 }, (_, i) => ({ cfci: i * 10 }));
    const quartiles = assignCfciQuartiles(records);
    expect(quartiles.filter(q => q === 1).length).toBe(2);
    expect(quartiles.filter(q => q === 2).length).toBe(2);
    expect(quartiles.filter(q => q === 3).length).toBe(2);
    expect(quartiles.filter(q => q === 4).length).toBe(2);
  });
});
