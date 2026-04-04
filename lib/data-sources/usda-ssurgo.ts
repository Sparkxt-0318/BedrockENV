import { SsurgoData, SoilComponent, SoilHorizon } from '@/types/exposure';
import { DataSourceResult, fetchWithRetry } from './types';

/**
 * USDA SSURGO — Soil survey data via Soil Data Access (SDA) web service.
 *
 * Queries soil properties (texture, pH, organic matter, CEC, Ksat, drainage)
 * for the soil map unit at a given lat/lng point.
 *
 * Data resolution: NEIGHBORHOOD-LEVEL (soil map unit, typically 1–100 acres)
 * Cache: 90 days (SSURGO updates annually)
 */

export async function fetchSsurgoData(
  latitude: number,
  longitude: number
): Promise<DataSourceResult<SsurgoData>> {
  // SDA expects a POST with an SQL-like query
  const query = `
    SELECT
      mu.muname, mu.mukey,
      c.compname, c.comppct_r, c.drainagecl,
      ch.hzname, ch.hzdept_r, ch.hzdepb_r,
      ch.sandtotal_r, ch.silttotal_r, ch.claytotal_r,
      ch.ph1to1h2o_r, ch.om_r, ch.cec7_r, ch.ksat_r
    FROM sacatalog sc
    INNER JOIN legend l ON l.areasymbol = sc.areasymbol
    INNER JOIN mapunit mu ON mu.lkey = l.lkey
    INNER JOIN component c ON c.mukey = mu.mukey
    INNER JOIN chorizon ch ON ch.cokey = c.cokey
    WHERE mu.mukey IN (
      SELECT * FROM SDA_Get_Mukey_from_intersection_with_WktWgs84('POINT(${longitude} ${latitude})')
    )
    AND c.comppct_r > 15
    ORDER BY c.comppct_r DESC, ch.hzdept_r ASC
  `.trim();

  const url = 'https://SDMDataAccess.sc.egov.usda.gov/Tabular/post.rest';

  try {
    const response = await fetchWithRetry(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `query=${encodeURIComponent(query)}&format=JSON`,
      timeoutMs: 20_000,
    });

    if (!response.ok) {
      return {
        data: null,
        error: `USDA SDA returned HTTP ${response.status}`,
        source: 'USDA SSURGO',
        cached: false,
        fetchedAt: new Date().toISOString(),
      };
    }

    const json = await response.json();
    const table = json?.Table;

    if (!Array.isArray(table) || table.length === 0) {
      return {
        data: null,
        error: 'No soil survey data available for this location',
        source: 'USDA SSURGO',
        cached: false,
        fetchedAt: new Date().toISOString(),
      };
    }

    // Parse rows into components and horizons
    const componentMap = new Map<string, { comp: SoilComponent; drainage: string }>();
    let mapUnitName = '';
    let mapUnitKey = '';

    for (const row of table) {
      mapUnitName = row.muname || mapUnitName;
      mapUnitKey = row.mukey || mapUnitKey;

      const compName = row.compname || 'Unknown';
      const compKey = `${compName}-${row.comppct_r}`;

      if (!componentMap.has(compKey)) {
        componentMap.set(compKey, {
          comp: {
            name: compName,
            percentage: parseNum(row.comppct_r),
            horizons: [],
          },
          drainage: row.drainagecl || '',
        });
      }

      const horizon: SoilHorizon = {
        name: row.hzname || '',
        sand: parseNum(row.sandtotal_r),
        silt: parseNum(row.silttotal_r),
        clay: parseNum(row.claytotal_r),
        ph: parseNum(row.ph1to1h2o_r),
        organicMatter: parseNum(row.om_r),
        cec: parseNum(row.cec7_r),
        ksat: parseNum(row.ksat_r),
      };

      componentMap.get(compKey)!.comp.horizons.push(horizon);
    }

    const components = Array.from(componentMap.values());
    const allHorizons = components.flatMap((c) => c.comp.horizons);

    // Compute aggregate properties from surface horizons (top layer)
    const surfaceHorizons = allHorizons.filter(
      (h) => h.ph > 0 || h.organicMatter > 0
    );

    const avgPh = average(surfaceHorizons.map((h) => h.ph).filter((v) => v > 0));
    const avgOm = average(surfaceHorizons.map((h) => h.organicMatter).filter((v) => v > 0));
    const avgCec = average(surfaceHorizons.map((h) => h.cec).filter((v) => v > 0));
    const avgKsat = average(surfaceHorizons.map((h) => h.ksat).filter((v) => v > 0));

    // Determine dominant texture from highest-percentage component's surface horizon
    const dominantComp = components[0];
    const dominantHorizon = dominantComp?.comp.horizons[0];
    const dominantTexture = dominantHorizon
      ? classifyTexture(dominantHorizon.sand, dominantHorizon.silt, dominantHorizon.clay)
      : 'Unknown';

    const drainageClass = dominantComp?.drainage || 'Unknown';

    // pH range
    const phValues = surfaceHorizons.map((h) => h.ph).filter((v) => v > 0);
    const phRange: [number, number] = phValues.length > 0
      ? [Math.min(...phValues), Math.max(...phValues)]
      : [0, 0];

    return {
      data: {
        mapUnitName,
        mapUnitKey,
        components: components.map((c) => c.comp),
        dominantTexture,
        phRange,
        organicMatterPct: Math.round(avgOm * 10) / 10,
        drainageClass,
        cec: Math.round(avgCec * 10) / 10,
        ksat: Math.round(avgKsat * 10) / 10,
      },
      error: null,
      source: 'USDA SSURGO',
      cached: false,
      fetchedAt: new Date().toISOString(),
    };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Unknown error fetching SSURGO data',
      source: 'USDA SSURGO',
      cached: false,
      fetchedAt: new Date().toISOString(),
    };
  }
}

function parseNum(val: unknown): number {
  if (val === null || val === undefined || val === '') return 0;
  const n = parseFloat(String(val));
  return isNaN(n) ? 0 : n;
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

/**
 * Simplified USDA soil texture classification from sand/silt/clay percentages.
 */
function classifyTexture(sand: number, silt: number, clay: number): string {
  if (sand + silt + clay < 50) return 'Unknown';
  if (clay >= 40) return 'Clay';
  if (sand >= 85) return 'Sand';
  if (silt >= 80) return 'Silt';
  if (clay >= 27 && sand >= 20 && sand <= 45) return 'Clay loam';
  if (clay >= 27 && sand < 20) return 'Silty clay loam';
  if (clay >= 20 && clay < 35 && silt < 28 && sand > 45) return 'Sandy clay loam';
  if (clay < 27 && silt >= 50) return 'Silt loam';
  if (sand >= 43 && sand <= 85 && clay < 20) return 'Sandy loam';
  return 'Loam';
}
