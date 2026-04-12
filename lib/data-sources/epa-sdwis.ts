import { WaterViolation } from '@/types/exposure';
import { DataSourceResult, fetchWithRetry } from './types';
import { FIPS_TO_STATE } from './fips';

/**
 * EPA SDWIS — Safe Drinking Water Information System violations.
 *
 * Queries violation history for a given public water system (PWSID).
 *
 * Data resolution: AREA-LEVEL (water system level)
 * Cache: 7 days (violations can update frequently)
 */

// Health-based violation type codes (MCL violations are more severe than monitoring)
const HEALTH_BASED_TYPES = new Set([
  'MCL',   // Maximum Contaminant Level
  'MRDL',  // Maximum Residual Disinfectant Level
  'TT',    // Treatment Technique
]);

export async function fetchSdwisViolations(
  pwsid: string
): Promise<DataSourceResult<WaterViolation[]>> {
  const url = `https://data.epa.gov/efservice/VIOLATION/PWSID/${pwsid}/ROWS/0:100/JSON`;

  try {
    const response = await fetchWithRetry(url, { timeoutMs: 15_000 });

    if (!response.ok) {
      return {
        data: null,
        error: `EPA SDWIS API returned HTTP ${response.status}`,
        source: 'EPA SDWIS',
        cached: false,
        fetchedAt: new Date().toISOString(),
      };
    }

    const results = await response.json();

    if (!Array.isArray(results) || results.length === 0) {
      return {
        data: [],
        error: null,
        source: 'EPA SDWIS',
        cached: false,
        fetchedAt: new Date().toISOString(),
      };
    }

    const violations: WaterViolation[] = results.map(
      (v: Record<string, string>) => ({
        type: v.VIOLATION_TYPE_CODE || 'Unknown',
        contaminant: v.CONTAMINANT_NAME || v.CONTAMINANT_CODE || 'Unknown',
        beginDate: v.COMPL_PER_BEGIN_DATE || '',
        endDate: v.COMPL_PER_END_DATE || undefined,
        status: v.COMPLIANCE_STATUS_CODE || 'Unknown',
        isHealthBased: HEALTH_BASED_TYPES.has(v.VIOLATION_TYPE_CODE || ''),
      })
    );

    // Sort newest first
    violations.sort(
      (a, b) => new Date(b.beginDate).getTime() - new Date(a.beginDate).getTime()
    );

    return {
      data: violations,
      error: null,
      source: 'EPA SDWIS',
      cached: false,
      fetchedAt: new Date().toISOString(),
    };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Unknown error fetching SDWIS data',
      source: 'EPA SDWIS',
      cached: false,
      fetchedAt: new Date().toISOString(),
    };
  }
}

/**
 * Compute violation summary statistics for scoring.
 */
export function computeViolationStats(violations: WaterViolation[]) {
  const now = new Date();
  const fiveYearsAgo = new Date(now.getFullYear() - 5, now.getMonth(), now.getDate());
  const tenYearsAgo = new Date(now.getFullYear() - 10, now.getMonth(), now.getDate());

  const recent5yr = violations.filter(
    (v) => new Date(v.beginDate) >= fiveYearsAgo
  );
  const recent10yr = violations.filter(
    (v) => new Date(v.beginDate) >= tenYearsAgo
  );

  const healthBased5yr = recent5yr.filter((v) => v.isHealthBased);
  const activeViolations = violations.filter(
    (v) => !v.endDate || v.status === 'O' || v.status === 'Open'
  );

  // Unique contaminants in health-based violations
  const contaminantSet = new Set(
    healthBased5yr.map((v) => v.contaminant)
  );

  return {
    total: violations.length,
    last5Years: recent5yr.length,
    last10Years: recent10yr.length,
    healthBased5yr: healthBased5yr.length,
    activeCount: activeViolations.length,
    violationContaminants: Array.from(contaminantSet),
  };
}

// ---------------------------------------------------------------------------
// PWSID Lookup
// ---------------------------------------------------------------------------

export interface WaterSystemInfo {
  pwsid: string;
  name: string;
  populationServed: number;
  primarySource: string;
}

/**
 * Look up the serving public water system (PWSID) for a given location.
 *
 * Queries EPA SDWIS via Envirofacts for active Community Water Systems (CWS)
 * in the given state. Returns the system with the highest population served —
 * which is the dominant utility for the county in the vast majority of cases.
 *
 * Limitations (acceptable for MVP):
 * - County-level matching is not available via SDWIS API; we pick by
 *   population heuristic.
 * - Some addresses are served by small or non-community systems not in CWS.
 */
export async function lookupWaterSystem(
  fipsState: string,
  fipsCounty: string
): Promise<WaterSystemInfo | null> {
  // EPA SDWIS uses 2-letter state abbreviations, not FIPS codes
  const stateAbbrev = FIPS_TO_STATE[fipsState];
  if (!stateAbbrev) {
    console.warn('lookupWaterSystem: unknown FIPS state code', fipsState);
    return null;
  }

  // Query active CWSs in this state (server-side filters reduce payload)
  const url = [
    'https://data.epa.gov/efservice/WATER_SYSTEM',
    `STATE_CODE/${encodeURIComponent(stateAbbrev)}`,
    'PWS_TYPE_CODE/CWS',
    'PWS_ACTIVITY_CODE/A',
    'ROWS/0:50',
    'JSON',
  ].join('/');

  try {
    const response = await fetchWithRetry(url, { timeoutMs: 15_000, retries: 1 });

    if (!response.ok) {
      console.error(`EPA SDWIS water system lookup HTTP ${response.status}`);
      return null;
    }

    const systems: Record<string, string>[] = await response.json();

    if (!Array.isArray(systems) || systems.length === 0) {
      console.warn(`No active CWS found for state ${stateAbbrev}`);
      return null;
    }

    // Prefer systems whose COUNTIES_SERVED contains the county FIPS.
    // COUNTIES_SERVED is a free-text field (county names or FIPS), so we also
    // check as a numeric match. Fall back to the largest system by population.
    const byCounty = systems.find((s) => {
      const counties = (s.COUNTIES_SERVED || '').toLowerCase();
      return counties.includes(fipsCounty);
    });

    const best = byCounty ?? systems.reduce((a, b) => {
      const popA = parseInt(a.POPULATION_SERVED_COUNT || '0', 10);
      const popB = parseInt(b.POPULATION_SERVED_COUNT || '0', 10);
      return popB > popA ? b : a;
    });

    return {
      pwsid: best.PWSID || '',
      name: best.PWS_NAME || 'Unknown Water System',
      populationServed: parseInt(best.POPULATION_SERVED_COUNT || '0', 10),
      primarySource: best.PRIMARY_SOURCE_CODE || '',
    };
  } catch (err) {
    console.error('Water system lookup error:', err);
    return null;
  }
}
