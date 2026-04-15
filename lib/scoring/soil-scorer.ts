import { SoilLayerData, LayerScore, BrownfieldSite, FloodZoneData } from '@/types/exposure';
import { DataResolution } from '@/types/resolution';

/**
 * Soil Sub-Score (0–100). Higher = more exposure risk.
 *
 * Sub-components (default weights):
 *   1. health              0.30  — SSURGO pH + organic matter + drainage
 *   2. contamination       0.35  — distance-weighted EPA brownfield proximity
 *   3. floodContamination  0.25  — novel compound risk: SFHA × brownfield density
 *   4. climateStress       0.10  — NASA POWER aridity + precipitation trend
 *
 * Graceful degradation: missing/unmapped inputs drop their sub-component
 * and the remaining weights are re-normalized. Missing data never counts
 * against the user.
 *
 * Confidence resolution:
 *   - 'neighborhood'  — SSURGO coverage == 'mapped' or 'partial'
 *   - 'area'          — only coarse-grained sources (NASA POWER, unmapped
 *                       SSURGO/NFHL)
 */

const SOIL_SUB_WEIGHTS = {
  health: 0.30,
  contamination: 0.35,
  floodContamination: 0.25,
  climateStress: 0.10,
} as const;

const UNAVAILABLE_LAYER: LayerScore = {
  score: 0,
  confidence: 'area',
  available: false,
  subScores: {},
  rawData: {},
};

export function scoreSoilLayer(data: SoilLayerData): LayerScore {
  const subScores: Record<string, number> = {};
  const activeWeights: Record<string, number> = {};

  // ── 1. Soil health (SSURGO pH + OM + drainage) ────────────────────────────
  //
  // Only score health when SSURGO has real chemistry data. Unmapped points
  // and fetch failures drop this component and re-weight the rest.
  const ssurgoUsable =
    data.ssurgo != null && data.ssurgo.coverage !== 'unmapped';

  if (ssurgoUsable && data.ssurgo) {
    const phScore = scorePh(data.ssurgo.phRange);
    const omScore = scoreOrganicMatter(data.ssurgo.organicMatterPct);
    const drainageScore = scoreDrainage(data.ssurgo.drainageClass);
    subScores.health = Math.round(
      phScore * 0.35 + omScore * 0.40 + drainageScore * 0.25
    );
    activeWeights.health = SOIL_SUB_WEIGHTS.health;
  }

  // ── 2. Contamination proximity (EPA brownfields) ──────────────────────────
  //
  // `brownfields == null` means the client failed — drop this sub-score.
  // An empty array means the client succeeded with no hits — that's a
  // positive signal (contamination = 0).
  if (data.brownfields != null) {
    subScores.contamination = scoreBrownfieldProximity(data.brownfields);
    activeWeights.contamination = SOIL_SUB_WEIGHTS.contamination;
  }

  // ── 3. Flood-contamination compound (SFHA × brownfield density) ───────────
  //
  // Novel sub-component: flooding mobilizes soil contaminants, so co-occurrence
  // of SFHA and nearby brownfields warrants a penalty strictly larger than the
  // sum of either in isolation.
  //
  // Requires BOTH a mapped flood zone AND the brownfield query to have
  // resolved (even if empty). Otherwise drop & re-weight.
  const floodUsable = isFloodZoneUsable(data.floodZone);
  if (floodUsable && data.brownfields != null && data.floodZone) {
    subScores.floodContamination = scoreFloodContaminationCompound(
      data.floodZone,
      data.brownfields
    );
    activeWeights.floodContamination = SOIL_SUB_WEIGHTS.floodContamination;
  }

  // ── 4. Climate stress (NASA POWER aridity index + trend) ──────────────────
  if (data.moistureData) {
    subScores.climateStress = scoreClimateStress(data.moistureData);
    activeWeights.climateStress = SOIL_SUB_WEIGHTS.climateStress;
  }

  // ── Combine ───────────────────────────────────────────────────────────────
  const totalWeight = Object.values(activeWeights).reduce((s, w) => s + w, 0);

  if (totalWeight === 0) {
    // Every upstream client returned null/unmapped — caller must re-weight
    // this layer out of the composite.
    return UNAVAILABLE_LAYER;
  }

  let soilScore = 0;
  for (const [key, weight] of Object.entries(activeWeights)) {
    soilScore += (subScores[key] ?? 0) * (weight / totalWeight);
  }

  const confidence: DataResolution = ssurgoUsable ? 'neighborhood' : 'area';

  return {
    score: Math.round(clamp(soilScore, 0, 100)),
    confidence,
    available: true,
    subScores,
    rawData: {
      ssurgoCoverage: data.ssurgo?.coverage ?? 'unavailable',
      soilTexture: data.ssurgo?.dominantTexture ?? null,
      soilPh: data.ssurgo?.phRange ?? null,
      organicMatterPct: data.ssurgo?.organicMatterPct ?? null,
      drainageClass: data.ssurgo?.drainageClass ?? null,
      brownfieldCount: data.brownfields?.length ?? 0,
      nearestBrownfieldMiles: data.brownfields?.[0]?.distance ?? null,
      floodZone: data.floodZone?.zone ?? null,
      floodCoverage: data.floodZone?.coverage ?? 'unavailable',
      isFloodHazardArea: data.floodZone?.isSpecialFloodHazardArea ?? false,
      aridityIndex: data.moistureData?.aridityIndex ?? null,
      precipitationAvgMm: data.moistureData?.precipitationAvgMm ?? null,
      weightsUsed: activeWeights,
    },
  };
}

