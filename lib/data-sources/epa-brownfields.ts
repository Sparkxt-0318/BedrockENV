import { BrownfieldSite } from '@/types/exposure';
import { DataSourceResult, fetchWithRetry } from './types';
import { haversineDistance, cardinalDirection } from '@/lib/utils';

/**
 * EPA Brownfields — contaminated / formerly contaminated land within a
 * search radius of a query point.
 *
 * Queries the EPA Envirofacts `FRS_PROGRAM_FACILITY` view filtered to the
 * BROWNFIELDS program acronym, within a lat/lon bounding box, then filters
 * to the exact haversine radius and sorts nearest-first.
 *
 * Bounding-box math: a degree of latitude ≈ 69 miles. A degree of longitude
 * is `69 * cos(lat)` miles, so we shrink the longitude span by `cos(lat)` to
 * avoid pulling in facilities that are far east/west of a high-latitude
 * query point. `cos` is clamped to 0.05 to keep the math finite near the
 * poles — brownfield programs are effectively US-only so this is defensive.
 *
 * Null/error convention:
 *  - Successful query with zero hits → `{ data: [], error: null }`.
 *  - Transport / HTTP / JSON failure → `{ data: null, error: <msg> }`.
 *
 * Data resolution: PROPERTY-LEVEL (distance from exact coordinates).
 * Cache: 30 days.
 */

export const DEFAULT_BROWNFIELD_RADIUS_MILES = 2;
export const MAX_BROWNFIELD_RESULTS = 50;

interface FrsRow {
  PRIMARY_NAME?: string;
  REGISTRY_ID?: string;
  PGM_SYS_ID?: string;
  PGM_SYS_ACRNM?: string;
  LATITUDE83?: string | number;
  LONGITUDE83?: string | number;
  INTEREST_TYPES?: string;
  FEDERAL_AGENCY_NAME?: string;
}

export async function fetchBrownfieldSites(
  latitude: number,
  longitude: number,
  radiusMiles: number = DEFAULT_BROWNFIELD_RADIUS_MILES
): Promise<DataSourceResult<BrownfieldSite[]>> {
  const fetchedAt = new Date().toISOString();

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return {
      data: null,
      error: 'latitude/longitude must be finite numbers',
      source: 'EPA Brownfields (FRS)',
      cached: false,
      fetchedAt,
    };
  }
  if (!Number.isFinite(radiusMiles) || radiusMiles <= 0) {
    return {
      data: null,
      error: 'radiusMiles must be a positive number',
      source: 'EPA Brownfields (FRS)',
      cached: false,
      fetchedAt,
    };
  }

  const { minLat, maxLat, minLon, maxLon } = boundingBox(
    latitude,
    longitude,
    radiusMiles
  );

  const url =
    `https://data.epa.gov/efservice/FRS_PROGRAM_FACILITY/` +
    `LATITUDE83/${minLat.toFixed(4)}/${maxLat.toFixed(4)}/` +
    `LONGITUDE83/${minLon.toFixed(4)}/${maxLon.toFixed(4)}/` +
    `PGM_SYS_ACRNM/BROWNFIELDS/ROWS/0:${MAX_BROWNFIELD_RESULTS}/JSON`;

  try {
    const response = await fetchWithRetry(url, { timeoutMs: 20_000 });

    if (!response.ok) {
      return {
        data: null,
        error: `EPA Envirofacts returned HTTP ${response.status}`,
        source: 'EPA Brownfields (FRS)',
        cached: false,
        fetchedAt,
      };
    }

    const body = (await response.json()) as unknown;
    if (!Array.isArray(body)) {
      return {
        data: null,
        error: 'EPA Envirofacts returned a malformed response',
        source: 'EPA Brownfields (FRS)',
        cached: false,
        fetchedAt,
      };
    }

    // Empty array is a valid "no brownfields in this radius" result.
    const rows = body as FrsRow[];
    const sites = parseRows(rows, latitude, longitude, radiusMiles);

    return {
      data: sites,
      error: null,
      source: 'EPA Brownfields (FRS)',
      cached: false,
      fetchedAt,
    };
  } catch (err) {
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : 'Unknown error fetching brownfield data',
      source: 'EPA Brownfields (FRS)',
      cached: false,
      fetchedAt,
    };
  }
}

/**
 * Exported for unit testing. A rectangular box that contains the given
 * radius circle. At latitude φ:
 *   dLat = radius / 69
 *   dLon = radius / (69 * max(cos(φ), 0.05))
 */
export function boundingBox(
  latitude: number,
  longitude: number,
  radiusMiles: number
): { minLat: number; maxLat: number; minLon: number; maxLon: number } {
  const MILES_PER_DEGREE_LAT = 69;
  const latRad = (latitude * Math.PI) / 180;
  const cosLat = Math.max(Math.cos(latRad), 0.05);
  const dLat = radiusMiles / MILES_PER_DEGREE_LAT;
  const dLon = radiusMiles / (MILES_PER_DEGREE_LAT * cosLat);
  return {
    minLat: latitude - dLat,
    maxLat: latitude + dLat,
    minLon: longitude - dLon,
    maxLon: longitude + dLon,
  };
}

function parseRows(
  rows: FrsRow[],
  originLat: number,
  originLon: number,
  radiusMiles: number
): BrownfieldSite[] {
  const sites: BrownfieldSite[] = [];
  for (const r of rows) {
    const siteLat = toNum(r.LATITUDE83);
    const siteLon = toNum(r.LONGITUDE83);
    // FRS occasionally records (0, 0) or null-ish coordinates for un-geocoded
    // sites. Drop those — a 0,0 coordinate in the Gulf of Guinea is never a
    // legitimate US brownfield.
    if (!Number.isFinite(siteLat) || !Number.isFinite(siteLon)) continue;
    if (siteLat === 0 && siteLon === 0) continue;

    const dist = haversineDistance(originLat, originLon, siteLat, siteLon);
    if (dist > radiusMiles) continue;

    const dir = cardinalDirection(originLat, originLon, siteLat, siteLon);
    sites.push({
      name: r.PRIMARY_NAME || r.PGM_SYS_ID || 'Unknown Site',
      siteId: r.REGISTRY_ID || r.PGM_SYS_ID || '',
      distance: Math.round(dist * 100) / 100,
      direction: dir,
      contaminantTypes: parseContaminants(r.INTEREST_TYPES),
      cleanupStatus: r.FEDERAL_AGENCY_NAME || 'Status unknown',
      latitude: siteLat,
      longitude: siteLon,
    });
  }
  return sites.sort((a, b) => a.distance - b.distance);
}

function toNum(v: unknown): number {
  if (v === null || v === undefined || v === '') return NaN;
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : NaN;
}

function parseContaminants(raw: string | undefined): string[] {
  if (!raw) return ['Unknown'];
  const parts = raw
    .split(/[,;|]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 5);
  return parts.length > 0 ? parts : ['Unknown'];
}
