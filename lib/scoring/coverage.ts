/**
 * Coverage-aware scoring primitives.
 *
 * The core idea: distinguish "present + clean" from "we don't have data
 * here." A sub-component returns a *presence reason* alongside its
 * numeric score. The layer's coverage = weighted-mean presence across its
 * sub-components. The composite's coverage = weighted-mean coverage
 * across its included layers (using the reweighted layer weights).
 *
 * All thresholds live here and are retunable without touching scorer
 * logic. Step 1 picks conservative defaults to expose the data-accuracy
 * gap — they get recalibrated in Step 2 against real multi-source
 * coverage numbers.
 */

// ---------------------------------------------------------------------------
// Threshold tuning
// ---------------------------------------------------------------------------

/**
 * Below this coverage fraction, the composite is flagged as `sufficient:
 * false` and the UI surfaces "Insufficient data" instead of a number.
 * The arithmetic score is still computed (callers may want to show a
 * preview), but no headline number is promised.
 */
export const INSUFFICIENT_COVERAGE_THRESHOLD = 0.35;

/**
 * Below this coverage fraction but at or above the insufficient line,
 * the composite is reported but its confidence is clamped to `'low'`
 * regardless of the per-layer resolution we happen to have. Above this
 * line, confidence follows the usual lowest-layer-resolution rule.
 */
export const LOW_CONFIDENCE_COVERAGE_THRESHOLD = 0.60;

// ---------------------------------------------------------------------------
// Sub-component presence model
// ---------------------------------------------------------------------------

export type PresenceReason =
  | 'present'        // scored normally
  | 'partial'        // data arrived but is thin (e.g. SSURGO 'partial')
  | 'unmapped'       // location outside the source's coverage envelope
  | 'out-of-scope'   // source doesn't cover this kind of address at all
  | 'fetch-failed';  // network / upstream error

/**
 * A single weighted sub-component inside a layer. `score` is optional —
 * a sub-component that we couldn't score at all contributes 0 to the
 * coverage numerator regardless of its weight.
 */
export interface SubComponent {
  /** 0..100 when scored; `null` when `reason` is not 'present' / 'partial'. */
  score: number | null;
  /** Weight of this sub-component *within its layer*. Need not sum to 1. */
  weight: number;
  reason: PresenceReason;
}

/**
 * Presence factor: how much a sub-component counts toward coverage.
 *   present      → 1.0  (fully contributes)
 *   partial      → 0.5  (half credit — data arrived but is thin)
 *   anything else → 0.0 (fetch failed, unmapped, out of scope)
 */
export function presenceFactor(reason: PresenceReason): number {
  switch (reason) {
    case 'present':
      return 1.0;
    case 'partial':
      return 0.5;
    case 'unmapped':
    case 'out-of-scope':
    case 'fetch-failed':
      return 0.0;
  }
}

/**
 * Layer coverage = Σ(weight × presenceFactor) / Σ(weight).
 * Zero total weight → 0 coverage (and the layer should also report
 * `available: false`).
 */
export function computeLayerCoverage(components: SubComponent[]): number {
  const total = components.reduce((s, c) => s + c.weight, 0);
  if (total === 0) return 0;
  const covered = components.reduce(
    (s, c) => s + c.weight * presenceFactor(c.reason),
    0
  );
  return clamp01(covered / total);
}

/**
 * Composite coverage = Σ(layerWeight × layerCoverage) / Σ(layerWeight),
 * where layerWeight is the *already-reweighted* MVP/FULL weight for
 * layers that are actually available.
 *
 * Callers pass the reweighted weight map (sums to 1.0) plus the
 * per-layer coverages they already computed.
 */
export function computeCompositeCoverage(
  layerWeights: Record<string, number>,
  layerCoverages: Record<string, number>
): number {
  const entries = Object.entries(layerWeights);
  const totalWeight = entries.reduce((s, [, w]) => s + w, 0);
  if (totalWeight === 0) return 0;
  let acc = 0;
  for (const [layer, w] of entries) {
    const c = layerCoverages[layer] ?? 0;
    acc += w * c;
  }
  return clamp01(acc / totalWeight);
}

// ---------------------------------------------------------------------------
// Threshold classification
// ---------------------------------------------------------------------------

export type CoverageTier = 'insufficient' | 'low-capped' | 'normal';

export function classifyCoverage(coverage: number): CoverageTier {
  if (coverage < INSUFFICIENT_COVERAGE_THRESHOLD) return 'insufficient';
  if (coverage < LOW_CONFIDENCE_COVERAGE_THRESHOLD) return 'low-capped';
  return 'normal';
}

export function isSufficient(coverage: number): boolean {
  return coverage >= INSUFFICIENT_COVERAGE_THRESHOLD;
}

// ---------------------------------------------------------------------------

function clamp01(x: number): number {
  if (!Number.isFinite(x)) return 0;
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}
