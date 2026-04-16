import { WaterLayerData, LayerScore } from '@/types/exposure';
import { computeViolationStats } from '@/lib/data-sources/epa-sdwis';
import { logNormalize, linearNormalize, stepNormalize } from './normalizer';
import {
  SubComponent,
  computeLayerCoverage,
} from './coverage';

/**
 * Water Sub-Score (0–100)
 *
 * Sub-components (weights within the layer, sum to 1.00):
 *   pfas        0.40 — max individual PFAS concentration (UCMR 5)
 *   lead        0.30 — housing-age-derived service-line exposure (Census)
 *   violations  0.30 — health-based SDWIS violations + active flag
 *
 * Coverage is tracked alongside the score. A sub-component with no data
 * contributes 0 to coverage AND drops its weight from the score's
 * weighted mean — missing data never implicitly counts as "clean 0".
 *
 * Confidence is reported at water-system level (`area`). Once we pull
 * site-specific sources in Step 2 we'll surface `neighborhood` for
 * PWS-served addresses and `property` for private-well monitors.
 */

const WATER_SUB_WEIGHTS = {
  pfas: 0.40,
  lead: 0.30,
  violations: 0.30,
} as const;

export function scoreWaterLayer(data: WaterLayerData): LayerScore {
  const subScores: Record<string, number> = {};
  const activeWeights: Record<string, number> = {};
  const components: SubComponent[] = [];

  // ── 1. PFAS ────────────────────────────────────────────────────────────
  if (data.pfas) {
    // Log normalize: 0 ppt → 0, 4 ppt (MCL) ≈ 50, 50+ ppt → 100.
    const pfasScore = logNormalize(data.pfas.maxIndividual, 50);
    subScores.pfas = pfasScore;
    activeWeights.pfas = WATER_SUB_WEIGHTS.pfas;
    components.push({ score: pfasScore, weight: WATER_SUB_WEIGHTS.pfas, reason: 'present' });
  } else {
    // No UCMR 5 record for this system. In Step 2 we'll replace this with
    // USGS WQP lookups; for now the component is simply missing.
    components.push({ score: null, weight: WATER_SUB_WEIGHTS.pfas, reason: 'fetch-failed' });
  }

  // ── 2. Lead risk ───────────────────────────────────────────────────────
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
    const pre1950Boost = data.leadRisk.pctPreA1950 > 30 ? 10 : 0;
    subScores.lead = Math.min(100, leadScore + pre1950Boost);
    activeWeights.lead = WATER_SUB_WEIGHTS.lead;
    components.push({ score: subScores.lead, weight: WATER_SUB_WEIGHTS.lead, reason: 'present' });
  } else {
    components.push({ score: null, weight: WATER_SUB_WEIGHTS.lead, reason: 'fetch-failed' });
  }

  // ── 3. Violations (SDWIS) ──────────────────────────────────────────────
  //
  // An *empty* violations array is ambiguous today: it could mean "we
  // checked SDWIS and this system is compliant" or "this system isn't
  // in SDWIS at all." Without an out-of-band signal we treat an empty
  // array as a *partial* presence — half credit toward coverage, score
  // of 0. Step 2 threads the actual lookup outcome through.
  const hasSystemId = typeof data.systemId === 'string' && data.systemId.length > 0;
  if (data.violations.length > 0) {
    const stats = computeViolationStats(data.violations);
    const healthScore = stepNormalize(stats.healthBased5yr, [
      { value: 0, score: 0 },
      { value: 1, score: 30 },
      { value: 2, score: 50 },
      { value: 3, score: 65 },
      { value: 5, score: 80 },
      { value: 10, score: 95 },
    ]);
    const activeBoost = stats.activeCount > 0 ? 15 : 0;
    const totalContrib = linearNormalize(stats.last10Years, 0, 20) * 0.2;
    subScores.violations = Math.min(100, Math.round(healthScore + activeBoost + totalContrib));
    activeWeights.violations = WATER_SUB_WEIGHTS.violations;
    components.push({
      score: subScores.violations,
      weight: WATER_SUB_WEIGHTS.violations,
      reason: 'present',
    });
  } else if (hasSystemId) {
    // We know which PWS this address belongs to, but the violations
    // query came back empty. Score 0 and count as *partial* coverage.
    subScores.violations = 0;
    activeWeights.violations = WATER_SUB_WEIGHTS.violations;
    components.push({
      score: 0,
      weight: WATER_SUB_WEIGHTS.violations,
      reason: 'partial',
    });
  } else {
    // No PWS mapping → SDWIS was never queryable for this address.
    components.push({
      score: null,
      weight: WATER_SUB_WEIGHTS.violations,
      reason: 'out-of-scope',
    });
  }

  // ── Combine ────────────────────────────────────────────────────────────
  const totalActiveWeight = Object.values(activeWeights).reduce((s, w) => s + w, 0);

  let waterScore = 0;
  if (totalActiveWeight > 0) {
    for (const [key, weight] of Object.entries(activeWeights)) {
      waterScore += (subScores[key] ?? 0) * (weight / totalActiveWeight);
    }
  }

  const coverage = computeLayerCoverage(components);

  return {
    score: Math.round(waterScore),
    confidence: 'area',
    available: totalActiveWeight > 0,
    coverage,
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
      coverageBreakdown: components.map((c) => ({
        weight: c.weight,
        reason: c.reason,
      })),
    },
  };
}
