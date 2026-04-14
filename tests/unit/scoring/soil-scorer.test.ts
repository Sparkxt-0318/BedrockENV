import { describe, it, expect } from 'vitest';
import { scoreSoilLayer } from '@/lib/scoring/soil-scorer';
import type { SoilLayerData, SsurgoData, FloodZoneData } from '@/types/exposure';

function buildSsurgo(overrides: Partial<SsurgoData> = {}): SsurgoData {
  return {
    mapUnitName: 'Test Map Unit',
    mapUnitKey: 'MU-1',
    components: [],
    dominantTexture: 'loam',
    phRange: [6.5, 6.8],
    organicMatterPct: 3.5,
    drainageClass: 'Well drained',
    cec: 15,
    ksat: 10,
    coverage: 'mapped',
    ...overrides,
  };
}

function buildFloodZone(
  overrides: Partial<FloodZoneData> = {}
): FloodZoneData {
  return {
    zone: 'X',
    zoneDescription: 'Minimal flood hazard',
    isSpecialFloodHazardArea: false,
    riskLevel: 'LOW',
    staticBfe: null,
    features: [],
    coverage: 'mapped',
    ...overrides,
  };
}

function buildSoilData(overrides: Partial<SoilLayerData> = {}): SoilLayerData {
  return {
    ssurgo: null,
    brownfields: [],
    floodZone: null,
    moistureData: null,
    ...overrides,
  };
}

describe('Soil Scorer', () => {
  it('returns LOW for healthy soil with no nearby contamination', () => {
    const result = scoreSoilLayer(
      buildSoilData({
        ssurgo: buildSsurgo(),
        brownfields: [],
        floodZone: buildFloodZone(),
      })
    );
    expect(result.score).toBeLessThan(30);
  });

  it('returns HIGH when near a brownfield inside a special flood hazard area', () => {
    const result = scoreSoilLayer(
      buildSoilData({
        ssurgo: buildSsurgo({
          phRange: [5.1, 5.3],
          organicMatterPct: 0.8,
          drainageClass: 'Poorly drained',
        }),
        brownfields: [
          {
            name: 'Old Factory',
            siteId: 'BF-001',
            distance: 0.3,
            direction: 'N',
            contaminantTypes: ['Lead', 'PCBs'],
            cleanupStatus: 'Active',
            latitude: 40,
            longitude: -74,
          },
        ],
        floodZone: buildFloodZone({
          zone: 'AE',
          zoneDescription: '1% annual chance flood',
          isSpecialFloodHazardArea: true,
          riskLevel: 'HIGH',
        }),
      })
    );
    expect(result.score).toBeGreaterThan(70);
  });

  it('flags the flood-contamination connection', () => {
    const noFlood = scoreSoilLayer(
      buildSoilData({
        ssurgo: buildSsurgo({ organicMatterPct: 2.0 }),
        brownfields: [
          {
            name: 'Site A',
            siteId: 'BF-A',
            distance: 0.5,
            direction: 'N',
            contaminantTypes: ['Petroleum'],
            cleanupStatus: 'Complete',
            latitude: 40,
            longitude: -74,
          },
        ],
        floodZone: buildFloodZone(),
      })
    );
    const withFlood = scoreSoilLayer(
      buildSoilData({
        ssurgo: buildSsurgo({ organicMatterPct: 2.0 }),
        brownfields: [
          {
            name: 'Site A',
            siteId: 'BF-A',
            distance: 0.5,
            direction: 'N',
            contaminantTypes: ['Petroleum'],
            cleanupStatus: 'Complete',
            latitude: 40,
            longitude: -74,
          },
        ],
        floodZone: buildFloodZone({
          zone: 'AE',
          zoneDescription: '1% annual chance flood',
          isSpecialFloodHazardArea: true,
          riskLevel: 'HIGH',
        }),
      })
    );
    expect(withFlood.score).toBeGreaterThan(noFlood.score);
  });

  it('handles missing SSURGO data without crashing', () => {
    const result = scoreSoilLayer(
      buildSoilData({
        ssurgo: null,
        brownfields: [],
        floodZone: buildFloodZone(),
      })
    );
    expect(typeof result.score).toBe('number');
    expect(['property', 'neighborhood']).toContain(result.confidence);
  });
});
