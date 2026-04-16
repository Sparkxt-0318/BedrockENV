import { DataSourceResult, fetchWithTimeout } from './types';

/**
 * CDC/ATSDR Social Vulnerability Index (SVI).
 *
 * Queries the CDC SVI data by census tract FIPS code. SVI ranks each
 * tract on 16 social factors grouped into 4 themes:
 *   1. Socioeconomic Status
 *   2. Household Characteristics & Disability
 *   3. Minority Status & Language
 *   4. Housing Type & Transportation
 *
 * Each theme and the overall SVI are expressed as national percentile
 * ranks (0–1). Higher = more socially vulnerable.
 *
 * API: CDC SocioNeeds/SVI ArcGIS Feature Service
 *
 * Failure modes:
 *  - Requires census tract (state + county + tract)
 *  - Rural tracts may have suppressed data (-999 sentinel)
 *  - Data updated every 2 years (may be 1-2 years stale)
 *  - ArcGIS service can be slow (~5-8s)
 *
 * Data resolution: NEIGHBORHOOD-LEVEL (census tract)
 */

const SVI_BASE = 'https://services1.arcgis.com/0MSEUqKaxRlEPj5g/ArcGIS/rest/services/CDC_SVI/FeatureServer/0/query';

export interface SviData {
  /** Overall SVI percentile (0–1). Higher = more vulnerable. */
  overallSvi: number;
  /** Theme 1: Socioeconomic status percentile. */
  socioeconomicSvi: number;
  /** Theme 2: Household characteristics & disability percentile. */
  householdSvi: number;
  /** Theme 3: Minority status & language percentile. */
  minoritySvi: number;
  /** Theme 4: Housing type & transportation percentile. */
  housingSvi: number;
  /** Census tract FIPS (11-digit). */
  tractFips: string;
  /** Total population of the tract. */
  totalPopulation: number;
}

interface ArcGisResponse {
  features?: Array<{
    attributes?: Record<string, string | number | null>;
  }>;
  error?: { message?: string };
}

export async function fetchSviData(
  fipsState: string,
  fipsCounty: string,
  censusTract: string,
  options: { timeoutMs?: number } = {}
): Promise<DataSourceResult<SviData>> {
  const fetchedAt = new Date().toISOString();
  const source = 'CDC SVI';

  if (!fipsState || !fipsCounty || !censusTract) {
    return {
      data: null,
      error: 'Census tract not available for SVI lookup',
      source,
      cached: false,
      fetchedAt,
    };
  }

  const timeoutMs = options.timeoutMs ?? 8000;
  const tractFips = `${fipsState}${fipsCounty}${censusTract}`;

  const params = new URLSearchParams({
    where: `FIPS='${tractFips}'`,
    outFields: 'FIPS,RPL_THEMES,RPL_THEME1,RPL_THEME2,RPL_THEME3,RPL_THEME4,E_TOTPOP',
    f: 'json',
    returnGeometry: 'false',
  });

  const url = `${SVI_BASE}?${params.toString()}`;

  try {
    const response = await fetchWithTimeout(url, { timeoutMs });

    if (!response.ok) {
      return {
        data: null,
        error: `SVI API returned HTTP ${response.status}`,
        source,
        cached: false,
        fetchedAt,
      };
    }

    const json = (await response.json()) as ArcGisResponse;

    if (json.error) {
      return {
        data: null,
        error: `SVI API error: ${json.error.message ?? 'Unknown'}`,
        source,
        cached: false,
        fetchedAt,
      };
    }

    const feature = json.features?.[0];
    if (!feature?.attributes) {
      return {
        data: null,
        error: 'No SVI data for this census tract',
        source,
        cached: false,
        fetchedAt,
      };
    }

    const attrs = feature.attributes;

    const pn = (key: string): number => {
      const v = attrs[key];
      if (v === null || v === undefined || v === -999) return 0;
      const n = typeof v === 'number' ? v : parseFloat(String(v));
      return Number.isFinite(n) && n >= 0 ? n : 0;
    };

    return {
      data: {
        overallSvi: pn('RPL_THEMES'),
        socioeconomicSvi: pn('RPL_THEME1'),
        householdSvi: pn('RPL_THEME2'),
        minoritySvi: pn('RPL_THEME3'),
        housingSvi: pn('RPL_THEME4'),
        tractFips,
        totalPopulation: Math.round(pn('E_TOTPOP')),
      },
      error: null,
      source,
      cached: false,
      fetchedAt,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown SVI error';
    const isTimeout = err instanceof Error && (err.name === 'AbortError' || msg.includes('abort'));
    return {
      data: null,
      error: isTimeout ? 'SVI request timed out' : msg,
      source,
      cached: false,
      fetchedAt,
    };
  }
}
