import { describe, it, expect } from 'vitest';
import {
  presenceFactor,
  computeLayerCoverage,
  computeCompositeCoverage,
  classifyCoverage,
  isSufficient,
  INSUFFICIENT_COVERAGE_THRESHOLD,
  LOW_CONFIDENCE_COVERAGE_THRESHOLD,
  SubComponent,
} from '@/lib/scoring/coverage';

// ---------------------------------------------------------------------------
// presenceFactor
// ---------------------------------------------------------------------------

describe('presenceFactor', () => {
  it('returns 1.0 for present', () => {
    expect(presenceFactor('present')).toBe(1.0);
  });

  it('returns 0.5 for partial', () => {
    expect(presenceFactor('partial')).toBe(0.5);
  });

  it('returns 0 for unmapped, out-of-scope, fetch-failed', () => {
    expect(presenceFactor('unmapped')).toBe(0);
    expect(presenceFactor('out-of-scope')).toBe(0);
    expect(presenceFactor('fetch-failed')).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// computeLayerCoverage
// ---------------------------------------------------------------------------

describe('computeLayerCoverage', () => {
  it('returns 1.0 when all components are present', () => {
    const components: SubComponent[] = [
      { score: 50, weight: 0.40, reason: 'present' },
      { score: 30, weight: 0.30, reason: 'present' },
      { score: 10, weight: 0.30, reason: 'present' },
    ];
    expect(computeLayerCoverage(components)).toBe(1.0);
  });

  it('returns 0 when all components failed', () => {
    const components: SubComponent[] = [
      { score: null, weight: 0.40, reason: 'fetch-failed' },
      { score: null, weight: 0.30, reason: 'unmapped' },
      { score: null, weight: 0.30, reason: 'out-of-scope' },
    ];
    expect(computeLayerCoverage(components)).toBe(0);
  });

  it('returns 0 for an empty component array', () => {
    expect(computeLayerCoverage([])).toBe(0);
  });

  it('gives partial coverage when some components are present and some failed', () => {
    const components: SubComponent[] = [
      { score: 50, weight: 0.40, reason: 'present' },     // 0.40 * 1.0 = 0.40
      { score: null, weight: 0.30, reason: 'fetch-failed' }, // 0.30 * 0.0 = 0
      { score: null, weight: 0.30, reason: 'fetch-failed' }, // 0.30 * 0.0 = 0
    ];
    // 0.40 / 1.00 = 0.40
    expect(computeLayerCoverage(components)).toBeCloseTo(0.4, 10);
  });

  it('gives half credit for partial components', () => {
    const components: SubComponent[] = [
      { score: 50, weight: 0.40, reason: 'present' },  // 0.40 * 1.0 = 0.40
      { score: 20, weight: 0.30, reason: 'present' },  // 0.30 * 1.0 = 0.30
      { score: 0, weight: 0.30, reason: 'partial' },   // 0.30 * 0.5 = 0.15
    ];
    // (0.40 + 0.30 + 0.15) / 1.00 = 0.85
    expect(computeLayerCoverage(components)).toBeCloseTo(0.85, 10);
  });

  it('correctly weights unequal components', () => {
    // Water sub-components: pfas 0.40, lead 0.30, violations 0.30
    // Only pfas present, lead & violations fetch-failed
    const components: SubComponent[] = [
      { score: 60, weight: 0.40, reason: 'present' },
      { score: null, weight: 0.30, reason: 'fetch-failed' },
      { score: null, weight: 0.30, reason: 'fetch-failed' },
    ];
    // 0.40 / 1.00 = 0.40
    expect(computeLayerCoverage(components)).toBeCloseTo(0.4, 10);
  });
});

// ---------------------------------------------------------------------------
// computeCompositeCoverage
// ---------------------------------------------------------------------------

describe('computeCompositeCoverage', () => {
  it('returns weighted mean of layer coverages', () => {
    const weights = { water: 0.55, soil: 0.45 };
    const coverages = { water: 1.0, soil: 0.5 };
    // 0.55 * 1.0 + 0.45 * 0.5 = 0.55 + 0.225 = 0.775
    expect(computeCompositeCoverage(weights, coverages)).toBeCloseTo(0.775, 10);
  });

  it('returns 0 when no layers have coverage', () => {
    const weights = { water: 0.55, soil: 0.45 };
    const coverages = { water: 0, soil: 0 };
    expect(computeCompositeCoverage(weights, coverages)).toBe(0);
  });

  it('returns 0 for empty weights', () => {
    expect(computeCompositeCoverage({}, {})).toBe(0);
  });

  it('treats missing layer coverage as 0', () => {
    const weights = { water: 1.0 };
    const coverages: Record<string, number> = {}; // water missing
    expect(computeCompositeCoverage(weights, coverages)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// classifyCoverage threshold transitions
// ---------------------------------------------------------------------------

describe('classifyCoverage', () => {
  it('returns insufficient below INSUFFICIENT_COVERAGE_THRESHOLD', () => {
    expect(classifyCoverage(0)).toBe('insufficient');
    expect(classifyCoverage(0.10)).toBe('insufficient');
    expect(classifyCoverage(INSUFFICIENT_COVERAGE_THRESHOLD - 0.001)).toBe('insufficient');
  });

  it('returns low-capped between thresholds', () => {
    expect(classifyCoverage(INSUFFICIENT_COVERAGE_THRESHOLD)).toBe('low-capped');
    expect(classifyCoverage(0.50)).toBe('low-capped');
    expect(classifyCoverage(LOW_CONFIDENCE_COVERAGE_THRESHOLD - 0.001)).toBe('low-capped');
  });

  it('returns normal at or above LOW_CONFIDENCE_COVERAGE_THRESHOLD', () => {
    expect(classifyCoverage(LOW_CONFIDENCE_COVERAGE_THRESHOLD)).toBe('normal');
    expect(classifyCoverage(0.80)).toBe('normal');
    expect(classifyCoverage(1.0)).toBe('normal');
  });

  it('threshold values are documented correctly', () => {
    expect(INSUFFICIENT_COVERAGE_THRESHOLD).toBe(0.35);
    expect(LOW_CONFIDENCE_COVERAGE_THRESHOLD).toBe(0.60);
  });
});

// ---------------------------------------------------------------------------
// isSufficient
// ---------------------------------------------------------------------------

describe('isSufficient', () => {
  it('returns false below the threshold', () => {
    expect(isSufficient(0)).toBe(false);
    expect(isSufficient(0.34)).toBe(false);
  });

  it('returns true at the threshold', () => {
    expect(isSufficient(0.35)).toBe(true);
  });

  it('returns true above the threshold', () => {
    expect(isSufficient(0.60)).toBe(true);
    expect(isSufficient(1.0)).toBe(true);
  });
});
