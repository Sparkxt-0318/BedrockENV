import { SsurgoData } from '@/types/exposure';
import { DataSourceResult, fetchWithRetry } from './types';
import { SDA_URL, SDA_QUERY, parseSdaResponse } from './usda-ssurgo-types';
import { aggregateRows, unmappedPlaceholder } from './usda-ssurgo-aggregator';

/**
 * USDA SSURGO — soil survey data via the Soil Data Access (SDA) Tabular web
 * service.
 *
 * Queries soil properties (texture, pH, organic matter, CEC, Ksat, drainage)
 * for the soil map unit at a given lat/lng point. SDA does NOT provide a JSON
 * REST endpoint — instead it accepts an SQL-like query and returns rows.
 *
 * The query joins mapunit → component → chorizon and uses
 * `SDA_Get_Mukey_from_intersection_with_WktWgs84('POINT(lon lat)')` to resolve
 * the mapunit at the query point. **WKT order is (lon, lat) — swapping them
 * silently returns zero rows.**
 *
 * Aggregation:
 *  - Skip miscellaneous areas (compkind='Miscellaneous area') and components
 *    with null comppct_r; these are rock outcrops / water / urban land that
 *    carry no chemistry.
 *  - For each remaining component, average horizons that intersect the 0–25
 *    cm band (surface horizon, residential-exposure-relevant), weighted by
 *    the intersected thickness in that band.
 *  - Report aggregates weighted across components by `comppct_r`.
 *
 * Coverage:
 *  - 'mapped'   — at least one surveyed component with non-null chemistry
 *  - 'partial'  — intersection found but every component had all-null
 *                 chemistry (urban-land / water / rock)
 *  - 'unmapped' — SDA returned zero rows (not surveyed here)
 *
 * Data resolution: NEIGHBORHOOD-LEVEL (map unit, typically 1–100 acres)
 * Cache: 90 days (SSURGO updates annually).
 */

export async function fetchSsurgoData(
  latitude: number,
  longitude: number
): Promise<DataSourceResult<SsurgoData>> {
  const fetchedAt = new Date().toISOString();

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return {
      data: null,
      error: 'latitude/longitude must be finite numbers',
      source: 'USDA SSURGO',
      cached: false,
      fetchedAt,
    };
  }

  // WKT uses (lon lat) order. This is the most common source of silent
  // zero-row responses — tests verify that swapping returns unmapped.
  const query = SDA_QUERY
    .replace('__LON__', longitude.toString())
    .replace('__LAT__', latitude.toString());

  try {
    const response = await fetchWithRetry(SDA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, format: 'JSON+COLUMNNAME' }),
      timeoutMs: 25_000,
    });

    if (!response.ok) {
      return {
        data: null,
        error: `USDA SDA returned HTTP ${response.status}`,
        source: 'USDA SSURGO',
        cached: false,
        fetchedAt,
      };
    }

    const json = (await response.json()) as unknown;
    const rows = parseSdaResponse(json);

    if (rows === null) {
      return {
        data: null,
        error: 'USDA SDA returned a malformed response',
        source: 'USDA SSURGO',
        cached: false,
        fetchedAt,
      };
    }

    if (rows.length === 0) {
      return {
        data: unmappedPlaceholder(),
        error: null,
        source: 'USDA SSURGO',
        cached: true,
        fetchedAt,
      };
    }

    const aggregated = aggregateRows(rows);
    return {
      data: aggregated,
      error: null,
      source: 'USDA SSURGO',
      cached: false,
      fetchedAt,
    };
  } catch (err) {
    return {
      data: null,
      error:
        err instanceof Error ? err.message : 'Unknown error fetching SSURGO data',
      source: 'USDA SSURGO',
      cached: false,
      fetchedAt,
    };
  }
}
