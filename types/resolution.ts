export type DataResolution = 'property' | 'neighborhood' | 'area';

export interface ResolutionInfo {
  resolution: DataResolution;
  source: string;
  description: string;
  lastUpdated?: string;
}

export function getResolutionLabel(resolution: DataResolution): string {
  switch (resolution) {
    case 'property':
      return 'Property-level';
    case 'neighborhood':
      return 'Neighborhood-level';
    case 'area':
      return 'Area-level';
  }
}

export function getResolutionDescription(resolution: DataResolution): string {
  switch (resolution) {
    case 'property':
      return 'High confidence — derived from property-specific coordinates or parcel data.';
    case 'neighborhood':
      return 'Moderate confidence — based on census block group or soil survey map unit data.';
    case 'area':
      return 'Directional — based on county, water system, or regional data.';
  }
}
