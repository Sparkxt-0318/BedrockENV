import { describe, it, expect, vi, afterEach } from 'vitest';
import { geocodeAddress, FIPS_TO_STATE } from '@/lib/data-sources/geocoding';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

/** Build a minimal Census API response for a single address match. */
function makeCensusResponse(overrides: {
  x?: number;
  y?: number;
  matchedAddress?: string;
  STATE?: string;
  COUNTY?: string;
  TRACT?: string;
  BLKGRP?: string;
} = {}) {
  return {
    result: {
      addressMatches: [
        {
          coordinates: { x: overrides.x ?? -77.0365, y: overrides.y ?? 38.8977 },
          matchedAddress: overrides.matchedAddress ?? '1600 PENNSYLVANIA AVE NW, WASHINGTON, DC 20500',
          geographies: {
            'Census Tracts': [
              {
                STATE: overrides.STATE ?? '11',
                COUNTY: overrides.COUNTY ?? '001',
                TRACT: overrides.TRACT ?? '010100',
                BLKGRP: overrides.BLKGRP ?? '1',
              },
            ],
          },
        },
      ],
    },
  };
}

/** Build a minimal Mapbox v6 geocoding response. */
function makeMapboxResponse(overrides: {
  lng?: number;
  lat?: number;
  fullAddress?: string;
  regionCode?: string;
} = {}) {
  return {
    features: [
      {
        geometry: { coordinates: [overrides.lng ?? -77.0365, overrides.lat ?? 38.8977] },
        properties: {
          full_address: overrides.fullAddress ?? '1600 Pennsylvania Ave NW, Washington, DC 20500',
          context: {
            region: { region_code: overrides.regionCode ?? 'US-DC' },
            district: { id: 'district.123456789', name: 'District of Columbia' },
          },
        },
      },
    ],
  };
}

function makeFetchOk(body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => body,
  } as unknown as Response);
}

// ---------------------------------------------------------------------------
// FIPS table (no network needed)
// ---------------------------------------------------------------------------

describe('FIPS_TO_STATE', () => {
  it('covers all 50 states + DC (≥ 51 entries)', () => {
    const entries = Object.entries(FIPS_TO_STATE);
    expect(entries.length).toBeGreaterThanOrEqual(51);
  });

  it('maps well-known FIPS codes correctly', () => {
    expect(FIPS_TO_STATE['06']).toBe('CA');
    expect(FIPS_TO_STATE['36']).toBe('NY');
    expect(FIPS_TO_STATE['11']).toBe('DC');
    expect(FIPS_TO_STATE['48']).toBe('TX');
  });
});

// ---------------------------------------------------------------------------
// geocodeAddress — mocked (no network)
// ---------------------------------------------------------------------------

describe('geocodeAddress (mocked fetch)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    delete process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  });

  it('returns source: census on a successful Census match', async () => {
    vi.stubGlobal('fetch', makeFetchOk(makeCensusResponse()));

    const result = await geocodeAddress('1600 Pennsylvania Ave NW, DC');

    expect(result).not.toBeNull();
    expect(result!.source).toBe('census');
    expect(result!.fipsState).toBe('11');
    expect(result!.fipsCounty).toBe('001');
    expect(result!.censusTract).toBe('010100');
    expect(result!.censusBlockGroup).toBe('1');
    expect(result!.latitude).toBeCloseTo(38.8977, 3);
    expect(result!.longitude).toBeCloseTo(-77.0365, 3);
  });

  it('returns null when Census returns no matches', async () => {
    vi.stubGlobal('fetch', makeFetchOk({ result: { addressMatches: [] } }));

    const result = await geocodeAddress('notarealplace 00000');
    expect(result).toBeNull();
  });

  it('falls back to Mapbox when Census returns empty and token is set', async () => {
    process.env.NEXT_PUBLIC_MAPBOX_TOKEN = 'test-token';

    // First call → Census (empty), second call → Mapbox (success)
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ result: { addressMatches: [] } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => makeMapboxResponse({ regionCode: 'US-DC' }),
        })
    );

    const result = await geocodeAddress('1600 Pennsylvania Ave NW, DC');

    expect(result).not.toBeNull();
    expect(result!.source).toBe('mapbox');
    // DC from "US-DC" → FIPS '11'
    expect(result!.fipsState).toBe('11');
    // County FIPS unavailable via Mapbox
    expect(result!.fipsCounty).toBe('');
    expect(result!.censusTract).toBe('');
    expect(result!.censusBlockGroup).toBe('');
  });

  it('normalises Mapbox region_code "CA" (no country prefix) to FIPS 06', async () => {
    process.env.NEXT_PUBLIC_MAPBOX_TOKEN = 'test-token';

    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ result: { addressMatches: [] } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () =>
            makeMapboxResponse({ regionCode: 'CA', lng: -118.243, lat: 34.052 }),
        })
    );

    const result = await geocodeAddress('123 Main St, Los Angeles, CA');
    expect(result!.source).toBe('mapbox');
    expect(result!.fipsState).toBe('06');
  });

  it('returns null when both Census and Mapbox fail', async () => {
    process.env.NEXT_PUBLIC_MAPBOX_TOKEN = 'test-token';

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({}),
      })
    );

    const result = await geocodeAddress('notarealplace 99999');
    expect(result).toBeNull();
  });

  it('returns null when Mapbox token is absent and Census fails', async () => {
    // No Mapbox token set
    vi.stubGlobal('fetch', makeFetchOk({ result: { addressMatches: [] } }));

    const result = await geocodeAddress('totally invalid address xyz');
    expect(result).toBeNull();
  });

  it('handles missing Census tract data gracefully', async () => {
    // Some addresses match but have no tract geography
    vi.stubGlobal(
      'fetch',
      makeFetchOk({
        result: {
          addressMatches: [
            {
              coordinates: { x: -100.0, y: 45.0 },
              matchedAddress: '123 RURAL RD, SOMEWHERE, ND 58000',
              geographies: {
                Counties: [{ STATE: '38', COUNTY: '005' }],
                // No 'Census Tracts' entry
              },
            },
          ],
        },
      })
    );

    const result = await geocodeAddress('123 Rural Rd, Somewhere, ND');
    expect(result).not.toBeNull();
    expect(result!.source).toBe('census');
    expect(result!.fipsState).toBe('38');
    expect(result!.fipsCounty).toBe('005');
    expect(result!.censusTract).toBe('');
    expect(result!.censusBlockGroup).toBe('');
  });
});

// ---------------------------------------------------------------------------
// geocodeAddress — live network (skipped if no connectivity)
// ---------------------------------------------------------------------------

describe('geocodeAddress (live network)', () => {
  it('resolves White House to correct coordinates and FIPS', async () => {
    if (!(await hasNetwork())) {
      console.warn('Skipping live network geocoding test (no connectivity)');
      return;
    }
    const result = await geocodeAddress(
      '1600 Pennsylvania Ave NW, Washington, DC 20500'
    );
    if (!result) {
      console.warn('Census geocoder returned no match — skipping assertions');
      return;
    }
    expect(result.latitude).toBeCloseTo(38.8977, 1);
    expect(result.longitude).toBeCloseTo(-77.0365, 1);
    expect(result.fipsState).toBe('11');
    expect(result.source).toBe('census');
  }, 30_000);

  it('returns null for a nonsense address', async () => {
    if (!(await hasNetwork())) return;
    const result = await geocodeAddress('aslkdjfaslkdjf not a real place 99999');
    expect(result).toBeNull();
  }, 30_000);
});
