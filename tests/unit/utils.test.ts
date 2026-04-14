import { describe, it, expect } from 'vitest';
import { haversineDistance, cardinalDirection } from '@/lib/utils';

// ---------------------------------------------------------------------------
// haversineDistance — returns distance in MILES.
// ---------------------------------------------------------------------------

describe('haversineDistance', () => {
  it('returns 0 for identical points', () => {
    expect(haversineDistance(40.7128, -74.006, 40.7128, -74.006)).toBe(0);
  });

  it('approximates 1° of latitude ≈ 69 miles at any longitude', () => {
    const d = haversineDistance(0, 0, 1, 0);
    expect(d).toBeCloseTo(69, 0);
  });

  it('shrinks 1° of longitude at higher latitudes (cos φ)', () => {
    const eqDeg = haversineDistance(0, 0, 0, 1);
    const at60 = haversineDistance(60, 0, 60, 1);
    // cos(60°) = 0.5 → longitudinal mile distance halves
    expect(at60).toBeCloseTo(eqDeg * 0.5, 1);
  });

  it('computes NYC → LA ≈ 2450 miles', () => {
    // NYC (40.7128, -74.006) to LA (34.0522, -118.2437)
    const d = haversineDistance(40.7128, -74.006, 34.0522, -118.2437);
    expect(d).toBeGreaterThan(2440);
    expect(d).toBeLessThan(2460);
  });

  it('computes antipodal distance ≈ half Earth circumference', () => {
    // Earth circumference (radius 3959 mi) ≈ 24,874 mi → antipodal ≈ 12,437 mi
    const d = haversineDistance(0, 0, 0, 180);
    expect(d).toBeGreaterThan(12_400);
    expect(d).toBeLessThan(12_500);
  });

  it('is symmetric (A→B == B→A)', () => {
    const a = haversineDistance(40.7128, -74.006, 34.0522, -118.2437);
    const b = haversineDistance(34.0522, -118.2437, 40.7128, -74.006);
    expect(a).toBeCloseTo(b, 6);
  });
});

// ---------------------------------------------------------------------------
// cardinalDirection — returns 8-way compass bearing string.
// ---------------------------------------------------------------------------

describe('cardinalDirection', () => {
  it('returns N for due-north targets', () => {
    expect(cardinalDirection(40, -100, 41, -100)).toBe('N');
    expect(cardinalDirection(0, 0, 1, 0)).toBe('N');
  });

  it('returns E for due-east targets', () => {
    expect(cardinalDirection(40, -100, 40, -99)).toBe('E');
    expect(cardinalDirection(0, 0, 0, 1)).toBe('E');
  });

  it('returns S for due-south targets', () => {
    expect(cardinalDirection(40, -100, 39, -100)).toBe('S');
    expect(cardinalDirection(0, 0, -1, 0)).toBe('S');
  });

  it('returns W for due-west targets', () => {
    expect(cardinalDirection(40, -100, 40, -101)).toBe('W');
    expect(cardinalDirection(0, 0, 0, -1)).toBe('W');
  });

  it('returns NE / SE / SW / NW for 45° offsets', () => {
    expect(cardinalDirection(0, 0, 1, 1)).toBe('NE');
    expect(cardinalDirection(0, 0, -1, 1)).toBe('SE');
    expect(cardinalDirection(0, 0, -1, -1)).toBe('SW');
    expect(cardinalDirection(0, 0, 1, -1)).toBe('NW');
  });

  it('works in the southern hemisphere', () => {
    // Buenos Aires (-34, -58) looking at a point 1° north
    expect(cardinalDirection(-34, -58, -33, -58)).toBe('N');
  });
});
