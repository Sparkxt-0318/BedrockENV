/**
 * Compound Flood-Contamination Index (CFCI) scorer.
 *
 * CFCI = normalize(FloodExposureScore × CPI) where:
 *   FloodExposureScore = FER × 100  (FER = fraction of residential structures in SFHA)
 *   CPI                = Contamination Pressure Index (from SCVI dataset, 0-100)
 *
 * Multiplication is deliberate — both factors must be present for high CFCI.
 * A county with heavy flooding but no contamination (e.g., rural coastal LA)
 * scores low, as does a county with heavy contamination but no flood exposure
 * (e.g., inland industrial interior). The compound risk is the intersection:
 * flood water mobilizing soil contaminants, brownfields, Superfund sediment,
 * and TRI release residuals.
 *
 * Source for flood exposure: FEMA NFIP Residential Penetration Rates
 *   (derived from NFHL — the same authoritative flood maps used per-property)
 * Source for contamination pressure: SCVI dataset CPI sub-score
 */

export interface CfciInputs {
  fer: number;
  cpi: number;
}

export interface CfciResult {
  cfci: number;
  floodExposureScore: number;
  cpi: number;
  cfciQuartile: 1 | 2 | 3 | 4;
  classification: CfciClassification;
}

export type CfciClassification =
  | 'Low'
  | 'Elevated'
  | 'High'
  | 'Severe';

export function computeCfci(inputs: CfciInputs): Omit<CfciResult, 'cfciQuartile'> {
  const fer = Number.isFinite(inputs.fer) ? Math.max(0, Math.min(1, inputs.fer)) : 0;
  const cpi = Number.isFinite(inputs.cpi) ? Math.max(0, Math.min(100, inputs.cpi)) : 0;
  const floodExposureScore = Math.round(fer * 100);
  const cfci = Math.round(Math.sqrt(floodExposureScore * cpi));

  return {
    cfci,
    floodExposureScore,
    cpi,
    classification: classifyCfci(cfci),
  };
}

export function classifyCfci(cfci: number): CfciClassification {
  if (cfci >= 50) return 'Severe';
  if (cfci >= 30) return 'High';
  if (cfci >= 15) return 'Elevated';
  return 'Low';
}

export function assignCfciQuartiles(records: { cfci: number }[]): (1 | 2 | 3 | 4)[] {
  const sorted = records.map((r, i) => ({ cfci: r.cfci, index: i }));
  sorted.sort((a, b) => a.cfci - b.cfci);

  const quartiles = new Array<1 | 2 | 3 | 4>(records.length);
  const n = sorted.length;
  for (let i = 0; i < n; i++) {
    const pct = i / n;
    let q: 1 | 2 | 3 | 4;
    if (pct < 0.25) q = 1;
    else if (pct < 0.5) q = 2;
    else if (pct < 0.75) q = 3;
    else q = 4;
    quartiles[sorted[i].index] = q;
  }
  return quartiles;
}
