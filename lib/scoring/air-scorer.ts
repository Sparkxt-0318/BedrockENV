import { AirLayerData, LayerScore } from '@/types/exposure';
import { DataResolution } from '@/types/resolution';
import { logNormalize, linearNormalize, stepNormalize } from './normalizer';
import { SubComponent, computeLayerCoverage } from './coverage';

/**
 * Air Sub-Score (0–100). Higher = more exposure risk.
 *
 * Sub-components (weights within the layer, sum to 1.00):
 *   currentAqi      0.30 — real-time PM2.5/AQI from OpenAQ or AQS
 *   ozone           0.20 — ozone 8-hr max from AQS annual data
 *   triEmissions    0.30 — TRI air emitters within 3mi from ECHO
 *   nonattainment   0.20 — EPA Green Book nonattainment designation
 *
 * When OpenAQ key is missing: score from nonattainment + TRI only,
 * confidence capped at area.
 *
 * Confidence tiers:
 *   property     — monitor < 5 km
 *   neighborhood — monitor < 15 km
 *   area         — only nonattainment/TRI data (no direct monitoring)
 */

const AIR_SUB_WEIGHTS = {
  currentAqi: 0.30,
  ozone: 0.20,
  triEmissions: 0.30,
  nonattainment: 0.20,
} as const;

const UNAVAILABLE_LAYER: LayerScore = {
  score: 0,
  confidence: 'area',
  available: false,
  coverage: 0,
  subScores: {},
  rawData: {},
};

