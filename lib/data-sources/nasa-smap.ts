import { SoilMoistureData } from '@/types/exposure';
import { DataSourceResult, fetchWithRetry } from './types';

/**
 * NASA POWER — precipitation + temperature as a soil-moisture proxy.
 *
 * Uses the NASA POWER (Prediction Of Worldwide Energy Resources) API to
 * fetch monthly mean precipitation (PRECTOTCORR, mm/day) and 2-m air
 * temperature (T2M, °C). We compute:
 *   - mean annual precipitation (mm)           — climate baseline
 *   - mean annual temperature (°C)              — climate baseline
 *   - aridity index (De Martonne = P / (T+10))  — diagnostic only
 *   - surface-moisture proxy (0–100)            — simple precipitation scaling
 *   - trend (early vs late window)              — drying vs wetting signal
 *
 * POWER is a ~50 km reanalysis grid. We tag `resolution: 'area'` so the
 * scorer knows this is climatological, not local. The aridity index should
 * be treated as a diagnostic indicator only — it's a first-pass climate
 * signal, not a property-level soil measurement.
 *
 * Fill handling: POWER uses -999 for missing months (rare on land, common
 * over ocean cells). Filter those before averaging and report what fraction
 * of the requested window came back as fill.
 *
 * Community: pinned to 'AG' (agroclimatology) — 'RE' would give subtly
 * different post-processing for renewable-energy use cases.
 *
 * Date window: POWER lags ~2 months, so the default end year is the last
 * completed full calendar year.
 */

const POWER_URL = 'https://power.larc.nasa.gov/api/temporal/monthly/point';
const POWER_COMMUNITY = 'AG';
const POWER_FILL_VALUE = -999;
const WINDOW_YEARS = 5;

interface PowerResponse {
  properties?: {
    parameter?: {
      PRECTOTCORR?: Record<string, number>;
      T2M?: Record<string, number>;
    };
  };
}

