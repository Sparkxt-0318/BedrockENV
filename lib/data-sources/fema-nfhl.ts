import { FloodZoneData, RiskTier } from '@/types/exposure';
import { DataSourceResult, fetchWithRetry } from './types';

/**
 * FEMA NFHL — National Flood Hazard Layer via ArcGIS REST service.
 *
 * Queries flood zone designation for a given lat/lng point.
 * Flooding MOBILIZES soil contamination — this is Bedrock's novel insight.
 *
 * Data resolution: PROPERTY-LEVEL (flood zone boundaries are parcel-level)
 * Cache: 90 days (NFHL updates as map revisions are published)
 */

const NFHL_URL = 'https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer/28/query';

// Flood zone risk mapping
const ZONE_RISK: Record<string, { risk: RiskTier; description: string; sfha: boolean }> = {
  'A':    { risk: 'HIGH', description: '1% annual chance flood (no BFE determined)', sfha: true },
  'AE':   { risk: 'HIGH', description: '1% annual chance flood (base flood elevation determined)', sfha: true },
  'AH':   { risk: 'HIGH', description: '1% annual chance flood — shallow flooding (1-3 ft)', sfha: true },
  'AO':   { risk: 'HIGH', description: '1% annual chance flood — sheet flow (1-3 ft)', sfha: true },
  'AR':   { risk: 'HIGH', description: '1% annual chance flood — temporary increased risk', sfha: true },
  'A99':  { risk: 'HIGH', description: '1% annual chance flood — federal flood protection system under construction', sfha: true },
  'V':    { risk: 'HIGH', description: 'Coastal high hazard area (velocity wave action)', sfha: true },
  'VE':   { risk: 'HIGH', description: 'Coastal high hazard area with BFE', sfha: true },
  'X':    { risk: 'LOW', description: 'Minimal flood hazard (outside SFHA)', sfha: false },
  'B':    { risk: 'MODERATE', description: '0.2% annual chance flood (shaded Zone X)', sfha: false },
  'C':    { risk: 'LOW', description: 'Minimal flood hazard', sfha: false },
  'D':    { risk: 'MODERATE', description: 'Undetermined flood hazard', sfha: false },
};

export async function fetchFloodZone(
  latitude: number,
  longitude: number
): Promise<DataSourceResult<FloodZoneData>> {
  const params = new URLSearchParams({
    geometry: JSON.stringify({ x: longitude, y: latitude }),
    geometryType: 'esriGeometryPoint',
    spatialRel: 'esriSpatialRelIntersects',
    outFields: 'FLD_ZONE,ZONE_SUBTY,SFHA_TF,STATIC_BFE',
    returnGeometry: 'false',
    f: 'json',
  });

  const url = `${NFHL_URL}?${params}`;

  try {
    const response = await fetchWithRetry(url, { timeoutMs: 15_000 });

    if (!response.ok) {
      return {
        data: null,
        error: `FEMA NFHL returned HTTP ${response.status}`,
        source: 'FEMA NFHL',
        cached: false,
        fetchedAt: new Date().toISOString(),
      };
    }

    const json = await response.json();
    const features = json?.features;

    if (!Array.isArray(features) || features.length === 0) {
      return {
        data: null,
        error: 'No flood zone data available for this location',
        source: 'FEMA NFHL',
        cached: false,
        fetchedAt: new Date().toISOString(),
      };
    }

    const attrs = features[0].attributes;
    const zone = attrs.FLD_ZONE || 'X';
    const subtype = attrs.ZONE_SUBTY || '';
    const sfha = attrs.SFHA_TF === 'T' || attrs.SFHA_TF === true;

    // Determine the effective zone for risk lookup
    // "shaded X" zones are typically indicated by ZONE_SUBTY
    let effectiveZone = zone;
    if (zone === 'X' && subtype && subtype.toLowerCase().includes('0.2')) {
      effectiveZone = 'B'; // Treat shaded X as moderate risk
    }

    const zoneInfo = ZONE_RISK[effectiveZone] ?? ZONE_RISK['X']!;

    return {
      data: {
        zone,
        zoneDescription: zoneInfo.description,
        isSpecialFloodHazardArea: sfha || zoneInfo.sfha,
        riskLevel: zoneInfo.risk,
      },
      error: null,
      source: 'FEMA NFHL',
      cached: false,
      fetchedAt: new Date().toISOString(),
    };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Unknown error fetching FEMA data',
      source: 'FEMA NFHL',
      cached: false,
      fetchedAt: new Date().toISOString(),
    };
  }
}
