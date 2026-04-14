import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  fetchBrownfieldSites,
  boundingBox,
  DEFAULT_BROWNFIELD_RADIUS_MILES,
} from '@/lib/data-sources/epa-brownfields';

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

// Newark, NJ (40.7282, -74.1788) — origin for most fixtures.
const NEWARK = { lat: 40.7282, lon: -74.1788 };

// ---------------------------------------------------------------------------
// boundingBox tests
// ---------------------------------------------------------------------------

describe('boundingBox', () => {
  it('produces a symmetric box around the query point', () => {
    const box = boundingBox(40, -100, 2);
    expect(box.maxLat - 40).toBeCloseTo(2 / 69, 4);
    expect(40 - box.minLat).toBeCloseTo(2 / 69, 4);
    expect(box.maxLon).toBeGreaterThan(-100);
    expect(box.minLon).toBeLessThan(-100);
  });

  it('shrinks the longitude span at higher latitudes', () => {
    const equatorial = boundingBox(0, 0, 2);
    const northern = boundingBox(60, 0, 2);
    const eqWidth = equatorial.maxLon - equatorial.minLon;
    const nWidth = northern.maxLon - northern.minLon;
    // cos(60°) = 0.5, so northern box should be roughly twice as wide in
    // degrees for the same mileage coverage.
    expect(nWidth).toBeGreaterThan(eqWidth * 1.5);
  });

  it('clamps cos(lat) near the poles so the box stays finite', () => {
    const polar = boundingBox(89.9, 0, 2);
    const width = polar.maxLon - polar.minLon;
    // With cos clamped to 0.05, the max longitude span at 2 miles is
    // 2 / (69 * 0.05) = ~0.58° — reasonable, not infinity.
    expect(Number.isFinite(width)).toBe(true);
    expect(width).toBeLessThan(2);
  });
});

// ---------------------------------------------------------------------------
// fetchBrownfieldSites tests
// ---------------------------------------------------------------------------

