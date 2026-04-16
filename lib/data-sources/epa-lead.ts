import { LeadRiskData, RiskTier } from '@/types/exposure';
import { DataSourceResult, fetchWithRetry } from './types';

/**
 * Lead service line risk assessment using Census housing age data.
 *
 * Uses American Community Survey Table B25034 (Year Structure Built)
 * to estimate the probability of lead plumbing in a census block group.
 *
 * - Pre-1950: high probability of lead service lines
 * - Pre-1986: lead solder was commonly used in plumbing
 * - Post-1986: Safe Drinking Water Act amendments banned lead solder
 *
 * Data resolution: NEIGHBORHOOD-LEVEL (census block group)
 * Cache: 90 days (ACS data updates annually)
 */

// ACS B25034 table field codes (Year Structure Built)
// _001E = Total, _010E = 1940-1949, _011E = 1939 or earlier
// _008E = 1960-1969, _009E = 1950-1959
// For pre-1986 we need: _007E (1970-1979) + _008E + _009E + _010E + _011E
// Actually the table breakdown:
// _002E: 2020 or later, _003E: 2010-2019, _004E: 2000-2009
// _005E: 1990-1999, _006E: 1980-1989, _007E: 1970-1979
// _008E: 1960-1969, _009E: 1950-1959, _010E: 1940-1949, _011E: 1939 or earlier

const FIELDS = [
  'B25034_001E', // Total housing units
  'B25034_007E', // 1970-1979
  'B25034_008E', // 1960-1969
  'B25034_009E', // 1950-1959
  'B25034_010E', // 1940-1949
  'B25034_011E', // 1939 or earlier
].join(',');

export async function fetchLeadRiskData(
  fipsState: string,
  fipsCounty: string,
  censusTract: string,
  censusBlockGroup: string
): Promise<DataSourceResult<LeadRiskData>> {
  // Guard: Census ACS requires state, county, tract, and block group.
  // Mapbox-geocoded addresses lack tract/block group — skip rather than
  // sending a malformed request that returns HTTP 400.
  if (!fipsState || !fipsCounty || !censusTract || !censusBlockGroup) {
    return {
      data: null,
      error: 'Census tract/block group not available (Mapbox geocoded)',
      source: 'U.S. Census ACS B25034',
      cached: false,
      fetchedAt: new Date().toISOString(),
    };
  }

  const apiKey = process.env.CENSUS_API_KEY;
  const keyParam = apiKey ? `&key=${apiKey}` : '';

  const url = `https://api.census.gov/data/2022/acs/acs5?get=${FIELDS}&for=block%20group:${censusBlockGroup}&in=state:${fipsState}%20county:${fipsCounty}%20tract:${censusTract}${keyParam}`;

  try {
    const response = await fetchWithRetry(url, { timeoutMs: 15_000 });

    if (!response.ok) {
      return {
        data: null,
        error: `Census API returned HTTP ${response.status}`,
        source: 'U.S. Census ACS B25034',
        cached: false,
        fetchedAt: new Date().toISOString(),
      };
    }

    const json = await response.json();

    // Census API returns [[headers], [values]]
    if (!Array.isArray(json) || json.length < 2) {
      return {
        data: null,
        error: 'No housing age data available for this block group',
        source: 'U.S. Census ACS B25034',
        cached: false,
        fetchedAt: new Date().toISOString(),
      };
    }

    const headers: string[] = json[0];
    const values: string[] = json[1];

    function getVal(field: string): number {
      const idx = headers.indexOf(field);
      if (idx === -1) return 0;
      const v = parseInt(values[idx], 10);
      return isNaN(v) || v < 0 ? 0 : v;
    }

    const total = getVal('B25034_001E');
    if (total === 0) {
      return {
        data: null,
        error: 'No housing units in this block group',
        source: 'U.S. Census ACS B25034',
        cached: false,
        fetchedAt: new Date().toISOString(),
      };
    }

    // Pre-1950 = built 1940-1949 + 1939 or earlier
    const pre1950 = getVal('B25034_010E') + getVal('B25034_011E');

    // Pre-1986 = 1970-1979 + 1960-1969 + 1950-1959 + pre-1950
    const pre1986 =
      getVal('B25034_007E') +
      getVal('B25034_008E') +
      getVal('B25034_009E') +
      pre1950;

    const pctPre1950 = Math.round((pre1950 / total) * 100);
    const pctPre1986 = Math.round((pre1986 / total) * 100);

    // Determine risk tier
    let riskTier: RiskTier;
    if (pctPre1950 > 30) {
      riskTier = 'HIGH';
    } else if (pctPre1986 > 50) {
      riskTier = 'ELEVATED';
    } else if (pctPre1986 > 25) {
      riskTier = 'MODERATE';
    } else {
      riskTier = 'LOW';
    }

    return {
      data: {
        pctPreA1950: pctPre1950,
        pctPre1986: pctPre1986,
        riskTier,
        resolution: 'neighborhood',
      },
      error: null,
      source: 'U.S. Census ACS B25034 (2022)',
      cached: false,
      fetchedAt: new Date().toISOString(),
    };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Unknown error fetching Census data',
      source: 'U.S. Census ACS B25034',
      cached: false,
      fetchedAt: new Date().toISOString(),
    };
  }
}
