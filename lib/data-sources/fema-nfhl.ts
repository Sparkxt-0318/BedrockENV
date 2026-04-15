import { FloodZoneData, FloodZoneFeature, RiskTier } from '@/types/exposure';
import { DataSourceResult, fetchWithRetry } from './types';

/**
 * FEMA NFHL — National Flood Hazard Layer via ArcGIS REST service.
 *
 * Queries every flood-hazard polygon that intersects the query point, then
 * distills a "headline" zone (the most hazardous) while returning the full
 * list of intersecting features. A coastal parcel can legitimately sit in
 * both VE (wave) and AE (still water) zones, and the scorer / recommendation
 * engine may need to know about coexisting zones.
 *
 * ArcGIS returns HTTP 200 with an error envelope (`{error: {code, message}}`)
 * for invalid parameters; we inspect the body, not just the status.
 *
 * NFHL coverage is digitized county-by-county. When the response body has
 * `features: []`, that could mean either:
 *  - the point is legitimately in unshaded Zone X (most of the country), OR
 *  - the county has never been digitized (rural US, tribal land)
 * There is no way to distinguish these from a single point query, so we
 * report `coverage: 'unmapped'` whenever features is empty and let the
 * scorer treat it conservatively.
 *
 * Data resolution: PROPERTY-LEVEL (parcel scale).
 * Cache: 90 days.
 */

// NB: FEMA's ArcGIS services live under /arcgis/rest — not /gis/nfhl/rest.
// The /gis/nfhl path returns an IBM WebSEAL 404 HTML page.
const NFHL_URL =
  'https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28/query';

/**
 * Hazard ranking — higher = worse. Used to pick the headline zone when a
 * query intersects multiple features. V-zones are coastal high-velocity
 * (worst), A-zones are riverine/shallow SFHA, X is non-SFHA.
 */
const ZONE_RANK: Record<string, number> = {
  VE: 100,
  V: 95,
  AE: 80,
  A: 75,
  AH: 72,
  AO: 70,
  AR: 68,
  A99: 65,
  D: 30,
  B: 20,
  X: 10,
  C: 5,
};

const ZONE_RISK: Record<
  string,
  { risk: RiskTier; description: string; sfha: boolean }
> = {
  A: {
    risk: 'HIGH',
    description: '1% annual chance flood (no BFE determined)',
    sfha: true,
  },
  AE: {
    risk: 'HIGH',
    description: '1% annual chance flood (base flood elevation determined)',
    sfha: true,
  },
  AH: {
    risk: 'HIGH',
    description: '1% annual chance flood — shallow flooding (1–3 ft)',
    sfha: true,
  },
  AO: {
    risk: 'HIGH',
    description: '1% annual chance flood — sheet flow (1–3 ft)',
    sfha: true,
  },
  AR: {
    risk: 'HIGH',
    description: '1% annual chance flood — temporary increased risk',
    sfha: true,
  },
  A99: {
    risk: 'HIGH',
    description:
      '1% annual chance flood — federal flood protection system under construction',
    sfha: true,
  },
  V: {
    risk: 'HIGH',
    description: 'Coastal high hazard area (velocity wave action)',
    sfha: true,
  },
  VE: {
    risk: 'HIGH',
    description: 'Coastal high hazard area with base flood elevation',
    sfha: true,
  },
  X: {
    risk: 'LOW',
    description: 'Minimal flood hazard (outside SFHA)',
    sfha: false,
  },
  B: {
    risk: 'MODERATE',
    description: '0.2% annual chance flood (shaded Zone X)',
    sfha: false,
  },
  C: { risk: 'LOW', description: 'Minimal flood hazard', sfha: false },
  D: { risk: 'MODERATE', description: 'Undetermined flood hazard', sfha: false },
};

/**
 * FEMA uses sentinel values in STATIC_BFE for "no BFE established":
 * -9999 (classic ArcGIS null), and occasionally 0 or negative values.
 */
const BFE_SENTINELS = new Set([-9999, 9999]);

interface NfhlFeature {
  attributes?: {
    FLD_ZONE?: string | null;
    ZONE_SUBTY?: string | null;
    SFHA_TF?: string | boolean | null;
    STATIC_BFE?: number | string | null;
  };
}

interface NfhlResponse {
  features?: NfhlFeature[];
  error?: { code?: number; message?: string };
}

