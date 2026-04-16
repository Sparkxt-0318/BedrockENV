import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { fetchAirQualityData } from '@/lib/data-sources/openaq';

function makeFetchOk(body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => body,
  } as unknown as Response);
}

describe('fetchAirQualityData', () => {
  beforeEach(() => {
    // Provide a test API key so the client doesn't short-circuit
    vi.stubGlobal('process', {
      ...process,
      env: { ...process.env, OPENAQ_API_KEY: 'test-key-123' },
    });
  });

  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

  it('parses OpenAQ v3 response into AirQualityData', async () => {
    const body = {
      results: [
        {
          id: 1,
          name: 'Newark Firehouse',
          coordinates: { latitude: 40.735, longitude: -74.17 },
          distance: 1200, // meters
          sensors: [
            {
              id: 101,
              parameter: { name: 'pm25', units: 'µg/m³' },
              summary: { avg: 18.2 },
              datetime_last: { utc: '2024-01-15T12:00:00Z' },
            },
            {
              id: 102,
              parameter: { name: 'o3', units: 'ppm' },
              summary: { avg: 0.04 },
              datetime_last: { utc: '2024-01-15T12:00:00Z' },
            },
          ],
        },
      ],
    };
    vi.stubGlobal('fetch', makeFetchOk(body));

    const result = await fetchAirQualityData(40.735, -74.17);

    expect(result.error).toBeNull();
    expect(result.data).not.toBeNull();
    expect(result.data!.stationName).toBe('Newark Firehouse');
    expect(result.data!.measurements).toHaveLength(2);
    expect(result.data!.exceedsWhoGuideline).toBe(true); // 18.2 > 15
  });

  it('does not flag WHO exceedance when PM2.5 is below guideline', async () => {
    const body = {
      results: [
        {
          id: 2,
          name: 'Clean Air Station',
          coordinates: { latitude: 40.0, longitude: -74.0 },
          sensors: [
            {
              id: 201,
              parameter: { name: 'pm25', units: 'µg/m³' },
              summary: { avg: 8.0 },
              datetime_last: { utc: '2024-01-15T12:00:00Z' },
            },
          ],
        },
      ],
    };
    vi.stubGlobal('fetch', makeFetchOk(body));

    const result = await fetchAirQualityData(40.0, -74.0);

    expect(result.data!.exceedsWhoGuideline).toBe(false);
  });

  it('returns error when no monitors found', async () => {
    vi.stubGlobal('fetch', makeFetchOk({ results: [] }));

    const result = await fetchAirQualityData(44.5, -110.5);

    expect(result.data).toBeNull();
    expect(result.error).toMatch(/No air quality/);
  });

  it('returns error when API key is missing', async () => {
    vi.stubGlobal('process', {
      ...process,
      env: { ...process.env, OPENAQ_API_KEY: undefined },
    });

    const result = await fetchAirQualityData(40.0, -74.0);

    expect(result.data).toBeNull();
    expect(result.error).toMatch(/API key not configured/);
  });

  it('returns error on HTTP failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false, status: 502, json: async () => ({}),
    } as unknown as Response));

    const result = await fetchAirQualityData(40.0, -74.0);

    expect(result.data).toBeNull();
    expect(result.error).toMatch(/502/);
  });

  it('returns error when fetch throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('connection reset')));

    const result = await fetchAirQualityData(40.0, -74.0);

    expect(result.data).toBeNull();
    expect(result.error).toBeTruthy();
  });

  it('rejects invalid coordinates', async () => {
    const result = await fetchAirQualityData(NaN, -74.0);
    expect(result.data).toBeNull();
    expect(result.error).toMatch(/Invalid/);
  });
});
