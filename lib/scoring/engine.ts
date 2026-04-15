import { CompositeScore, ExposureLayer, LayerScore } from '@/types/exposure';
import { DataResolution } from '@/types/resolution';
import { MVP_WEIGHTS, reweightForAvailableLayers } from './weights';

/**
 * Compute the composite Environmental Exposure Score (0–100).
 *
 * Inputs: a (possibly partial) map of per-layer scores. A layer with
 * `available: false` is treated as missing — its weight is redistributed
 * over the layers that remain.
 *
 * Composite confidence is the worst (lowest resolution) among the included
 * layers, mapped as:
 *     property      → 'high'
 *     neighborhood  → 'moderate'
 *     area          → 'low'
 *
 * This is deliberately one-dimensional. Earlier versions also penalized
 * assessments with few layers; the spec calls for lowest-resolution only.
 */

const RESOLUTION_RANK: Record<DataResolution, number> = {
  property: 3,
  neighborhood: 2,
  area: 1,
};

const CONFIDENCE_FROM_RESOLUTION: Record<DataResolution, 'high' | 'moderate' | 'low'> = {
  property: 'high',
  neighborhood: 'moderate',
  area: 'low',
};

export function computeCompositeScore(
  layerScores: Partial<Record<ExposureLayer, LayerScore>>
): CompositeScore {
  // Only layers with actual data get a vote.
  const availableLayers = (Object.entries(layerScores) as [ExposureLayer, LayerScore][])
    .filter(([, score]) => score.available)
    .map(([layer]) => layer);

  if (availableLayers.length === 0) {
    return {
      score: 0,
      confidence: 'low',
      layersIncluded: [],
      layerScores,
    };
  }

  // Re-weight remaining layers to sum to 1.0.
  const weights = reweightForAvailableLayers(MVP_WEIGHTS, availableLayers);

  let compositeScore = 0;
  for (const [layer, weight] of Object.entries(weights)) {
    const layerScore = layerScores[layer as ExposureLayer];
    if (layerScore) {
      compositeScore += layerScore.score * weight;
    }
  }

  // Lowest resolution among the included layers.
  let lowestResolution: DataResolution = 'property';
  for (const layer of availableLayers) {
    const ls = layerScores[layer];
    if (ls && RESOLUTION_RANK[ls.confidence] < RESOLUTION_RANK[lowestResolution]) {
      lowestResolution = ls.confidence;
    }
  }

  return {
    score: Math.round(compositeScore),
    confidence: CONFIDENCE_FROM_RESOLUTION[lowestResolution],
    layersIncluded: availableLayers,
    layerScores,
  };
}
