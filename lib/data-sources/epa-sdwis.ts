import { WaterViolation } from '@/types/exposure';
import { DataSourceResult, fetchWithRetry } from './types';
import { FIPS_TO_STATE } from './fips';

/**
 * EPA SDWIS — Safe Drinking Water Information System.
 *
 * Two capabilities:
 *   1. lookupWaterSystem — resolve (fipsState, fipsCounty) → PWSID
 *   2. fetchSdwisViolations — pull violation history for a known PWSID
 *
 * The Envirofacts REST API returns field names in **lowercase** (e.g.
 * `pwsid`, `pws_name`). All field access goes through `field()` so we
 * tolerate either casing.
 *
 * Data resolution: AREA-LEVEL (water system level)
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type Row = Record<string, unknown>;

/** Read a field case-insensitively from an Envirofacts row. */
function field(row: Row, name: string): string {
  const v = row[name] ?? row[name.toLowerCase()] ?? row[name.toUpperCase()];
  return v == null ? '' : String(v);
}

function fieldNum(row: Row, name: string): number {
  return parseInt(field(row, name) || '0', 10) || 0;
}

// ---------------------------------------------------------------------------
// Violations
// ---------------------------------------------------------------------------

// Contaminant code → human-readable name mapping (common codes)
const CONTAMINANT_NAMES: Record<string, string> = {
  '1005': 'Lead',
  '1007': 'Copper',
  '1024': 'Fluoride',
  '1025': 'Nitrite',
  '1040': 'Nitrate',
  '1074': 'Arsenic',
  '2050': 'Total Trihalomethanes',
  '2456': 'Total Haloacetic Acids',
  '2950': 'Chlorine',
  '3014': 'E. coli',
  '3100': 'Total Coliform',
  '4000': 'Radionuclides Rule',
  '5000': 'Lead & Copper Rule',
  '5100': 'Stage 1 DBP Rule',
  '5200': 'Stage 2 DBP Rule',
  '5400': 'Ground Water Rule',
  '5500': 'Aircraft Drinking Water Rule',
  '5800': 'Revised Total Coliform Rule',
  '7000': 'Consumer Confidence Report',
  '7500': 'Public Notification Rule',
};

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

    const results: Row[] = await response.json();

    if (!Array.isArray(results) || results.length === 0) {
      return {
        data: [],
        error: null,
        source: 'EPA SDWIS',
        cached: false,
        fetchedAt: new Date().toISOString(),
      };
    }

    const violations: WaterViolation[] = results.map((v) => {
      // The API uses violation_category_code; legacy data may have violation_type_code.
      const categoryCode = (
        field(v, 'violation_category_code') || field(v, 'violation_type_code')
      ).toUpperCase();

      // Contaminant: API uses contaminant_code; look up human-readable name.
      const contaminantCode = field(v, 'contaminant_code');
      const contaminantName = field(v, 'contaminant_name');
      const contaminant = contaminantName
        || CONTAMINANT_NAMES[contaminantCode]
        || contaminantCode
        || 'Unknown';

      // The API provides is_health_based_ind directly (Y/N).
      // Fall back to category code if the indicator is missing.
      const healthInd = field(v, 'is_health_based_ind').toUpperCase();
      const isHealthBased = healthInd === 'Y' ||
        categoryCode === 'MCL' || categoryCode === 'MRDL' || categoryCode === 'TT';

      return {
        type: categoryCode || 'Unknown',
        contaminant,
        beginDate: field(v, 'compl_per_begin_date'),
        endDate: field(v, 'compl_per_end_date') || undefined,
        status: field(v, 'compliance_status_code') || 'Unknown',
        isHealthBased,
      };
    });

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
 * Strategy (ordered by specificity):
 *
 *   1. City name match — query WATER_SYSTEM filtered by state + city_name.
 *      Most precise when city extraction succeeds.
 *
 *   2. ZIP code match — query WATER_SYSTEM filtered by state + zip_code.
 *      Good fallback when city names don't match Envirofacts' conventions.
 *
 *   3. Largest CWS in state — returns the dominant utility. Imprecise
 *      but guarantees *some* result.
 *
 * The Envirofacts REST API returns lowercase field names. All access goes
 * through the `field()` helper.
 */
export async function lookupWaterSystem(
  fipsState: string,
  fipsCounty: string,
  cityHint?: string,
  zipHint?: string
): Promise<WaterSystemInfo | null> {
  const stateAbbrev = FIPS_TO_STATE[fipsState];
  if (!stateAbbrev) {
    console.warn('lookupWaterSystem: unknown FIPS state code', fipsState);
    return null;
  }

  try {
    // ── Strategy 1: City name match in WATER_SYSTEM ─────────────────────
    if (cityHint) {
      const result = await lookupByCity(stateAbbrev, cityHint);
      if (result) {
        console.debug(`[SDWIS] Resolved via city: ${stateAbbrev}/${cityHint} → ${result.pwsid}`);
        return result;
      }
    }

    // ── Strategy 2: ZIP code match in WATER_SYSTEM ──────────────────────
    if (zipHint) {
      const result = await lookupByZip(stateAbbrev, zipHint);
      if (result) {
        console.debug(`[SDWIS] Resolved via zip: ${stateAbbrev}/${zipHint} → ${result.pwsid}`);
        return result;
      }
    }

    // ── Strategy 3: Largest CWS in state (last resort) ──────────────────
    const result = await lookupLargestInState(stateAbbrev);
    if (result) {
      console.debug(`[SDWIS] Resolved via state fallback: ${stateAbbrev} → ${result.pwsid}`);
    } else {
      console.warn(`[SDWIS] No CWS found for state=${stateAbbrev} city=${cityHint} zip=${zipHint}`);
    }
    return result;
  } catch (err) {
    console.error('Water system lookup error:', err);
    return null;
  }
}