// ── helpers ─────────────────────────────────────────────────────────────────

function isFloodZoneUsable(fz: FloodZoneData | null): fz is FloodZoneData {
  return fz != null && fz.coverage !== 'unmapped';
}

/**
 * Distance-weighted proximity score.
 *
 * Each site contributes `1 / (0.25 + distance_mi)` — the 0.25 floor keeps
 * on-property sites from exploding to infinity. The total is mapped through
 * a soft ceiling so a single very-close site and many distant sites both
 * score meaningfully.
 *
 * - 0 sites → 0  (clean)
 * - 1 site @ 1.0 mi → ~40
 * - 1 site @ 0.25 mi → ~80
 * - 3 sites @ 0.3/0.5/0.8 mi → ~85
 */
function scoreBrownfieldProximity(sites: BrownfieldSite[]): number {
  if (sites.length === 0) return 0;

  let weightSum = 0;
  for (const s of sites) {
    // Skip garbage distances defensively.
    if (!Number.isFinite(s.distance) || s.distance < 0) continue;
    weightSum += 1 / (0.25 + s.distance);
  }

  // weightSum range roughly: 0.4 (single far site) .. 4+ (multiple very close)
  // Map via saturation curve so it lands in 0..100.
  const saturated = 100 * (1 - Math.exp(-weightSum / 1.5));
  return Math.round(clamp(saturated, 0, 100));
}

/**
 * Flood-contamination compound risk.
 *
 * Must score strictly higher than the max of (flood-only, contamination-only)
 * when both are present — that's the whole point of the sub-component and
 * it's asserted by the unit tests.
 *
 * Construction:
 *   base      = flood-only penalty (SFHA vs moderate vs low)
 *   proximity = contamination proximity 0..100 from the same sites
 *   compound  = base + (proximity * multiplier)
 * where `multiplier` is positive iff flooding actually intersects the parcel
 * AND there's at least one brownfield within 2 miles.
 */
function scoreFloodContaminationCompound(
  fz: FloodZoneData,
  sites: BrownfieldSite[]
): number {
  const sfha = fz.isSpecialFloodHazardArea;
  const moderate = fz.riskLevel === 'MODERATE';

  let base = 0;
  if (sfha) base = 55;
  else if (moderate) base = 20;

  const proximity = scoreBrownfieldProximity(sites);
  const nearestMiles = sites[0]?.distance ?? Infinity;

  // Amplifier: only fires when the flood polygon ALSO contains (or nearly
  // contains) contamination sources. The nearer the site, the bigger the
  // compound effect.
  let amplifier = 0;
  if (sfha && Number.isFinite(nearestMiles)) {
    if (nearestMiles < 0.5) amplifier = 0.60;
    else if (nearestMiles < 1.0) amplifier = 0.45;
    else if (nearestMiles < 2.0) amplifier = 0.30;
  } else if (moderate && nearestMiles < 1.0) {
    amplifier = 0.25;
  }

  const compound = base + proximity * amplifier;
  return Math.round(clamp(compound, 0, 100));
}

/**
 * Climate stress from NASA POWER.
 *
 * De Martonne aridity index is the dominant signal. < 20 (semi-arid) climbs
 * toward 100; > 28 (very humid) is neutral. A decreasing precipitation trend
 * adds a small penalty.
 */
function scoreClimateStress(
  moisture: NonNullable<SoilLayerData['moistureData']>
): number {
  let stress = 0;

  const ai = moisture.aridityIndex;
  if (ai != null && Number.isFinite(ai)) {
    if (ai < 10) stress = 85;
    else if (ai < 20) stress = 55;
    else if (ai < 24) stress = 30;
    else if (ai < 28) stress = 10;
    else stress = 0;
  }

  if (moisture.trend === 'decreasing') stress = Math.min(100, stress + 10);

  return Math.round(clamp(stress, 0, 100));
}

function clamp(x: number, lo: number, hi: number): number {
  if (x < lo) return lo;
  if (x > hi) return hi;
  return x;
}

/** pH deviation from optimal (6.0–7.0) → score 0–100 */
function scorePh(phRange: [number, number]): number {
  if (phRange[0] === 0 && phRange[1] === 0) return 0;
  const avgPh = (phRange[0] + phRange[1]) / 2;
  if (avgPh >= 6.0 && avgPh <= 7.0) return 0;
  if (avgPh >= 5.5 && avgPh <= 7.5) return 25;
  if (avgPh >= 5.0 && avgPh <= 8.0) return 50;
  return 75;
}

/** Organic matter % → score 0–100 (low OM = high score = bad) */
function scoreOrganicMatter(omPct: number): number {
  if (omPct <= 0) return 0;
  if (omPct >= 5) return 0;
  if (omPct >= 4) return 15;
  if (omPct >= 3) return 30;
  if (omPct >= 2) return 55;
  if (omPct >= 1) return 80;
  return 95;
}

/** Drainage class → score 0–100 */
function scoreDrainage(drainageClass: string): number {
  const dc = drainageClass.toLowerCase();
  if (dc.includes('very poorly')) return 85;
  if (dc.includes('poorly') && !dc.includes('somewhat')) return 65;
  if (dc.includes('somewhat poorly')) return 40;
  if (dc.includes('moderately well')) return 10;
  if (dc.includes('well')) return 0;
  return 20;
}
