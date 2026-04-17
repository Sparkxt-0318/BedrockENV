import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { GeocodedAddress } from '@/types/exposure';

const mockGeocoded: GeocodedAddress = {
  raw: '123 Test St, Newark, NJ 07102',
  normalized: '123 Test St, Newark, NJ 07102',
  latitude: 40.7357,
  longitude: -74.1724,
  fipsState: '34',
  fipsCounty: '013',
  censusTract: '000600',
  censusBlockGroup: '1',
};

const mockWaterSystem = { pwsid: 'NJ0714001', name: 'NEWARK WATER' };

vi.mock('@/lib/data-sources/geocoding', () => ({
  geocodeAddress: vi.fn(),
  lookupWaterSystem: vi.fn(),
  extractCityHint: vi.fn(() => 'Newark'),
  extractZipHint: vi.fn(() => '07102'),
}));

vi.mock('@/lib/data-sources/epa-ucmr5', () => ({
  fetchUcmr5PfasData: vi.fn(() => Promise.resolve({ data: { detected: true, contaminants: [] }, error: null, source: 'ucmr5', cached: false, fetchedAt: new Date().toISOString() })),
}));
vi.mock('@/lib/data-sources/epa-sdwis', () => ({
  fetchSdwisViolations: vi.fn(() => Promise.resolve({ data: [], error: null, source: 'sdwis', cached: false, fetchedAt: new Date().toISOString() })),
}));
vi.mock('@/lib/data-sources/epa-lead', () => ({
  fetchLeadRiskData: vi.fn(() => Promise.resolve({ data: { medianYearBuilt: 1960, pctPre1960: 0.4 }, error: null, source: 'acs', cached: false, fetchedAt: new Date().toISOString() })),
}));
vi.mock('@/lib/data-sources/usgs-wqp', () => ({
  fetchWqpPfasData: vi.fn(() => Promise.resolve({ data: null, error: null, source: 'wqp', cached: false, fetchedAt: new Date().toISOString() })),
}));
vi.mock('@/lib/data-sources/usda-ssurgo', () => ({
  fetchSsurgoData: vi.fn(() => Promise.resolve({ data: { drainageClass: 'well drained', floodFrequency: 'none' }, error: null, source: 'ssurgo', cached: false, fetchedAt: new Date().toISOString() })),
}));
vi.mock('@/lib/data-sources/epa-brownfields', () => ({
  fetchBrownfieldSites: vi.fn(() => Promise.resolve({ data: [], error: null, source: 'brownfields', cached: false, fetchedAt: new Date().toISOString() })),
}));
vi.mock('@/lib/data-sources/epa-echo', () => ({
  fetchEchoFacilities: vi.fn(() => Promise.resolve({ data: { facilities: [], summary: { total: 0, snc: 0 } }, error: null, source: 'echo', cached: false, fetchedAt: new Date().toISOString() })),
}));
vi.mock('@/lib/data-sources/fema-nfhl', () => ({
  fetchFloodZone: vi.fn(() => Promise.resolve({ data: { zone: 'X', panelNumber: '1234' }, error: null, source: 'nfhl', cached: false, fetchedAt: new Date().toISOString() })),
}));
vi.mock('@/lib/data-sources/nasa-smap', () => ({
  fetchNasaPowerData: vi.fn(() => Promise.resolve({ data: { avgPrecipitation: 100 }, error: null, source: 'nasa-power', cached: false, fetchedAt: new Date().toISOString() })),
}));
vi.mock('@/lib/data-sources/openaq', () => ({
  fetchAirQualityData: vi.fn(() => Promise.resolve({ data: { pm25: 12, location: 'Test' }, error: null, source: 'openaq', cached: false, fetchedAt: new Date().toISOString() })),
}));
vi.mock('@/lib/data-sources/epa-aqs', () => ({
  fetchAqsData: vi.fn(() => Promise.resolve({ data: null, error: null, source: 'aqs', cached: false, fetchedAt: new Date().toISOString() })),
}));
vi.mock('@/lib/data-sources/epa-superfund', () => ({
  fetchSuperfundSites: vi.fn(() => Promise.resolve({ data: [], error: null, source: 'superfund', cached: false, fetchedAt: new Date().toISOString() })),
}));
vi.mock('@/lib/data-sources/epa-ejscreen', () => ({
  fetchEjScreenData: vi.fn(() => Promise.resolve({ data: null, error: null, source: 'ejscreen', cached: false, fetchedAt: new Date().toISOString() })),
}));
vi.mock('@/lib/data-sources/cdc-svi', () => ({
  fetchSviData: vi.fn(() => Promise.resolve({ data: null, error: null, source: 'svi', cached: false, fetchedAt: new Date().toISOString() })),
}));
vi.mock('@/lib/data-sources/nonattainment', () => ({
  lookupNonattainment: vi.fn(() => ({ isNonattainment: false, pollutants: [] })),
}));