/**
 * Query WATER_SYSTEM by state + city_name for addresses where county FIPS
 * is unavailable (Mapbox fallback). Picks the largest active CWS whose
 * city_name matches the geocoded city.
 */
async function lookupByCity(
  stateAbbrev: string,
  city: string
): Promise<WaterSystemInfo | null> {
  // Normalize city: uppercase, strip common suffixes
  const normalizedCity = city.trim().toUpperCase().replace(/\s+(CITY|TOWN|VILLAGE|BOROUGH)$/i, '');
  if (!normalizedCity) return null;

  const url = [
    'https://data.epa.gov/efservice/WATER_SYSTEM',
    `STATE_CODE/${encodeURIComponent(stateAbbrev)}`,
    `CITY_NAME/${encodeURIComponent(normalizedCity)}`,
    'PWS_TYPE_CODE/CWS',
    'PWS_ACTIVITY_CODE/A',
    'ROWS/0:20',
    'JSON',
  ].join('/');

  const response = await fetchWithRetry(url, { timeoutMs: 15_000, retries: 1 });
  if (!response.ok) return null;

  const systems: Row[] = await response.json();
  if (!Array.isArray(systems) || systems.length === 0) return null;

  // Pick the largest by population
  let best = systems[0];
  for (const s of systems) {
    if (fieldNum(s, 'population_served_count') > fieldNum(best, 'population_served_count')) {
      best = s;
    }
  }

  const pwsid = field(best, 'pwsid');
  if (!pwsid) return null;

  return {
    pwsid,
    name: field(best, 'pws_name') || 'Unknown Water System',
    populationServed: fieldNum(best, 'population_served_count'),
    primarySource: field(best, 'primary_source_code'),
  };
}

/**
 * Query WATER_SYSTEM by state + zip_code. Useful when city name doesn't
 * match Envirofacts conventions (e.g. "MIAMI BEACH" vs "MIAMI").
 */
async function lookupByZip(
  stateAbbrev: string,
  zip: string
): Promise<WaterSystemInfo | null> {
  const zip5 = zip.trim().substring(0, 5);
  if (!/^\d{5}$/.test(zip5)) return null;

  const url = [
    'https://data.epa.gov/efservice/WATER_SYSTEM',
    `STATE_CODE/${encodeURIComponent(stateAbbrev)}`,
    `ZIP_CODE/${encodeURIComponent(zip5)}`,
    'PWS_TYPE_CODE/CWS',
    'PWS_ACTIVITY_CODE/A',
    'ROWS/0:20',
    'JSON',
  ].join('/');

  const response = await fetchWithRetry(url, { timeoutMs: 15_000, retries: 1 });
  if (!response.ok) return null;

  const systems: Row[] = await response.json();
  if (!Array.isArray(systems) || systems.length === 0) return null;

  let best = systems[0];
  for (const s of systems) {
    if (fieldNum(s, 'population_served_count') > fieldNum(best, 'population_served_count')) {
      best = s;
    }
  }

  const pwsid = field(best, 'pwsid');
  if (!pwsid) return null;

  return {
    pwsid,
    name: field(best, 'pws_name') || 'Unknown Water System',
    populationServed: fieldNum(best, 'population_served_count'),
    primarySource: field(best, 'primary_source_code'),
  };
}

/**
 * Last resort: return the largest active CWS in the entire state.
 * This is imprecise but guarantees we resolve *some* PWSID for the state.
 */
async function lookupLargestInState(
  stateAbbrev: string
): Promise<WaterSystemInfo | null> {
  const url = [
    'https://data.epa.gov/efservice/WATER_SYSTEM',
    `STATE_CODE/${encodeURIComponent(stateAbbrev)}`,
    'PWS_TYPE_CODE/CWS',
    'PWS_ACTIVITY_CODE/A',
    'ROWS/0:100',
    'JSON',
  ].join('/');

  const response = await fetchWithRetry(url, { timeoutMs: 15_000, retries: 1 });
  if (!response.ok) return null;

  const systems: Row[] = await response.json();
  if (!Array.isArray(systems) || systems.length === 0) return null;

  let best = systems[0];
  for (const s of systems) {
    if (fieldNum(s, 'population_served_count') > fieldNum(best, 'population_served_count')) {
      best = s;
    }
  }

  const pwsid = field(best, 'pwsid');
  if (!pwsid) return null;

  return {
    pwsid,
    name: field(best, 'pws_name') || 'Unknown Water System',
    populationServed: fieldNum(best, 'population_served_count'),
    primarySource: field(best, 'primary_source_code'),
  };
}
