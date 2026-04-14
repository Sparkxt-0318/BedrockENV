import { describe, it, expect, vi, afterEach } from 'vitest';
import { fetchNasaPowerData } from '@/lib/data-sources/nasa-smap';

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

/** Build a POWER-style response for a fixed 5-year window. */
function makeResponse(
  startYear: number,
  endYear: number,
  precipMmPerDay: number,
  tempC: number,
  overrides: {
    precipOverrides?: Record<string, number>;
    tempOverrides?: Record<string, number>;
  } = {}
) {
  const precip: Record<string, number> = {};
  const temp: Record<string, number> = {};
  for (let y = startYear; y <= endYear; y++) {
    for (let m = 1; m <= 12; m++) {
      const key = `${y}${m.toString().padStart(2, '0')}`;
      precip[key] = precipMmPerDay;
      temp[key] = tempC;
    }
    // POWER also emits a YYYY13 annual total — our parser should drop it.
    precip[`${y}13`] = precipMmPerDay * 365;
    temp[`${y}13`] = tempC;
  }
  Object.assign(precip, overrides.precipOverrides ?? {});
  Object.assign(temp, overrides.tempOverrides ?? {});
  return {
    properties: {
      parameter: {
        PRECTOTCORR: precip,
        T2M: temp,
      },
    },
  };
}

// Use a fixed clock so start/end years don't drift across test runs.
const NOW = new Date('2026-03-15T00:00:00Z');
// Last completed full year = 2025, window = 2021..2025.
const START_YEAR = 2021;
const END_YEAR = 2025;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('fetchNasaPowerData', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('computes annual precipitation, temperature, and aridity for a humid climate', async () => {
    // 4 mm/day → ~1460 mm/year (Miami-ish). 24 °C mean temp.
    // De Martonne index = 1460 / (24+10) = ~43 → "very humid"
    vi.stubGlobal('fetch', mockFetchJson(makeResponse(START_YEAR, END_YEAR, 4, 24)));

    const result = await fetchNasaPowerData(25.79, -80.13, NOW);

    expect(result.error).toBeNull();
    expect(result.data).not.toBeNull();
    expect(result.data!.resolution).toBe('area');
    expect(result.data!.meanAnnualTempC).toBeCloseTo(24, 1);
    expect(result.data!.precipitationAvgMm).toBeGreaterThan(1400);
    expect(result.data!.precipitationAvgMm).toBeLessThan(1500);
    expect(result.data!.aridityIndex).not.toBeNull();
    expect(result.data!.aridityIndex!).toBeGreaterThan(28); // "very humid"
    expect(result.data!.fillFraction).toBe(0);
    expect(result.source).toBe('NASA POWER');
  });

  it('computes a low aridity index for an arid climate', async () => {
    // 0.3 mm/day → ~110 mm/year. 20 °C mean temp.
    // De Martonne = 110 / 30 = ~3.7 → arid
    vi.stubGlobal('fetch', mockFetchJson(makeResponse(START_YEAR, END_YEAR, 0.3, 20)));

    const result = await fetchNasaPowerData(33.5, -115, NOW);

    expect(result.error).toBeNull();
    expect(result.data!.aridityIndex!).toBeLessThan(10); // arid
    expect(result.data!.surfaceMoisture).toBe(0); // < 200 mm clamps to 0
  });

  it('filters POWER -999 fill values and reports fillFraction', async () => {
    // Replace first full year (12 months) with -999 for both PRECTOTCORR and T2M.
    const fills: Record<string, number> = {};
    for (let m = 1; m <= 12; m++) {
      fills[`${START_YEAR}${m.toString().padStart(2, '0')}`] = -999;
    }
    vi.stubGlobal(
      'fetch',
      mockFetchJson(
        makeResponse(START_YEAR, END_YEAR, 3, 15, {
          precipOverrides: fills,
          tempOverrides: fills,
        })
      )
    );

    const result = await fetchNasaPowerData(40, -100, NOW);

    expect(result.error).toBeNull();
    expect(result.data!.fillFraction).toBeCloseTo(12 / 60, 2);
    // Averages should still be sensible — the non-fill months are all 3 mm/day.
    expect(result.data!.precipitationAvgMm).toBeGreaterThan(1000);
  });

  it('returns null aridity index for cold climates (non-physical denominator)', async () => {
    // Mean annual temp -15 °C → denominator -5, guarded → null
    vi.stubGlobal('fetch', mockFetchJson(makeResponse(START_YEAR, END_YEAR, 1, -15)));

    const result = await fetchNasaPowerData(65, -150, NOW);
    expect(result.error).toBeNull();
    expect(result.data!.aridityIndex).toBeNull();
  });

  it('classifies a drying trend when late-window precip drops', async () => {
    // Early years (2021-2022): 5 mm/day. Late years (2023-2025): 2 mm/day.
    const precip: Record<string, number> = {};
    const temp: Record<string, number> = {};
    for (let y = START_YEAR; y <= END_YEAR; y++) {
      for (let m = 1; m <= 12; m++) {
        const key = `${y}${m.toString().padStart(2, '0')}`;
        precip[key] = y < 2023 ? 5 : 2;
        temp[key] = 15;
      }
    }
    vi.stubGlobal(
      'fetch',
      mockFetchJson({ properties: { parameter: { PRECTOTCORR: precip, T2M: temp } } })
    );

    const result = await fetchNasaPowerData(40, -100, NOW);
    expect(result.data!.trend).toBe('decreasing');
  });

  it('returns an error on HTTP 5xx', async () => {
    vi.stubGlobal('fetch', mockFetchJson({}, 504));
    const result = await fetchNasaPowerData(40, -100, NOW);
    expect(result.data).toBeNull();
    expect(result.error).toMatch(/504/);
  });

  it('returns an error when PRECTOTCORR is missing from the response', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetchJson({ properties: { parameter: { T2M: { '202501': 15 } } } })
    );

    const result = await fetchNasaPowerData(40, -100, NOW);
    expect(result.data).toBeNull();
    expect(result.error).toMatch(/precipitation/i);
  });

  it('returns an error when every month is a fill value', async () => {
    const fills: Record<string, number> = {};
    for (let y = START_YEAR; y <= END_YEAR; y++) {
      for (let m = 1; m <= 12; m++) {
        fills[`${y}${m.toString().padStart(2, '0')}`] = -999;
      }
    }
    vi.stubGlobal(
      'fetch',
      mockFetchJson({
        properties: { parameter: { PRECTOTCORR: fills, T2M: { ...fills } } },
      })
    );

    const result = await fetchNasaPowerData(40, -100, NOW);
    expect(result.data).toBeNull();
    expect(result.error).toMatch(/Insufficient/);
  });

  it('returns an error when fetch throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ETIMEDOUT')));
    const result = await fetchNasaPowerData(40, -100, NOW);
    expect(result.data).toBeNull();
    expect(result.error).toMatch(/ETIMEDOUT/);
  });

  it('rejects out-of-range coordinates', async () => {
    const badLat = await fetchNasaPowerData(95, 0, NOW);
    expect(badLat.error).toMatch(/latitude/);

    const badLon = await fetchNasaPowerData(0, -200, NOW);
    expect(badLon.error).toMatch(/longitude/);
  });
});
