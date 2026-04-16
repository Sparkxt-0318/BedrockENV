import {
  CompositeScore,
  ExposureLayer,
  LayerScore,
} from '@/types/exposure';
import { DataResolution } from '@/types/resolution';
import { FULL_WEIGHTS, reweightForAvailableLayers } from './weights';
import {
  classifyCoverage,
  computeCompositeCoverage,
  isSufficient,
} from './coverage';
import { SCORING_VERSION } from './version';

/**
 * Compute the composite Environmental Exposure Score (0–100) with
 * coverage awareness.
 *
 * Inputs: a (possibly partial) map of per-layer scores. A layer with
 * `available: false` is treated as missing — its weight is redistributed
 * over the layers that remain.
 *
 * Outputs include:
 *   - `score`         — weighted arithmetic combination (always computed)
 *   - `coverage`      — reweighted-weighted mean of included layers'
 *                       coverage fractions
 *   - `sufficient`    — coverage ≥ INSUFFICIENT threshold
 *   - `confidence`    — 'insufficient' when `sufficient === false`,
 *                       'low' when coverage is below the LOW_CAPPED
 *                       threshold but above insufficient, otherwise
 *                       derived from the lowest layer resolution
 *                       (property → high, neighborhood → moderate,
 *                       area → low)
 *   - `scoringVersion` — snapshot of SCORING_VERSION for cache invalidation
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
      confidence: 'insufficient',
      sufficient: false,
      coverage: 0,
      scoringVersion: SCORING_VERSION,
      layersIncluded: [],
      layerScores,
    };
  }

  // Re-weight remaining layers to sum to 1.0.
  const weights = reweightForAvailableLayers(FULL_WEIGHTS, availableLayers);

  // Weighted arithmetic composite.
  let compositeScore = 0;
  for (const [layer, weight] of Object.entries(weights)) {
    const layerScore = layerScores[layer as ExposureLayer];
    if (layerScore) {
      compositeScore += layerScore.score * weight;
    }
  }

  // Composite coverage uses the *reweighted* weights so that dropping
  // a layer doesn't artificially inflate overall coverage.
  const layerCoverages: Record<string, number> = {};
  for (const layer of availableLayers) {
    layerCoverages[layer] = layerScores[layer]?.coverage ?? 0;
  }
  const coverage = computeCompositeCoverage(weights, layerCoverages);

  // Lowest resolution among the included layers.
  let lowestResolution: DataResolution = 'property';
  for (const layer of availableLayers) {
    const ls = layerScores[layer];
    if (ls && RESOLUTION_RANK[ls.confidence] < RESOLUTION_RANK[lowestResolution]) {
      lowestResolution = ls.confidence;
    }
  }

  // Confidence: coverage tier wins when it's worse than the resolution
  // tier. A location with great resolution but lousy coverage is still
  // a low-confidence assessment.
  const tier = classifyCoverage(coverage);
  const resolutionConfidence = CONFIDENCE_FROM_RESOLUTION[lowestResolution];

  let confidence: CompositeScore['confidence'];
  if (tier === 'insufficient') {
    confidence = 'insufficient';
  } else if (tier === 'low-capped') {
    confidence = 'low';
  } else {
    confidence = resolutionConfidence;
  }

  return {
    score: Math.round(compositeScore),
    confidence,
    sufficient: isSufficient(coverage),
    coverage: round3(coverage),
    scoringVersion: SCORING_VERSION,
    layersIncluded: availableLayers,
    layerScores,
  };
}

function round3(x: number): number {
  return Math.round(x * 1000) / 1000;
}
