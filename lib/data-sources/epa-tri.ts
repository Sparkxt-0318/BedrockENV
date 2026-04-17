/**
 * EPA TRI (Toxics Release Inventory) — facility counts and release estimates.
 *
 * Uses the EPA Envirofacts REST API to query TRI_REPORTING_FORM records
 * filtered by state abbreviation + county name. Returns facility count
 * and estimated release quantities.
 *
 * Endpoint: https://data.epa.gov/efservice/TRI_REPORTING_FORM
 * Filters: STATE_ABBR, COUNTY_NAME, REPORTING_YEAR
 *
 * Limitation: Annual on-site release totals live in TRI_RELEASE_QTY which
 * does NOT support COUNTY_NAME filtering (only doc_ctrl_num). Envirofacts
 * multi-table JOINs produce Cartesian products, not proper JOINs.
 * We use one_time_release_qty from TRI_REPORTING_FORM as a lower-bound
 * proxy until a proper TRI API is available.
 *
 * No API key required. Rate limit is generous but responses are slow (3-5s).
 */

import { DataSourceResult, fetchWithRetry } from './types';
import { FIPS_TO_STATE } from './fips';

export interface TriReleaseData {
  totalOnSiteReleaseLbs: number;
  facilityCount: number;
  topChemicals: Array<{ chemical: string; lbs: number }>;
}

const ENVIROFACTS_BASE = 'https://data.epa.gov/efservice';

interface TriFormRow {
  doc_ctrl_num?: string;
  tri_facility_id?: string;
  cas_chem_name?: string;
  reporting_year?: string | number;
  one_time_release_qty?: number | string | null;
}

export async function fetchTriReleasesByCounty(
  stateAbbr: string,
  countyName: string,
  options: { timeoutMs?: number } = {},
): Promise<DataSourceResult<TriReleaseData>> {
  const fetchedAt = new Date().toISOString();
  const timeoutMs = options.timeoutMs ?? 25_000;

  const normalizedCounty = countyName.toUpperCase().replace(/\s+COUNTY$/i, '').trim();
  const normalizedState = stateAbbr.toUpperCase().trim();

  // Query TRI_REPORTING_FORM — supports county-level filtering
  const url =
    `${ENVIROFACTS_BASE}/TRI_REPORTING_FORM/` +
    `STATE_ABBR/${normalizedState}/` +
    `COUNTY_NAME/${encodeURIComponent(normalizedCounty)}/` +
    `REPORTING_YEAR/2022/` +
    `rows/0:499/JSON/`;

  try {
    const resp = await fetchWithRetry(url, { timeoutMs, retries: 2 });

    if (!resp.ok) {
      // Fallback to 2021
      const fallbackUrl =
        `${ENVIROFACTS_BASE}/TRI_REPORTING_FORM/` +
        `STATE_ABBR/${normalizedState}/` +
        `COUNTY_NAME/${encodeURIComponent(normalizedCounty)}/` +
        `REPORTING_YEAR/2021/` +
        `rows/0:499/JSON/`;
      const fallbackResp = await fetchWithRetry(fallbackUrl, { timeoutMs, retries: 1 });
      if (!fallbackResp.ok) {
        return {
          data: null,
          error: `TRI Envirofacts returned HTTP ${resp.status}`,
          source: 'EPA TRI',
          cached: false,
          fetchedAt,
        };
      }
      return parseFormResponse(await fallbackResp.json(), fetchedAt);
    }

    return parseFormResponse(await resp.json(), fetchedAt);
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Unknown TRI fetch error',
      source: 'EPA TRI',
      cached: false,
      fetchedAt,
    };
  }
}

function parseFormResponse(
  json: unknown,
  fetchedAt: string,
): DataSourceResult<TriReleaseData> {
  if (!Array.isArray(json) || json.length === 0) {
    return {
      data: { totalOnSiteReleaseLbs: 0, facilityCount: 0, topChemicals: [] },
      error: null,
      source: 'EPA TRI',
      cached: false,
      fetchedAt,
    };
  }

  const rows = json as TriFormRow[];
  const facilities = new Set<string>();
  let totalLbs = 0;
  const chemTotals = new Map<string, number>();

  for (const row of rows) {
    if (row.tri_facility_id) facilities.add(row.tri_facility_id);

    const qty = parseTriNum(row.one_time_release_qty);
    totalLbs += qty;

    if (qty > 0) {
      const chem = row.cas_chem_name ?? 'Unknown';
      chemTotals.set(chem, (chemTotals.get(chem) ?? 0) + qty);
    }
  }

  const topChemicals = Array.from(chemTotals.entries())
    .map(([chemical, lbs]) => ({ chemical, lbs: Math.round(lbs) }))
    .sort((a, b) => b.lbs - a.lbs)
    .slice(0, 5);

  return {
    data: {
      totalOnSiteReleaseLbs: Math.round(totalLbs),
      facilityCount: facilities.size,
      topChemicals,
    },
    error: null,
    source: 'EPA TRI',
    cached: false,
    fetchedAt,
  };
}

/**
 * Convenience wrapper accepting FIPS codes. countyName must be provided
 * since there's no standard FIPS→county-name table in the codebase.
 */
export async function fetchTriReleasesByFips(
  fipsState: string,
  countyName: string,
  options: { timeoutMs?: number } = {},
): Promise<DataSourceResult<TriReleaseData>> {
  const stateAbbr = FIPS_TO_STATE[fipsState];
  if (!stateAbbr) {
    return {
      data: null,
      error: `Unknown state FIPS: ${fipsState}`,
      source: 'EPA TRI',
      cached: false,
      fetchedAt: new Date().toISOString(),
    };
  }
  return fetchTriReleasesByCounty(stateAbbr, countyName, options);
}

function parseTriNum(val: unknown): number {
  if (val === null || val === undefined || val === '') return 0;
  const n = typeof val === 'number' ? val : parseFloat(String(val));
  return Number.isFinite(n) && n >= 0 ? n : 0;
}
