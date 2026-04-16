import { describe, it, expect, beforeEach } from 'vitest';
import { lookupNonattainment, _resetNonattainmentCache } from '@/lib/data-sources/nonattainment';

describe('lookupNonattainment', () => {
  beforeEach(() => {
    _resetNonattainmentCache();
  });

  it('returns nonattainment for LA County (06037)', () => {
    const result = lookupNonattainment('06', '037');

    expect(result).not.toBeNull();
    expect(result!.isNonattainment).toBe(true);
    expect(result!.pollutants).toContain('PM2.5');
    expect(result!.pollutants).toContain('Ozone');
    expect(result!.classification).toBe('Serious');
    expect(result!.countyFips).toBe('06037');
  });

  it('returns nonattainment for Riverside County (06065) — Extreme', () => {
    const result = lookupNonattainment('06', '065');

    expect(result!.isNonattainment).toBe(true);
    expect(result!.classification).toBe('Extreme');
  });

  it('returns attainment for a county not in the bundle', () => {
    const result = lookupNonattainment('99', '999');

    expect(result).not.toBeNull();
    expect(result!.isNonattainment).toBe(false);
    expect(result!.pollutants).toHaveLength(0);
    expect(result!.classification).toBe('attainment');
  });

  it('returns null for empty FIPS inputs', () => {
    expect(lookupNonattainment('', '037')).toBeNull();
    expect(lookupNonattainment('06', '')).toBeNull();
  });

  it('returns correct data for Cook County IL (17031)', () => {
    const result = lookupNonattainment('17', '031');

    expect(result!.isNonattainment).toBe(true);
    expect(result!.pollutants).toContain('PM2.5');
    expect(result!.pollutants).toContain('Ozone');
    expect(result!.classification).toBe('Moderate');
  });

  it('returns correct data for Harris County TX (48201) — Ozone only', () => {
    const result = lookupNonattainment('48', '201');

    expect(result!.isNonattainment).toBe(true);
    expect(result!.pollutants).toEqual(['Ozone']);
    expect(result!.classification).toBe('Marginal');
  });

  it('caches the bundle on subsequent calls', () => {
    const r1 = lookupNonattainment('06', '037');
    const r2 = lookupNonattainment('06', '065');

    expect(r1).not.toBeNull();
    expect(r2).not.toBeNull();
    expect(r2!.classification).toBe('Extreme');
  });
});
