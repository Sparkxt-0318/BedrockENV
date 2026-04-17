import { describe, it, expect } from 'vitest';
import {
  scoreOrganicMatter,
  scorePh,
  scoreDrainage,
  scoreTexture,
  scoreClimate,
  scoreUrbanGap,
  computeSvs,
  scoreLegacy,
  scoreIndustrialDensity,
  scoreCompliance,
  scoreRelease,
  computeCpi,
  computeUsdaSviClass,
  computeScvi,
  assignQuartiles,
  type SoilVulnerabilityInputs,
  type ContaminationPressureInputs,
} from '@/lib/intelligence/scvi-scorer';

// ---------------------------------------------------------------------------
// SVS component tests
// ---------------------------------------------------------------------------

describe('scoreOrganicMatter', () => {
  it('returns 10 for healthy soil (≥3%)', () => {
    expect(scoreOrganicMatter(3.0)).toBe(10);
    expect(scoreOrganicMatter(5.0)).toBe(10);
  });

  it('returns 30 for moderate OM (2-3%)', () => {
    expect(scoreOrganicMatter(2.0)).toBe(30);
    expect(scoreOrganicMatter(2.5)).toBe(30);
  });

  it('returns 60 for low OM (1-2%)', () => {
    expect(scoreOrganicMatter(1.0)).toBe(60);
    expect(scoreOrganicMatter(1.5)).toBe(60);
  });

  it('returns 90 for severely degraded (<1%)', () => {
    expect(scoreOrganicMatter(0.5)).toBe(90);
    expect(scoreOrganicMatter(0)).toBe(90);
  });

  it('returns null for null input', () => {
    expect(scoreOrganicMatter(null)).toBeNull();
  });
});

describe('scorePh', () => {
  it('returns 10 for optimal pH (6.0-7.0)', () => {
    expect(scorePh(6.5)).toBe(10);
    expect(scorePh(6.0)).toBe(10);
    expect(scorePh(7.0)).toBe(10);
  });

  it('returns 30 for slightly off (5.5-6.0, 7.0-7.5)', () => {
    expect(scorePh(5.5)).toBe(30);
    expect(scorePh(7.5)).toBe(30);
  });

  it('returns 60 for moderately off (5.0-5.5, 7.5-8.0)', () => {
    expect(scorePh(5.0)).toBe(60);
    expect(scorePh(8.0)).toBe(60);
  });

  it('returns 90 for extreme pH (<5.0, >8.0)', () => {
    expect(scorePh(4.0)).toBe(90);
    expect(scorePh(9.0)).toBe(90);
  });

  it('returns null for null input', () => {
    expect(scorePh(null)).toBeNull();
  });
});

describe('scoreDrainage', () => {
  it('returns low score for well-drained soil', () => {
    expect(scoreDrainage('Well drained')).toBe(10);
    expect(scoreDrainage('Moderately well drained')).toBe(20);
  });

  it('returns high score for poorly drained (surface pooling)', () => {
    expect(scoreDrainage('Poorly drained')).toBe(70);
    expect(scoreDrainage('Very poorly drained')).toBe(85);
  });

  it('returns high score for excessively drained (rapid leaching)', () => {
    expect(scoreDrainage('Excessively drained')).toBe(75);
  });

  it('returns null for null input', () => {
    expect(scoreDrainage(null)).toBeNull();
  });

  it('returns default 40 for unrecognized drainage class', () => {
    expect(scoreDrainage('Unknown class')).toBe(40);
  });
});

describe('scoreTexture', () => {
  it('returns 80 for sandy soil (rapid leaching)', () => {
    expect(scoreTexture(75, 10, null)).toBe(80);
  });

  it('returns 50 for heavy clay', () => {
    expect(scoreTexture(10, 55, null)).toBe(50);
  });

  it('returns 20 for loam (balanced)', () => {
    expect(scoreTexture(40, 30, null)).toBe(20);
  });

  it('falls back to ksat when sand/clay unavailable', () => {
    expect(scoreTexture(null, null, 150)).toBe(70);
    expect(scoreTexture(null, null, 0.5)).toBe(45);
  });

  it('returns null when all inputs null', () => {
    expect(scoreTexture(null, null, null)).toBeNull();
  });
});

