import { WqpDetection, WqpPfasData } from '@/types/exposure';
import { DataSourceResult, fetchWithTimeout } from './types';
import { boundingBox } from './epa-brownfields';

/**
 * USGS Water Quality Portal (WQP) — ambient water quality monitoring data.
 *
 * Queries the WQP v3 Result endpoint by bounding box for PFAS-related
 * characteristic names. Returns CSV which is parsed in-process.
 *
 * Critical for locations where UCMR 5 data is absent (e.g. Hoosick Falls,
 * Yellowstone) because WQP covers surface water, groundwater, and ambient
 * monitoring sites that aren't tied to a PWSID.
 *
 * API: https://www.waterqualitydata.us/wqx3/Result/search
 * (v3 endpoint — the legacy /data/ endpoint does not support JSON reliably)
 *
 * Data resolution: AREA-LEVEL (~7-mile bbox around query point)
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const WQP_RESULT_URL = 'https://www.waterqualitydata.us/wqx3/Result/search';

/** Bounding box radius in miles for the WQP query. */
const BBOX_RADIUS_MILES = 7;

/**
 * Key PFAS characteristic names used by WQP / USGS monitoring programs.
 */
const PFAS_CHARACTERISTICS = [
  'Perfluorooctanoic acid',
  'Perfluorooctanesulfonic acid (PFOS)',
  'Perfluorooctane sulfonate',
  'Perfluorobutanesulfonic acid (PFBS)',
  'Perfluorohexanesulfonic acid (PFHxS)',
  'Perfluorononanoic acid (PFNA)',
  'Perfluorodecanoic acid (PFDA)',
  'Hexafluoropropylene oxide dimer acid (HFPO-DA)',
  'GenX',
];

/** EPA MCL for PFOS/PFOA: 4 ng/L (4 ppt). */
const EPA_MCL_PPT = 4;

// ---------------------------------------------------------------------------
// Unit conversion
// ---------------------------------------------------------------------------

/**
 * Normalize a WQP result value to ng/L (ppt).
 * Common WQP units:
 *   ug/l  = µg/L = ppb → ×1000 to get ppt
 *   ng/l  = ng/L = ppt → ×1
 *   mg/l  = mg/L = ppm → ×1_000_000 to get ppt
 */
export function toPpt(value: number, unit: string): number {
  const u = unit.toLowerCase().replace(/\s/g, '');
  if (u === 'ng/l') return value;
  if (u === 'ug/l' || u === 'µg/l') return value * 1000;
  if (u === 'mg/l') return value * 1_000_000;
  // Fallback: assume ng/L if unit is unrecognized
  return value;
}

// ---------------------------------------------------------------------------
// CSV parsing (lightweight, no external deps)
// ---------------------------------------------------------------------------

/**
 * Parse a simple CSV string into an array of objects.
 * Handles quoted fields containing commas. Not a full RFC 4180 parser
 * but sufficient for the well-formatted WQP v3 output.
 */
export function parseCsv(text: string): Record<string, string>[] {
  const lines = text.split('\n').filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    const row: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j] ?? '';
    }
    rows.push(row);
  }
  return rows;
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      fields.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());
  return fields;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function fetchWqpPfasData(
  latitude: number,
  longitude: number,
  options: { timeoutMs?: number } = {}
): Promise<DataSourceResult<WqpPfasData>> {
  const fetchedAt = new Date().toISOString();
  const source = 'USGS WQP';

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return { data: null, error: 'Invalid coordinates', source, cached: false, fetchedAt };
  }

  const { minLon, minLat, maxLon, maxLat } = boundingBox(latitude, longitude, BBOX_RADIUS_MILES);

  // WQP v3 expects date as MM-DD-YYYY
  const fiveYearsAgo = new Date();
  fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
  const mm = String(fiveYearsAgo.getMonth() + 1).padStart(2, '0');
  const dd = String(fiveYearsAgo.getDate()).padStart(2, '0');
  const yyyy = fiveYearsAgo.getFullYear();
  const startDate = `${mm}-${dd}-${yyyy}`;

  // Build URL manually — URLSearchParams encodes ';' as '%3B' but WQP
  // uses literal ';' as a multi-value delimiter for characteristicName.
  const charNames = PFAS_CHARACTERISTICS.map(c => encodeURIComponent(c)).join(';');
  const bbox = `${minLon},${minLat},${maxLon},${maxLat}`;
  const qs = [
    `bBox=${bbox}`,
    `characteristicName=${charNames}`,
    `startDateLo=${startDate}`,
    `dataProfile=narrow`,
    `mimeType=csv`,
    `sorted=no`,
    `zip=no`,
  ].join('&');

  const url = `${WQP_RESULT_URL}?${qs}`;
  const timeoutMs = options.timeoutMs ?? 8000; // WQP can be slow

  try {
    const response = await fetchWithTimeout(url, { timeoutMs });

    if (!response.ok) {
      return {
        data: null,
        error: `WQP API returned HTTP ${response.status}`,
        source,
        cached: false,
        fetchedAt,
      };
    }

    const csvText = await response.text();

    // WQP returns HTTP 200 with an error message inside the CSV body
    if (csvText.includes('ERROR:') && csvText.includes('INCOMPLETE DATA')) {
      return {
        data: null,
        error: 'WQP returned incomplete data — query may be too broad',
        source,
        cached: false,
        fetchedAt,
      };
    }

    const rows = parseCsv(csvText);

    if (rows.length === 0) {
      return {
        data: { detections: [], maxDetectionPpt: 0, monitoringLocationCount: 0, exceedsMcl: false },
        error: null,
        source,
        cached: false,
        fetchedAt,
      };
    }

    const detections: WqpDetection[] = [];
    const locationIds = new Set<string>();
    let maxPpt = 0;
    let anyExceedsMcl = false;

    for (const row of rows) {
      const charName = row['Result_Characteristic'] ?? '';
      const rawValue = parseFloat(row['Result_Measure'] ?? '');
      if (!charName || !Number.isFinite(rawValue) || rawValue < 0) continue;

      const unit = row['Result_MeasureUnit'] ?? 'ng/L';
      const valuePpt = toPpt(rawValue, unit);
      const locId = row['Location_Identifier'] ?? '';

      if (locId) locationIds.add(locId);
      if (valuePpt > maxPpt) maxPpt = valuePpt;
      if (valuePpt > EPA_MCL_PPT) anyExceedsMcl = true;

      detections.push({
        characteristicName: charName,
        value: rawValue,
        unit,
        valuePpt,
        sampleDate: row['Activity_StartDate'] ?? '',
        monitoringLocationId: locId,
        organizationName: row['Org_FormalName'] ?? '',
      });
    }

    // Sort by concentration descending
    detections.sort((a, b) => b.valuePpt - a.valuePpt);

    return {
      data: {
        detections,
        maxDetectionPpt: Math.round(maxPpt * 100) / 100,
        monitoringLocationCount: locationIds.size,
        exceedsMcl: anyExceedsMcl,
      },
      error: null,
      source,
      cached: false,
      fetchedAt,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown WQP error';
    const isTimeout = err instanceof Error && (err.name === 'AbortError' || msg.includes('abort'));
    return {
      data: null,
      error: isTimeout ? 'WQP request timed out' : msg,
      source,
      cached: false,
      fetchedAt,
    };
  }
}
