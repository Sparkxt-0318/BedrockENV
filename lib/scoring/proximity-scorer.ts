import { ProximityLayerData, LayerScore } from '@/types/exposure';
import { DataResolution } from '@/types/resolution';
import { stepNormalize } from './normalizer';
import { SubComponent, computeLayerCoverage } from './coverage';

/**
 * Proximity Sub-Score (0–100). Higher = more exposure risk.
 *
 * Sub-components (weights within the layer, sum to 1.00):
 *   superfundProximity  0.35 — NPL-listed Superfund sites within 5 mi
 *   rcraFacilities      0.25 — RCRA hazardous waste handlers within 3 mi
 *   triReleases         0.20 — TRI toxic release facilities within 3 mi
 *   sncFacilities       0.20 — Facilities in significant non-compliance
 *
 * Superfund sites are distance-weighted: a site at 0.5 km is far more
 * dangerous than one at 8 km. The other sub-components use facility
 * counts from ECHO data.
 *
 * Confidence tiers:
 *   property     — ECHO data available (within-radius query)
 *   area         — ECHO data unavailable, only Superfund or nothing
 */

const PROXIMITY_SUB_WEIGHTS = {
  superfundProximity: 0.35,
  rcraFacilities: 0.25,
  triReleases: 0.20,
  sncFacilities: 0.20,
} as const;

const UNAVAILABLE_LAYER: LayerScore = {
  score: 0,
  confidence: 'area',
  available: false,
  coverage: 0,
  subScores: {},
  rawData: {},
};

