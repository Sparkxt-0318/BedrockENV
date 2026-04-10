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
  it('weights water 0.55 and soil 0.45 in MVP mode', () => {
    const result = computeCompositeScore({
      water: layer(80, 'area'),
      soil: layer(20, 'neighborhood'),
    });
    // 80*0.55 + 20*0.45 = 44 + 9 = 53
    expect(result.score).toBe(53);
    expect(result.layersIncluded).toEqual(['water', 'soil']);
  });

  it('re-weights when only one layer has data', () => {
    const result = computeCompositeScore({
      water: layer(60, 'area'),
      soil: layer(0, 'neighborhood', false),
    });
    expect(result.score).toBe(60);
    expect(result.layersIncluded).toEqual(['water']);
  });

  it('composite confidence degrades with lowest layer resolution and small layer count', () => {
    const result = computeCompositeScore({
      water: layer(50, 'area'),
      soil: layer(30, 'neighborhood'),
    });
    // 2 layers -> layer-count confidence is "moderate"
    // Lowest resolution is "area" -> "low"
    // Final is min(moderate, low) = low
    expect(result.confidence).toBe('low');
  });

  it('returns zero with low confidence when no layers have data', () => {
    const result = computeCompositeScore({
      water: layer(0, 'area', false),
      soil: layer(0, 'neighborhood', false),
    });
    expect(result.score).toBe(0);
    expect(result.confidence).toBe('low');
    expect(result.layersIncluded).toEqual([]);
  });
});
