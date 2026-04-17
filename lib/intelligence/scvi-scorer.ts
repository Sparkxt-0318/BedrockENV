/**
 * Soil Contamination Vulnerability Index (SCVI) scorer.
 *
 * SCVI = normalize(SVS × CPI) where:
 *   SVS = Soil Vulnerability Sub-index (how easily contaminants move)
 *   CPI = Contamination Pressure Index (how much pressure exists nearby)
 *
 * Multiplication is deliberate — both factors must be present for high SCVI.
 */

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

export interface SoilVulnerabilityInputs {
  organicMatterPct: number | null;
  ph: number | null;
  drainageClass: string | null;
  clayPct: number | null;
  sandPct: number | null;
  ksat: number | null;
  hydrologicSoilGroup: string | null;
  meanAnnualPrecipMm: number | null;
  aridityIndex: number | null;
  ndviAnomaly: number | null;
  isUrbanLandMapUnit: boolean;
}

export interface ContaminationPressureInputs {
  brownfieldCount: number;
  brownfieldNearestMiles: number | null;
  superfundCount: number;
  superfundNearestMiles: number | null;
  echoFacilityCount: number;
  echoSncCount: number;
  triFacilityCount: number;
  triTotalReleasesLbs: number;
  countyAreaSqMi: number;
}

export type UsdaSviClass = 'Low' | 'Moderate' | 'Moderately High' | 'High';

export interface ScviResult {
  scvi: number;
  svs: number;
  cpi: number;
  scviQuartile: 1 | 2 | 3 | 4;
  usdaSviClass: UsdaSviClass;

  svsComponents: {
    organicMatter: number;
    ph: number;
    drainage: number;
    texture: number;
    climate: number;
    urbanGap: number;
  };

  cpiComponents: {
    legacy: number;
    industrial: number;
    compliance: number;
    release: number;
  };

  coverage: {
    svsDataPoints: number;
    svsMaxDataPoints: number;
    cpiDataPoints: number;
    cpiMaxDataPoints: number;
  };
}

// ---------------------------------------------------------------------------
// SVS component scorers
// ---------------------------------------------------------------------------

const SVS_WEIGHTS = {
  organicMatter: 0.25,
  ph: 0.20,
  drainage: 0.25,
  texture: 0.15,
  climate: 0.10,
  urbanGap: 0.05,
} as const;

export function scoreOrganicMatter(omPct: number | null): number | null {
  if (omPct === null || omPct === undefined) return null;
  if (omPct >= 3.0) return 10;
  if (omPct >= 2.0) return 30;
  if (omPct >= 1.0) return 60;
  return 90;
}

export function scorePh(ph: number | null): number | null {
  if (ph === null || ph === undefined) return null;
  if (ph >= 6.0 && ph <= 7.0) return 10;
  if ((ph >= 5.5 && ph < 6.0) || (ph > 7.0 && ph <= 7.5)) return 30;
  if ((ph >= 5.0 && ph < 5.5) || (ph > 7.5 && ph <= 8.0)) return 60;
  return 90;
}

export function scoreDrainage(drainageClass: string | null): number | null {
  if (!drainageClass) return null;
  const normalized = drainageClass.toLowerCase().trim();
  if (normalized === 'well drained') return 10;
  if (normalized === 'moderately well drained') return 20;
  if (normalized.startsWith('somewhat excessively')) return 50;
  if (normalized === 'somewhat poorly drained') return 50;
  if (normalized === 'poorly drained') return 70;
  if (normalized === 'excessively drained') return 75;
  if (normalized === 'very poorly drained') return 85;
  return 40;
}

export function scoreTexture(sandPct: number | null, clayPct: number | null, ksat: number | null): number | null {
  if (sandPct !== null) {
    if (sandPct > 70) return 80;
    if (clayPct !== null && clayPct > 50) return 50;
    return 20;
  }
  if (clayPct !== null) {
    if (clayPct > 50) return 50;
    return 20;
  }
  if (ksat !== null) {
    if (ksat > 100) return 70;
    if (ksat < 1) return 45;
    return 25;
  }
  return null;
}

export function scoreClimate(precipMm: number | null, aridityIndex: number | null): number | null {
  if (precipMm === null && aridityIndex === null) return null;
  let score = 40;
  if (precipMm !== null) {
    if (precipMm > 1400) score = 70;
    else if (precipMm > 900) score = 40;
    else score = 20;
  }
  if (aridityIndex !== null && aridityIndex < 0.3) {
    score = Math.max(score, 60);
  }
  return score;
}