export async function fetchNasaPowerData(
  latitude: number,
  longitude: number,
  now: Date = new Date()
): Promise<DataSourceResult<SoilMoistureData>> {
  const fetchedAt = new Date().toISOString();

  if (!Number.isFinite(latitude) || Math.abs(latitude) > 90) {
    return errorResult('latitude out of range', fetchedAt);
  }
  if (!Number.isFinite(longitude) || Math.abs(longitude) > 180) {
    return errorResult('longitude out of range', fetchedAt);
  }

  // POWER publishes monthly aggregates ~2 months after month-end. To avoid
  // requesting months that haven't been published yet, end on the last full
  // calendar year before "now".
  const endYear = now.getUTCFullYear() - 1;
  const startYear = endYear - (WINDOW_YEARS - 1);

  const params = new URLSearchParams({
    parameters: 'PRECTOTCORR,T2M',
    community: POWER_COMMUNITY,
    longitude: longitude.toFixed(4),
    latitude: latitude.toFixed(4),
    start: String(startYear),
    end: String(endYear),
    format: 'JSON',
  });

  const url = `${POWER_URL}?${params.toString()}`;

  try {
    const response = await fetchWithRetry(url, { timeoutMs: 20_000 });

    if (!response.ok) {
      return errorResult(
        `NASA POWER returned HTTP ${response.status}`,
        fetchedAt
      );
    }

    const json = (await response.json()) as PowerResponse;
    const precipRaw = json?.properties?.parameter?.PRECTOTCORR;
    const tempRaw = json?.properties?.parameter?.T2M;

    if (!precipRaw || typeof precipRaw !== 'object') {
      return errorResult('No precipitation data returned', fetchedAt);
    }
    if (!tempRaw || typeof tempRaw !== 'object') {
      return errorResult('No temperature data returned', fetchedAt);
    }

    // POWER returns monthly keys as "YYYYMM" plus annual totals as "YYYY13".
    // We only want the monthly entries.
    const precipEntries = monthlyEntries(precipRaw);
    const tempEntries = monthlyEntries(tempRaw);

    const requestedMonths = WINDOW_YEARS * 12;
    const precipMonths = precipEntries.filter((e) => e.value !== POWER_FILL_VALUE);
    const tempMonths = tempEntries.filter((e) => e.value !== POWER_FILL_VALUE);

    if (precipMonths.length === 0 || tempMonths.length === 0) {
      return errorResult(
        'Insufficient precipitation/temperature data after filtering fills',
        fetchedAt
      );
    }

    const fillFraction =
      requestedMonths > 0
        ? Math.round(
            ((requestedMonths - precipMonths.length) / requestedMonths) * 1000
          ) / 1000
        : 0;

    // PRECTOTCORR is a monthly mean of mm/day. Multiply by an average
    // month length (30.44 days) to get mm/month; sum 12 months for mm/year.
    const meanMmPerDay =
      precipMonths.reduce((s, e) => s + e.value, 0) / precipMonths.length;
    const meanAnnualPrecipMm = meanMmPerDay * 365.25;

    const meanAnnualTempC =
      tempMonths.reduce((s, e) => s + e.value, 0) / tempMonths.length;

    // De Martonne aridity index. Clamp the denominator to a small positive
    // floor so cold-climate cells (mean annual T ≤ -10 °C) don't explode.
    // In those cases the index isn't physically meaningful — report null.
    const deMartonneDenom = meanAnnualTempC + 10;
    const aridityIndex =
      deMartonneDenom > 0.5
        ? Math.round((meanAnnualPrecipMm / deMartonneDenom) * 10) / 10
        : null;

    // Early vs late window trend — split at midpoint of WINDOW_YEARS.
    const midYear = startYear + Math.floor(WINDOW_YEARS / 2);
    const early = precipMonths.filter((e) => e.year < midYear);
    const late = precipMonths.filter((e) => e.year >= midYear);
    const earlyAvg =
      early.length > 0 ? early.reduce((s, e) => s + e.value, 0) / early.length : 0;
    const lateAvg =
      late.length > 0 ? late.reduce((s, e) => s + e.value, 0) / late.length : 0;

    let trend: 'increasing' | 'decreasing' | 'stable';
    const changePct = earlyAvg > 0 ? ((lateAvg - earlyAvg) / earlyAvg) * 100 : 0;
    if (changePct > 10) trend = 'increasing';
    else if (changePct < -10) trend = 'decreasing';
    else trend = 'stable';

    // Surface-moisture proxy: scale precipitation into 0–100. 1800 mm/yr
    // (heavy rain climate) → 100. Under 200 mm/yr (desert) → 0.
    const surfaceMoisture = clamp(
      Math.round(((meanAnnualPrecipMm - 200) / (1800 - 200)) * 100),
      0,
      100
    );

    return {
      data: {
        surfaceMoisture,
        trend,
        precipitationAvgMm: Math.round(meanAnnualPrecipMm * 10) / 10,
        meanAnnualTempC: Math.round(meanAnnualTempC * 10) / 10,
        aridityIndex,
        fillFraction,
        resolution: 'area',
      },
      error: null,
      source: 'NASA POWER',
      cached: false,
      fetchedAt,
    };
  } catch (err) {
    return errorResult(
      err instanceof Error ? err.message : 'Unknown error fetching NASA POWER data',
      fetchedAt
    );
  }
}

interface MonthEntry {
  year: number;
  month: number;
  value: number;
}

function monthlyEntries(
  raw: Record<string, number>
): MonthEntry[] {
  const out: MonthEntry[] = [];
  for (const [key, val] of Object.entries(raw)) {
    if (typeof val !== 'number') continue;
    const m = key.match(/^(\d{4})(\d{2})$/);
    if (!m) continue;
    const month = parseInt(m[2], 10);
    if (month < 1 || month > 12) continue; // drops "YYYY13" annual rollups
    out.push({
      year: parseInt(m[1], 10),
      month,
      value: val,
    });
  }
  return out;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function errorResult(
  message: string,
  fetchedAt: string
): DataSourceResult<SoilMoistureData> {
  return {
    data: null,
    error: message,
    source: 'NASA POWER',
    cached: false,
    fetchedAt,
  };
}
