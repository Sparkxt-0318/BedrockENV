import { CompositeScore, ExposureLayer, LayerScore } from '@/types/exposure';
import { DataResolution } from '@/types/resolution';
import { MVP_WEIGHTS, reweightForAvailableLayers } from './weights';

/**
 * Compute the composite Environmental Exposure Score (0–100).
 *
 * Takes individual layer scores and produces a weighted composite.
 * When layers are missing, remaining layers are re-weighted proportionally.
 * Composite confidence = lowest confidence among included layers.
 */

const RESOLUTION_RANK: Record<DataResolution, number> = {
  property: 3,
  neighborhood: 2,
  area: 1,
};

const CONFIDENCE_FROM_LAYERS: Record<number, 'high' | 'moderate' | 'low'> = {
  5: 'high',
  4: 'high',
  3: 'moderate',
  2: 'moderate',
  1: 'low',
};

export function computeCompositeScore(
  layerScores: Partial<Record<ExposureLayer, LayerScore>>
): CompositeScore {
  // Determine which layers have data
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

  // Re-weight for available layers
  const weights = reweightForAvailableLayers(MVP_WEIGHTS, availableLayers);

  // Compute weighted average
  let compositeScore = 0;
  for (const [layer, weight] of Object.entries(weights)) {
    const layerScore = layerScores[layer as ExposureLayer];
    if (layerScore) {
      compositeScore += layerScore.score * weight;
    }
  }

  // Determine confidence: lowest resolution among included layers
  let lowestResolution: DataResolution = 'property';
  for (const layer of availableLayers) {
    const ls = layerScores[layer];
    if (ls && RESOLUTION_RANK[ls.confidence] < RESOLUTION_RANK[lowestResolution]) {
      lowestResolution = ls.confidence;
    }
  }

  // Also factor in number of layers for confidence
  const layerCountConfidence =
    CONFIDENCE_FROM_LAYERS[availableLayers.length] ?? 'low';
  const resolutionConfidence =
    lowestResolution === 'area'
      ? 'low'
      : lowestResolution === 'neighborhood'
        ? 'moderate'
        : 'high';

  // Take the lower of the two confidence assessments
  const confidenceRank = { high: 3, moderate: 2, low: 1 };
  const finalConfidence =
    confidenceRank[layerCountConfidence] < confidenceRank[resolutionConfidence]
      ? layerCountConfidence
      : resolutionConfidence;

  return {
    score: Math.round(compositeScore),
    confidence: finalConfidence,
    layersIncluded: availableLayers,
    layerScores,
  };
}