describe('scoreClimate', () => {
  it('returns 70 for high precipitation (>1400mm)', () => {
    expect(scoreClimate(1500, null)).toBe(70);
  });

  it('returns 40 for moderate precipitation', () => {
    expect(scoreClimate(1000, null)).toBe(40);
  });

  it('returns 20 for low precipitation', () => {
    expect(scoreClimate(500, null)).toBe(20);
  });

  it('returns 60 for arid conditions (dust pathway)', () => {
    expect(scoreClimate(null, 0.2)).toBe(60);
  });

  it('takes max of precip and aridity scores', () => {
    expect(scoreClimate(500, 0.2)).toBe(60);
  });

  it('returns null when both null', () => {
    expect(scoreClimate(null, null)).toBeNull();
  });
});

describe('scoreUrbanGap', () => {
  it('returns 0 for non-urban', () => {
    expect(scoreUrbanGap(false, -0.3)).toBe(0);
  });

  it('returns 80 for urban with vegetation stress', () => {
    expect(scoreUrbanGap(true, -0.2)).toBe(80);
  });

  it('returns 50 for urban without stress data', () => {
    expect(scoreUrbanGap(true, null)).toBe(50);
    expect(scoreUrbanGap(true, -0.1)).toBe(50);
  });
});

// ---------------------------------------------------------------------------
// SVS composite
// ---------------------------------------------------------------------------

