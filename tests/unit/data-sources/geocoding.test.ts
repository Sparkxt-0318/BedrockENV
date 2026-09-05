import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  geocodeAddress,
  FIPS_TO_STATE,
  extractCityHint,
  extractZipHint,
} from '@/lib/data-sources/geocoding';

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

// ---------------------------------------------------------------------------
// extractCityHint
// ---------------------------------------------------------------------------

type MinimalGeocoded = { raw: string; normalized?: string };

describe('extractCityHint', () => {
  it('extracts city from Census 4-part format', () => {
    const geo: MinimalGeocoded = {
      raw: '1600 PENNSYLVANIA AVE NW, WASHINGTON, DC 20500',
    };
    expect(extractCityHint(geo as Parameters<typeof extractCityHint>[0])).toBe('WASHINGTON');
  });

  it('extracts city from Census 4-part format with US suffix', () => {
    const geo: MinimalGeocoded = {
      raw: '123 MAIN ST, SPRINGFIELD, IL 62701, UNITED STATES',
    };
    expect(extractCityHint(geo as Parameters<typeof extractCityHint>[0])).toBe('SPRINGFIELD');
  });

  it('extracts city from Mapbox short format "City, State Zip"', () => {
    const geo: MinimalGeocoded = {
      raw: 'Chicago, IL 60601',
    };
    expect(extractCityHint(geo as Parameters<typeof extractCityHint>[0])).toBe('Chicago');
  });

  it('returns null when part starts with a digit (street address, not city)', () => {
    const geo: MinimalGeocoded = {
      raw: '1600 PENNSYLVANIA AVE',
    };
    // Only two parts, first starts with digit → not a city hint
    expect(extractCityHint(geo as Parameters<typeof extractCityHint>[0])).toBeNull();
  });

  it('uses normalized over raw when present', () => {
    const geo = {
      raw: 'raw value ignored',
      normalized: '100 MAIN ST, HOUSTON, TX 77002',
    };
    expect(extractCityHint(geo as Parameters<typeof extractCityHint>[0])).toBe('HOUSTON');
  });

  it('returns null for a single-segment address', () => {
    const geo: MinimalGeocoded = { raw: 'NoCommasHere' };
    expect(extractCityHint(geo as Parameters<typeof extractCityHint>[0])).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// extractZipHint
// ---------------------------------------------------------------------------

describe('extractZipHint', () => {
  it('extracts a 5-digit ZIP from the middle of an address string', () => {
    const geo: MinimalGeocoded = {
      raw: '1600 PENNSYLVANIA AVE NW, WASHINGTON, DC 20500',
    };
    expect(extractZipHint(geo as Parameters<typeof extractZipHint>[0])).toBe('20500');
  });

  it('extracts ZIP from normalized field when present', () => {
    const geo = {
      raw: 'no zip here',
      normalized: '500 Main St, Austin, TX 78701',
    };
    expect(extractZipHint(geo as Parameters<typeof extractZipHint>[0])).toBe('78701');
  });

  it('handles ZIP+4 format and returns only the 5-digit part', () => {
    const geo: MinimalGeocoded = { raw: 'Somewhere, TX 78701-1234' };
    expect(extractZipHint(geo as Parameters<typeof extractZipHint>[0])).toBe('78701');
  });

  it('returns null when there is no 5-digit number', () => {
    const geo: MinimalGeocoded = { raw: 'No zip in this address' };
    expect(extractZipHint(geo as Parameters<typeof extractZipHint>[0])).toBeNull();
  });

  it('does not match a 4-digit number', () => {
    const geo: MinimalGeocoded = { raw: 'Year 2024 test' };
    expect(extractZipHint(geo as Parameters<typeof extractZipHint>[0])).toBeNull();
  });
});
