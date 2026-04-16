import { EchoFacility, EchoData } from '@/types/exposure';
import { DataSourceResult, fetchWithTimeout } from './types';
import { haversineDistance, cardinalDirection } from '@/lib/utils';

/**
 * EPA ECHO — Enforcement and Compliance History Online.
 *
 * Queries the ECHO Facility Search REST API for regulated facilities
 * near a given point. Returns facilities regulated under CWA (water),
 * RCRA (hazardous waste), CAA (air), and other programs, along with
 * their compliance status.
 *
 * Significant non-compliance (SNC) flags nearby indicate active
 * environmental enforcement issues — a proximity risk signal.
 *
 * API: https://echodata.epa.gov/echo/echo_rest_services.get_facilities
 *
 * Data resolution: PROPERTY-LEVEL (distance from exact coordinates)
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ECHO_FACILITIES_URL =
  'https://echodata.epa.gov/echo/echo_rest_services.get_facilities';

/** Search radius in miles. */
const DEFAULT_RADIUS_MILES = 3;

/** Max facilities to return. */
const MAX_RESULTS = 25;

// ---------------------------------------------------------------------------
// ECHO API response types (subset)
// ---------------------------------------------------------------------------

interface EchoApiRow {
  RegistryID?: string;
  FacName?: string;
  FacLat?: string;
  FacLong?: string;
  CWAPermitStatusFlag?: string;
  RCRAPermitStatusFlag?: string;
  CAAPermitStatusFlag?: string;
  SDWISFlag?: string;
  TRIFlag?: string;
  CurrSvFlag?: string; // Current Significant Violation flag (Y/N)
  CurrVioFlag?: string; // Current Violation flag (Y/N)
  CurrComplianceStatus?: string;
}

interface EchoApiResponse {
  Results?: {
    Facilities?: EchoApiRow[];
    Message?: string;
    QueryRows?: string;
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function fetchEchoFacilities(
  latitude: number,
  longitude: number,
  options: { timeoutMs?: number; radiusMiles?: number } = {}
): Promise<DataSourceResult<EchoData>> {
  const fetchedAt = new Date().toISOString();
  const source = 'EPA ECHO';

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return { data: null, error: 'Invalid coordinates', source, cached: false, fetchedAt };
  }

  const radiusMiles = options.radiusMiles ?? DEFAULT_RADIUS_MILES;
  const timeoutMs = options.timeoutMs ?? 4000;

  const params = new URLSearchParams({
    output: 'JSON',
    p_lat: String(latitude),
    p_long: String(longitude),
    p_radius: String(radiusMiles),
    responseset: String(MAX_RESULTS),
  });

  const url = `${ECHO_FACILITIES_URL}?${params.toString()}`;

  try {
    const response = await fetchWithTimeout(url, { timeoutMs });

    if (!response.ok) {
      return {
        data: null,
        error: `ECHO API returned HTTP ${response.status}`,
        source,
        cached: false,
        fetchedAt,
      };
    }

    const json = (await response.json()) as EchoApiResponse;
    const rows = json?.Results?.Facilities;

    if (!Array.isArray(rows) || rows.length === 0) {
      return {
        data: { facilities: [], significantViolationCount: 0, totalCount: 0 },
        error: null,
        source,
        cached: false,
        fetchedAt,
      };
    }

    const facilities: EchoFacility[] = [];
    let sncCount = 0;

    for (const row of rows) {
      const facLat = parseFloat(row.FacLat ?? '');
      const facLon = parseFloat(row.FacLong ?? '');
      if (!Number.isFinite(facLat) || !Number.isFinite(facLon)) continue;

      const dist = haversineDistance(latitude, longitude, facLat, facLon);
      if (dist > radiusMiles) continue;

      const programs: string[] = [];
      if (row.CWAPermitStatusFlag === 'Y') programs.push('CWA');
      if (row.RCRAPermitStatusFlag === 'Y') programs.push('RCRA');
      if (row.CAAPermitStatusFlag === 'Y') programs.push('CAA');
      if (row.SDWISFlag === 'Y') programs.push('SDWIS');
      if (row.TRIFlag === 'Y') programs.push('TRI');

      const isSNC = row.CurrSvFlag === 'Y';
      if (isSNC) sncCount++;

      facilities.push({
        registryId: row.RegistryID ?? '',
        name: row.FacName ?? 'Unknown Facility',
        distance: Math.round(dist * 100) / 100,
        direction: cardinalDirection(latitude, longitude, facLat, facLon),
        latitude: facLat,
        longitude: facLon,
        programs,
        complianceStatus: row.CurrComplianceStatus ?? 'Unknown',
        significantViolation: isSNC,
      });
    }

    // Sort by distance
    facilities.sort((a, b) => a.distance - b.distance);

    return {
      data: {
        facilities,
        significantViolationCount: sncCount,
        totalCount: facilities.length,
      },
      error: null,
      source,
      cached: false,
      fetchedAt,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown ECHO error';
    const isTimeout = err instanceof Error && (err.name === 'AbortError' || msg.includes('abort'));
    return {
      data: null,
      error: isTimeout ? 'ECHO request timed out' : msg,
      source,
      cached: false,
      fetchedAt,
    };
  }
}
