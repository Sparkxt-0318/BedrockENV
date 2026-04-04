import { ExposureLayer } from '@/types/exposure';
import { LayerWeights } from './types';

// MVP weights (water + soil only)
export const MVP_WEIGHTS: LayerWeights = {
  water: 0.55,
  soil: 0.45,
};

// Full weights (all five layers)
export const FULL_WEIGHTS: LayerWeights = {
  water: 0.25,
  soil: 0.15,
  air: 0.25,
  proximity: 0.20,
  ej: 0.15,
};

/**
 * Re-weight available layers proportionally when some layers have no data.
 * Ensures weights always sum to 1.0.
 */
export function reweightForAvailableLayers(
  weights: LayerWeights,
  availableLayers: ExposureLayer[]
): Record<string, number> {
  const available = Object.entries(weights).filter(
    ([layer]) => availableLayers.includes(layer as ExposureLayer)
  );

  const totalWeight = available.reduce((sum, [, w]) => sum + (w ?? 0), 0);
  if (totalWeight === 0) return {};

  const reweighted: Record<string, number> = {};
  for (const [layer, weight] of available) {
    reweighted[layer] = (weight ?? 0) / totalWeight;
  }
  return reweighted;
}
