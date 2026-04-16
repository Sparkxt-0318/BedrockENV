import { GeocodedAddress, WaterLayerData, SoilLayerData, ExposureAssessment } from '@/types/exposure';
import { geocodeAddress, lookupWaterSystem, extractCityHint, extractZipHint } from './geocoding';
import { fetchUcmr5PfasData } from './epa-ucmr5';
import { fetchSdwisViolations } from './epa-sdwis';
import { fetchLeadRiskData } from './epa-lead';
import { fetchSsurgoData } from './usda-ssurgo';
import { fetchBrownfieldSites } from './epa-brownfields';
import { fetchFloodZone } from './fema-nfhl';
import { fetchNasaPowerData } from './nasa-smap';
import { fetchWqpPfasData } from './usgs-wqp';
import { fetchEchoFacilities } from './epa-echo';
import { fetchAirQualityData } from './openaq';
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
  const cityHint = extractCityHint(geocoded) ?? undefined;
  const zipHint = extractZipHint(geocoded) ?? undefined;
  const waterSystem = await lookupWaterSystem(
    geocoded.fipsState,
    geocoded.fipsCounty,
    cityHint,
    zipHint
  );
  if (waterSystem) {
    geocoded.waterSystemId = waterSystem.pwsid;
    geocoded.waterSystemName = waterSystem.name;
  } else {
    errors.push('Could not identify the serving water system for this address.');
  }

  // Step 3: Fetch ALL layer data in parallel with per-source 4s timeout
  const SOURCE_TIMEOUT = 4_000;
  const noWaterSystem = { data: null, error: 'No water system identified', source: '', cached: false, fetchedAt: new Date().toISOString() };

  const settled = await Promise.allSettled([
    // [0] UCMR 5 PFAS (water)
    waterSystem
      ? fetchUcmr5PfasData(waterSystem.pwsid, waterSystem.name)
      : Promise.resolve(noWaterSystem),
    // [1] SDWIS violations (water)
    waterSystem
      ? fetchSdwisViolations(waterSystem.pwsid)
      : Promise.resolve({ ...noWaterSystem, data: [] as never }),
    // [2] Lead risk (water)
    fetchLeadRiskData(
      geocoded.fipsState,
      geocoded.fipsCounty,
      geocoded.censusTract,
      geocoded.censusBlockGroup
    ),
    // [3] WQP ambient PFAS (water — bbox, not PWSID-dependent)
    fetchWqpPfasData(geocoded.latitude, geocoded.longitude, { timeoutMs: SOURCE_TIMEOUT }),
    // [4] SSURGO (soil)
    fetchSsurgoData(geocoded.latitude, geocoded.longitude),
    // [5] Brownfields (soil)
    fetchBrownfieldSites(geocoded.latitude, geocoded.longitude),
    // [6] ECHO facilities (soil/proximity)
    fetchEchoFacilities(geocoded.latitude, geocoded.longitude, { timeoutMs: SOURCE_TIMEOUT }),
    // [7] Flood zone (soil)
    fetchFloodZone(geocoded.latitude, geocoded.longitude),
    // [8] Soil moisture / climate (soil)
    fetchNasaPowerData(geocoded.latitude, geocoded.longitude),
    // [9] Air quality (air)
    fetchAirQualityData(geocoded.latitude, geocoded.longitude, { timeoutMs: SOURCE_TIMEOUT }),
  ]);

  // Unwrap settled results — rejected promises become error results
  function unwrap<T>(result: PromiseSettledResult<T>, label: string): T | null {
    if (result.status === 'fulfilled') return result.value;
    errors.push(`${label}: ${result.reason instanceof Error ? result.reason.message : String(result.reason)}`);
    return null;
  }

  const pfasResult = unwrap(settled[0], 'PFAS');
  const violationsResult = unwrap(settled[1], 'Violations');
  const leadResult = unwrap(settled[2], 'Lead risk');
  const wqpResult = unwrap(settled[3], 'WQP PFAS');
  const ssurgoResult = unwrap(settled[4], 'Soil survey');
  const brownfieldsResult = unwrap(settled[5], 'Brownfields');
  const echoResult = unwrap(settled[6], 'ECHO facilities');
  const floodResult = unwrap(settled[7], 'Flood zone');
  const moistureResult = unwrap(settled[8], 'Soil moisture');
  const airResult = unwrap(settled[9], 'Air quality');

  // Collect non-fatal errors from successful-but-errored results
  if (pfasResult?.error) errors.push(`PFAS: ${pfasResult.error}`);
  if (violationsResult?.error) errors.push(`Violations: ${violationsResult.error}`);
  if (leadResult?.error) errors.push(`Lead risk: ${leadResult.error}`);
  if (wqpResult?.error) errors.push(`WQP PFAS: ${wqpResult.error}`);
  if (ssurgoResult?.error) errors.push(`Soil survey: ${ssurgoResult.error}`);
  if (brownfieldsResult?.error) errors.push(`Brownfields: ${brownfieldsResult.error}`);
  if (echoResult?.error) errors.push(`ECHO: ${echoResult.error}`);
  if (floodResult?.error) errors.push(`Flood zone: ${floodResult.error}`);
  if (moistureResult?.error) errors.push(`Soil moisture: ${moistureResult.error}`);
  if (airResult?.error) errors.push(`Air quality: ${airResult.error}`);

  // Build water layer data
  const waterData: WaterLayerData = {
    pfas: pfasResult?.data ?? null,
    wqpPfas: wqpResult?.data ?? null,
    violations: (violationsResult?.data as never) ?? [],
    leadRisk: leadResult?.data ?? null,
    systemName: waterSystem?.name ?? 'Unknown',
    systemId: waterSystem?.pwsid ?? '',
  };

  // Build soil layer data
  const soilData: SoilLayerData = {
    ssurgo: ssurgoResult?.data ?? null,
    brownfields: brownfieldsResult?.data ?? [],
    echoFacilities: echoResult?.data ?? null,
    floodZone: floodResult?.data ?? null,
    moistureData: moistureResult?.data ?? null,
  };

  // Air data (standalone layer)
  const airData = airResult?.data ?? null;

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
    airData,
    dataFreshness: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  return { assessment, geocoded, errors };
}
