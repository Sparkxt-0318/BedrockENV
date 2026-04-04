import { RiskTier } from '@/types/exposure';

export function getExposureColor(score: number): string {
  if (score <= 25) return 'var(--exposure-low)';
  if (score <= 50) return 'var(--exposure-moderate)';
  if (score <= 75) return 'var(--exposure-elevated)';
  return 'var(--exposure-high)';
}

export function getExposureLabel(score: number): string {
  if (score <= 25) return 'Low';
  if (score <= 50) return 'Moderate';
  if (score <= 75) return 'Elevated';
  return 'High';
}

export function getRiskTierFromScore(score: number): RiskTier {
  if (score <= 25) return 'LOW';
  if (score <= 50) return 'MODERATE';
  if (score <= 75) return 'ELEVATED';
  return 'HIGH';
}

export function formatDistance(miles: number): string {
  if (miles < 0.1) return 'less than 0.1 miles';
  return `${miles.toFixed(1)} miles`;
}

export function cardinalDirection(fromLat: number, fromLng: number, toLat: number, toLng: number): string {
  const dLat = toLat - fromLat;
  const dLng = toLng - fromLng;
  const angle = (Math.atan2(dLng, dLat) * 180) / Math.PI;
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(((angle + 360) % 360) / 45) % 8;
  return directions[index];
}

export function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959; // Earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