export function scoreUrbanGap(isUrban: boolean, ndviAnomaly: number | null): number {
  if (!isUrban) return 0;
  if (ndviAnomaly !== null && ndviAnomaly < -0.15) return 80;
  return 50;
}

// ---------------------------------------------------------------------------
// SVS composite
// ---------------------------------------------------------------------------

export function computeSvs(inputs: SoilVulnerabilityInputs): { svs: number; components: ScviResult['svsComponents']; dataPoints: number } {
  const scores = {
    organicMatter: scoreOrganicMatter(inputs.organicMatterPct),
    ph: scorePh(inputs.ph),
    drainage: scoreDrainage(inputs.drainageClass),
    texture: scoreTexture(inputs.sandPct, inputs.clayPct, inputs.ksat),
    climate: scoreClimate(inputs.meanAnnualPrecipMm, inputs.aridityIndex),
    urbanGap: scoreUrbanGap(inputs.isUrbanLandMapUnit, inputs.ndviAnomaly),
  };

  let totalWeight = 0;
  let weightedSum = 0;
  let dataPoints = 0;

  for (const [key, score] of Object.entries(scores)) {
    const weight = SVS_WEIGHTS[key as keyof typeof SVS_WEIGHTS];
    if (score !== null) {
      weightedSum += score * weight;
      totalWeight += weight;
      if (key !== 'urbanGap') dataPoints++;
    }
  }

  // urbanGap always contributes when urban
  if (inputs.isUrbanLandMapUnit) dataPoints++;

  const svs = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;

  return {
    svs,
    components: {
      organicMatter: scores.organicMatter ?? 0,
      ph: scores.ph ?? 0,
      drainage: scores.drainage ?? 0,
      texture: scores.texture ?? 0,
      climate: scores.climate ?? 0,
      urbanGap: scores.urbanGap,
    },
    dataPoints,
  };
}

// ---------------------------------------------------------------------------
// CPI component scorers
// ---------------------------------------------------------------------------

const CPI_WEIGHTS = {
  legacy: 0.35,
  industrial: 0.35,
  compliance: 0.15,
  release: 0.15,
} as const;

export function scoreLegacy(
  superfundCount: number,
  superfundNearestMiles: number | null,
  brownfieldCount: number,
  brownfieldNearestMiles: number | null,
): number {
  if (superfundCount > 0 && superfundNearestMiles !== null && superfundNearestMiles < 1) return 95;
  if (superfundCount > 0 && superfundNearestMiles !== null && superfundNearestMiles < 3) return 75;
  if (superfundCount > 0) return 65;
  if (brownfieldCount > 5) return 70;
  if (brownfieldCount > 0) return 40;
  return 0;
}

export function scoreIndustrialDensity(
  echoCount: number,
  triCount: number,
  areaSqMi: number,
): number {
  if (areaSqMi <= 0) return 0;
  const density = (echoCount + triCount) / areaSqMi;
  if (density > 10) return 90;
  if (density > 5) return 70;
  if (density > 1) return 50;
  if (density > 0.1) return 30;
  return 0;
}

export function scoreCompliance(sncCount: number): number {
  if (sncCount > 5) return 90;
  if (sncCount > 0) return 60;
  return 10;
}

export function scoreRelease(totalReleasesLbs: number): number {
  if (totalReleasesLbs > 1_000_000) return 95;
  if (totalReleasesLbs > 100_000) return 70;
  if (totalReleasesLbs > 10_000) return 45;
  if (totalReleasesLbs > 0) return 20;
  return 0;
}

// ---------------------------------------------------------------------------
// CPI composite
// ---------------------------------------------------------------------------

