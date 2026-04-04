import { WaterLayerData, LayerScore } from '@/types/exposure';
import { computeViolationStats } from '@/lib/data-sources/epa-sdwis';
import { logNormalize, linearNormalize, stepNormalize } from './normalizer';

/**
 * Water Sub-Score (0–100)
 *
 * Components:
 * 1. PFAS score (0–100) — log-scale based on max individual PFAS concentration
 * 2. Lead risk score (0–100) — based on housing age percentages
 * 3. Violation score (0–100) — count + severity weighted
 *
 * Water sub-score = weighted average of available components.
 * Confidence: 'area' (water system level data)
 */

const WATER_SUB_WEIGHTS = {
  pfas: 0.40,
  lead: 0.30,
  violations: 0.30,
};

export function scoreWaterLayer(data: WaterLayerData): LayerScore {
  const subScores: Record<string, number> = {};
  const availableWeights: Record<string, number> = {};

  // 1. PFAS score
  if (data.pfas) {
    // Log normalize: 0 ppt = 0, 4 ppt (MCL) ≈ 50, 20 ppt ≈ 80, 50+ ppt → 100
    const pfasScore = logNormalize(data.pfas.maxIndividual, 50);
    subScores.pfas = pfasScore;
    availableWeights.pfas = WATER_SUB_WEIGHTS.pfas;
  }

  // 2. Lead risk score
  if (data.leadRisk) {
    const leadScore = stepNormalize(data.leadRisk.pctPre1986, [
      { value: 0, score: 0 },
      { value: 10, score: 15 },
      { value: 25, score: 35 },
      { value: 40, score: 55 },
      { value: 50, score: 70 },
      { value: 70, score: 85 },
      { value: 85, score: 95 },
    ]);
    // Boost if lots of pre-1950 housing
    const pre1950Boost = data.leadRisk.pctPreA1950 > 30 ? 10 : 0;
    subScores.lead = Math.min(100, leadScore + pre1950Boost);
    availableWeights.lead = WATER_SUB_WEIGHTS.lead;
  }

  // 3. Violation score
  if (data.violations.length > 0) {
    const stats = computeViolationStats(data.violations);
    // Health-based violations in last 5 years are the most important signal
    const healthScore = stepNormalize(stats.healthBased5yr, [
      { value: 0, score: 0 },
      { value: 1, score: 30 },
      { value: 2, score: 50 },
      { value: 3, score: 65 },
      { value: 5, score: 80 },
      { value: 10, score: 95 },
    ]);
    // Active violations boost
    const activeBoost = stats.activeCount > 0 ? 15 : 0;
    // Total count adds smaller contribution
    const totalContrib = linearNormalize(stats.last10Years, 0, 20) * 0.2;

    subScores.violations = Math.min(100, Math.round(healthScore + activeBoost + totalContrib));
    availableWeights.violations = WATER_SUB_WEIGHTS.violations;
  } else {
    // No violations found — this is a positive signal (score 0)
    subScores.violations = 0;
    availableWeights.violations = WATER_SUB_WEIGHTS.violations;
  }

  // Compute weighted average with available components
  const totalWeight = Object.values(availableWeights).reduce((s, w) => s + w, 0);

  let waterScore = 0;
  if (totalWeight > 0) {
    for (const [key, weight] of Object.entries(availableWeights)) {
      waterScore += (subScores[key] ?? 0) * (weight / totalWeight);
    }
  }

  return {
    score: Math.round(waterScore),
    confidence: 'area', // Water system level
    available: totalWeight > 0,
    subScores,
    rawData: {
      pfasMaxPpt: data.pfas?.maxIndividual ?? null,
      pfasExceedsMcl: data.pfas?.exceedsMcl ?? null,
      pfasAnalyteCount: data.pfas?.analytes.length ?? 0,
      violationCount: data.violations.length,
      leadPctPre1986: data.leadRisk?.pctPre1986 ?? null,
      leadPctPre1950: data.leadRisk?.pctPreA1950 ?? null,
      waterSystemId: data.systemId,
      waterSystemName: data.systemName,
    },
  };
}
