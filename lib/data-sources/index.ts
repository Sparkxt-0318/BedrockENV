import { GeocodedAddress, WaterLayerData, SoilLayerData, ExposureAssessment } from '@/types/exposure';
import { geocodeAddress, lookupWaterSystem } from './geocoding';
import { fetchUcmr5PfasData } from './epa-ucmr5';
import { fetchSdwisViolations } from './epa-sdwis';
import { fetchLeadRiskData } from './epa-lead';
import { fetchSsurgoData } from './usda-ssurgo';
import { fetchBrownfieldSites } from './epa-brownfields';
import { fetchFloodZone } from './fema-nfhl';
import { fetchNasaPowerData } from './nasa-smap';
import { scoreWaterLayer } from '@/lib/scoring/water-scorer';
import { scoreSoilLayer } from '@/lib/scoring/soil-scorer';
import { computeCompositeScore } from '@/lib/scoring/engine';

/**
 * Unified data orchestrator.
 * Fetches all data layers for a given address, computes scores, and returns
 * a complete ExposureAssessment.
 *
 * Designed for graceful degradation: if any individual API fails,
 * the assessment still returns with whatever data is available.
 */

export interface OrchestrationResult {
  assessment: ExposureAssessment | null;
  geocoded: GeocodedAddress | null;
  errors: string[];
}

export async function fetchFullAssessment(
  address: string
): Promise<OrchestrationResult> {
  const errors: string[] = [];

  // Step 1: Geocode the address
  const geocoded = await geocodeAddress(address);
  if (!geocoded) {
    return {
      assessment: null,
      geocoded: null,
      errors: ['Could not geocode address. Please check the address and try again.'],
    };
  }

  // Step 2: Look up water system
  const waterSystem = await lookupWaterSystem(
    geocoded.fipsState,
    geocoded.fipsCounty
  );
  if (waterSystem) {
    geocoded.waterSystemId = waterSystem.pwsid;
    geocoded.waterSystemName = waterSystem.name;
  } else {
    errors.push('Could not identify the serving water system for this address.');
  }

  // Step 3: Fetch ALL layer data in parallel (water + soil)
  const noWaterSystem = { data: null, error: 'No water system identified', source: '', cached: false, fetchedAt: new Date().toISOString() };

  const [
    pfasResult,
    violationsResult,
    leadResult,
    ssurgoResult,
    brownfieldsResult,
    floodResult,
    moistureResult,
  ] = await Promise.all([
    // Water sources
    waterSystem
      ? fetchUcmr5PfasData(waterSystem.pwsid, waterSystem.name)
      : Promise.resolve(noWaterSystem),
    waterSystem
      ? fetchSdwisViolations(waterSystem.pwsid)
      : Promise.resolve({ ...noWaterSystem, data: [] as never }),
    fetchLeadRiskData(
      geocoded.fipsState,
      geocoded.fipsCounty,
      geocoded.censusTract,
      geocoded.censusBlockGroup
    ),
    // Soil sources
    fetchSsurgoData(geocoded.latitude, geocoded.longitude),
    fetchBrownfieldSites(geocoded.latitude, geocoded.longitude),
    fetchFloodZone(geocoded.latitude, geocoded.longitude),
    fetchNasaPowerData(geocoded.latitude, geocoded.longitude),
  ]);

  // Collect non-fatal errors
  if (pfasResult.error) errors.push(`PFAS: ${pfasResult.error}`);
  if (violationsResult.error) errors.push(`Violations: ${violationsResult.error}`);
  if (leadResult.error) errors.push(`Lead risk: ${leadResult.error}`);
  if (ssurgoResult.error) errors.push(`Soil survey: ${ssurgoResult.error}`);
  if (brownfieldsResult.error) errors.push(`Brownfields: ${brownfieldsResult.error}`);
  if (floodResult.error) errors.push(`Flood zone: ${floodResult.error}`);
  if (moistureResult.error) errors.push(`Soil moisture: ${moistureResult.error}`);

  // Build water layer data
  const waterData: WaterLayerData = {
    pfas: pfasResult.data,
    violations: (violationsResult.data as never) ?? [],
    leadRisk: leadResult.data,
    systemName: waterSystem?.name ?? 'Unknown',
    systemId: waterSystem?.pwsid ?? '',
  };

  // Build soil layer data
  const soilData: SoilLayerData = {
    ssurgo: ssurgoResult.data,
    brownfields: brownfieldsResult.data ?? [],
    floodZone: floodResult.data,
    moistureData: moistureResult.data,
  };

  // Step 4: Score layers
  const waterScore = scoreWaterLayer(waterData);
  const soilScore = scoreSoilLayer(soilData);

  // Step 5: Compute composite score (MVP: water + soil)
  const compositeScore = computeCompositeScore({
    water: waterScore,
    soil: soilScore,
  });

  const assessment: ExposureAssessment = {
    id: crypto.randomUUID(),
    address: geocoded,
    compositeScore,
    waterData,
    soilData,
    dataFreshness: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  return { assessment, geocoded, errors };
}
