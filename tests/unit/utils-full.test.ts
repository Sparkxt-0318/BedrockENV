import { describe, it, expect } from 'vitest';
import {
  getExposureColor,
  getExposureLabel,
  getRiskTierFromScore,
  formatDistance,
  cardinalDirection,
  haversineDistance,
} from '@/lib/utils';

describe('getExposureColor', () => {
  it('returns low color for scores 0-25', () => {
    expect(getExposureColor(0)).toBe('var(--exposure-low)');
    expect(getExposureColor(25)).toBe('var(--exposure-low)');
  });

  it('returns moderate color for scores 26-50', () => {
    expect(getExposureColor(26)).toBe('var(--exposure-moderate)');
    expect(getExposureColor(50)).toBe('var(--exposure-moderate)');
  });

  it('returns elevated color for scores 51-75', () => {
    expect(getExposureColor(51)).toBe('var(--exposure-elevated)');
    expect(getExposureColor(75)).toBe('var(--exposure-elevated)');
  });

  it('returns high color for scores 76-100', () => {
    expect(getExposureColor(76)).toBe('var(--exposure-high)');
    expect(getExposureColor(100)).toBe('var(--exposure-high)');
  });
});

describe('getExposureLabel', () => {
  it('returns correct label for each tier', () => {
    expect(getExposureLabel(10)).toBe('Low');
    expect(getExposureLabel(40)).toBe('Moderate');
    expect(getExposureLabel(60)).toBe('Elevated');
    expect(getExposureLabel(90)).toBe('High');
  });

  it('returns correct label at tier boundaries', () => {
    expect(getExposureLabel(25)).toBe('Low');
    expect(getExposureLabel(50)).toBe('Moderate');
    expect(getExposureLabel(75)).toBe('Elevated');
  });
});

describe('getRiskTierFromScore', () => {
  it('maps scores to RiskTier enum values', () => {
    expect(getRiskTierFromScore(0)).toBe('LOW');
    expect(getRiskTierFromScore(25)).toBe('LOW');
    expect(getRiskTierFromScore(26)).toBe('MODERATE');
    expect(getRiskTierFromScore(50)).toBe('MODERATE');
    expect(getRiskTierFromScore(51)).toBe('ELEVATED');
    expect(getRiskTierFromScore(75)).toBe('ELEVATED');
    expect(getRiskTierFromScore(76)).toBe('HIGH');
    expect(getRiskTierFromScore(100)).toBe('HIGH');
  });
});

describe('formatDistance', () => {
  it('returns "less than 0.1 miles" for tiny distances', () => {
    expect(formatDistance(0.05)).toBe('less than 0.1 miles');
    expect(formatDistance(0)).toBe('less than 0.1 miles');
  });

  it('formats distances with one decimal place', () => {
    expect(formatDistance(0.5)).toBe('0.5 miles');
    expect(formatDistance(1.23)).toBe('1.2 miles');
    expect(formatDistance(10)).toBe('10.0 miles');
  });
});

describe('cardinalDirection', () => {
  it('returns N for due north', () => {
    expect(cardinalDirection(40, -74, 41, -74)).toBe('N');
  });

  it('returns E for due east', () => {
    expect(cardinalDirection(40, -74, 40, -73)).toBe('E');
  });

  it('returns S for due south', () => {
    expect(cardinalDirection(41, -74, 40, -74)).toBe('S');
  });

  it('returns W for due west', () => {
    expect(cardinalDirection(40, -73, 40, -74)).toBe('W');
  });

  it('returns NE for northeast', () => {
    expect(cardinalDirection(40, -74, 41, -73)).toBe('NE');
  });
});

describe('haversineDistance', () => {
  it('returns 0 for the same point', () => {
    expect(haversineDistance(40.7128, -74.006, 40.7128, -74.006)).toBe(0);
  });

  it('calculates approximately correct distance (NYC to Newark ~8-10 mi)', () => {
    const dist = haversineDistance(40.7128, -74.006, 40.7357, -74.1724);
    expect(dist).toBeGreaterThan(8);
    expect(dist).toBeLessThan(12);
  });

  it('calculates approximately correct distance (NYC to LA ~2400-2500 mi)', () => {
    const dist = haversineDistance(40.7128, -74.006, 34.0522, -118.2437);
    expect(dist).toBeGreaterThan(2400);
    expect(dist).toBeLessThan(2500);
  });
});
