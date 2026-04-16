import { EjLayerData, LayerScore } from '@/types/exposure';
import { DataResolution } from '@/types/resolution';
import { stepNormalize } from './normalizer';
import { SubComponent, computeLayerCoverage } from './coverage';

/**
 * Environmental Justice Sub-Score (0–100). Higher = more EJ burden.
 *
 * Sub-components (weights within the layer, sum to 1.00):
 *   ejScreenIndex       0.40 — EPA EJScreen EJ index percentile
 *   socialVulnerability  0.35 — CDC SVI overall percentile
 *   demographicBurden    0.25 — EJScreen demographic indicators
 *
 * EJScreen percentiles are already 0–100 (national rank). SVI
 * percentiles are 0–1 (converted to 0–100). These are not raw
 * values — they represent relative standing.
 *
 * Confidence tiers:
 *   property     — both EJScreen and SVI available (block group + tract)
 *   neighborhood — only one source available
 *   area         — neither available
 */

const EJ_SUB_WEIGHTS = {
  ejScreenIndex: 0.40,
  socialVulnerability: 0.35,
  demographicBurden: 0.25,
} as const;

const UNAVAILABLE_LAYER: LayerScore = {
  score: 0,
  confidence: 'area',
  available: false,
  coverage: 0,
  subScores: {},
  rawData: {},
};

export function scoreEjLayer(data: EjLayerData): LayerScore {
  const subScores: Record<string, number> = {};
  const activeWeights: Record<string, number> = {};
  const components: SubComponent[] = [];

  let hasEjScreen = false;
  let hasSvi = false;

  // ── 1. EJScreen EJ Index ─────────────────────────────────────────────
  const ej = data.ejscreen;
  if (ej !== null && ej.ejIndex !== null) {
    hasEjScreen = true;
    // EJScreen EJ index is already a national percentile (0–100).
    // Use a mild step curve to emphasize the high-burden end.
    const ejScore = stepNormalize(ej.ejIndex, [
      { value: 0, score: 0 },
      { value: 20, score: 10 },
      { value: 40, score: 25 },
      { value: 50, score: 35 },
      { value: 60, score: 45 },
      { value: 70, score: 60 },
      { value: 80, score: 75 },
      { value: 90, score: 90 },
      { value: 95, score: 100 },
    ]);
    subScores.ejScreenIndex = ejScore;
    activeWeights.ejScreenIndex = EJ_SUB_WEIGHTS.ejScreenIndex;
    components.push({
      score: ejScore,
      weight: EJ_SUB_WEIGHTS.ejScreenIndex,
      reason: 'present',
    });
  } else {
    components.push({
      score: null,
      weight: EJ_SUB_WEIGHTS.ejScreenIndex,
      reason: ej === null ? 'fetch-failed' : 'out-of-scope',
    });
  }

  // ── 2. CDC Social Vulnerability Index ────────────────────────────────
  const svi = data.svi;
  if (svi !== null && svi.overallSvi >= 0) {
    hasSvi = true;
    // SVI percentile is 0–1. Convert to 0–100, then apply step curve.
    const sviPctile = svi.overallSvi * 100;
    const sviScore = stepNormalize(sviPctile, [
      { value: 0, score: 0 },
      { value: 20, score: 10 },
      { value: 40, score: 25 },
      { value: 50, score: 35 },
      { value: 60, score: 45 },
      { value: 70, score: 60 },
      { value: 80, score: 75 },
      { value: 90, score: 90 },
      { value: 95, score: 100 },
    ]);
    subScores.socialVulnerability = sviScore;
    activeWeights.socialVulnerability = EJ_SUB_WEIGHTS.socialVulnerability;
    components.push({
      score: sviScore,
      weight: EJ_SUB_WEIGHTS.socialVulnerability,
      reason: 'present',
    });
  } else {
    components.push({
      score: null,
      weight: EJ_SUB_WEIGHTS.socialVulnerability,
      reason: svi === null ? 'fetch-failed' : 'out-of-scope',
    });
  }

  // ── 3. Demographic Burden (from EJScreen demographic indicators) ─────
  if (ej !== null && ej.demographicIndex !== null) {
    // demographicIndex is a percentile (0–100) combining minority %
    // and low-income %. Apply the same step curve.
    const demoScore = stepNormalize(ej.demographicIndex, [
      { value: 0, score: 0 },
      { value: 20, score: 10 },
      { value: 40, score: 25 },
      { value: 50, score: 35 },
      { value: 60, score: 45 },
      { value: 70, score: 60 },
      { value: 80, score: 75 },
      { value: 90, score: 90 },
      { value: 95, score: 100 },
    ]);
    subScores.demographicBurden = demoScore;
    activeWeights.demographicBurden = EJ_SUB_WEIGHTS.demographicBurden;
    components.push({
      score: demoScore,
      weight: EJ_SUB_WEIGHTS.demographicBurden,
      reason: 'present',
    });
  } else {
    components.push({
      score: null,
      weight: EJ_SUB_WEIGHTS.demographicBurden,
      reason: ej === null ? 'fetch-failed' : 'out-of-scope',
    });
  }

  // ── Combine ──────────────────────────────────────────────────────────
  const totalWeight = Object.values(activeWeights).reduce((s, w) => s + w, 0);

  if (totalWeight === 0) {
    return UNAVAILABLE_LAYER;
  }

  let ejScore = 0;
  for (const [key, weight] of Object.entries(activeWeights)) {
    ejScore += (subScores[key] ?? 0) * (weight / totalWeight);
  }

  let confidence: DataResolution = 'area';
  if (hasEjScreen && hasSvi) {
    confidence = 'property';
  } else if (hasEjScreen || hasSvi) {
    confidence = 'neighborhood';
  }

  const coverage = computeLayerCoverage(components);

  return {
    score: Math.round(Math.min(100, Math.max(0, ejScore))),
    confidence,
    available: true,
    coverage,
    subScores,
    rawData: {
      ejIndex: ej?.ejIndex ?? null,
      ejIndexSupplemental: ej?.ejIndexSupplemental ?? null,
      demographicIndex: ej?.demographicIndex ?? null,
      sviOverall: svi?.overallSvi ?? null,
      sviSocioeconomic: svi?.socioeconomicSvi ?? null,
      sviHousehold: svi?.householdSvi ?? null,
      sviMinority: svi?.minoritySvi ?? null,
      sviHousing: svi?.housingSvi ?? null,
      minorityPct: ej?.minorityPct ?? null,
      lowIncomePct: ej?.lowIncomePct ?? null,
      blockGroup: ej?.blockGroup ?? null,
      tractFips: svi?.tractFips ?? null,
      weightsUsed: activeWeights,
      coverageBreakdown: components.map((c) => ({
        weight: c.weight,
        reason: c.reason,
      })),
    },
  };
}