export function scoreProximityLayer(data: ProximityLayerData): LayerScore {
  const subScores: Record<string, number> = {};
  const activeWeights: Record<string, number> = {};
  const components: SubComponent[] = [];

  // ── 1. Superfund NPL proximity ───────────────────────────────────────
  const sites = data.superfundSites;
  if (sites !== null) {
    let sfScore = 0;
    if (sites.length > 0) {
      const closestKm = sites[0].distanceKm;
      const distScore = stepNormalize(
        closestKm <= 0 ? 0.1 : closestKm,
        [
          { value: 0, score: 100 },
          { value: 0.5, score: 95 },
          { value: 1.0, score: 85 },
          { value: 2.0, score: 70 },
          { value: 4.0, score: 50 },
          { value: 6.0, score: 35 },
          { value: 8.0, score: 20 },
        ]
      );
      // Inverse: closer = higher risk, but stepNormalize picks the last >=
      // So we need inverted scoring: score = 100 at 0km, ~20 at 8km
      // Actually stepNormalize assigns the score for the highest threshold
      // the value reaches. For distance, higher = less risky.
      // Reverse the mapping: use (max_dist - distance) as input.
      const maxDist = 10;
      const invertedDist = Math.max(0, maxDist - closestKm);
      const proximityScore = stepNormalize(invertedDist, [
        { value: 0, score: 0 },
        { value: 2, score: 15 },
        { value: 4, score: 30 },
        { value: 6, score: 50 },
        { value: 8, score: 75 },
        { value: 9, score: 90 },
        { value: 10, score: 100 },
      ]);

      const countBoost = Math.min(15, (sites.length - 1) * 5);
      sfScore = Math.min(100, proximityScore + countBoost);
    }

    subScores.superfundProximity = sfScore;
    activeWeights.superfundProximity = PROXIMITY_SUB_WEIGHTS.superfundProximity;
    // FRS SEMS radius search has known coverage gaps (e.g. Tar Creek NPL).
    // Positive results are high-confidence; negative results (empty array)
    // get 'partial' to reflect the uncertainty of a null search.
    components.push({
      score: sfScore,
      weight: PROXIMITY_SUB_WEIGHTS.superfundProximity,
      reason: sites.length > 0 ? 'present' : 'partial',
    });
  } else {
    components.push({
      score: null,
      weight: PROXIMITY_SUB_WEIGHTS.superfundProximity,
      reason: 'fetch-failed',
    });
  }

  // ── 2. RCRA hazardous waste facilities ───���───────────────────────────
  const echo = data.echoFacilities;
  if (echo !== null) {
    const rcraCount = echo.facilities.filter(f => f.programs.includes('RCRA')).length;
    const rcraScore = stepNormalize(rcraCount, [
      { value: 0, score: 0 },
      { value: 1, score: 15 },
      { value: 3, score: 30 },
      { value: 5, score: 45 },
      { value: 10, score: 65 },
      { value: 15, score: 80 },
      { value: 25, score: 95 },
    ]);
    subScores.rcraFacilities = rcraScore;
    activeWeights.rcraFacilities = PROXIMITY_SUB_WEIGHTS.rcraFacilities;
    components.push({
      score: rcraScore,
      weight: PROXIMITY_SUB_WEIGHTS.rcraFacilities,
      reason: 'present',
    });

    // ── 3. TRI toxic release facilities ──────────────────────────────
    const triCount = echo.facilities.filter(f => f.programs.includes('TRI')).length;
    const triScore = stepNormalize(triCount, [
      { value: 0, score: 0 },
      { value: 1, score: 15 },
      { value: 3, score: 30 },
      { value: 5, score: 45 },
      { value: 10, score: 65 },
      { value: 20, score: 80 },
      { value: 50, score: 95 },
    ]);
    subScores.triReleases = triScore;
    activeWeights.triReleases = PROXIMITY_SUB_WEIGHTS.triReleases;
    components.push({
      score: triScore,
      weight: PROXIMITY_SUB_WEIGHTS.triReleases,
      reason: 'present',
    });

    // ── 4. Significant non-compliance facilities ─────────────────────
    const sncCount = echo.significantViolationCount;
    const sncScore = stepNormalize(sncCount, [
      { value: 0, score: 0 },
      { value: 1, score: 25 },
      { value: 2, score: 40 },
      { value: 3, score: 55 },
      { value: 5, score: 70 },
      { value: 8, score: 85 },
      { value: 12, score: 95 },
    ]);
    subScores.sncFacilities = sncScore;
    activeWeights.sncFacilities = PROXIMITY_SUB_WEIGHTS.sncFacilities;
    components.push({
      score: sncScore,
      weight: PROXIMITY_SUB_WEIGHTS.sncFacilities,
      reason: 'present',
    });
  } else {
    components.push({
      score: null,
      weight: PROXIMITY_SUB_WEIGHTS.rcraFacilities,
      reason: 'fetch-failed',
    });
    components.push({
      score: null,
      weight: PROXIMITY_SUB_WEIGHTS.triReleases,
      reason: 'fetch-failed',
    });
    components.push({
      score: null,
      weight: PROXIMITY_SUB_WEIGHTS.sncFacilities,
      reason: 'fetch-failed',
    });
  }

  // ── Combine ──────────────────────────────────────────────────────────
  const totalWeight = Object.values(activeWeights).reduce((s, w) => s + w, 0);

  if (totalWeight === 0) {
    return UNAVAILABLE_LAYER;
  }

  let proximityScore = 0;
  for (const [key, weight] of Object.entries(activeWeights)) {
    proximityScore += (subScores[key] ?? 0) * (weight / totalWeight);
  }

  let confidence: DataResolution = 'area';
  if (echo !== null) {
    confidence = 'property';
  }

  const coverage = computeLayerCoverage(components);

  return {
    score: Math.round(Math.min(100, Math.max(0, proximityScore))),
    confidence,
    available: true,
    coverage,
    subScores,
    rawData: {
      superfundSiteCount: sites?.length ?? 0,
      closestSuperfundKm: sites && sites.length > 0 ? sites[0].distanceKm : null,
      rcraCount: echo?.facilities.filter(f => f.programs.includes('RCRA')).length ?? 0,
      triCount: echo?.facilities.filter(f => f.programs.includes('TRI')).length ?? 0,
      sncCount: echo?.significantViolationCount ?? 0,
      totalEchoFacilities: echo?.totalCount ?? 0,
      weightsUsed: activeWeights,
      coverageBreakdown: components.map((c) => ({
        weight: c.weight,
        reason: c.reason,
      })),
    },
  };
}
