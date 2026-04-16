import { describe, it, expect } from 'vitest';
import { computeCompositeScore } from '@/lib/scoring/engine';
import type { LayerScore } from '@/types/exposure';

function layer(
  score: number,
  confidence: LayerScore['confidence'] = 'neighborhood',
  available = true,
  coverage = 1
): LayerScore {
  return {
    score,
    confidence,
    available,
    coverage,
    subScores: {},
    rawData: {},
  };
}

describe('Composite Scorer', () => {
  it('weights water 0.55 and soil 0.45 when both layers are present', () => {
    const result = computeCompositeScore({
      water: layer(80, 'neighborhood'),
      soil: layer(20, 'neighborhood'),
    });
    // 80 * 0.55 + 20 * 0.45 = 44 + 9 = 53
    expect(result.score).toBe(53);
    expect(result.layersIncluded).toEqual(['water', 'soil']);
    expect(result.coverage).toBe(1);
    expect(result.sufficient).toBe(true);
    expect(result.scoringVersion).toBeGreaterThanOrEqual(1);
  });

  it('passes through water-only when soil is unavailable (no artificial penalty)', () => {
    const result = computeCompositeScore({
      water: layer(60, 'property'),
      soil: layer(0, 'neighborhood', false),
    });
    expect(result.score).toBe(60);
    expect(result.layersIncluded).toEqual(['water']);
    expect(result.confidence).toBe('high'); // property → high
  });

  it('passes through soil-only when water is unavailable', () => {
    const result = computeCompositeScore({
      water: layer(0, 'area', false),
      soil: layer(42, 'neighborhood'),
    });
    expect(result.score).toBe(42);
    expect(result.layersIncluded).toEqual(['soil']);
    expect(result.confidence).toBe('moderate'); // neighborhood → moderate
  });

  it('returns insufficient when both layers are unavailable', () => {
    const result = computeCompositeScore({
      water: layer(0, 'area', false),
      soil: layer(0, 'neighborhood', false),
    });
    expect(result.score).toBe(0);
    expect(result.confidence).toBe('insufficient');
    expect(result.sufficient).toBe(false);
    expect(result.coverage).toBe(0);
    expect(result.layersIncluded).toEqual([]);
  });

  it('clamps confidence to low when coverage is between 0.35 and 0.60', () => {
    // Water with 0.50 coverage (partial data), no soil
    const result = computeCompositeScore({
      water: layer(60, 'property', true, 0.50),
      soil: layer(0, 'area', false, 0),
    });
    // 0.50 is above 0.35 (sufficient) but below 0.60 (low-capped)
    expect(result.sufficient).toBe(true);
    expect(result.confidence).toBe('low');
  });

  it('marks insufficient when coverage below 0.35', () => {
    const result = computeCompositeScore({
      water: layer(60, 'property', true, 0.30),
      soil: layer(0, 'area', false, 0),
    });
    expect(result.sufficient).toBe(false);
    expect(result.confidence).toBe('insufficient');
  });

  it('composite confidence inherits the lowest resolution among included layers', () => {
    // property + area → area → low
    const mixed = computeCompositeScore({
      water: layer(50, 'property'),
      soil: layer(30, 'area'),
    });
    expect(mixed.confidence).toBe('low');

    // neighborhood + property → neighborhood → moderate
    const neighborhoodPlusProperty = computeCompositeScore({
      water: layer(50, 'property'),
      soil: layer(30, 'neighborhood'),
    });
    expect(neighborhoodPlusProperty.confidence).toBe('moderate');

    // property + property → property → high
    const allProperty = computeCompositeScore({
      water: layer(50, 'property'),
      soil: layer(30, 'property'),
    });
    expect(allProperty.confidence).toBe('high');
  });
});
