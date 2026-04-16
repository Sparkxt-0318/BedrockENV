import { AqsData, AqsAnnualSummary } from '@/types/exposure';
import { DataSourceResult, fetchWithTimeout } from './types';

/**
 * EPA AQS — Air Quality System historical data.
 *
 * Queries the AQS Data Mart API for annual PM2.5 and ozone summaries
 * near a given point. Requires free registration (EPA_AQS_EMAIL and
 * EPA_AQS_KEY env vars).
 *
 * API: https://aqs.epa.gov/data/api/annualData/byLatLng
 *
 * Failure modes:
 *  - No credentials → graceful skip with descriptive error
 *  - Rate limited (5 req/min) → 429 passthrough, no retry
 *  - No monitors near coordinates → empty result (rural areas)
 *  - Current year may have no data → fall back to prior year
 *
 * Data resolution: AREA-LEVEL (nearest monitor, county-level aggregation)
 */

const AQS_BASE = 'https://aqs.epa.gov/data/api';

const PM25_PARAM = '88101';
const OZONE_PARAM = '44201';

function distKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface AqsApiRow {
  parameter_code?: string;
  parameter?: string;
  arithmetic_mean?: string;
  first_max_value?: string;
  units_of_measure?: string;
  year?: string;
  observation_count?: string;
  local_site_name?: string;
  latitude?: string;
  longitude?: string;
}

interface AqsApiResponse {
  Header?: Array<{ status?: string; rows?: number }>;
  Data?: AqsApiRow[];
}

export async function fetchAqsData(
  latitude: number,
  longitude: number,
  options: { timeoutMs?: number } = {}
): Promise<DataSourceResult<AqsData>> {
  const fetchedAt = new Date().toISOString();
  const source = 'EPA AQS';

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return { data: null, error: 'Invalid coordinates', source, cached: false, fetchedAt };
  }

  const email = process.env.EPA_AQS_EMAIL;
  const key = process.env.EPA_AQS_KEY;
  if (!email || !key) {
    return {
      data: null,
      error: 'EPA AQS credentials not configured (EPA_AQS_EMAIL, EPA_AQS_KEY)',
      source,
      cached: false,
      fetchedAt,
    };
  }

  const timeoutMs = options.timeoutMs ?? 8000;
  const currentYear = new Date().getFullYear();
  const queryYear = currentYear - 1;

  const params = `email=${encodeURIComponent(email)}&key=${encodeURIComponent(key)}&param=${PM25_PARAM},${OZONE_PARAM}&bdate=${queryYear}0101&edate=${queryYear}1231&latitude=${latitude}&longitude=${longitude}&distance=25`;
  const url = `${AQS_BASE}/annualData/byLatLng?${params}`;

  try {
    const response = await fetchWithTimeout(url, { timeoutMs });

    if (!response.ok) {
      return {
        data: null,
        error: `AQS API returned HTTP ${response.status}`,
        source,
        cached: false,
        fetchedAt,
      };
    }

    const json = (await response.json()) as AqsApiResponse;
    const header = json?.Header?.[0];

    if (header?.status === 'Failed' || !json?.Data) {
      return {
        data: { summaries: [], pm25Annual: null, ozoneMax: null, year: queryYear },
        error: null,
        source,
        cached: false,
        fetchedAt,
      };
    }

    const rows = json.Data;
    if (rows.length === 0) {
      return {
        data: { summaries: [], pm25Annual: null, ozoneMax: null, year: queryYear },
        error: null,
        source,
        cached: false,
        fetchedAt,
      };
    }

    const summaries: AqsAnnualSummary[] = [];
    let pm25Annual: number | null = null;
    let ozoneMax: number | null = null;

    for (const row of rows) {
      const paramCode = row.parameter_code ?? '';
      const mean = parseFloat(row.arithmetic_mean ?? '');
      const maxVal = parseFloat(row.first_max_value ?? '');
      const rowLat = parseFloat(row.latitude ?? '');
      const rowLon = parseFloat(row.longitude ?? '');
      const year = parseInt(row.year ?? '', 10);

      if (!Number.isFinite(mean) && !Number.isFinite(maxVal)) continue;

      const dist = Number.isFinite(rowLat) && Number.isFinite(rowLon)
        ? Math.round(distKm(latitude, longitude, rowLat, rowLon) * 10) / 10
        : 0;

      summaries.push({
        parameter: row.parameter ?? paramCode,
        parameterCode: paramCode,
        arithmeticMean: Number.isFinite(mean) ? mean : 0,
        firstMaxValue: Number.isFinite(maxVal) ? maxVal : 0,
        unit: row.units_of_measure ?? '',
        year: Number.isFinite(year) ? year : queryYear,
        observationCount: parseInt(row.observation_count ?? '0', 10) || 0,
        monitorSiteName: row.local_site_name ?? '',
        latitude: Number.isFinite(rowLat) ? rowLat : 0,
        longitude: Number.isFinite(rowLon) ? rowLon : 0,
        distanceKm: dist,
      });

      if (paramCode === PM25_PARAM && Number.isFinite(mean)) {
        if (pm25Annual === null || mean > pm25Annual) pm25Annual = mean;
      }
      if (paramCode === OZONE_PARAM && Number.isFinite(maxVal)) {
        if (ozoneMax === null || maxVal > ozoneMax) ozoneMax = maxVal;
      }
    }

    return {
      data: { summaries, pm25Annual, ozoneMax, year: queryYear },
      error: null,
      source,
      cached: false,
      fetchedAt,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown AQS error';
    const isTimeout = err instanceof Error && (err.name === 'AbortError' || msg.includes('abort'));
    return {
      data: null,
      error: isTimeout ? 'AQS request timed out' : msg,
      source,
      cached: false,
      fetchedAt,
    };
  }
}
