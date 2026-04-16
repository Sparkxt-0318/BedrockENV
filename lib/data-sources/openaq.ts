import { AirQualityData, AirQualityMeasurement } from '@/types/exposure';
import { DataSourceResult, fetchWithTimeout } from './types';

/**
 * OpenAQ — Open Air Quality data from global monitoring networks.
 *
 * Queries the OpenAQ v2 "latest" endpoint for the nearest air quality
 * monitoring station within 25 km of a given point. Returns the most
 * recent measurement for each parameter (PM2.5, PM10, O3, NO2, SO2, CO).
 *
 * API: https://api.openaq.org/v2/latest
 *
 * Failure modes:
 *  - Remote areas may have no monitor within 25 km → empty result.
 *  - OpenAQ may be slow or rate-limited → 4s timeout.
 *  - Monitors may report stale data (weeks old) — `lastUpdated` is included.
 *
 * Data resolution: AREA-LEVEL (nearest station, up to 25 km away)
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const OPENAQ_LATEST_URL = 'https://api.openaq.org/v2/latest';

/** Search radius in meters (25 km). */
const RADIUS_METERS = 25_000;

/** WHO annual PM2.5 guideline: 15 µg/m³ (2021 update). */
const WHO_PM25_GUIDELINE = 15;

/** Maximum locations to request. */
const MAX_LOCATIONS = 5;

// ---------------------------------------------------------------------------
// OpenAQ v2 response types (subset)
// ---------------------------------------------------------------------------

interface OpenAqMeasurement {
  parameter: string;
  value: number;
  lastUpdated: string;
  unit: string;
}

interface OpenAqResult {
  location: string;
  coordinates?: { latitude: number; longitude: number };
  measurements: OpenAqMeasurement[];
  distance?: number; // present when using coordinates filter
}

interface OpenAqResponse {
  results: OpenAqResult[];
}

// ---------------------------------------------------------------------------
// Haversine (inline — avoid circular dependency with utils)
// ---------------------------------------------------------------------------

function distKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // km
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

  const timeoutMs = options.timeoutMs ?? 4000;

  const params = new URLSearchParams({
    coordinates: `${latitude},${longitude}`,
    radius: String(RADIUS_METERS),
    limit: String(MAX_LOCATIONS),
    order_by: 'distance',
    sort: 'asc',
  });

  const url = `${OPENAQ_LATEST_URL}?${params.toString()}`;

  try {
    const response = await fetchWithTimeout(url, {
      timeoutMs,
      headers: { Accept: 'application/json' },
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

    const json = (await response.json()) as OpenAqResponse;
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

    // Take the nearest station
    const nearest = results[0];
    const coords = nearest.coordinates;
    const stationLat = coords?.latitude ?? latitude;
    const stationLon = coords?.longitude ?? longitude;
    const distanceKm = coords
      ? Math.round(distKm(latitude, longitude, stationLat, stationLon) * 10) / 10
      : 0;

    const measurements: AirQualityMeasurement[] = [];
    let exceedsWho = false;

    for (const m of nearest.measurements) {
      if (!Number.isFinite(m.value)) continue;

      measurements.push({
        parameter: m.parameter,
        value: m.value,
        unit: m.unit,
        lastUpdated: m.lastUpdated,
      });

      if (m.parameter === 'pm25' && m.value > WHO_PM25_GUIDELINE) {
        exceedsWho = true;
      }
    }

    return {
      data: {
        stationName: nearest.location || 'Unknown Station',
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