describe('fetchBrownfieldSites', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('parses FRS rows, sorts by distance, and enriches with direction', async () => {
    // Two sites near Newark: one ~0.5 mi north, one ~1 mi east.
    const north = { lat: NEWARK.lat + 0.5 / 69, lon: NEWARK.lon };
    const east = {
      lat: NEWARK.lat,
      lon: NEWARK.lon + 1 / (69 * Math.cos((NEWARK.lat * Math.PI) / 180)),
    };
    const body = [
      {
        PRIMARY_NAME: 'Old Factory',
        REGISTRY_ID: 'FRS-1',
        LATITUDE83: east.lat,
        LONGITUDE83: east.lon,
        INTEREST_TYPES: 'Lead; PCBs',
        FEDERAL_AGENCY_NAME: 'Active',
      },
      {
        PRIMARY_NAME: 'Closer Site',
        REGISTRY_ID: 'FRS-2',
        LATITUDE83: north.lat,
        LONGITUDE83: north.lon,
        INTEREST_TYPES: 'Petroleum',
        FEDERAL_AGENCY_NAME: 'Complete',
      },
    ];
    vi.stubGlobal('fetch', mockFetchJson(body));

    const result = await fetchBrownfieldSites(NEWARK.lat, NEWARK.lon);

    expect(result.error).toBeNull();
    expect(result.data).not.toBeNull();
    expect(result.data!.length).toBe(2);
    // Sorted by distance
    expect(result.data![0].siteId).toBe('FRS-2');
    expect(result.data![0].distance).toBeLessThan(result.data![1].distance);
    expect(result.data![0].direction).toBe('N');
    expect(result.data![1].direction).toBe('E');
    expect(result.data![0].contaminantTypes).toEqual(['Petroleum']);
    expect(result.data![1].contaminantTypes).toEqual(['Lead', 'PCBs']);
  });

  it('filters out (0, 0) sentinel coordinates', async () => {
    const body = [
      {
        PRIMARY_NAME: 'Un-geocoded',
        REGISTRY_ID: 'FRS-X',
        LATITUDE83: 0,
        LONGITUDE83: 0,
      },
      {
        PRIMARY_NAME: 'Real Site',
        REGISTRY_ID: 'FRS-R',
        LATITUDE83: NEWARK.lat + 0.3 / 69,
        LONGITUDE83: NEWARK.lon,
      },
    ];
    vi.stubGlobal('fetch', mockFetchJson(body));

    const result = await fetchBrownfieldSites(NEWARK.lat, NEWARK.lon);
    expect(result.data).toHaveLength(1);
    expect(result.data![0].siteId).toBe('FRS-R');
  });

  it('filters out sites outside the requested radius', async () => {
    const body = [
      {
        PRIMARY_NAME: 'Far Site',
        REGISTRY_ID: 'FRS-FAR',
        // 10 miles north — well outside the 2-mile default.
        LATITUDE83: NEWARK.lat + 10 / 69,
        LONGITUDE83: NEWARK.lon,
      },
    ];
    vi.stubGlobal('fetch', mockFetchJson(body));

    const result = await fetchBrownfieldSites(NEWARK.lat, NEWARK.lon);
    expect(result.data).toEqual([]);
  });

  it('accepts a custom radiusMiles parameter', async () => {
    // Site 3 miles north — outside default 2 mi but inside 5 mi.
    const body = [
      {
        PRIMARY_NAME: 'Mid-range Site',
        REGISTRY_ID: 'FRS-M',
        LATITUDE83: NEWARK.lat + 3 / 69,
        LONGITUDE83: NEWARK.lon,
      },
    ];
    vi.stubGlobal('fetch', mockFetchJson(body));

    const tight = await fetchBrownfieldSites(
      NEWARK.lat,
      NEWARK.lon,
      DEFAULT_BROWNFIELD_RADIUS_MILES
    );
    expect(tight.data).toEqual([]);

    vi.stubGlobal('fetch', mockFetchJson(body));
    const wide = await fetchBrownfieldSites(NEWARK.lat, NEWARK.lon, 5);
    expect(wide.data).toHaveLength(1);
    expect(wide.data![0].distance).toBeGreaterThan(
      DEFAULT_BROWNFIELD_RADIUS_MILES
    );
    expect(wide.data![0].distance).toBeLessThanOrEqual(5);
  });

  it('returns an empty array (not an error) when no rows match', async () => {
    vi.stubGlobal('fetch', mockFetchJson([]));

    const result = await fetchBrownfieldSites(NEWARK.lat, NEWARK.lon);
    expect(result.error).toBeNull();
    expect(result.data).toEqual([]);
  });

  it('returns an error on HTTP 5xx', async () => {
    vi.stubGlobal('fetch', mockFetchJson({}, 503));

    const result = await fetchBrownfieldSites(NEWARK.lat, NEWARK.lon);
    expect(result.data).toBeNull();
    expect(result.error).toMatch(/503/);
  });

  it('returns an error on malformed (non-array) response body', async () => {
    vi.stubGlobal('fetch', mockFetchJson({ message: 'oops' }));

    const result = await fetchBrownfieldSites(NEWARK.lat, NEWARK.lon);
    expect(result.data).toBeNull();
    expect(result.error).toMatch(/malformed/);
  });

  it('returns an error when fetch throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('DNS fail')));

    const result = await fetchBrownfieldSites(NEWARK.lat, NEWARK.lon);
    expect(result.data).toBeNull();
    expect(result.error).toMatch(/DNS/);
  });

  it('rejects non-finite coordinates and non-positive radii', async () => {
    const bad1 = await fetchBrownfieldSites(Number.NaN, 0);
    expect(bad1.error).toMatch(/finite/);

    const bad2 = await fetchBrownfieldSites(0, 0, 0);
    expect(bad2.error).toMatch(/positive/);
  });
});
