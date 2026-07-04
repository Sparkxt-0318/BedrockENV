import { DataSourceResult, fetchWithTimeout } from './types';

/**
 * EPA EJScreen — Environmental Justice Screening Tool.
 *
 * Queries the EJScreen REST API for environmental justice indices
 * at a given lat/lng. Returns national percentile ranks (0–100) for
 * multiple environmental and demographic indicators.
 *
 * API: https://ejscreen.epa.gov/mapper/ejscreenRESTbroker.aspx
 *
 * Failure modes:
 *  - No API key required (public)
 *  - API can be slow (5-10s response times common)
 *  - Rural or unmapped areas may return null/empty indicators
 *  - Percentile ranks are relative to national distribution
 *
 * Data resolution: NEIGHBORHOOD-LEVEL (census block group)
 */

const EJSCREEN_BASE = 'https://ejscreen.epa.gov/mapper/ejscreenRESTbroker.aspx';

export interface EjScreenData {
  /** EJ index — overall environmental justice index percentile (0–100). */
  ejIndex: number | null;
  /** Supplemental EJ index percentile. */
  ejIndexSupplemental: number | null;
  /** PM2.5 percentile. */
  pm25Pctile: number | null;
  /** Ozone percentile. */
  ozonePctile: number | null;
  /** Diesel PM percentile. */
  dieselPmPctile: number | null;
  /** Traffic proximity percentile. */
  trafficPctile: number | null;
  /** Lead paint indicator percentile. */
  leadPaintPctile: number | null;
  /** Superfund proximity percentile. */
  superfundPctile: number | null;
  /** RMP (Risk Management Plan) facility proximity percentile. */
  rmpPctile: number | null;
  /** Hazardous waste proximity percentile. */
  hazWastePctile: number | null;
  /** Wastewater discharge percentile. */
  wastewaterPctile: number | null;
  /** Demographic index percentile. */
  demographicIndex: number | null;
  /** Minority percentage. */
  minorityPct: number | null;
  /** Low-income percentage. */
  lowIncomePct: number | null;
  /** Linguistic isolation percentage. */
  linguisticIsolationPct: number | null;
  /** Less than high school education percentage. */
  lessHsEducationPct: number | null;
  /** Under age 5 percentage. */
  under5Pct: number | null;
  /** Over age 64 percentage. */
  over64Pct: number | null;
  /** Census block group FIPS. */
  blockGroup: string;
}

interface EjScreenApiResponse {
  data?: Array<Record<string, string | number | null>>;
  status?: string;
}

export async function fetchEjScreenData(
  latitude: number,
  longitude: number,
  options: { timeoutMs?: number } = {}
): Promise<DataSourceResult<EjScreenData>> {
  const fetchedAt = new Date().toISOString();
  const source = 'EPA EJScreen';

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return { data: null, error: 'Invalid coordinates', source, cached: false, fetchedAt };
  }

  const timeoutMs = options.timeoutMs ?? 10000;

  const params = new URLSearchParams({
    namestr: '',
    geometry: JSON.stringify({
      spatialReference: { wkid: 4326 },
      x: longitude,
      y: latitude,
    }),
    distance: '0',
    unit: '9035',
    aession: '',
    f: 'json',
  });

  const url = `${EJSCREEN_BASE}?${params.toString()}`;

  try {
    const response = await fetchWithTimeout(url, { timeoutMs });

    if (!response.ok) {
      return {
        data: null,
        error: `EJScreen API returned HTTP ${response.status}`,
        source,
        cached: false,
        fetchedAt,
      };
    }

    const json = (await response.json()) as EjScreenApiResponse;
    const row = json?.data?.[0];

    if (!row) {
      return {
        data: null,
        error: 'No EJScreen data for this location',
        source,
        cached: false,
        fetchedAt,
      };
    }

    const pn = (key: string): number | null => {
      const v = row[key];
      if (v === null || v === undefined || v === '') return null;
      const n = typeof v === 'number' ? v : parseFloat(String(v));
      return Number.isFinite(n) ? n : null;
    };

    const data: EjScreenData = {
      ejIndex: pn('S_E_PCTILE') ?? pn('P_EJ_D2'),
      ejIndexSupplemental: pn('S_E_SUPP_PCTILE') ?? pn('P_EJS_D2'),
      pm25Pctile: pn('S_PM25_PCTILE') ?? pn('P_PM25'),
      ozonePctile: pn('S_OZONE_PCTILE') ?? pn('P_OZONE'),
      dieselPmPctile: pn('S_DSLPM_PCTILE') ?? pn('P_DSLPM'),
      trafficPctile: pn('S_TRAFPROX_PCTILE') ?? pn('P_PTRAF'),
      leadPaintPctile: pn('S_LDPNT_PCTILE') ?? pn('P_LDPNT'),
      superfundPctile: pn('S_NPL_PCTILE') ?? pn('P_PNPL'),
      rmpPctile: pn('S_RMP_PCTILE') ?? pn('P_PRMP'),
      hazWastePctile: pn('S_TSDF_PCTILE') ?? pn('P_PTSDF'),
      wastewaterPctile: pn('S_WTRPROX_PCTILE') ?? pn('P_PWDIS'),
      demographicIndex: pn('S_DEMOGIDX_PCTILE') ?? pn('P_DEMOGIDX_2'),
      minorityPct: pn('S_MINORPCT') ?? pn('MINORPCT'),
      lowIncomePct: pn('S_LOWINCPCT') ?? pn('LOWINCPCT'),
      linguisticIsolationPct: pn('S_LINGISOPCT') ?? pn('LINGISOPCT'),
      lessHsEducationPct: pn('S_LESSHSPCT') ?? pn('LESSHSPCT'),
      under5Pct: pn('S_UNDER5PCT') ?? pn('UNDER5PCT'),
      over64Pct: pn('S_OVER64PCT') ?? pn('OVER64PCT'),
      blockGroup: String(row['ID'] ?? row['BLOCKGROUP'] ?? ''),
    };

    return {
      data,
      error: null,
      source,
      cached: false,
      fetchedAt,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown EJScreen error';
    const isTimeout = err instanceof Error && (err.name === 'AbortError' || msg.includes('abort'));
    return {
      data: null,
      error: isTimeout ? 'EJScreen request timed out' : msg,
      source,
      cached: false,
      fetchedAt,
    };
  }
}
