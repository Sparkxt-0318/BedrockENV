import { describe, it, expect } from 'vitest';
import {
  STANDARD_DISCLAIMERS,
  getApplicableDisclaimers,
} from '@/lib/recommendations/disclaimers';

describe('STANDARD_DISCLAIMERS', () => {
  it('exports all expected disclaimer keys', () => {
    expect(STANDARD_DISCLAIMERS).toHaveProperty('general');
    expect(STANDARD_DISCLAIMERS).toHaveProperty('water');
    expect(STANDARD_DISCLAIMERS).toHaveProperty('soil');
    expect(STANDARD_DISCLAIMERS).toHaveProperty('brownfield');
    expect(STANDARD_DISCLAIMERS).toHaveProperty('lead');
    expect(STANDARD_DISCLAIMERS).toHaveProperty('flood');
  });

  it('each disclaimer is a non-empty string', () => {
    for (const value of Object.values(STANDARD_DISCLAIMERS)) {
      expect(typeof value).toBe('string');
      expect(value.length).toBeGreaterThan(0);
    }
  });
});

describe('getApplicableDisclaimers', () => {
  it('always includes the general disclaimer', () => {
    const result = getApplicableDisclaimers([]);
    expect(result).toContain(STANDARD_DISCLAIMERS.general);
    expect(result).toHaveLength(1);
  });

  it('adds water disclaimer when water layer is included', () => {
    const result = getApplicableDisclaimers(['water']);
    expect(result).toContain(STANDARD_DISCLAIMERS.general);
    expect(result).toContain(STANDARD_DISCLAIMERS.water);
    expect(result).toHaveLength(2);
  });

  it('adds soil disclaimer when soil layer is included', () => {
    const result = getApplicableDisclaimers(['soil']);
    expect(result).toContain(STANDARD_DISCLAIMERS.general);
    expect(result).toContain(STANDARD_DISCLAIMERS.soil);
    expect(result).toHaveLength(2);
  });

  it('adds both water and soil disclaimers when both layers included', () => {
    const result = getApplicableDisclaimers(['water', 'soil']);
    expect(result).toContain(STANDARD_DISCLAIMERS.general);
    expect(result).toContain(STANDARD_DISCLAIMERS.water);
    expect(result).toContain(STANDARD_DISCLAIMERS.soil);
    expect(result).toHaveLength(3);
  });

  it('ignores layers without dedicated disclaimers', () => {
    const result = getApplicableDisclaimers(['air', 'proximity', 'ej']);
    expect(result).toEqual([STANDARD_DISCLAIMERS.general]);
  });

  it('handles water and soil among other layers', () => {
    const result = getApplicableDisclaimers(['air', 'water', 'proximity', 'soil', 'ej']);
    expect(result).toHaveLength(3);
    expect(result[0]).toBe(STANDARD_DISCLAIMERS.general);
    expect(result).toContain(STANDARD_DISCLAIMERS.water);
    expect(result).toContain(STANDARD_DISCLAIMERS.soil);
  });
});
