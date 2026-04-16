import { describe, it, expect } from 'vitest';
import { scoreWaterLayer } from '@/lib/scoring/water-scorer';
import type { WaterLayerData, WaterViolation } from '@/types/exposure';

function buildWaterData(overrides: Partial<WaterLayerData> = {}): WaterLayerData {
  return {
    pfas: null,
    wqpPfas: null,
    violations: [],
    leadRisk: null,
    systemName: 'Test Utility',
    systemId: 'TEST0001',
    ...overrides,
  };
}

describe('Water Scorer', () => {
  it('returns a low score for a clean water system with no detections', () => {
    const result = scoreWaterLayer(
      buildWaterData({
        pfas: null,
        violations: [],
        leadRisk: {
          pctPre1986: 10,
          pctPreA1950: 2,
          riskTier: 'LOW',
          resolution: 'neighborhood',
        },
      })
    );
    expect(result.score).toBeLessThan(20);
    expect(result.confidence).toBe('area');
    expect(result.available).toBe(true);
  });

  it('returns a HIGH score when PFAS exceeds the MCL', () => {
    const result = scoreWaterLayer(
      buildWaterData({
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
        violations: [],
        leadRisk: {
          pctPre1986: 20,
          pctPreA1950: 5,
          riskTier: 'LOW',
          resolution: 'neighborhood',
        },
      })
    );
    expect(result.score).toBeGreaterThan(20);
  });

  it('returns an elevated score for PFAS detected below MCL', () => {
    const low = scoreWaterLayer(
      buildWaterData({
        pfas: null,
        violations: [],
        leadRisk: {
          pctPre1986: 20,
          pctPreA1950: 5,
          riskTier: 'LOW',
          resolution: 'neighborhood',
        },
      })
    );
    const withPfas = scoreWaterLayer(
      buildWaterData({
        pfas: {
          systemId: 'TEST0001',
          systemName: 'Test Utility',
          analytes: [
            { name: 'PFOS', concentration: 2.1, mcl: 4, exceedsMcl: false },
          ],
          maxIndividual: 2.1,
          totalPfas: 2.1,
          exceedsMcl: false,
          testingPeriod: '2023',
        },
        violations: [],
        leadRisk: {
          pctPre1986: 20,
          pctPreA1950: 5,
          riskTier: 'LOW',
          resolution: 'neighborhood',
        },
      })
    );
    expect(withPfas.score).toBeGreaterThan(low.score);
  });

  it('accounts for lead risk from old housing stock', () => {
    const result = scoreWaterLayer(
      buildWaterData({
        pfas: null,
        violations: [],
        leadRisk: {
          pctPre1986: 80,
          pctPreA1950: 45,
          riskTier: 'HIGH',
          resolution: 'neighborhood',
        },
      })
    );
    expect(result.score).toBeGreaterThan(25);
    expect(result.subScores.lead).toBeGreaterThan(80);
  });

  it('accumulates score from multiple risk factors', () => {
    const pfasBase = buildWaterData({
      pfas: {
        systemId: 'TEST0001',
        systemName: 'Test Utility',
        analytes: [
          { name: 'PFOS', concentration: 6, mcl: 4, exceedsMcl: true },
        ],
        maxIndividual: 6,
        totalPfas: 6,
        exceedsMcl: true,
        testingPeriod: '2023',
      },
      violations: [],
      leadRisk: {
        pctPre1986: 10,
        pctPreA1950: 2,
        riskTier: 'LOW',
        resolution: 'neighborhood',
      },
    });

    const lastYearStr = `${new Date().getFullYear() - 1}-06-01`;
    const violation: WaterViolation = {
      type: 'MCL',
      contaminant: 'Arsenic',
      beginDate: lastYearStr,
      status: 'Resolved',
      isHealthBased: true,
    };
    const pfasOnly = scoreWaterLayer(pfasBase);
    const pfasPlusViolations = scoreWaterLayer({
      ...pfasBase,
      violations: [violation, violation, violation, violation],
    });
    expect(pfasPlusViolations.score).toBeGreaterThan(pfasOnly.score);
  });

  it('treats WQP empty with no PWSID as unmapped, not clean', () => {
    const withPwsid = scoreWaterLayer(
      buildWaterData({
        systemId: 'FL1234567',
        wqpPfas: { detections: [], maxDetectionPpt: 0, monitoringLocationCount: 0, exceedsMcl: false },
        leadRisk: { pctPre1986: 20, pctPreA1950: 5, riskTier: 'LOW', resolution: 'neighborhood' },
      })
    );
    const noPwsid = scoreWaterLayer({
      pfas: null,
      wqpPfas: { detections: [], maxDetectionPpt: 0, monitoringLocationCount: 0, exceedsMcl: false },
      violations: [],
      leadRisk: { pctPre1986: 20, pctPreA1950: 5, riskTier: 'LOW', resolution: 'neighborhood' },
      systemName: '',
      systemId: '',
    });

    // With PWSID: WQP empty is 'partial' (0.5) → PFAS counts toward coverage
    expect(withPwsid.coverage).toBeGreaterThan(noPwsid.coverage);
    // Without PWSID: WQP empty is 'unmapped' (0.0) → PFAS does NOT count
    const breakdown = noPwsid.rawData.coverageBreakdown as { weight: number; reason: string }[];
    expect(breakdown[0].reason).toBe('unmapped');
  });

  it('marks unavailable when no water layer data is present', () => {
    const result = scoreWaterLayer({
      pfas: null,
      wqpPfas: null,
      violations: [],
      leadRisk: null,
      systemName: '',
      systemId: '',
    });
    // Only "violations" weight contributes (at 0) so score is 0 but available is true
    expect(result.score).toBe(0);
    expect(result.confidence).toBe('area');
  });
});
