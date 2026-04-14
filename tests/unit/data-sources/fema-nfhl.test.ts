import { describe, it, expect, vi, afterEach } from 'vitest';
import { fetchFloodZone } from '@/lib/data-sources/fema-nfhl';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockFetchJson(body: unknown, status = 200) {
  return vi.fn().mockResolvedValue({
    ok: status < 400,
    status,
    statusText: `HTTP ${status}`,
    json: async () => body,
  } as unknown as Response);
}

interface AttrOverrides {
  FLD_ZONE?: string;
  ZONE_SUBTY?: string | null;
  SFHA_TF?: string | boolean;
  STATIC_BFE?: number | null;
}
function feature(attrs: AttrOverrides) {
  return { attributes: { SFHA_TF: 'F', STATIC_BFE: -9999, ...attrs } };
}

// Miami Beach, FL
const MIAMI = { lat: 25.7907, lon: -80.13 };

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('fetchFloodZone', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('parses a single AE feature with a real BFE', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetchJson({
        features: [feature({ FLD_ZONE: 'AE', SFHA_TF: 'T', STATIC_BFE: 12 })],
      })
    );

    const result = await fetchFloodZone(MIAMI.lat, MIAMI.lon);

    expect(result.error).toBeNull();
    expect(result.data).not.toBeNull();
    expect(result.data!.coverage).toBe('mapped');
    expect(result.data!.zone).toBe('AE');
    expect(result.data!.isSpecialFloodHazardArea).toBe(true);
    expect(result.data!.riskLevel).toBe('HIGH');
    expect(result.data!.staticBfe).toBe(12);
    expect(result.data!.features).toHaveLength(1);
    expect(result.data!.features[0].zone).toBe('AE');
  });

  it('returns ALL features and picks the most hazardous as the headline', async () => {
    // Coastal parcel: intersects both VE (wave) and AE (still water).
    vi.stubGlobal(
      'fetch',
      mockFetchJson({
        features: [
          feature({ FLD_ZONE: 'AE', SFHA_TF: 'T', STATIC_BFE: 10 }),
          feature({ FLD_ZONE: 'VE', SFHA_TF: 'T', STATIC_BFE: 15 }),
        ],
      })
    );

    const result = await fetchFloodZone(MIAMI.lat, MIAMI.lon);

    expect(result.data!.features).toHaveLength(2);
    // Headline is VE (rank 100 > AE rank 80)
    expect(result.data!.zone).toBe('VE');
    // BFE headline is the highest across all features
    expect(result.data!.staticBfe).toBe(15);
    // Both features preserved regardless of which is headline
    const zones = result.data!.features.map((f) => f.zone).sort();
    expect(zones).toEqual(['AE', 'VE']);
  });

  it('treats STATIC_BFE = -9999 as "no BFE established" (null)', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetchJson({
        features: [feature({ FLD_ZONE: 'A', SFHA_TF: 'T', STATIC_BFE: -9999 })],
      })
    );

    const result = await fetchFloodZone(MIAMI.lat, MIAMI.lon);
    expect(result.error).toBeNull();
    expect(result.data!.zone).toBe('A');
    expect(result.data!.staticBfe).toBeNull();
    expect(result.data!.features[0].staticBfe).toBeNull();
  });

  it('maps shaded Zone X (0.2% annual chance) to the moderate B description', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetchJson({
        features: [
          feature({
            FLD_ZONE: 'X',
            ZONE_SUBTY: '0.2 PCT ANNUAL CHANCE FLOOD HAZARD',
            SFHA_TF: 'F',
            STATIC_BFE: -9999,
          }),
        ],
      })
    );

    const result = await fetchFloodZone(25, -80);
    expect(result.data!.zone).toBe('X');
    expect(result.data!.riskLevel).toBe('MODERATE');
    expect(result.data!.zoneDescription).toMatch(/0\.2%/);
  });

  it('returns unmapped coverage when features is empty', async () => {
    vi.stubGlobal('fetch', mockFetchJson({ features: [] }));

    const result = await fetchFloodZone(MIAMI.lat, MIAMI.lon);
    expect(result.error).toBeNull();
    expect(result.data).not.toBeNull();
    expect(result.data!.coverage).toBe('unmapped');
    expect(result.data!.features).toEqual([]);
    expect(result.data!.staticBfe).toBeNull();
  });

  it('returns an error when ArcGIS returns a 200 error envelope', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetchJson({
        error: { code: 400, message: 'Unable to complete operation' },
      })
    );

    const result = await fetchFloodZone(MIAMI.lat, MIAMI.lon);
    expect(result.data).toBeNull();
    expect(result.error).toMatch(/400/);
    expect(result.error).toMatch(/Unable to complete/);
  });

  it('returns an error on HTTP 5xx', async () => {
    vi.stubGlobal('fetch', mockFetchJson({}, 502));
    const result = await fetchFloodZone(MIAMI.lat, MIAMI.lon);
    expect(result.data).toBeNull();
    expect(result.error).toMatch(/502/);
  });

  it('returns an error on malformed response (missing features array)', async () => {
    vi.stubGlobal('fetch', mockFetchJson({ notFeatures: true }));
    const result = await fetchFloodZone(MIAMI.lat, MIAMI.lon);
    expect(result.data).toBeNull();
    expect(result.error).toMatch(/malformed/);
  });

  it('returns an error when fetch throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ENETUNREACH')));
    const result = await fetchFloodZone(MIAMI.lat, MIAMI.lon);
    expect(result.data).toBeNull();
    expect(result.error).toMatch(/ENETUNREACH/);
  });

  it('rejects non-finite coordinates', async () => {
    const result = await fetchFloodZone(Number.NaN, -80);
    expect(result.error).toMatch(/finite/);
  });
});
