import { describe, it, expect } from 'vitest';
import { evaluateRecommendations } from '@/lib/recommendations/engine';
import type {
  ExposureAssessment,
  WaterLayerData,
  SoilLayerData,
  CompositeScore,
} from '@/types/exposure';

function buildAssessment(opts: {
  water?: WaterLayerData;
  soil?: SoilLayerData;
  composite?: Partial<CompositeScore>;
}): ExposureAssessment {
  return {
    id: 'test-assessment',
    address: {
      raw: '1 Test St, Nowhere, CA 00000',
      normalized: '1 Test St, Nowhere, CA 00000',
      latitude: 0,
      longitude: 0,
      fipsState: '06',
      fipsCounty: '001',
      censusTract: '000000',
      censusBlockGroup: '1',
    },
    compositeScore: {
      score: opts.composite?.score ?? 50,
      confidence: opts.composite?.confidence ?? 'moderate',
      sufficient: opts.composite?.sufficient ?? true,
      coverage: opts.composite?.coverage ?? 1,
      scoringVersion: opts.composite?.scoringVersion ?? 1,
      layersIncluded: opts.composite?.layersIncluded ?? ['water', 'soil'],
      layerScores: opts.composite?.layerScores ?? {},
    },
    waterData: opts.water,
    soilData: opts.soil,
    dataFreshness: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
}

describe('Recommendation Engine', () => {
  it('triggers PFAS-HIGH template when PFAS exceeds MCL', () => {
    const recs = evaluateRecommendations(
      buildAssessment({
        water: {
          systemName: 'Test Utility',
          systemId: 'TEST0001',
          violations: [],
          leadRisk: null,
          wqpPfas: null,
          pfas: {
            systemId: 'TEST0001',
            systemName: 'Test Utility',
            analytes: [
              { name: 'PFOS', concentration: 8.5, mcl: 4, exceedsMcl: true },
            ],
            maxIndividual: 8.5,
            totalPfas: 8.5,
            exceedsMcl: true,
            testingPeriod: '2023',
          },
        },
      })
    );
    const pfasRec = recs.find((r) => r.templateId.startsWith('PFAS-HIGH'));
    expect(pfasRec).toBeDefined();
    expect(pfasRec!.riskTier).toBe('HIGH');
    expect(pfasRec!.finding).toContain('8.5');
    expect(pfasRec!.finding).toContain('Test Utility');
  });

  it('triggers LEAD-HIGH template for old housing stock', () => {
    const recs = evaluateRecommendations(
      buildAssessment({
        water: {
          systemName: 'Test Utility',
          systemId: 'TEST0001',
          violations: [],
          pfas: null,
          wqpPfas: null,
          leadRisk: {
            pctPreA1950: 45,
            pctPre1986: 70,
            riskTier: 'HIGH',
            resolution: 'neighborhood',
          },
        },
      })
    );
    const leadRec = recs.find((r) => r.templateId.startsWith('LEAD-HIGH'));
    expect(leadRec).toBeDefined();
  });

  it('triggers SOIL-FLOOD compound risk template', () => {
    const recs = evaluateRecommendations(
      buildAssessment({
        soil: {
          ssurgo: null,
          moistureData: null,
          echoFacilities: null,
          brownfields: [
            {
              name: 'Old Mill Site',
              siteId: 'BF-MILL',
              distance: 0.3,
              direction: 'N',
              contaminantTypes: ['Lead'],
              cleanupStatus: 'Active',
              latitude: 0,
              longitude: 0,
            },
          ],
          floodZone: {
            zone: 'AE',
            zoneDescription: '1% annual chance flood',
            isSpecialFloodHazardArea: true,
            riskLevel: 'HIGH',
            staticBfe: 12.5,
            features: [],
            coverage: 'mapped',
          },
        },
      })
    );
    const floodRec = recs.find((r) => r.templateId.startsWith('SOIL-FLOOD'));
    expect(floodRec).toBeDefined();
    expect(floodRec!.finding).toContain('Old Mill Site');
  });

  it('never returns duplicate templates for the same trigger field', () => {
    const lastYear = `${new Date().getFullYear() - 1}-06-01`;
    const recs = evaluateRecommendations(
      buildAssessment({
        water: {
          systemName: 'Test Utility',
          systemId: 'TEST0001',
          violations: Array.from({ length: 5 }, () => ({
            type: 'MCL',
            contaminant: 'Nitrate',
            beginDate: lastYear,
            status: 'Resolved',
            isHealthBased: true,
          })),
          wqpPfas: null,
          leadRisk: {
            pctPreA1950: 40,
            pctPre1986: 70,
            riskTier: 'HIGH',
            resolution: 'neighborhood',
          },
          pfas: {
            systemId: 'TEST0001',
            systemName: 'Test Utility',
            analytes: [
              { name: 'PFOS', concentration: 10, mcl: 4, exceedsMcl: true },
            ],
            maxIndividual: 10,
            totalPfas: 10,
            exceedsMcl: true,
            testingPeriod: '2023',
          },
        },
      })
    );
    const ids = recs.map((r) => r.templateId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every recommendation includes a source citation and disclaimer', () => {
    const recs = evaluateRecommendations(
      buildAssessment({
        water: {
          systemName: 'Test Utility',
          systemId: 'TEST0001',
          violations: [],
          leadRisk: null,
          wqpPfas: null,
          pfas: {
            systemId: 'TEST0001',
            systemName: 'Test Utility',
            analytes: [
              { name: 'PFOS', concentration: 10, mcl: 4, exceedsMcl: true },
            ],
            maxIndividual: 10,
            totalPfas: 10,
            exceedsMcl: true,
            testingPeriod: '2023',
          },
        },
        soil: {
          ssurgo: null,
          moistureData: null,
          echoFacilities: null,
          floodZone: null,
          brownfields: [
            {
              name: 'Test Site',
              siteId: 'BF-T',
              distance: 0.2,
              direction: 'N',
              contaminantTypes: ['Lead'],
              cleanupStatus: 'Active',
              latitude: 0,
              longitude: 0,
            },
          ],
        },
      })
    );
    expect(recs.length).toBeGreaterThan(0);
    for (const rec of recs) {
      expect(rec.sourceCitation).toBeTruthy();
      expect(rec.sourceCitation.length).toBeGreaterThan(10);
      expect(rec.disclaimer).toBeTruthy();
      expect(rec.disclaimer.length).toBeGreaterThan(10);
    }
  });

  it('returns no HIGH/ELEVATED triggers for completely clean data', () => {
    const recs = evaluateRecommendations(
      buildAssessment({
        water: {
          systemName: 'Test Utility',
          systemId: 'TEST0001',
          violations: [],
          pfas: null,
          wqpPfas: null,
          leadRisk: {
            pctPreA1950: 5,
            pctPre1986: 20,
            riskTier: 'LOW',
            resolution: 'neighborhood',
          },
        },
        soil: {
          ssurgo: {
            mapUnitName: 'Unit',
            mapUnitKey: 'MU',
            components: [],
            dominantTexture: 'loam',
            phRange: [6.5, 6.8],
            organicMatterPct: 4.0,
            drainageClass: 'Well drained',
            cec: 15,
            ksat: 10,
            coverage: 'mapped',
          },
          brownfields: [],
          echoFacilities: null,
          floodZone: {
            zone: 'X',
            zoneDescription: 'Minimal',
            isSpecialFloodHazardArea: false,
            riskLevel: 'LOW',
            staticBfe: null,
            features: [],
            coverage: 'mapped',
          },
          moistureData: null,
        },
      })
    );
    const highRecs = recs.filter(
      (r) => r.riskTier === 'HIGH' || r.riskTier === 'ELEVATED'
    );
    expect(highRecs).toHaveLength(0);
  });
});
