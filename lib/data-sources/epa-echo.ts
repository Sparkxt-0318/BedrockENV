import { EchoFacility, EchoData } from '@/types/exposure';
import { DataSourceResult, fetchWithTimeout } from './types';

/**
 * EPA ECHO — Enforcement and Compliance History Online.
 *
 * Two-step API flow:
 *   1. `get_facilities` with lat/lng/radius → returns a QueryID and summary stats
 *   2. `get_qid` with the QueryID → returns paginated facility rows
 *
 * The API does NOT return longitude in facility rows, so we cannot compute
 * haversine distances. Instead, we rely on ECHO's radius filter and report
 * distance as 0 (within the search radius).
 *
 * API: https://echodata.epa.gov/echo/echo_rest_services
 *
 * Data resolution: PROPERTY-LEVEL (within specified radius)
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ECHO_BASE = 'https://echodata.epa.gov/echo/echo_rest_services';
const DEFAULT_RADIUS_MILES = 3;
const MAX_RESULTS = 25;

// ---------------------------------------------------------------------------
// ECHO API response types
// ---------------------------------------------------------------------------

interface EchoSearchResponse {
  Results?: {
    Message?: string;
    QueryID?: string;
    QueryRows?: string;
    SVRows?: string;
    CAARows?: string;
    CWARows?: string;
    RCRRows?: string;
    TRIRows?: string;
  };
}

interface EchoFacilityRow {
  RegistryID?: string;
  FacName?: string;
  FacLat?: string;
  FacCity?: string;
  FacState?: string;
  FacSNCFlg?: string;  // Significant Non-Compliance flag (Y/N)
  FacComplianceStatus?: string;
  FacActiveFlag?: string;
  CAAComplianceStatus?: string;
  CWAComplianceStatus?: string;
  RCRAComplianceStatus?: string;
  SDWAComplianceStatus?: string;
  AIRFlag?: string;
  TRIFlag?: string;
  CAAHpvFlag?: string;
}

interface EchoQidResponse {
  Results?: {
    Facilities?: EchoFacilityRow[];
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

  // Step 1: Get QueryID
  const searchParams = new URLSearchParams({
    output: 'JSON',
    p_lat: String(latitude),
    p_long: String(longitude),
    p_radius: String(radiusMiles),
  });

  const searchUrl = `${ECHO_BASE}.get_facilities?${searchParams.toString()}`;

  try {
    const searchResp = await fetchWithTimeout(searchUrl, { timeoutMs });
    if (!searchResp.ok) {
      return {
        data: null,
        error: `ECHO search returned HTTP ${searchResp.status}`,
        source,
        cached: false,
        fetchedAt,
      };
    }

    const searchJson = (await searchResp.json()) as EchoSearchResponse;
    const qid = searchJson?.Results?.QueryID;
    const totalRows = parseInt(searchJson?.Results?.QueryRows ?? '0', 10);
    const sncTotal = parseInt(searchJson?.Results?.SVRows ?? '0', 10);

    if (!qid || totalRows === 0) {
      return {
        data: { facilities: [], significantViolationCount: 0, totalCount: 0 },
        error: null,
        source,
        cached: false,
        fetchedAt,
      };
    }

    // Step 2: Fetch facility details using QueryID
    const qidParams = new URLSearchParams({
      output: 'JSON',
      qid,
      pageno: '1',
      pagesize: String(MAX_RESULTS),
    });

    const qidUrl = `${ECHO_BASE}.get_qid?${qidParams.toString()}`;
    const qidResp = await fetchWithTimeout(qidUrl, { timeoutMs });

    if (!qidResp.ok) {
      // Still return summary data from step 1 even if step 2 fails
      return {
        data: {
          facilities: [],
          significantViolationCount: sncTotal,
          totalCount: totalRows,
        },
        error: `ECHO facility fetch returned HTTP ${qidResp.status}`,
        source,
        cached: false,
        fetchedAt,
      };
    }

    const qidJson = (await qidResp.json()) as EchoQidResponse;
    const rows = qidJson?.Results?.Facilities ?? [];

    const facilities: EchoFacility[] = [];
    let sncCount = 0;

    for (const row of rows) {
      if (row.FacActiveFlag === 'N') continue;

      const programs: string[] = [];
      if (row.CWAComplianceStatus && row.CWAComplianceStatus !== 'None') programs.push('CWA');
      if (row.RCRAComplianceStatus && row.RCRAComplianceStatus !== 'None') programs.push('RCRA');
      if (row.CAAComplianceStatus && row.CAAComplianceStatus !== 'None') programs.push('CAA');
      if (row.SDWAComplianceStatus && row.SDWAComplianceStatus !== 'None') programs.push('SDWIS');
      if (row.AIRFlag === 'Y') programs.push('AIR');
      if (row.TRIFlag === 'Y') programs.push('TRI');

      const isSNC = row.FacSNCFlg === 'Y';
      if (isSNC) sncCount++;

      const facLat = parseFloat(row.FacLat ?? '');

      facilities.push({
        registryId: row.RegistryID ?? '',
        name: row.FacName ?? 'Unknown Facility',
        // ECHO API doesn't return longitude in paginated results — we report 0
        // since all results are within the search radius.
        distance: 0,
        direction: '',
        latitude: Number.isFinite(facLat) ? facLat : 0,
        longitude: 0,
        programs,
        complianceStatus: row.FacComplianceStatus ?? 'Unknown',
        significantViolation: isSNC,
      });
    }

    return {
      data: {
        facilities,
        significantViolationCount: sncCount,
        totalCount: totalRows,
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
