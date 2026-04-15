import { BrownfieldSite } from '@/types/exposure';
import { DataSourceResult, fetchWithRetry } from './types';
import { haversineDistance, cardinalDirection } from '@/lib/utils';

/**
 * EPA Brownfields — contaminated / formerly contaminated land within a
 * search radius of a query point.
 *
 * Uses the EPA NEPAssist ArcGIS REST service (`NEPAVELayersPublic_fgdb`
 * layer 13 — "Brownfields") rather than the Envirofacts efservice REST
 * endpoint. The Envirofacts FRS_PROGRAM_FACILITY table no longer carries
 * latitude/longitude columns (confirmed 2026-04 — the schema was trimmed
 * and the bounding-box filter returns rows from unrelated states /
 * countries), so it cannot be used for proximity queries. ArcGIS gives us
 * a proper spatial envelope query and returns rows with `latitude` /
 * `longitude` fields already populated.
 *
 * Null/error convention:
 *  - Successful query with zero hits → `{ data: [], error: null }`.
 *  - Transport / HTTP / JSON failure → `{ data: null, error: <msg> }`.
 *  - ArcGIS error envelopes (`{error:{code,message}}`) are treated as
 *    failures even when the HTTP status is 200.
 *
 * Data resolution: PROPERTY-LEVEL (distance from exact coordinates).
 * Cache: 30 days.
 */

export const DEFAULT_BROWNFIELD_RADIUS_MILES = 2;
export const MAX_BROWNFIELD_RESULTS = 50;

const BROWNFIELDS_URL =
  'https://geopub.epa.gov/arcgis/rest/services/NEPAssist/NEPAVELayersPublic_fgdb/MapServer/13/query';

interface ArcgisFeature {
  attributes?: {
    registry_id?: string | null;
    primary_name?: string | null;
    location_address?: string | null;
    city_name?: string | null;
    state_code?: string | null;
    latitude?: number | string | null;
    longitude?: number | string | null;
    pgm_sys_id?: string | null;
    pgm_sys_acrnm?: string | null;
  };
}

interface ArcgisResponse {
  features?: ArcgisFeature[];
  error?: { code?: number; message?: string };
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
      source: 'EPA Brownfields (NEPAssist)',
      cached: false,
      fetchedAt,
    };
  }
  if (!Number.isFinite(radiusMiles) || radiusMiles <= 0) {
    return {
      data: null,
      error: 'radiusMiles must be a positive number',
      source: 'EPA Brownfields (NEPAssist)',
      cached: false,
      fetchedAt,
    };
  }

  const { minLat, maxLat, minLon, maxLon } = boundingBox(
    latitude,
    longitude,
    radiusMiles
  );

  const envelope = {
    xmin: minLon,
    ymin: minLat,
    xmax: maxLon,
    ymax: maxLat,
    spatialReference: { wkid: 4326 },
  };

  const params = new URLSearchParams({
    geometry: JSON.stringify(envelope),
    geometryType: 'esriGeometryEnvelope',
    inSR: '4326',
    spatialRel: 'esriSpatialRelIntersects',
    outFields:
      'registry_id,primary_name,location_address,city_name,state_code,latitude,longitude,pgm_sys_id,pgm_sys_acrnm',
    returnGeometry: 'false',
    resultRecordCount: String(MAX_BROWNFIELD_RESULTS),
    f: 'json',
  });

  const url = `${BROWNFIELDS_URL}?${params.toString()}`;

  try {
    const response = await fetchWithRetry(url, { timeoutMs: 20_000 });

    if (!response.ok) {
      return {
        data: null,
        error: `EPA NEPAssist returned HTTP ${response.status}`,
        source: 'EPA Brownfields (NEPAssist)',
        cached: false,
        fetchedAt,
      };
    }

    const json = (await response.json()) as ArcgisResponse;

    // ArcGIS returns HTTP 200 with an error envelope for invalid params.
    if (json && json.error) {
      return {
        data: null,
        error: `EPA NEPAssist error ${json.error.code ?? '?'}: ${json.error.message ?? 'unknown'}`,
        source: 'EPA Brownfields (NEPAssist)',
        cached: false,
        fetchedAt,
      };
    }

    const features = Array.isArray(json?.features) ? json!.features! : null;
    if (features === null) {
      return {
        data: null,
        error: 'EPA NEPAssist returned a malformed response (no features array)',
        source: 'EPA Brownfields (NEPAssist)',
        cached: false,
        fetchedAt,
      };
    }

    const sites = parseFeatures(features, latitude, longitude, radiusMiles);

    return {
      data: sites,
      error: null,
      source: 'EPA Brownfields (NEPAssist)',
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
      source: 'EPA Brownfields (NEPAssist)',
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

function parseFeatures(
  features: ArcgisFeature[],
  originLat: number,
  originLon: number,
  radiusMiles: number
): BrownfieldSite[] {
  const sites: BrownfieldSite[] = [];
  for (const f of features) {
    const attrs = f.attributes;
    if (!attrs) continue;

    const siteLat = toNum(attrs.latitude);
    const siteLon = toNum(attrs.longitude);
    // Drop null-islands and un-geocoded records.
    if (!Number.isFinite(siteLat) || !Number.isFinite(siteLon)) continue;
    if (siteLat === 0 && siteLon === 0) continue;

    const dist = haversineDistance(originLat, originLon, siteLat, siteLon);
    if (dist > radiusMiles) continue;

    const dir = cardinalDirection(originLat, originLon, siteLat, siteLon);
    sites.push({
      name:
        attrs.primary_name ||
        attrs.pgm_sys_id ||
        attrs.registry_id ||
        'Unknown Site',
      siteId: attrs.registry_id || attrs.pgm_sys_id || '',
      distance: Math.round(dist * 100) / 100,
      direction: dir,
      // NEPAssist does not expose contaminant-type metadata — that lives in
      // ACRES, which is not publicly queryable. Record the EPA program
      // acronym so downstream consumers can at least identify which database
      // this site came from (typically 'ACRES').
      contaminantTypes: attrs.pgm_sys_acrnm
        ? [attrs.pgm_sys_acrnm]
        : ['Unknown'],
      cleanupStatus: 'Status unknown',
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
