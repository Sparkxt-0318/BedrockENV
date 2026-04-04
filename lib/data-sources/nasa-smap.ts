import { SoilMoistureData } from '@/types/exposure';
import { DataSourceResult, fetchWithRetry } from './types';

/**
 * NASA POWER API — Precipitation and temperature data as soil moisture proxy.
 *
 * Uses the NASA POWER (Prediction of Worldwide Energy Resources) API to get
 * monthly precipitation and temperature data. This is used as a proxy for
 * soil moisture conditions when SMAP satellite data isn't available.
 *
 * Data resolution: AREA-LEVEL (~50km grid)
 * Cache: 30 days
 */

const POWER_URL = 'https://power.larc.nasa.gov/api/temporal/monthly/point';

export async function fetchNasaPowerData(
  latitude: number,
  longitude: number
): Promise<DataSourceResult<SoilMoistureData>> {
  const endYear = new Date().getFullYear() - 1;
  const startYear = endYear - 4; // 5 years of data

  const params = new URLSearchParams({
    parameters: 'PRECTOTCORR,T2M',
    community: 'AG',
    longitude: longitude.toFixed(4),
    latitude: latitude.toFixed(4),
    start: String(startYear),
    end: String(endYear),
    format: 'JSON',
  });

  const url = `${POWER_URL}?${params}`;

  try {
    const response = await fetchWithRetry(url, { timeoutMs: 20_000 });

    if (!response.ok) {
      return {
        data: null,
        error: `NASA POWER returned HTTP ${response.status}`,
        source: 'NASA POWER',
        cached: false,
        fetchedAt: new Date().toISOString(),
      };
    }

    const json = await response.json();
    const precip = json?.properties?.parameter?.PRECTOTCORR;

    if (!precip) {
      return {
        data: null,
        error: 'No precipitation data available for this location',
        source: 'NASA POWER',
        cached: false,
        fetchedAt: new Date().toISOString(),
      };
    }

    // Parse monthly precipitation values
    // Keys are in format "YYYYMM", values are mm/day
    const precipValues = Object.entries(precip)
      .filter(([, v]) => typeof v === 'number' && (v as number) >= 0)
      .map(([key, v]) => ({
        yearMonth: key,
        year: parseInt(key.substring(0, 4)),
        month: parseInt(key.substring(4)),
        value: v as number,
      }));

    if (precipValues.length === 0) {
      return {
        data: null,
        error: 'Insufficient precipitation data',
        source: 'NASA POWER',
        cached: false,
        fetchedAt: new Date().toISOString(),
      };
    }

    // Average monthly precipitation (mm/day → mm/month approximation)
    const avgPrecip =
      precipValues.reduce((s, p) => s + p.value, 0) / precipValues.length;
    const avgPrecipMmMonth = avgPrecip * 30; // Approximate mm per month

    // Determine trend: compare recent 2 years vs earlier years
    const midYear = startYear + 2;
    const earlyValues = precipValues.filter((p) => p.year <= midYear);
    const lateValues = precipValues.filter((p) => p.year > midYear);

    const earlyAvg = earlyValues.length > 0
      ? earlyValues.reduce((s, p) => s + p.value, 0) / earlyValues.length
      : 0;
    const lateAvg = lateValues.length > 0
      ? lateValues.reduce((s, p) => s + p.value, 0) / lateValues.length
      : 0;

    let trend: 'increasing' | 'decreasing' | 'stable';
    const changePct = earlyAvg > 0 ? ((lateAvg - earlyAvg) / earlyAvg) * 100 : 0;
    if (changePct > 10) trend = 'increasing';
    else if (changePct < -10) trend = 'decreasing';
    else trend = 'stable';

    // Estimate surface moisture from precipitation (simplified proxy)
    // High precip = higher moisture, scale 0–100
    const surfaceMoisture = Math.min(100, Math.round((avgPrecipMmMonth / 150) * 100));

    return {
      data: {
        surfaceMoisture,
        trend,
        precipitationAvgMm: Math.round(avgPrecipMmMonth * 10) / 10,
        resolution: 'area',
      },
      error: null,
      source: 'NASA POWER',
      cached: false,
      fetchedAt: new Date().toISOString(),
    };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Unknown error fetching NASA POWER data',
      source: 'NASA POWER',
      cached: false,
      fetchedAt: new Date().toISOString(),
    };
  }
}
