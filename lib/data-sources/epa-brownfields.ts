import { BrownfieldSite } from '@/types/exposure';
import { DataSourceResult, fetchWithRetry } from './types';
import { haversineDistance, cardinalDirection } from '@/lib/utils';

/**
 * EPA Brownfields — Contaminated land sites within a search radius.
 *
 * Queries EPA Envirofacts for brownfield assessment sites near a given lat/lng.
 *
 * Data resolution: PROPERTY-LEVEL (distance computed from exact coordinates)
 * Cache: 30 days
 */

const SEARCH_RADIUS_MILES = 2;

export async function fetchBrownfieldSites(
  latitude: number,
  longitude: number
): Promise<DataSourceResult<BrownfieldSite[]>> {
  // EPA FRS (Facility Registry Service) is more reliable for proximity searches.
  // Query brownfield program facilities within a bounding box.
  const degreeOffset = SEARCH_RADIUS_MILES / 69; // rough degrees per mile
  const minLat = latitude - degreeOffset;
  const maxLat = latitude + degreeOffset;
  const minLng = longitude - degreeOffset;
  const maxLng = longitude + degreeOffset;

  const url = `https://data.epa.gov/efservice/FRS_PROGRAM_FACILITY/LATITUDE83/${minLat.toFixed(4)}/${maxLat.toFixed(4)}/LONGITUDE83/${minLng.toFixed(4)}/${maxLng.toFixed(4)}/PGM_SYS_ACRNM/BROWNFIELDS/ROWS/0:50/JSON`;

  try {
    const response = await fetchWithRetry(url, { timeoutMs: 20_000 });

    if (!response.ok) {
      // Try the alternative brownfields endpoint
      return await fetchBrownfieldsAlternate(latitude, longitude);
    }

    const results = await response.json();

    if (!Array.isArray(results) || results.length === 0) {
      // Try alternate endpoint
      return await fetchBrownfieldsAlternate(latitude, longitude);
    }

    const sites: BrownfieldSite[] = results
      .map((r: Record<string, string>) => {
        const siteLat = parseFloat(r.LATITUDE83 || '0');
        const siteLng = parseFloat(r.LONGITUDE83 || '0');
        const dist = haversineDistance(latitude, longitude, siteLat, siteLng);
        const dir = cardinalDirection(latitude, longitude, siteLat, siteLng);

        return {
          name: r.PRIMARY_NAME || r.PGM_SYS_ID || 'Unknown Site',
          siteId: r.REGISTRY_ID || r.PGM_SYS_ID || '',
          distance: Math.round(dist * 100) / 100,
          direction: dir,
          contaminantTypes: parseContaminants(r.INTEREST_TYPES || ''),
          cleanupStatus: r.FEDERAL_AGENCY_NAME || 'Status unknown',
          latitude: siteLat,
          longitude: siteLng,
        };
      })
      .filter((s: BrownfieldSite) => s.distance <= SEARCH_RADIUS_MILES)
      .sort((a: BrownfieldSite, b: BrownfieldSite) => a.distance - b.distance);

    return {
      data: sites,
      error: null,
      source: 'EPA Brownfields (via FRS)',
      cached: false,
      fetchedAt: new Date().toISOString(),
    };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Unknown error fetching brownfield data',
      source: 'EPA Brownfields',
      cached: false,
      fetchedAt: new Date().toISOString(),
    };
  }
}

/**
 * Alternative brownfields query using the direct brownfields assessments table.
 */
async function fetchBrownfieldsAlternate(
  latitude: number,
  longitude: number
): Promise<DataSourceResult<BrownfieldSite[]>> {
  const degreeOffset = SEARCH_RADIUS_MILES / 69;
  const minLat = latitude - degreeOffset;
  const maxLat = latitude + degreeOffset;
  const minLng = longitude - degreeOffset;
  const maxLng = longitude + degreeOffset;

  const url = `https://data.epa.gov/efservice/BROWNFIELDS_PROPERTY_LOCATIONS/LATITUDE/${minLat.toFixed(4)}/${maxLat.toFixed(4)}/LONGITUDE/${minLng.toFixed(4)}/${maxLng.toFixed(4)}/ROWS/0:50/JSON`;

  try {
    const response = await fetchWithRetry(url, { timeoutMs: 15_000 });

    if (!response.ok) {
      return {
        data: [],
        error: null, // No brownfields found is not an error
        source: 'EPA Brownfields',
        cached: false,
        fetchedAt: new Date().toISOString(),
      };
    }

    const results = await response.json();

    if (!Array.isArray(results) || results.length === 0) {
      return {
        data: [],
        error: null,
        source: 'EPA Brownfields',
        cached: false,
        fetchedAt: new Date().toISOString(),
      };
    }

    const sites: BrownfieldSite[] = results
      .map((r: Record<string, string>) => {
        const siteLat = parseFloat(r.LATITUDE || '0');
        const siteLng = parseFloat(r.LONGITUDE || '0');
        const dist = haversineDistance(latitude, longitude, siteLat, siteLng);
        const dir = cardinalDirection(latitude, longitude, siteLat, siteLng);

        return {
          name: r.PROPERTY_NAME || 'Unknown Site',
          siteId: r.PROPERTY_ID || '',
          distance: Math.round(dist * 100) / 100,
          direction: dir,
          contaminantTypes: parseContaminants(r.CONTAMINANT_NAME || r.MEDIA || ''),
          cleanupStatus: r.ASSESSMENT_TYPE || 'Status unknown',
          latitude: siteLat,
          longitude: siteLng,
        };
      })
      .filter((s: BrownfieldSite) => s.distance <= SEARCH_RADIUS_MILES)
      .sort((a: BrownfieldSite, b: BrownfieldSite) => a.distance - b.distance);

    return {
      data: sites,
      error: null,
      source: 'EPA Brownfields',
      cached: false,
      fetchedAt: new Date().toISOString(),
    };
  } catch {
    return {
      data: [],
      error: null,
      source: 'EPA Brownfields',
      cached: false,
      fetchedAt: new Date().toISOString(),
    };
  }
}

function parseContaminants(raw: string): string[] {
  if (!raw) return ['Unknown'];
  return raw
    .split(/[,;|]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 5);
}
