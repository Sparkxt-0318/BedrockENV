/**
 * Normalize a raw value to a 0–100 score using a specified method.
 */

/**
 * Linear normalization: value → 0–100 between min and max.
 * Values below min → 0, above max → 100.
 */
export function linearNormalize(
  value: number,
  min: number,
  max: number
): number {
  if (max === min) return value >= max ? 100 : 0;
  const clamped = Math.max(min, Math.min(max, value));
  return Math.round(((clamped - min) / (max - min)) * 100);
}

/**
 * Log-scale normalization: better for values with wide ranges (e.g., PFAS ppt).
 * 0 → 0, thresholdLow → ~30, thresholdHigh → ~70, max → 100.
 */
export function logNormalize(
  value: number,
  max: number
): number {
  if (value <= 0) return 0;
  if (value >= max) return 100;
  // log1p handles value=0 gracefully
  return Math.round((Math.log1p(value) / Math.log1p(max)) * 100);
}

/**
 * Step normalization: maps value to discrete risk tiers.
 * Returns a score in defined bands.
 */
export function stepNormalize(
  value: number,
  thresholds: { value: number; score: number }[]
): number {
  // thresholds should be sorted ascending by value
  let result = 0;
  for (const t of thresholds) {
    if (value >= t.value) {
      result = t.score;
    } else {
      break;
    }
  }
  return result;
}
