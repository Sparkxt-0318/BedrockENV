import { GeocodedAddress, WaterLayerData, SoilLayerData, AirLayerData, ProximityLayerData, EjLayerData, ExposureAssessment } from '@/types/exposure';
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
import { fetchAqsData } from './epa-aqs';
import { fetchSuperfundSites } from './epa-superfund';
import { fetchEjScreenData } from './epa-ejscreen';
import { fetchSviData } from './cdc-svi';
import { lookupNonattainment } from './nonattainment';
import { scoreWaterLayer } from '@/lib/scoring/water-scorer';
import { scoreSoilLayer } from '@/lib/scoring/soil-scorer';
import { scoreAirLayer } from '@/lib/scoring/air-scorer';
import { scoreProximityLayer } from '@/lib/scoring/proximity-scorer';
import { scoreEjLayer } from '@/lib/scoring/ej-scorer';
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
    // [6] ECHO facilities (soil/proximity) — two sequential API calls, needs 2× timeout
    fetchEchoFacilities(geocoded.latitude, geocoded.longitude, { timeoutMs: SOURCE_TIMEOUT * 2 }),
    // [7] Flood zone (soil)
    fetchFloodZone(geocoded.latitude, geocoded.longitude),
    // [8] Soil moisture / climate (soil)
    fetchNasaPowerData(geocoded.latitude, geocoded.longitude),
    // [9] Air quality — OpenAQ (air)
    fetchAirQualityData(geocoded.latitude, geocoded.longitude, { timeoutMs: SOURCE_TIMEOUT }),
    // [10] Air quality — EPA AQS historical (air)
    fetchAqsData(geocoded.latitude, geocoded.longitude, { timeoutMs: SOURCE_TIMEOUT * 2 }),
    // [11] Superfund NPL sites (proximity)
    fetchSuperfundSites(geocoded.latitude, geocoded.longitude, { timeoutMs: SOURCE_TIMEOUT * 2 }),
    // [12] EJScreen (EJ)
    fetchEjScreenData(geocoded.latitude, geocoded.longitude, { timeoutMs: SOURCE_TIMEOUT * 2.5 }),
    // [13] CDC SVI (EJ)
    fetchSviData(geocoded.fipsState, geocoded.fipsCounty, geocoded.censusTract, { timeoutMs: SOURCE_TIMEOUT * 2 }),
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
  const aqsResult = unwrap(settled[10], 'EPA AQS');
  const superfundResult = unwrap(settled[11], 'Superfund');
  const ejscreenResult = unwrap(settled[12], 'EJScreen');
  const sviResult = unwrap(settled[13], 'CDC SVI');

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
  if (aqsResult?.error) errors.push(`EPA AQS: ${aqsResult.error}`);
  if (superfundResult?.error) errors.push(`Superfund: ${superfundResult.error}`);
  if (ejscreenResult?.error) errors.push(`EJScreen: ${ejscreenResult.error}`);
  if (sviResult?.error) errors.push(`CDC SVI: ${sviResult.error}`);

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

  // Build air layer data — TRI emitter count comes from ECHO facilities
  const echoFacilities = echoResult?.data?.facilities ?? [];
  const triEmitterCount = echoFacilities.filter(f => f.programs.includes('TRI')).length;

  const nonattainment = lookupNonattainment(geocoded.fipsState, geocoded.fipsCounty);

  const airData: AirLayerData = {
    openaq: airResult?.data ?? null,
    aqs: aqsResult?.data ?? null,
    nonattainment,
    triEmitters: triEmitterCount,
  };

  // Build proximity layer data — reuses ECHO facilities for RCRA/TRI/SNC counts
  const proximityData: ProximityLayerData = {
    superfundSites: superfundResult?.data ?? [],
    echoFacilities: echoResult?.data ?? null,
  };

  // Build EJ layer data
  const ejScreenIndices = ejscreenResult?.data ? {
    ejIndex: ejscreenResult.data.ejIndex,
    ejIndexSupplemental: ejscreenResult.data.ejIndexSupplemental,
    demographicIndex: ejscreenResult.data.demographicIndex,
    pm25Pctile: ejscreenResult.data.pm25Pctile,
    ozonePctile: ejscreenResult.data.ozonePctile,
    trafficPctile: ejscreenResult.data.trafficPctile,
    leadPaintPctile: ejscreenResult.data.leadPaintPctile,
    superfundPctile: ejscreenResult.data.superfundPctile,
    hazWastePctile: ejscreenResult.data.hazWastePctile,
    minorityPct: ejscreenResult.data.minorityPct,
    lowIncomePct: ejscreenResult.data.lowIncomePct,
    linguisticIsolationPct: ejscreenResult.data.linguisticIsolationPct,
    lessHsEducationPct: ejscreenResult.data.lessHsEducationPct,
    blockGroup: ejscreenResult.data.blockGroup,
  } : null;

  const sviIndices = sviResult?.data ? {
    overallSvi: sviResult.data.overallSvi,
    socioeconomicSvi: sviResult.data.socioeconomicSvi,
    householdSvi: sviResult.data.householdSvi,
    minoritySvi: sviResult.data.minoritySvi,
    housingSvi: sviResult.data.housingSvi,
    tractFips: sviResult.data.tractFips,
    totalPopulation: sviResult.data.totalPopulation,
  } : null;

  const ejData: EjLayerData = {
    ejscreen: ejScreenIndices,
    svi: sviIndices,
  };

  // Step 4: Score layers
  const waterScore = scoreWaterLayer(waterData);
  const soilScore = scoreSoilLayer(soilData);
  const airScore = scoreAirLayer(airData);
  const proximityScore = scoreProximityLayer(proximityData);
  const ejScore = scoreEjLayer(ejData);

  // Step 5: Compute composite score (MVP: water + soil only — other layers scored but not weighted yet)
  const compositeScore = computeCompositeScore({
    water: waterScore,
    soil: soilScore,
  });

  // Attach other layer scores for visibility even though they're not weighted in MVP composite
  compositeScore.layerScores.air = airScore;
  compositeScore.layerScores.proximity = proximityScore;
  compositeScore.layerScores.ej = ejScore;

  const assessment: ExposureAssessment = {
    id: crypto.randomUUID(),
    address: geocoded,
    compositeScore,
    waterData,
    soilData,
    airData,
    proximityData,
    ejData,
    dataFreshness: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  return { assessment, geocoded, errors };
}
