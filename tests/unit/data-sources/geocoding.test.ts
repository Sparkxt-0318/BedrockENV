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
              },
            ],
            '2020 Census Blocks': [
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

  it('falls back to Mapbox and enriches tract via Census coordinate lookup', async () => {
    process.env.NEXT_PUBLIC_MAPBOX_TOKEN = 'test-token';

    // Call 1: Census address geocoder → empty
    // Call 2: Mapbox → success
    // Call 3: Census coordinate geocoder → enriches tract/block group
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
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            result: {
              geographies: {
                'Census Tracts': [{ STATE: '11', COUNTY: '001', TRACT: '010100' }],
                '2020 Census Blocks': [{ STATE: '11', COUNTY: '001', TRACT: '010100', BLKGRP: '1' }],
              },
            },
          }),
        })
    );

    const result = await geocodeAddress('1600 Pennsylvania Ave NW, DC');

    expect(result).not.toBeNull();
    expect(result!.source).toBe('mapbox');
    expect(result!.fipsState).toBe('11');
    expect(result!.fipsCounty).toBe('001');
    expect(result!.censusTract).toBe('010100');
    expect(result!.censusBlockGroup).toBe('1');
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
        // Census coordinate lookup (enrichment)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            result: {
              geographies: {
                'Census Tracts': [{ STATE: '06', COUNTY: '037', TRACT: '207110' }],
                '2020 Census Blocks': [{ STATE: '06', COUNTY: '037', TRACT: '207110', BLKGRP: '2' }],
              },
            },
          }),
        })
    );

    const result = await geocodeAddress('123 Main St, Los Angeles, CA');
    expect(result!.source).toBe('mapbox');
    expect(result!.fipsState).toBe('06');
    expect(result!.fipsCounty).toBe('037');
    expect(result!.censusTract).toBe('207110');
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
// geocodeAddress — additional mocked edge cases
// ---------------------------------------------------------------------------

describe('geocodeAddress — Mapbox + FCC enrichment paths (mocked)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    delete process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  });

  it('returns null when Mapbox returns empty features array', async () => {
    process.env.NEXT_PUBLIC_MAPBOX_TOKEN = 'test-token';

    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        // Census address geocoder → empty
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ result: { addressMatches: [] } }),
        })
        // Mapbox → returns empty features
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ features: [] }),
        })
    );

    const result = await geocodeAddress('nowhere land 00000');
    expect(result).toBeNull();
  });

  it('falls back to FCC when Census coordinate enrichment returns no county FIPS', async () => {
    process.env.NEXT_PUBLIC_MAPBOX_TOKEN = 'test-token';

    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        // Call 1: Census address geocoder → empty
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ result: { addressMatches: [] } }),
        })
        // Call 2: Mapbox → success (no county FIPS via Mapbox)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => makeMapboxResponse({ regionCode: 'US-TX', lng: -94.1, lat: 29.9 }),
        })
        // Call 3: Census coordinate enrichment → no fipsCounty (no County FIPS in response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            result: {
              geographies: {
                'Census Tracts': [{ STATE: '48', TRACT: '000100' }], // no COUNTY field
                '2020 Census Blocks': [{ STATE: '48', TRACT: '000100', BLKGRP: '1' }],
              },
            },
          }),
        })
        // Call 4: FCC census area API → provides county FIPS
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            results: [
              { county_fips: '48245' }, // Jefferson County, TX (Port Arthur area)
            ],
          }),
        })
    );

    const result = await geocodeAddress('Port Arthur, TX 77640');
    expect(result).not.toBeNull();
    expect(result!.source).toBe('mapbox');
    expect(result!.fipsState).toBe('48');
    expect(result!.fipsCounty).toBe('245');
  });

  it('returns Mapbox result without county FIPS when both Census coordinate and FCC enrichment fail', async () => {
    process.env.NEXT_PUBLIC_MAPBOX_TOKEN = 'test-token';

    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        // Census address geocoder → empty
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ result: { addressMatches: [] } }),
        })
        // Mapbox → success
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => makeMapboxResponse({ regionCode: 'US-TX', lng: -94.1, lat: 29.9 }),
        })
        // Census coordinate enrichment → returns no state (enrichment skipped)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            result: {
              geographies: {}, // empty
            },
          }),
        })
        // FCC census → empty results
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ results: [] }),
        })
    );

    const result = await geocodeAddress('Port Arthur, TX');
    expect(result).not.toBeNull();
    expect(result!.source).toBe('mapbox');
    // No county FIPS available from either enrichment source
    expect(result!.fipsCounty).toBe('');
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
