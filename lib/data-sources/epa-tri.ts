/**
 * EPA TRI (Toxics Release Inventory) — annual release quantities by county.
 *
 * Uses the EPA Envirofacts REST API to query TRI_RELEASE_QTY records
 * filtered by state + county FIPS code. Returns total on-site release
 * pounds (fugitive air + stack air + water + underground + land) for
 * the most recent reporting year available.
 *
 * Endpoint: https://data.epa.gov/efservice/
 * Table: TRI_RELEASE_QTY joined with TRI_FACILITY for FIPS filtering
 *
 * Rate limit: Envirofacts is generous but slow (~3-5s per query).
 * No API key required.
 */

import { DataSourceResult, fetchWithRetry } from './types';

export interface TriReleaseData {
  totalOnSiteReleaseLbs: number;
  facilityCount: number;
  reportingYear: number;
  topChemicals: Array<{ chemical: string; lbs: number }>;
}

const ENVIROFACTS_BASE = 'https://data.epa.gov/efservice';

interface TriRow {
  REPORTING_YEAR?: string;
  FACILITY_NAME?: string;
  CHEMICAL?: string;
  TOTAL_RELEASES?: string;
  ON_SITE_RELEASE_TOTAL?: string;
  '5.1_FUGITIVE_AIR'?: string;
  '5.2_STACK_AIR'?: string;
  '5.3_WATER'?: string;
  '5.4_UNDERGROUND'?: string;
  '5.5_LAND'?: string;
}

export async function fetchTriReleasesByCounty(
  fipsState: string,
  fipsCounty: string,
  options: { timeoutMs?: number } = {},
): Promise<DataSourceResult<TriReleaseData>> {
  const fetchedAt = new Date().toISOString();
  const timeoutMs = options.timeoutMs ?? 20_000;

  // Envirofacts uses 2-digit state FIPS and 3-digit county FIPS.
  // TRI_FACILITY table has COUNTY_FIPS_CODE (3 digits) and STATE_ABBR.
  // We query via the combined approach: state FIPS + county code.
  //
  // Use the V_TRI_FORM_R_SCHEDULE_1 view which has release quantities
  // joined with facility info. Filter by state+county FIPS.
  const url =
    `${ENVIROFACTS_BASE}/V_TRI_FORM_R_SCHEDULE_1/` +
    `FIPS_STATE_CODE/${fipsState}/` +
    `FIPS_COUNTY_CODE/${fipsCounty}/` +
    `REPORTING_YEAR/=/2022/` +
    `JSON/`;

  try {
    const response = await fetchWithRetry(url, {
      timeoutMs,
      retries: 2,
    });

    if (!response.ok) {
      // Try prior year as fallback (some counties lag in reporting)
      const fallbackUrl =
        `${ENVIROFACTS_BASE}/V_TRI_FORM_R_SCHEDULE_1/` +
        `FIPS_STATE_CODE/${fipsState}/` +
        `FIPS_COUNTY_CODE/${fipsCounty}/` +
        `REPORTING_YEAR/=/2021/` +
        `JSON/`;

      const fallbackResp = await fetchWithRetry(fallbackUrl, {
        timeoutMs,
        retries: 1,
      });

      if (!fallbackResp.ok) {
        return {
          data: null,
          error: `TRI Envirofacts returned HTTP ${response.status}`,
          source: 'EPA TRI',
          cached: false,
          fetchedAt,
        };
      }

      return parseTriResponse(await fallbackResp.json(), 2021, fetchedAt);
    }

    return parseTriResponse(await response.json(), 2022, fetchedAt);
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

function parseTriResponse(
  json: unknown,
  year: number,
  fetchedAt: string,
): DataSourceResult<TriReleaseData> {
  if (!Array.isArray(json)) {
    return {
      data: { totalOnSiteReleaseLbs: 0, facilityCount: 0, reportingYear: year, topChemicals: [] },
      error: null,
      source: 'EPA TRI',
      cached: false,
      fetchedAt,
    };
  }

  const rows = json as TriRow[];
  const facilities = new Set<string>();
  let totalLbs = 0;
  const chemTotals = new Map<string, number>();

  for (const row of rows) {
    const facility = row.FACILITY_NAME ?? 'Unknown';
    facilities.add(facility);

    const releaseLbs = parseTriNum(row.ON_SITE_RELEASE_TOTAL) ||
      parseTriNum(row.TOTAL_RELEASES) ||
      (parseTriNum(row['5.1_FUGITIVE_AIR']) +
       parseTriNum(row['5.2_STACK_AIR']) +
       parseTriNum(row['5.3_WATER']) +
       parseTriNum(row['5.4_UNDERGROUND']) +
       parseTriNum(row['5.5_LAND']));

    totalLbs += releaseLbs;

    const chem = row.CHEMICAL ?? 'Unknown';
    chemTotals.set(chem, (chemTotals.get(chem) ?? 0) + releaseLbs);
  }

  const topChemicals = Array.from(chemTotals.entries())
    .map(([chemical, lbs]) => ({ chemical, lbs }))
    .sort((a, b) => b.lbs - a.lbs)
    .slice(0, 5);

  return {
    data: {
      totalOnSiteReleaseLbs: Math.round(totalLbs),
      facilityCount: facilities.size,
      reportingYear: year,
      topChemicals,
    },
    error: null,
    source: 'EPA TRI',
    cached: false,
    fetchedAt,
  };
}

function parseTriNum(val: unknown): number {
  if (val === null || val === undefined || val === '') return 0;
  const n = typeof val === 'number' ? val : parseFloat(String(val));
  return Number.isFinite(n) && n >= 0 ? n : 0;
}
