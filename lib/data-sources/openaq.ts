import { AirQualityData, AirQualityMeasurement } from '@/types/exposure';
import { DataSourceResult, fetchWithTimeout } from './types';

/**
 * OpenAQ — Open Air Quality data from global monitoring networks.
 *
 * Uses the OpenAQ v3 API which requires an API key (OPENAQ_API_KEY env var).
 * When the key is absent, returns a clear error so downstream scoring
 * gracefully degrades rather than timing out on a 401.
 *
 * API: https://api.openaq.org/v3/locations (nearest station)
 *      https://api.openaq.org/v3/locations/{id}/latest (measurements)
 *
 * Failure modes:
 *  - No API key → error result, not a crash.
 *  - Remote areas may have no monitor within 25 km → null result.
 *  - OpenAQ may be slow or rate-limited → 4s timeout.
 *  - Monitors may report stale data — `lastUpdated` is included.
 *
 * Data resolution: AREA-LEVEL (nearest station, up to 25 km away)
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const OPENAQ_LOCATIONS_URL = 'https://api.openaq.org/v3/locations';

/** Search radius in meters (25 km). */
const RADIUS_METERS = 25_000;

/** WHO annual PM2.5 guideline: 15 µg/m³ (2021 update). */
const WHO_PM25_GUIDELINE = 15;

// ---------------------------------------------------------------------------
// OpenAQ v3 response types (subset)
// ---------------------------------------------------------------------------

interface OpenAqV3Location {
  id: number;
  name: string;
  coordinates?: { latitude: number; longitude: number };
  sensors?: Array<{
    id: number;
    parameter: { name: string; units: string };
    summary?: { avg?: number; max?: number };
    datetime_last?: { utc?: string };
  }>;
  distance?: number; // meters, when using coordinates filter
}

interface OpenAqV3Response {
  results: OpenAqV3Location[];
}

// ---------------------------------------------------------------------------
// Haversine (inline — avoid circular dependency with utils)
// ---------------------------------------------------------------------------

function distKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function fetchAirQualityData(
  latitude: number,
  longitude: number,
  options: { timeoutMs?: number } = {}
): Promise<DataSourceResult<AirQualityData>> {
  const fetchedAt = new Date().toISOString();
  const source = 'OpenAQ';

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return { data: null, error: 'Invalid coordinates', source, cached: false, fetchedAt };
  }

  const apiKey = process.env.OPENAQ_API_KEY;
  if (!apiKey) {
    return {
      data: null,
      error: 'OpenAQ API key not configured (OPENAQ_API_KEY)',
      source,
      cached: false,
      fetchedAt,
    };
  }

  const timeoutMs = options.timeoutMs ?? 4000;

  const params = new URLSearchParams({
    coordinates: `${latitude},${longitude}`,
    radius: String(RADIUS_METERS),
    limit: '1',
    order_by: 'distance',
    sort: 'asc',
  });

  const url = `${OPENAQ_LOCATIONS_URL}?${params.toString()}`;

  try {
    const response = await fetchWithTimeout(url, {
      timeoutMs,
      headers: {
        Accept: 'application/json',
        'X-API-Key': apiKey,
      },
    });

    if (!response.ok) {
      return {
        data: null,
        error: `OpenAQ API returned HTTP ${response.status}`,
        source,
        cached: false,
        fetchedAt,
      };
    }

    const json = (await response.json()) as OpenAqV3Response;
    const results = json?.results;

    if (!Array.isArray(results) || results.length === 0) {
      return {
        data: null,
        error: 'No air quality monitors found within 25 km',
        source,
        cached: false,
        fetchedAt,
      };
    }

    const nearest = results[0];
    const coords = nearest.coordinates;
    const stationLat = coords?.latitude ?? latitude;
    const stationLon = coords?.longitude ?? longitude;
    const distanceKm = coords
      ? Math.round(distKm(latitude, longitude, stationLat, stationLon) * 10) / 10
      : nearest.distance ? Math.round((nearest.distance / 1000) * 10) / 10 : 0;

    const measurements: AirQualityMeasurement[] = [];
    let exceedsWho = false;

    for (const sensor of nearest.sensors ?? []) {
      const param = sensor.parameter?.name;
      const value = sensor.summary?.avg ?? sensor.summary?.max;
      if (!param || value === undefined || !Number.isFinite(value)) continue;

      measurements.push({
        parameter: param,
        value,
        unit: sensor.parameter?.units ?? '',
        lastUpdated: sensor.datetime_last?.utc ?? '',
      });

      if (param === 'pm25' && value > WHO_PM25_GUIDELINE) {
        exceedsWho = true;
      }
    }

    return {
      data: {
        stationName: nearest.name || 'Unknown Station',
        distanceKm,
        latitude: stationLat,
        longitude: stationLon,
        measurements,
        exceedsWhoGuideline: exceedsWho,
      },
      error: null,
      source,
      cached: false,
      fetchedAt,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown OpenAQ error';
    const isTimeout = err instanceof Error && (err.name === 'AbortError' || msg.includes('abort'));
    return {
      data: null,
      error: isTimeout ? 'OpenAQ request timed out' : msg,
      source,
      cached: false,
      fetchedAt,
    };
  }
}