export async function fetchFloodZone(
  latitude: number,
  longitude: number
): Promise<DataSourceResult<FloodZoneData>> {
  const fetchedAt = new Date().toISOString();

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return {
      data: null,
      error: 'latitude/longitude must be finite numbers',
      source: 'FEMA NFHL',
      cached: false,
      fetchedAt,
    };
  }

  const params = new URLSearchParams({
    geometry: JSON.stringify({ x: longitude, y: latitude, spatialReference: { wkid: 4326 } }),
    geometryType: 'esriGeometryPoint',
    inSR: '4326',
    spatialRel: 'esriSpatialRelIntersects',
    outFields: 'FLD_ZONE,ZONE_SUBTY,SFHA_TF,STATIC_BFE',
    returnGeometry: 'false',
    f: 'json',
  });

  const url = `${NFHL_URL}?${params.toString()}`;

  try {
    const response = await fetchWithRetry(url, { timeoutMs: 15_000 });

    if (!response.ok) {
      return {
        data: null,
        error: `FEMA NFHL returned HTTP ${response.status}`,
        source: 'FEMA NFHL',
        cached: false,
        fetchedAt,
      };
    }

    const json = (await response.json()) as NfhlResponse;

    // ArcGIS can return HTTP 200 with an error envelope.
    if (json && json.error) {
      return {
        data: null,
        error: `FEMA NFHL error ${json.error.code ?? '?'}: ${json.error.message ?? 'unknown'}`,
        source: 'FEMA NFHL',
        cached: false,
        fetchedAt,
      };
    }

    const raw = Array.isArray(json?.features) ? json!.features : null;
    if (raw === null) {
      return {
        data: null,
        error: 'FEMA NFHL returned a malformed response (no features array)',
        source: 'FEMA NFHL',
        cached: false,
        fetchedAt,
      };
    }

    if (raw.length === 0) {
      return {
        data: unmappedPlaceholder(),
        error: null,
        source: 'FEMA NFHL',
        cached: true,
        fetchedAt,
      };
    }

    const features: FloodZoneFeature[] = raw
      .map(toFeature)
      .filter((f): f is FloodZoneFeature => f !== null);

    if (features.length === 0) {
      return {
        data: unmappedPlaceholder(),
        error: null,
        source: 'FEMA NFHL',
        cached: true,
        fetchedAt,
      };
    }

    // Pick the most hazardous feature as the headline. Ranking uses the
    // RAW zone string — V > A > X > B/C — plus a nudge for SFHA so that
    // shaded Zone X (moderate) outranks unshaded Zone X (low) when both
    // intersect the same point.
    const headline = features.reduce((best, f) => {
      const bestScore = (ZONE_RANK[best.zone] ?? 0) + (best.sfha ? 1 : 0);
      const fScore = (ZONE_RANK[f.zone] ?? 0) + (f.sfha ? 1 : 0);
      return fScore > bestScore ? f : best;
    });

    // Headline STATIC_BFE = highest non-null BFE across all features (if any).
    const bfes = features
      .map((f) => f.staticBfe)
      .filter((v): v is number => v !== null);
    const headlineBfe = bfes.length > 0 ? Math.max(...bfes) : null;

    return {
      data: {
        zone: headline.zone,
        zoneDescription: headline.description,
        isSpecialFloodHazardArea: headline.sfha,
        riskLevel: headline.riskLevel,
        staticBfe: headlineBfe,
        features,
        coverage: 'mapped',
      },
      error: null,
      source: 'FEMA NFHL',
      cached: false,
      fetchedAt,
    };
  } catch (err) {
    return {
      data: null,
      error:
        err instanceof Error ? err.message : 'Unknown error fetching FEMA data',
      source: 'FEMA NFHL',
      cached: false,
      fetchedAt,
    };
  }
}

function toFeature(raw: NfhlFeature): FloodZoneFeature | null {
  const attrs = raw.attributes;
  if (!attrs) return null;

  const rawZone = (attrs.FLD_ZONE ?? '').toString().trim().toUpperCase();
  if (!rawZone) return null;

  const subtype =
    attrs.ZONE_SUBTY && String(attrs.ZONE_SUBTY).trim()
      ? String(attrs.ZONE_SUBTY).trim()
      : null;

  // Shaded X ("0.2 PCT ANNUAL CHANCE FLOOD HAZARD") → treat as Zone B for
  // risk lookup, but preserve the raw zone string for display.
  let effectiveZone = rawZone;
  if (rawZone === 'X' && subtype && /0\.2\s*pct/i.test(subtype)) {
    effectiveZone = 'B';
  }

  const sfhaRaw = attrs.SFHA_TF;
  const sfha =
    sfhaRaw === true || sfhaRaw === 'T' || sfhaRaw === 'Y' || sfhaRaw === 'true';

  const bfeRaw = attrs.STATIC_BFE;
  const bfeNum =
    typeof bfeRaw === 'number'
      ? bfeRaw
      : bfeRaw == null
        ? NaN
        : parseFloat(String(bfeRaw));
  const staticBfe =
    Number.isFinite(bfeNum) && !BFE_SENTINELS.has(bfeNum) && bfeNum > 0
      ? bfeNum
      : null;

  const info = ZONE_RISK[effectiveZone] ?? ZONE_RISK['X']!;
  return {
    zone: rawZone,
    subtype,
    sfha: sfha || info.sfha,
    staticBfe,
    description: info.description,
    riskLevel: info.risk,
  };
}

function unmappedPlaceholder(): FloodZoneData {
  return {
    zone: 'UNMAPPED',
    zoneDescription:
      'No NFHL feature intersects this point. Either minimal flood hazard or the county has not been digitized.',
    isSpecialFloodHazardArea: false,
    riskLevel: 'LOW',
    staticBfe: null,
    features: [],
    coverage: 'unmapped',
  };
}