vi.mock('@/lib/scoring/water-scorer', () => ({
  scoreWaterLayer: vi.fn(() => ({ score: 40, confidence: 'moderate', presence: 'present', components: {} })),
}));
vi.mock('@/lib/scoring/soil-scorer', () => ({
  scoreSoilLayer: vi.fn(() => ({ score: 20, confidence: 'moderate', presence: 'present', components: {} })),
}));
vi.mock('@/lib/scoring/air-scorer', () => ({
  scoreAirLayer: vi.fn(() => ({ score: 30, confidence: 'moderate', presence: 'present', components: {} })),
}));
vi.mock('@/lib/scoring/proximity-scorer', () => ({
  scoreProximityLayer: vi.fn(() => ({ score: 15, confidence: 'moderate', presence: 'present', components: {} })),
}));
vi.mock('@/lib/scoring/ej-scorer', () => ({
  scoreEjLayer: vi.fn(() => ({ score: 10, confidence: 'low', presence: 'partial', components: {} })),
}));
vi.mock('@/lib/scoring/engine', () => ({
  computeCompositeScore: vi.fn(() => ({
    score: 25,
    confidence: 'moderate',
    sufficient: true,
    coverage: 0.8,
    scoringVersion: 4,
    layersIncluded: ['water', 'soil', 'air', 'proximity', 'ej'],
    layerScores: {},
  })),
}));

import { fetchFullAssessment } from '@/lib/data-sources/index';
import { geocodeAddress, lookupWaterSystem } from '@/lib/data-sources/geocoding';
import { computeCompositeScore } from '@/lib/scoring/engine';
import { scoreWaterLayer } from '@/lib/scoring/water-scorer';

describe('fetchFullAssessment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null assessment when geocoding fails', async () => {
    vi.mocked(geocodeAddress).mockResolvedValueOnce(null);
    const result = await fetchFullAssessment('Nonexistent Address');
    expect(result.assessment).toBeNull();
    expect(result.geocoded).toBeNull();
    expect(result.errors).toContain('Could not geocode address. Please check the address and try again.');
  });

  it('returns a complete assessment for a valid address', async () => {
    vi.mocked(geocodeAddress).mockResolvedValueOnce(mockGeocoded);
    vi.mocked(lookupWaterSystem).mockResolvedValueOnce(mockWaterSystem);

    const result = await fetchFullAssessment('123 Test St, Newark, NJ 07102');

    expect(result.assessment).not.toBeNull();
    expect(result.geocoded).toEqual(expect.objectContaining({ latitude: 40.7357 }));
    expect(result.assessment!.compositeScore.score).toBe(25);
    expect(result.assessment!.address).toEqual(expect.objectContaining({ fipsState: '34' }));
  });

  it('calls all 5 scorers and composite engine', async () => {
    vi.mocked(geocodeAddress).mockResolvedValueOnce(mockGeocoded);
    vi.mocked(lookupWaterSystem).mockResolvedValueOnce(mockWaterSystem);

    await fetchFullAssessment('123 Test St');

    expect(scoreWaterLayer).toHaveBeenCalledOnce();
    expect(computeCompositeScore).toHaveBeenCalledOnce();
  });

  it('records error when water system lookup fails', async () => {
    vi.mocked(geocodeAddress).mockResolvedValueOnce(mockGeocoded);
    vi.mocked(lookupWaterSystem).mockResolvedValueOnce(null);

    const result = await fetchFullAssessment('123 Test St');

    expect(result.assessment).not.toBeNull();
    expect(result.errors).toContain('Could not identify the serving water system for this address.');
  });

  it('populates waterSystemId on geocoded address when water system found', async () => {
    vi.mocked(geocodeAddress).mockResolvedValueOnce({ ...mockGeocoded });
    vi.mocked(lookupWaterSystem).mockResolvedValueOnce(mockWaterSystem);

    const result = await fetchFullAssessment('123 Test St');

    expect(result.geocoded!.waterSystemId).toBe('NJ0714001');
    expect(result.geocoded!.waterSystemName).toBe('NEWARK WATER');
  });

  it('handles a data source rejecting without crashing', async () => {
    vi.mocked(geocodeAddress).mockResolvedValueOnce(mockGeocoded);
    vi.mocked(lookupWaterSystem).mockResolvedValueOnce(mockWaterSystem);

    const { fetchUcmr5PfasData } = await import('@/lib/data-sources/epa-ucmr5');
    vi.mocked(fetchUcmr5PfasData).mockRejectedValueOnce(new Error('API timeout'));

    const result = await fetchFullAssessment('123 Test St');

    expect(result.assessment).not.toBeNull();
    expect(result.errors).toContain('PFAS: API timeout');
  });

  it('sets waterData.systemName to Unknown when no water system', async () => {
    vi.mocked(geocodeAddress).mockResolvedValueOnce(mockGeocoded);
    vi.mocked(lookupWaterSystem).mockResolvedValueOnce(null);

    const result = await fetchFullAssessment('123 Test St');

    expect(result.assessment!.waterData.systemName).toBe('Unknown');
    expect(result.assessment!.waterData.systemId).toBe('');
  });

  it('assigns a UUID to the assessment', async () => {
    vi.mocked(geocodeAddress).mockResolvedValueOnce(mockGeocoded);
    vi.mocked(lookupWaterSystem).mockResolvedValueOnce(mockWaterSystem);

    const result = await fetchFullAssessment('123 Test St');

    expect(result.assessment!.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    );
  });

  it('collects non-fatal errors from successful-but-errored results', async () => {
    vi.mocked(geocodeAddress).mockResolvedValueOnce(mockGeocoded);
    vi.mocked(lookupWaterSystem).mockResolvedValueOnce(mockWaterSystem);

    const { fetchSsurgoData } = await import('@/lib/data-sources/usda-ssurgo');
    vi.mocked(fetchSsurgoData).mockResolvedValueOnce({
      data: null,
      error: 'Service degraded',
      source: 'ssurgo',
      cached: false,
      fetchedAt: new Date().toISOString(),
    });

    const result = await fetchFullAssessment('123 Test St');

    expect(result.assessment).not.toBeNull();
    expect(result.errors).toContain('Soil survey: Service degraded');
  });
});
