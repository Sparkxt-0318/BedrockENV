import { describe, it, expect, vi, afterEach } from 'vitest';
import { fetchAirQualityData } from '@/lib/data-sources/openaq';

function makeFetchOk(body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => body,
  } as unknown as Response);
}

describe('fetchAirQualityData', () => {
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

  it('parses OpenAQ response into AirQualityData', async () => {
    const body = {
      results: [
        {
          location: 'Newark Firehouse',
          coordinates: { latitude: 40.735, longitude: -74.17 },
          measurements: [
            { parameter: 'pm25', value: 18.2, lastUpdated: '2024-01-15T12:00:00Z', unit: 'µg/m³' },
            { parameter: 'o3', value: 0.04, lastUpdated: '2024-01-15T12:00:00Z', unit: 'ppm' },
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
          location: 'Clean Air Station',
          coordinates: { latitude: 40.0, longitude: -74.0 },
          measurements: [
            { parameter: 'pm25', value: 8.0, lastUpdated: '2024-01-15T12:00:00Z', unit: 'µg/m³' },
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
