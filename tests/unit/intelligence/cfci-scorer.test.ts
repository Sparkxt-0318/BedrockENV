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
  it('returns Severe for cfci >= 50', () => {
    expect(classifyCfci(50)).toBe('Severe');
    expect(classifyCfci(100)).toBe('Severe');
    expect(classifyCfci(75)).toBe('Severe');
  });

  it('returns High for cfci 30-49', () => {
    expect(classifyCfci(30)).toBe('High');
    expect(classifyCfci(49)).toBe('High');
    expect(classifyCfci(40)).toBe('High');
  });

  it('returns Elevated for cfci 15-29', () => {
    expect(classifyCfci(15)).toBe('Elevated');
    expect(classifyCfci(29)).toBe('Elevated');
    expect(classifyCfci(22)).toBe('Elevated');
  });

  it('returns Low for cfci < 15', () => {
    expect(classifyCfci(0)).toBe('Low');
    expect(classifyCfci(14)).toBe('Low');
    expect(classifyCfci(7)).toBe('Low');
  });
});

// ---------------------------------------------------------------------------
// computeCfci
// ---------------------------------------------------------------------------

describe('computeCfci', () => {
  it('computes correct cfci for typical flood+contamination county', () => {
    // FER=0.5, CPI=60 → FES=50, cfci=round(sqrt(50*60))=round(54.77)=55
    const result = computeCfci({ fer: 0.5, cpi: 60 });
    expect(result.floodExposureScore).toBe(50);
    expect(result.cfci).toBe(55);
    expect(result.classification).toBe('Severe');
    expect(result.cpi).toBe(60);
  });

  it('returns zero cfci when no flood exposure', () => {
    const result = computeCfci({ fer: 0, cpi: 80 });
    expect(result.floodExposureScore).toBe(0);
    expect(result.cfci).toBe(0);
    expect(result.classification).toBe('Low');
  });

  it('returns zero cfci when no contamination pressure', () => {
    const result = computeCfci({ fer: 0.8, cpi: 0 });
    expect(result.floodExposureScore).toBe(80);
    expect(result.cfci).toBe(0);
    expect(result.classification).toBe('Low');
  });

  it('reaches maximum cfci of 100 when both factors maxed', () => {
    const result = computeCfci({ fer: 1.0, cpi: 100 });
    expect(result.floodExposureScore).toBe(100);
    expect(result.cfci).toBe(100);
    expect(result.classification).toBe('Severe');
  });

  it('clamps fer above 1.0 to 1.0', () => {
    const result = computeCfci({ fer: 1.5, cpi: 100 });
    expect(result.floodExposureScore).toBe(100);
  });

  it('clamps fer below 0 to 0', () => {
    const result = computeCfci({ fer: -0.5, cpi: 100 });
    expect(result.floodExposureScore).toBe(0);
    expect(result.cfci).toBe(0);
  });

  it('clamps cpi above 100 to 100', () => {
    const result = computeCfci({ fer: 1.0, cpi: 150 });
    expect(result.cpi).toBe(100);
    expect(result.cfci).toBe(100);
  });

  it('clamps cpi below 0 to 0', () => {
    const result = computeCfci({ fer: 1.0, cpi: -10 });
    expect(result.cpi).toBe(0);
    expect(result.cfci).toBe(0);
  });

  it('treats non-finite fer as 0', () => {
    const result = computeCfci({ fer: NaN, cpi: 80 });
    expect(result.floodExposureScore).toBe(0);
    expect(result.cfci).toBe(0);
  });

  it('treats non-finite cpi as 0', () => {
    const result = computeCfci({ fer: 0.8, cpi: Infinity });
    expect(result.cpi).toBe(0);
    expect(result.cfci).toBe(0);
  });

  it('returns Elevated classification for moderate risk', () => {
    // Want cfci in 15-29 range: sqrt(FES * CPI) ~= 20 → FES*CPI=400
    // fer=0.1 → FES=10, CPI=40 → sqrt(400)=20
    const result = computeCfci({ fer: 0.1, cpi: 40 });
    expect(result.classification).toBe('Elevated');
  });

  it('returns High classification for significant risk', () => {
    // sqrt(FES * CPI) ~= 35 → FES*CPI ~= 1225
    // fer=0.35 → FES=35, CPI=43 → sqrt(35*43)=sqrt(1505)=38.8 → 39
    const result = computeCfci({ fer: 0.35, cpi: 43 });
    expect(result.classification).toBe('High');
  });
});

// ---------------------------------------------------------------------------
// assignCfciQuartiles
// ---------------------------------------------------------------------------

describe('assignCfciQuartiles', () => {
  it('distributes 8 records evenly across 4 quartiles', () => {
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

  it('preserves original index ordering', () => {
    // Sorted ascending by cfci: [10→idx1, 50→idx2, 90→idx0]
    const records = [{ cfci: 90 }, { cfci: 10 }, { cfci: 50 }];
    const q = assignCfciQuartiles(records);
    expect(q[0]).toBe(3); // cfci=90, sorted index 2/3 → pct=0.67 → Q3
    expect(q[1]).toBe(1); // cfci=10, sorted index 0/3 → pct=0.00 → Q1
    expect(q[2]).toBe(2); // cfci=50, sorted index 1/3 → pct=0.33 → Q2
  });

  it('handles single record (assigned Q1)', () => {
    const q = assignCfciQuartiles([{ cfci: 55 }]);
    expect(q[0]).toBe(1);
  });

  it('handles empty array', () => {
    const q = assignCfciQuartiles([]);
    expect(q).toHaveLength(0);
  });

  it('assigns Q4 to highest record in 4-record set', () => {
    const records = [{ cfci: 0 }, { cfci: 25 }, { cfci: 50 }, { cfci: 100 }];
    const q = assignCfciQuartiles(records);
    expect(q[3]).toBe(4);
    expect(q[0]).toBe(1);
  });

  it('handles ties — does not throw', () => {
    const records = Array.from({ length: 4 }, () => ({ cfci: 50 }));
    expect(() => assignCfciQuartiles(records)).not.toThrow();
    const q = assignCfciQuartiles(records);
    expect(q).toHaveLength(4);
  });
});