export function scoreAirLayer(data: AirLayerData): LayerScore {
  const subScores: Record<string, number> = {};
  const activeWeights: Record<string, number> = {};
  const components: SubComponent[] = [];

  let monitorDistKm: number | null = null;

  // ── 1. Current AQI (PM2.5 from OpenAQ or AQS) ───────────────────────
  const pm25 = extractPm25(data);
  if (pm25 !== null) {
    monitorDistKm = data.openaq?.distanceKm ?? null;
    // WHO guideline: 15 µg/m³ annual. EPA NAAQS: 9 µg/m³ annual (2024).
    // Score: 0 at 0, ~50 at 9 (NAAQS), ~75 at 15 (WHO), 100 at 35+.
    const aqiScore = stepNormalize(pm25, [
      { value: 0, score: 0 },
      { value: 5, score: 20 },
      { value: 9, score: 45 },
      { value: 12, score: 60 },
      { value: 15, score: 75 },
      { value: 25, score: 90 },
      { value: 35, score: 100 },
    ]);
    subScores.currentAqi = aqiScore;
    activeWeights.currentAqi = AIR_SUB_WEIGHTS.currentAqi;
    components.push({
      score: aqiScore,
      weight: AIR_SUB_WEIGHTS.currentAqi,
      reason: 'present',
    });
  } else {
    components.push({
      score: null,
      weight: AIR_SUB_WEIGHTS.currentAqi,
      reason: data.openaq === null && data.aqs === null ? 'fetch-failed' : 'out-of-scope',
    });
  }

  // ── 2. Ozone (AQS annual 8-hr max) ──────────────────────────────────
  const ozoneMax = data.aqs?.ozoneMax ?? null;
  if (ozoneMax !== null) {
    // EPA NAAQS 8-hr ozone: 0.070 ppm. Score 0 at 0, ~50 at 0.070, 100 at 0.12+.
    const ozoneScore = stepNormalize(ozoneMax, [
      { value: 0, score: 0 },
      { value: 0.050, score: 25 },
      { value: 0.065, score: 45 },
      { value: 0.070, score: 55 },
      { value: 0.085, score: 75 },
      { value: 0.100, score: 90 },
      { value: 0.120, score: 100 },
    ]);
    subScores.ozone = ozoneScore;
    activeWeights.ozone = AIR_SUB_WEIGHTS.ozone;
    components.push({
      score: ozoneScore,
      weight: AIR_SUB_WEIGHTS.ozone,
      reason: 'present',
    });
  } else {
    components.push({
      score: null,
      weight: AIR_SUB_WEIGHTS.ozone,
      reason: data.aqs === null ? 'fetch-failed' : 'out-of-scope',
    });
  }

  // ── 3. TRI air emitters within search radius ─────────────────────────
  // Count of ECHO facilities with TRI flag — represents industrial
  // air emission sources nearby.
  const triCount = data.triEmitters;
  if (triCount >= 0) {
    const triScore = stepNormalize(triCount, [
      { value: 0, score: 0 },
      { value: 1, score: 15 },
      { value: 3, score: 30 },
      { value: 5, score: 45 },
      { value: 10, score: 65 },
      { value: 20, score: 80 },
      { value: 50, score: 95 },
    ]);
    subScores.triEmissions = triScore;
    activeWeights.triEmissions = AIR_SUB_WEIGHTS.triEmissions;
    components.push({
      score: triScore,
      weight: AIR_SUB_WEIGHTS.triEmissions,
      reason: 'present',
    });
  } else {
    components.push({
      score: null,
      weight: AIR_SUB_WEIGHTS.triEmissions,
      reason: 'fetch-failed',
    });
  }

  // ── 4. Nonattainment status ──────────────────────────────────────────
  if (data.nonattainment !== null) {
    let naScore = 0;
    if (data.nonattainment.isNonattainment) {
      const classification = data.nonattainment.classification.toLowerCase();
      const pollutantCount = data.nonattainment.pollutants.length;

      // Base score from classification severity
      const classScore = stepNormalize(
        classification === 'extreme' ? 5 :
        classification === 'severe' ? 4 :
        classification === 'serious' ? 3 :
        classification === 'moderate' ? 2 :
        classification === 'marginal' ? 1 : 0,
        [
          { value: 0, score: 0 },
          { value: 1, score: 30 },
          { value: 2, score: 50 },
          { value: 3, score: 70 },
          { value: 4, score: 85 },
          { value: 5, score: 95 },
        ]
      );

      // Multi-pollutant boost
      const multiBoost = pollutantCount > 1 ? Math.min(15, (pollutantCount - 1) * 5) : 0;
      naScore = Math.min(100, classScore + multiBoost);
    }

    subScores.nonattainment = naScore;
    activeWeights.nonattainment = AIR_SUB_WEIGHTS.nonattainment;
    components.push({
      score: naScore,
      weight: AIR_SUB_WEIGHTS.nonattainment,
      reason: 'present',
    });
  } else {
    components.push({
      score: null,
      weight: AIR_SUB_WEIGHTS.nonattainment,
      reason: 'fetch-failed',
    });
  }

  // ── Combine ──────────────────────────────────────────────────────────
  const totalWeight = Object.values(activeWeights).reduce((s, w) => s + w, 0);

  if (totalWeight === 0) {
    return UNAVAILABLE_LAYER;
  }

  let airScore = 0;
  for (const [key, weight] of Object.entries(activeWeights)) {
    airScore += (subScores[key] ?? 0) * (weight / totalWeight);
  }

  // Determine confidence from monitor distance
  let confidence: DataResolution = 'area';
  if (monitorDistKm !== null) {
    if (monitorDistKm < 5) confidence = 'property';
    else if (monitorDistKm < 15) confidence = 'neighborhood';
  }

  const coverage = computeLayerCoverage(components);

  return {
    score: Math.round(Math.min(100, Math.max(0, airScore))),
    confidence,
    available: true,
    coverage,
    subScores,
    rawData: {
      pm25: pm25,
      ozoneMax: ozoneMax,
      triEmitters: data.triEmitters,
      nonattainment: data.nonattainment?.isNonattainment ?? null,
      nonattainmentPollutants: data.nonattainment?.pollutants ?? [],
      monitorDistKm,
      weightsUsed: activeWeights,
      coverageBreakdown: components.map((c) => ({
        weight: c.weight,
        reason: c.reason,
      })),
    },
  };
}

function extractPm25(data: AirLayerData): number | null {
  // Prefer OpenAQ (more current) over AQS (annual average)
  if (data.openaq) {
    const pm25Sensor = data.openaq.measurements.find(
      (m) => m.parameter === 'pm25' || m.parameter === 'pm2.5'
    );
    if (pm25Sensor && Number.isFinite(pm25Sensor.value)) {
      return pm25Sensor.value;
    }
  }
  // Fall back to AQS annual mean
  if (data.aqs?.pm25Annual !== null && data.aqs?.pm25Annual !== undefined) {
    return data.aqs.pm25Annual;
  }
  return null;
}
