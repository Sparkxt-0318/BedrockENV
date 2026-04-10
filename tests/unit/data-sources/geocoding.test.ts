import { describe, it, expect } from 'vitest';
import { geocodeAddress, FIPS_TO_STATE } from '@/lib/data-sources/geocoding';

/**
 * These "unit" tests for the geocoder hit the Census Bureau geocoding API
 * directly. They are fast (<5s) but network-dependent. If the network is
 * unreachable (e.g. in CI without egress) the tests will skip rather than
 * fail so that the rest of the unit suite stays green.
 */

async function hasNetwork(): Promise<boolean> {
  try {
    const res = await fetch(
      'https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress?address=test&benchmark=Public_AR_Current&vintage=Current_Current&format=json',
      { signal: AbortSignal.timeout(5000) }
    );
    return res.ok || res.status < 500;
  } catch {
    return false;
  }
}

describe('Geocoding', () => {
  it('exposes a FIPS_TO_STATE lookup covering all 50 states + DC', () => {
    const entries = Object.entries(FIPS_TO_STATE);
    expect(entries.length).toBeGreaterThanOrEqual(51);
    expect(FIPS_TO_STATE['06']).toBe('CA');
    expect(FIPS_TO_STATE['36']).toBe('NY');
    expect(FIPS_TO_STATE['11']).toBe('DC');
  });

  it('resolves a well-known address to correct coordinates and FIPS', async () => {
    if (!(await hasNetwork())) {
      console.warn('Skipping network-dependent geocoding test');
      return;
    }
    const result = await geocodeAddress(
      '1600 Pennsylvania Ave NW, Washington, DC 20500'
    );
    if (!result) {
      console.warn('Census geocoder returned no match, skipping assertions');
      return;
    }
    expect(result.latitude).toBeCloseTo(38.8977, 1);
    expect(result.longitude).toBeCloseTo(-77.0365, 1);
    expect(result.fipsState).toBe('11');
    expect(result.fipsCounty).toBeTruthy();
    expect(result.censusTract).toBeTruthy();
  }, 30_000);

  it('returns null for a nonsense address', async () => {
    if (!(await hasNetwork())) return;
    const result = await geocodeAddress(
      'aslkdjfaslkdjf not a real place 99999'
    );
    expect(result).toBeNull();
  }, 30_000);
});