describe('computeSvs', () => {
  const healthySoil: SoilVulnerabilityInputs = {
    organicMatterPct: 4.0,
    ph: 6.5,
    drainageClass: 'Well drained',
    clayPct: 25,
    sandPct: 35,
    ksat: 10,
    hydrologicSoilGroup: 'B',
    meanAnnualPrecipMm: 900,
    aridityIndex: 30,
    ndviAnomaly: null,
    isUrbanLandMapUnit: false,
  };

  const degradedSoil: SoilVulnerabilityInputs = {
    organicMatterPct: 0.5,
    ph: 4.5,
    drainageClass: 'Very poorly drained',
    clayPct: 5,
    sandPct: 80,
    ksat: null,
    hydrologicSoilGroup: 'D',
    meanAnnualPrecipMm: 1600,
    aridityIndex: null,
    ndviAnomaly: null,
    isUrbanLandMapUnit: false,
  };

  it('healthy soil gets low SVS', () => {
    const result = computeSvs(healthySoil);
    expect(result.svs).toBeLessThan(25);
  });

  it('degraded soil gets high SVS', () => {
    const result = computeSvs(degradedSoil);
    expect(result.svs).toBeGreaterThan(75);
  });

  it('tracks data points', () => {
    const result = computeSvs(healthySoil);
    expect(result.dataPoints).toBe(5);
  });

  it('handles all null inputs gracefully', () => {
    const nullInputs: SoilVulnerabilityInputs = {
      organicMatterPct: null, ph: null, drainageClass: null,
      clayPct: null, sandPct: null, ksat: null,
      hydrologicSoilGroup: null, meanAnnualPrecipMm: null,
      aridityIndex: null, ndviAnomaly: null, isUrbanLandMapUnit: false,
    };
    const result = computeSvs(nullInputs);
    expect(result.svs).toBe(0);
    expect(result.dataPoints).toBe(0);
  });

  it('urban gap fill adds data point for urban land', () => {
    const urban: SoilVulnerabilityInputs = {
      ...healthySoil,
      organicMatterPct: null, ph: null, drainageClass: null,
      sandPct: null, clayPct: null, ksat: null,
      isUrbanLandMapUnit: true, ndviAnomaly: -0.2,
    };
    const result = computeSvs(urban);
    expect(result.components.urbanGap).toBe(80);
    expect(result.dataPoints).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// CPI component tests
// ---------------------------------------------------------------------------

describe('scoreLegacy', () => {
  it('returns 95 for very close Superfund (<1 mi)', () => {
    expect(scoreLegacy(1, 0.5, 0, null)).toBe(95);
  });

  it('returns 75 for nearby Superfund (1-3 mi)', () => {
    expect(scoreLegacy(1, 2.0, 0, null)).toBe(75);
  });

  it('returns 65 for distant Superfund', () => {
    expect(scoreLegacy(1, 4.0, 0, null)).toBe(65);
  });

  it('returns 70 for many brownfields', () => {
    expect(scoreLegacy(0, null, 6, 0.5)).toBe(70);
  });

  it('returns 40 for few brownfields', () => {
    expect(scoreLegacy(0, null, 2, 1.0)).toBe(40);
  });

  it('returns 0 for no contamination sites', () => {
    expect(scoreLegacy(0, null, 0, null)).toBe(0);
  });

  it('Superfund takes precedence over brownfields', () => {
    expect(scoreLegacy(1, 0.5, 10, 0.1)).toBe(95);
  });
});

describe('scoreIndustrialDensity', () => {
  it('returns 90 for very high density (>10/sqmi)', () => {
    expect(scoreIndustrialDensity(100, 50, 10)).toBe(90);
  });

  it('returns 50 for moderate density (1-5)', () => {
    expect(scoreIndustrialDensity(50, 0, 20)).toBe(50);
  });

  it('returns 0 for zero facilities', () => {
    expect(scoreIndustrialDensity(0, 0, 100)).toBe(0);
  });

  it('returns 0 for zero area', () => {
    expect(scoreIndustrialDensity(10, 5, 0)).toBe(0);
  });
});

describe('scoreCompliance', () => {
  it('returns 90 for many violators', () => {
    expect(scoreCompliance(6)).toBe(90);
  });

  it('returns 60 for some violators', () => {
    expect(scoreCompliance(3)).toBe(60);
  });

  it('returns 10 for no violators', () => {
    expect(scoreCompliance(0)).toBe(10);
  });
});

describe('scoreRelease', () => {
  it('returns 95 for massive releases (>1M lbs)', () => {
    expect(scoreRelease(2_000_000)).toBe(95);
  });

  it('returns 70 for large releases', () => {
    expect(scoreRelease(500_000)).toBe(70);
  });

  it('returns 0 for zero releases', () => {
    expect(scoreRelease(0)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// CPI composite
// ---------------------------------------------------------------------------

describe('computeCpi', () => {
  it('returns 0-range for clean county', () => {
    const clean: ContaminationPressureInputs = {
      brownfieldCount: 0, brownfieldNearestMiles: null,
      superfundCount: 0, superfundNearestMiles: null,
      echoFacilityCount: 0, echoSncCount: 0,
      triFacilityCount: 0, triTotalReleasesLbs: 0,
      countyAreaSqMi: 500,
    };
    const result = computeCpi(clean);
    expect(result.cpi).toBeLessThan(10);
  });

  it('returns high CPI for heavily contaminated county', () => {
    const heavy: ContaminationPressureInputs = {
      brownfieldCount: 10, brownfieldNearestMiles: 0.2,
      superfundCount: 2, superfundNearestMiles: 0.5,
      echoFacilityCount: 200, echoSncCount: 8,
      triFacilityCount: 20, triTotalReleasesLbs: 2_000_000,
      countyAreaSqMi: 15,
    };
    const result = computeCpi(heavy);
    expect(result.cpi).toBeGreaterThan(85);
  });
});

// ---------------------------------------------------------------------------
// USDA SVI classification
// ---------------------------------------------------------------------------

describe('computeUsdaSviClass', () => {
  it('returns Low for Group A with high OC', () => {
    expect(computeUsdaSviClass('A', 2.5)).toBe('Low');
  });

  it('returns High for Group D with low OC', () => {
    expect(computeUsdaSviClass('D', 0.3)).toBe('High');
  });

  it('returns Moderate for Group B with moderate OC', () => {
    expect(computeUsdaSviClass('B', 1.5)).toBe('Moderate');
  });

  it('returns Moderately High for Group C with low OC', () => {
    expect(computeUsdaSviClass('C', 0.6)).toBe('Moderately High');
  });

  it('defaults to Moderate when both null', () => {
    expect(computeUsdaSviClass(null, null)).toBe('Moderate');
  });

  it('handles dual groups (A/D, B/D, C/D)', () => {
    expect(computeUsdaSviClass('A/D', 2.0)).toBe('Low');
    expect(computeUsdaSviClass('C/D', 0.3)).toBe('High');
  });
});

// ---------------------------------------------------------------------------
// SCVI composite (the interaction test)
// ---------------------------------------------------------------------------

describe('computeScvi', () => {
  const vulnerableSoil: SoilVulnerabilityInputs = {
    organicMatterPct: 0.5, ph: 4.5, drainageClass: 'Very poorly drained',
    clayPct: 5, sandPct: 80, ksat: null,
    hydrologicSoilGroup: 'D', meanAnnualPrecipMm: 1600,
    aridityIndex: null, ndviAnomaly: null, isUrbanLandMapUnit: false,
  };

  const resilientSoil: SoilVulnerabilityInputs = {
    organicMatterPct: 4.0, ph: 6.5, drainageClass: 'Well drained',
    clayPct: 25, sandPct: 35, ksat: 10,
    hydrologicSoilGroup: 'A', meanAnnualPrecipMm: 900,
    aridityIndex: 30, ndviAnomaly: null, isUrbanLandMapUnit: false,
  };

  const highPressure: ContaminationPressureInputs = {
    brownfieldCount: 10, brownfieldNearestMiles: 0.2,
    superfundCount: 2, superfundNearestMiles: 0.5,
    echoFacilityCount: 200, echoSncCount: 8,
    triFacilityCount: 20, triTotalReleasesLbs: 2_000_000,
    countyAreaSqMi: 15,
  };

  const lowPressure: ContaminationPressureInputs = {
    brownfieldCount: 0, brownfieldNearestMiles: null,
    superfundCount: 0, superfundNearestMiles: null,
    echoFacilityCount: 0, echoSncCount: 0,
    triFacilityCount: 0, triTotalReleasesLbs: 0,
    countyAreaSqMi: 500,
  };

  it('high SVS + low CPI → low SCVI (interaction)', () => {
    const result = computeScvi(vulnerableSoil, lowPressure);
    expect(result.svs).toBeGreaterThan(75);
    expect(result.cpi).toBeLessThan(10);
    expect(result.scvi).toBeLessThan(30);
  });

  it('low SVS + high CPI → moderate SCVI (interaction)', () => {
    const result = computeScvi(resilientSoil, highPressure);
    expect(result.svs).toBeLessThan(25);
    expect(result.cpi).toBeGreaterThan(85);
    expect(result.scvi).toBeLessThan(50);
  });

  it('high SVS + high CPI → high SCVI (both required)', () => {
    const result = computeScvi(vulnerableSoil, highPressure);
    expect(result.svs).toBeGreaterThan(75);
    expect(result.cpi).toBeGreaterThan(85);
    expect(result.scvi).toBeGreaterThan(75);
  });

  it('low SVS + low CPI → very low SCVI', () => {
    const result = computeScvi(resilientSoil, lowPressure);
    expect(result.scvi).toBeLessThan(10);
  });

  it('includes USDA SVI classification', () => {
    const result = computeScvi(vulnerableSoil, highPressure);
    expect(result.usdaSviClass).toBe('High');
  });

  it('returns coverage stats', () => {
    const result = computeScvi(resilientSoil, highPressure);
    expect(result.coverage.svsDataPoints).toBeGreaterThan(0);
    expect(result.coverage.cpiDataPoints).toBeGreaterThan(0);
  });

  it('handles all-null SVS inputs (SCVI = 0)', () => {
    const nullSoil: SoilVulnerabilityInputs = {
      organicMatterPct: null, ph: null, drainageClass: null,
      clayPct: null, sandPct: null, ksat: null,
      hydrologicSoilGroup: null, meanAnnualPrecipMm: null,
      aridityIndex: null, ndviAnomaly: null, isUrbanLandMapUnit: false,
    };
    const result = computeScvi(nullSoil, highPressure);
    expect(result.svs).toBe(0);
    expect(result.scvi).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Quartile assignment
// ---------------------------------------------------------------------------

describe('assignQuartiles', () => {
  it('distributes 8 records into 4 quartiles', () => {
    const records = [
      { scvi: 10 }, { scvi: 20 }, { scvi: 30 }, { scvi: 40 },
      { scvi: 50 }, { scvi: 60 }, { scvi: 70 }, { scvi: 80 },
    ];
    const q = assignQuartiles(records);
    expect(q[0]).toBe(1);
    expect(q[1]).toBe(1);
    expect(q[2]).toBe(2);
    expect(q[3]).toBe(2);
    expect(q[4]).toBe(3);
    expect(q[5]).toBe(3);
    expect(q[6]).toBe(4);
    expect(q[7]).toBe(4);
  });

  it('preserves original index ordering', () => {
    const records = [{ scvi: 90 }, { scvi: 10 }, { scvi: 50 }];
    const q = assignQuartiles(records);
    expect(q[0]).toBe(3); // scvi=90 is sorted index 2 of 3 → pct=0.67 → Q3
    expect(q[1]).toBe(1); // scvi=10 is sorted index 0 of 3 → pct=0.00 → Q1
    expect(q[2]).toBe(2); // scvi=50 is sorted index 1 of 3 → pct=0.33 → Q2
  });

  it('handles single record', () => {
    const q = assignQuartiles([{ scvi: 50 }]);
    expect(q[0]).toBe(1);
  });

  it('handles empty array', () => {
    const q = assignQuartiles([]);
    expect(q).toHaveLength(0);
  });
});
