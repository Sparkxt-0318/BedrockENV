import { GeocodedAddress, WaterLayerData, ExposureAssessment } from '@/types/exposure';
import { geocodeAddress, lookupWaterSystem } from './geocoding';
import { fetchUcmr5PfasData } from './epa-ucmr5';
import { fetchSdwisViolations } from './epa-sdwis';
import { fetchLeadRiskData } from './epa-lead';
import { scoreWaterLayer } from '@/lib/scoring/water-scorer';
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

  // Step 3: Fetch all water layer data in parallel
  const [pfasResult, violationsResult, leadResult] = await Promise.all([
    waterSystem
      ? fetchUcmr5PfasData(waterSystem.pwsid, waterSystem.name)
      : Promise.resolve({ data: null, error: 'No water system identified', source: 'EPA UCMR 5', cached: false, fetchedAt: new Date().toISOString() }),
    waterSystem
      ? fetchSdwisViolations(waterSystem.pwsid)
      : Promise.resolve({ data: null, error: 'No water system identified', source: 'EPA SDWIS', cached: false, fetchedAt: new Date().toISOString() }),
    fetchLeadRiskData(
      geocoded.fipsState,
      geocoded.fipsCounty,
      geocoded.censusTract,
      geocoded.censusBlockGroup
    ),
  ]);

  // Collect errors (not fatal — just informational)
  if (pfasResult.error) errors.push(`PFAS: ${pfasResult.error}`);
  if (violationsResult.error) errors.push(`Violations: ${violationsResult.error}`);
  if (leadResult.error) errors.push(`Lead risk: ${leadResult.error}`);

  // Build water layer data
  const waterData: WaterLayerData = {
    pfas: pfasResult.data,
    violations: violationsResult.data ?? [],
    leadRisk: leadResult.data,
    systemName: waterSystem?.name ?? 'Unknown',
    systemId: waterSystem?.pwsid ?? '',
  };

  // Step 4: Score water layer
  const waterScore = scoreWaterLayer(waterData);

  // Step 5: Compute composite score (MVP: water only for now, soil in Week 3)
  const compositeScore = computeCompositeScore({
    water: waterScore,
  });

  const assessment: ExposureAssessment = {
    id: crypto.randomUUID(),
    address: geocoded,
    compositeScore,
    waterData,
    dataFreshness: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  return { assessment, geocoded, errors };
}