export function computeCpi(inputs: ContaminationPressureInputs): { cpi: number; components: ScviResult['cpiComponents']; dataPoints: number } {
  const legacy = scoreLegacy(
    inputs.superfundCount,
    inputs.superfundNearestMiles,
    inputs.brownfieldCount,
    inputs.brownfieldNearestMiles,
  );
  const industrial = scoreIndustrialDensity(
    inputs.echoFacilityCount,
    inputs.triFacilityCount,
    inputs.countyAreaSqMi,
  );
  const compliance = scoreCompliance(inputs.echoSncCount);
  const release = scoreRelease(inputs.triTotalReleasesLbs);

  const cpi = Math.round(
    legacy * CPI_WEIGHTS.legacy +
    industrial * CPI_WEIGHTS.industrial +
    compliance * CPI_WEIGHTS.compliance +
    release * CPI_WEIGHTS.release
  );

  let dataPoints = 0;
  if (inputs.brownfieldCount > 0 || inputs.superfundCount > 0) dataPoints++;
  if (inputs.echoFacilityCount > 0 || inputs.triFacilityCount > 0) dataPoints++;
  if (inputs.echoSncCount >= 0) dataPoints++;
  if (inputs.triTotalReleasesLbs >= 0) dataPoints++;

  return { cpi, components: { legacy, industrial, compliance, release }, dataPoints };
}

// ---------------------------------------------------------------------------
// USDA SVI classification (simplified county-level)
// ---------------------------------------------------------------------------

export function computeUsdaSviClass(
  hydrologicGroup: string | null,
  organicCarbonPct: number | null,
): UsdaSviClass {
  // Organic carbon approximated as OM% / 1.72 (Van Bemmelen factor)
  const oc = organicCarbonPct ?? (null as number | null);

  const groupRisk = (() => {
    if (!hydrologicGroup) return 2;
    const g = hydrologicGroup.toUpperCase().trim();
    if (g === 'A') return 1;
    if (g === 'B' || g === 'A/D') return 2;
    if (g === 'C' || g === 'B/D') return 3;
    if (g === 'D' || g === 'C/D') return 4;
    return 2;
  })();

  const ocRisk = (() => {
    if (oc === null) return 2;
    if (oc >= 2.0) return 1;
    if (oc >= 1.0) return 2;
    if (oc >= 0.5) return 3;
    return 4;
  })();

  const combined = (groupRisk + ocRisk) / 2;
  if (combined <= 1.5) return 'Low';
  if (combined <= 2.5) return 'Moderate';
  if (combined <= 3.5) return 'Moderately High';
  return 'High';
}

// ---------------------------------------------------------------------------
// SCVI composite
// ---------------------------------------------------------------------------

export function computeScvi(
  svsInputs: SoilVulnerabilityInputs,
  cpiInputs: ContaminationPressureInputs,
): ScviResult {
  const svsResult = computeSvs(svsInputs);
  const cpiResult = computeCpi(cpiInputs);

  // SCVI = normalize(SVS × CPI) to 0-100
  // SVS and CPI are each 0-100, so product is 0-10000
  const rawProduct = svsResult.svs * cpiResult.cpi;
  const scvi = Math.round(Math.sqrt(rawProduct));
  // sqrt maps 0-10000 to 0-100 while preserving the multiplicative interaction

  const organicCarbonPct = svsInputs.organicMatterPct !== null
    ? svsInputs.organicMatterPct / 1.72
    : null;

  const usdaSviClass = computeUsdaSviClass(
    svsInputs.hydrologicSoilGroup,
    organicCarbonPct,
  );

  return {
    scvi,
    svs: svsResult.svs,
    cpi: cpiResult.cpi,
    scviQuartile: 1, // assigned during batch processing
    usdaSviClass,
    svsComponents: svsResult.components,
    cpiComponents: cpiResult.components,
    coverage: {
      svsDataPoints: svsResult.dataPoints,
      svsMaxDataPoints: 6,
      cpiDataPoints: cpiResult.dataPoints,
      cpiMaxDataPoints: 4,
    },
  };
}

// ---------------------------------------------------------------------------
// Quartile assignment (post-batch)
// ---------------------------------------------------------------------------

export function assignQuartiles(records: { scvi: number }[]): (1 | 2 | 3 | 4)[] {
  const sorted = [...records].map((r, i) => ({ scvi: r.scvi, index: i }));
  sorted.sort((a, b) => a.scvi - b.scvi);

  const quartiles = new Array<1 | 2 | 3 | 4>(records.length);
  const n = sorted.length;
  for (let i = 0; i < n; i++) {
    const pct = i / n;
    let q: 1 | 2 | 3 | 4;
    if (pct < 0.25) q = 1;
    else if (pct < 0.50) q = 2;
    else if (pct < 0.75) q = 3;
    else q = 4;
    quartiles[sorted[i].index] = q;
  }
  return quartiles;
}
