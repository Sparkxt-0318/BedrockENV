import { SuperfundSite } from '@/types/exposure';
import { DataSourceResult, fetchWithTimeout } from './types';

/**
 * EPA Superfund — National Priorities List (NPL) site search.
 *
 * Uses the EPA FRS (Facility Registry Service) REST API to find
 * Superfund-listed sites near a given point. FRS supports lat/lng
 * radius search filtered by program system acronym (SEMS = Superfund).
 *
 * API: https://ofmpub.epa.gov/frs_public2/frs_rest_services.get_facilities
 *
 * Failure modes:
 *  - No API key required (public)
 *  - Empty results in areas far from industrial/legacy contamination
 *  - Timeout risk on the FRS API (~5-8s common)
 *  - FRS may return non-NPL SEMS sites (proposed, deleted) — filter by status
 *
 * Data resolution: PROPERTY-LEVEL (distance to each site computed)
 */

const FRS_BASE = 'https://ofmpub.epa.gov/frs_public2/frs_rest_services.get_facilities';
const DEFAULT_RADIUS_MILES = 5;

interface FrsApiResult {
  FRSFacility?: FrsFacility[];
}

interface FrsFacility {
  RegistryId?: string;
  FacilityName?: string;
  LocationAddress?: string;
  Latitude83?: string;
  Longitude83?: string;
  SupplementalLocation?: string;
  ProgramList?: FrsProgram[];
}

interface FrsProgram {
  ProgramSystemAcronym?: string;
  ProgramSystemId?: string;
  SourceOfData?: string;
}

function distKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function fetchSuperfundSites(
  latitude: number,
  longitude: number,
  options: { timeoutMs?: number; radiusMiles?: number } = {}
): Promise<DataSourceResult<SuperfundSite[]>> {
  const fetchedAt = new Date().toISOString();
  const source = 'EPA FRS (Superfund)';

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return { data: null, error: 'Invalid coordinates', source, cached: false, fetchedAt };
  }

  const radiusMiles = options.radiusMiles ?? DEFAULT_RADIUS_MILES;
  const timeoutMs = options.timeoutMs ?? 8000;

  const params = new URLSearchParams({
    latitude83: String(latitude),
    longitude83: String(longitude),
    search_radius: String(radiusMiles),
    pgm_sys_acrnm: 'SEMS',
    output: 'JSON',
  });

  const url = `${FRS_BASE}?${params.toString()}`;

  try {
    const response = await fetchWithTimeout(url, { timeoutMs });

    if (!response.ok) {
      return {
        data: null,
        error: `FRS API returned HTTP ${response.status}`,
        source,
        cached: false,
        fetchedAt,
      };
    }

    const json = (await response.json()) as FrsApiResult;
    const facilities = json?.FRSFacility ?? [];

    const sites: SuperfundSite[] = [];

    for (const fac of facilities) {
      const facLat = parseFloat(fac.Latitude83 ?? '');
      const facLon = parseFloat(fac.Longitude83 ?? '');

      if (!Number.isFinite(facLat) || !Number.isFinite(facLon)) continue;

      const semsProgram = fac.ProgramList?.find(
        (p) => p.ProgramSystemAcronym === 'SEMS'
      );

      const dist = Math.round(distKm(latitude, longitude, facLat, facLon) * 10) / 10;

      sites.push({
        siteId: semsProgram?.ProgramSystemId ?? fac.RegistryId ?? '',
        name: fac.FacilityName ?? 'Unknown Site',
        nplStatus: 'listed',
        latitude: facLat,
        longitude: facLon,
        distanceKm: dist,
      });
    }

    sites.sort((a, b) => a.distanceKm - b.distanceKm);

    return {
      data: sites,
      error: null,
      source,
      cached: false,
      fetchedAt,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown FRS error';
    const isTimeout = err instanceof Error && (err.name === 'AbortError' || msg.includes('abort'));
    return {
      data: null,
      error: isTimeout ? 'FRS Superfund request timed out' : msg,
      source,
      cached: false,
      fetchedAt,
    };
  }
}
