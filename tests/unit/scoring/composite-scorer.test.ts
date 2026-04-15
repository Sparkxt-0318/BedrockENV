import { describe, it, expect } from 'vitest';
import { computeCompositeScore } from '@/lib/scoring/engine';
import type { LayerScore } from '@/types/exposure';

function layer(
  score: number,
  confidence: LayerScore['confidence'] = 'neighborhood',
  available = true
): LayerScore {
  return {
    score,
    confidence,
    available,
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

  it('returns empty result with low confidence when both layers are unavailable', () => {
    const result = computeCompositeScore({
      water: layer(0, 'area', false),
      soil: layer(0, 'neighborhood', false),
    });
    expect(result.score).toBe(0);
    expect(result.confidence).toBe('low');
    expect(result.layersIncluded).toEqual([]);
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
