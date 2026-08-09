export interface SdaRow {
  muname?: string | null;
  mukey?: string | null;
  compname?: string | null;
  compkind?: string | null;
  comppct_r?: number | string | null;
  drainagecl?: string | null;
  hydgrp?: string | null;
  hzname?: string | null;
  hzdept_r?: number | string | null;
  hzdepb_r?: number | string | null;
  sandtotal_r?: number | string | null;
  silttotal_r?: number | string | null;
  claytotal_r?: number | string | null;
  ph1to1h2o_r?: number | string | null;
  om_r?: number | string | null;
  cec7_r?: number | string | null;
  ksat_r?: number | string | null;
}

export const SDA_URL =
  'https://SDMDataAccess.sc.egov.usda.gov/Tabular/SDMTabularService/post.rest';

export const SDA_QUERY = `
  SELECT
    mu.muname, mu.mukey,
    c.compname, c.compkind, c.comppct_r, c.drainagecl, c.hydgrp,
    ch.hzname, ch.hzdept_r, ch.hzdepb_r,
    ch.sandtotal_r, ch.silttotal_r, ch.claytotal_r,
    ch.ph1to1h2o_r, ch.om_r, ch.cec7_r, ch.ksat_r
  FROM mapunit mu
  INNER JOIN component c ON c.mukey = mu.mukey
  LEFT OUTER JOIN chorizon ch ON ch.cokey = c.cokey
  WHERE mu.mukey IN (
    SELECT mukey FROM SDA_Get_Mukey_from_intersection_with_WktWgs84('POINT(__LON__ __LAT__)')
  )
  ORDER BY c.comppct_r DESC, ch.hzdept_r ASC
`.trim();

/** Surface horizon band (cm). Residential exposure — root zone / garden soil. */
export const SURFACE_DEPTH_CM = 25;

/**
 * SDA returns one of two shapes depending on the `format` flag:
 *  - `JSON+COLUMNNAME`: `{ Table: [[header1, header2, ...], [val1, val2, ...], ...] }`
 *  - `JSON`:           `{ Table: [{col1: val1, col2: val2}, ...] }`
 * We accept both so schema shifts don't break the client.
 *
 * Returns null when the payload is malformed, [] when the query legitimately
 * returned zero rows.
 */
export function parseSdaResponse(json: unknown): SdaRow[] | null {
  if (!json || typeof json !== 'object') return null;
  const table = (json as { Table?: unknown }).Table;
  if (!Array.isArray(table)) return null;
  if (table.length === 0) return [];

  // Array-of-arrays shape: first element is headers.
  if (Array.isArray(table[0])) {
    const headers = (table[0] as unknown[]).map((h) => String(h));
    const rows: SdaRow[] = [];
    for (let i = 1; i < table.length; i++) {
      const vals = table[i];
      if (!Array.isArray(vals)) continue;
      const row: Record<string, unknown> = {};
      for (let c = 0; c < headers.length; c++) {
        row[headers[c]] = vals[c] ?? null;
      }
      rows.push(row as SdaRow);
    }
    return rows;
  }

  // Array-of-objects shape.
  if (typeof table[0] === 'object' && table[0] !== null) {
    return table as SdaRow[];
  }

  return null;
}
