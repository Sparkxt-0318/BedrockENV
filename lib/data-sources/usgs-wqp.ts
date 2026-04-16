import { WqpDetection, WqpPfasData } from '@/types/exposure';
import { DataSourceResult, fetchWithTimeout } from './types';
import { boundingBox } from './epa-brownfields';

/**
 * USGS Water Quality Portal (WQP) — ambient water quality monitoring data.
 *
 * Queries the WQP Result endpoint by bounding box for PFAS-related
 * characteristic names. This captures monitoring data from USGS, states,
 * and tribes — not just public water systems.
 *
 * Critical for locations where UCMR 5 data is absent (e.g. Hoosick Falls,
 * Yellowstone) because WQP covers surface water, groundwater, and ambient
 * monitoring sites that aren't tied to a PWSID.
 *
 * API: https://www.waterqualitydata.us/data/Result/search
 *
 * Data resolution: AREA-LEVEL (~7-mile bbox around query point)
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const WQP_RESULT_URL = 'https://www.waterqualitydata.us/data/Result/search';

/** Bounding box radius in miles for the WQP query. */
const BBOX_RADIUS_MILES = 7;

/**
 * Key PFAS characteristic names used by WQP / USGS monitoring programs.
 * This is not exhaustive but covers the primary compounds of concern.
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
function toPpt(value: number, unit: string): number {
  const u = unit.toLowerCase().replace(/\s/g, '');
  if (u === 'ng/l' || u === 'ng/l') return value;
  if (u === 'ug/l' || u === 'µg/l' || u === 'ug/l') return value * 1000;
  if (u === 'mg/l') return value * 1_000_000;
  // Fallback: assume ng/L if unit is unrecognized
  return value;
}

// ---------------------------------------------------------------------------
// WQP API response types (subset of the full schema)
// ---------------------------------------------------------------------------

interface WqpResultRow {
  CharacteristicName?: string;
  ResultMeasureValue?: string;
  'ResultMeasure/MeasureUnitCode'?: string;
  ActivityStartDate?: string;
  MonitoringLocationIdentifier?: string;
  OrganizationFormalName?: string;
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
  const fiveYearsAgo = new Date();
  fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
  const startDate = fiveYearsAgo.toISOString().slice(0, 10); // YYYY-MM-DD

  const params = new URLSearchParams({
    bBox: `${minLon},${minLat},${maxLon},${maxLat}`,
    characteristicName: PFAS_CHARACTERISTICS.join(';'),
    startDateLo: startDate,
    mimeType: 'application/json',
    sorted: 'no',
    zip: 'no',
  });

  const url = `${WQP_RESULT_URL}?${params.toString()}`;
  const timeoutMs = options.timeoutMs ?? 4000;

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

    const rows: WqpResultRow[] = await response.json();

    if (!Array.isArray(rows) || rows.length === 0) {
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
      const charName = row.CharacteristicName ?? '';
      const rawValue = parseFloat(row.ResultMeasureValue ?? '');
      if (!charName || !Number.isFinite(rawValue) || rawValue < 0) continue;

      const unit = row['ResultMeasure/MeasureUnitCode'] ?? 'ng/l';
      const valuePpt = toPpt(rawValue, unit);
      const locId = row.MonitoringLocationIdentifier ?? '';

      if (locId) locationIds.add(locId);
      if (valuePpt > maxPpt) maxPpt = valuePpt;
      if (valuePpt > EPA_MCL_PPT) anyExceedsMcl = true;

      detections.push({
        characteristicName: charName,
        value: rawValue,
        unit,
        valuePpt,
        sampleDate: row.ActivityStartDate ?? '',
        monitoringLocationId: locId,
        organizationName: row.OrganizationFormalName ?? '',
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
    // Distinguish timeout from other errors
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
