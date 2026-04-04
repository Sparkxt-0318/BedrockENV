import { SoilLayerData, LayerScore } from '@/types/exposure';
import { linearNormalize, stepNormalize } from './normalizer';

/**
 * Soil Sub-Score (0–100)
 *
 * Components:
 * 1. Soil health index (0–100) — from SSURGO: pH, organic matter, drainage
 * 2. Contamination proximity (0–100) — distance to brownfields/industrial sites
 * 3. Flood-contamination risk (0–100) — flood zone × proximity to contamination sources
 * 4. Moisture stress indicator (0–100) — precipitation-based proxy
 *
 * Soil sub-score = weighted average of available components.
 * Confidence: 'neighborhood' (SSURGO map unit level) or 'property' if brownfield proximity dominates
 */

const SOIL_SUB_WEIGHTS = {
  health: 0.30,
  contamination: 0.35,
  floodContamination: 0.25,
  moisture: 0.10,
};

export function scoreSoilLayer(data: SoilLayerData): LayerScore {
  const subScores: Record<string, number> = {};
  const availableWeights: Record<string, number> = {};

  // 1. Soil health score from SSURGO
  if (data.ssurgo) {
    const phScore = scorePh(data.ssurgo.phRange);
    const omScore = scoreOrganicMatter(data.ssurgo.organicMatterPct);
    const drainageScore = scoreDrainage(data.ssurgo.drainageClass);

    // Weighted average of soil health indicators
    subScores.health = Math.round(phScore * 0.35 + omScore * 0.40 + drainageScore * 0.25);
    availableWeights.health = SOIL_SUB_WEIGHTS.health;
  }

  // 2. Contamination proximity from brownfields
  if (data.brownfields) {
    if (data.brownfields.length === 0) {
      subScores.contamination = 0; // No brownfields nearby — good
    } else {
      const nearest = data.brownfields[0];
      // Closer = higher score (more exposure risk)
      // 0.0 miles → 100, 0.5 miles → 70, 1.0 miles → 40, 2.0 miles → 10
      const proximityScore = stepNormalize(
        2 - nearest.distance, // Invert: closer = higher value
        [
          { value: 0, score: 5 },
          { value: 0.5, score: 20 },
          { value: 1.0, score: 40 },
          { value: 1.5, score: 70 },
          { value: 1.8, score: 85 },
          { value: 2.0, score: 100 },
        ]
      );
      // Boost for multiple nearby sites
      const countBoost = Math.min(15, data.brownfields.length * 5);
      subScores.contamination = Math.min(100, proximityScore + countBoost);
    }
    availableWeights.contamination = SOIL_SUB_WEIGHTS.contamination;
  }

  // 3. Flood-contamination compounded risk
  if (data.floodZone) {
    let floodScore = 0;
    if (data.floodZone.isSpecialFloodHazardArea) {
      floodScore = 60; // Base: being in a flood zone is already a concern
      // Compound with contamination proximity
      if (data.brownfields && data.brownfields.length > 0) {
        const nearest = data.brownfields[0];
        if (nearest.distance < 0.5) floodScore = 100;
        else if (nearest.distance < 1.0) floodScore = 85;
        else if (nearest.distance < 2.0) floodScore = 70;
      }
    } else if (data.floodZone.riskLevel === 'MODERATE') {
      floodScore = 25;
      if (data.brownfields && data.brownfields.length > 0 && data.brownfields[0].distance < 1.0) {
        floodScore = 50;
      }
    }
    subScores.floodContamination = floodScore;
    availableWeights.floodContamination = SOIL_SUB_WEIGHTS.floodContamination;
  }

  // 4. Moisture stress from NASA POWER
  if (data.moistureData) {
    // Very high or very low moisture can indicate problems
    const moisture = data.moistureData.surfaceMoisture;
    let moistureScore: number;
    if (moisture < 20) {
      // Very dry — soil degradation risk
      moistureScore = linearNormalize(20 - moisture, 0, 20);
    } else if (moisture > 80) {
      // Very wet — waterlogging, contamination mobilization
      moistureScore = linearNormalize(moisture - 80, 0, 20);
    } else {
      // Moderate — healthy range
      moistureScore = 0;
    }
    // Trend factor
    if (data.moistureData.trend === 'decreasing') moistureScore = Math.min(100, moistureScore + 10);
    subScores.moisture = moistureScore;
    availableWeights.moisture = SOIL_SUB_WEIGHTS.moisture;
  }

  // Compute weighted average
  const totalWeight = Object.values(availableWeights).reduce((s, w) => s + w, 0);
  let soilScore = 0;
  if (totalWeight > 0) {
    for (const [key, weight] of Object.entries(availableWeights)) {
      soilScore += (subScores[key] ?? 0) * (weight / totalWeight);
    }
  }

  // Determine confidence: property-level if brownfield proximity is the main signal,
  // otherwise neighborhood-level (SSURGO)
  const hasBrownfieldData = (subScores.contamination ?? 0) > 30;
  const confidence = hasBrownfieldData ? 'property' as const : 'neighborhood' as const;

  return {
    score: Math.round(soilScore),
    confidence,
    available: totalWeight > 0,
    subScores,
    rawData: {
      soilTexture: data.ssurgo?.dominantTexture ?? null,
      soilPh: data.ssurgo?.phRange ?? null,
      organicMatterPct: data.ssurgo?.organicMatterPct ?? null,
      drainageClass: data.ssurgo?.drainageClass ?? null,
      brownfieldCount: data.brownfields?.length ?? 0,
      nearestBrownfieldMiles: data.brownfields?.[0]?.distance ?? null,
      floodZone: data.floodZone?.zone ?? null,
      isFloodHazardArea: data.floodZone?.isSpecialFloodHazardArea ?? false,
      precipitationAvgMm: data.moistureData?.precipitationAvgMm ?? null,
    },
  };
}

/** pH deviation from optimal (6.0–7.0) → score 0–100 */
function scorePh(phRange: [number, number]): number {
  if (phRange[0] === 0 && phRange[1] === 0) return 0;
  const avgPh = (phRange[0] + phRange[1]) / 2;
  if (avgPh >= 6.0 && avgPh <= 7.0) return 0;
  if (avgPh >= 5.5 && avgPh <= 7.5) return 25;
  if (avgPh >= 5.0 && avgPh <= 8.0) return 50;
  return 75; // Extreme pH
}

/** Organic matter % → score 0–100 (low OM = high score = bad) */
function scoreOrganicMatter(omPct: number): number {
  if (omPct <= 0) return 0; // No data
  return stepNormalize(
    5 - omPct, // Invert: low OM = higher value
    [
      { value: 0, score: 0 },   // OM >= 5% (excellent)
      { value: 1, score: 15 },  // OM ~4%
      { value: 2, score: 30 },  // OM ~3%
      { value: 3, score: 55 },  // OM ~2%
      { value: 4, score: 80 },  // OM ~1%
      { value: 4.5, score: 95 },// OM ~0.5%
    ]
  );
}

/** Drainage class → score 0–100 */
function scoreDrainage(drainageClass: string): number {
  const dc = drainageClass.toLowerCase();
  if (dc.includes('well') && !dc.includes('poorly')) return 0;
  if (dc.includes('moderately well')) return 10;
  if (dc.includes('somewhat poorly')) return 40;
  if (dc.includes('poorly')) return 65;
  if (dc.includes('very poorly')) return 85;
  return 20; // Default moderate
}
