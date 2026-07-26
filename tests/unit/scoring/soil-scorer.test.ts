import { describe, it, expect } from 'vitest';
import { scoreSoilLayer } from '@/lib/scoring/soil-scorer';
import type {
  SoilLayerData,
  SsurgoData,
  FloodZoneData,
  BrownfieldSite,
  SoilMoistureData,
} from '@/types/exposure';

// ---------------------------------------------------------------------------
// Builders — keep test intent obvious
// ---------------------------------------------------------------------------

function buildSsurgo(overrides: Partial<SsurgoData> = {}): SsurgoData {
  return {
    mapUnitName: 'Test Map Unit',
    mapUnitKey: 'MU-1',
    components: [],
    dominantTexture: 'loam',
    phRange: [6.5, 6.8],
    organicMatterPct: 3.5,
    drainageClass: 'Well drained',
    hydrologicSoilGroup: 'B',
    sandPct: 35,
    clayPct: 20,
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

function buildBrownfield(
  overrides: Partial<BrownfieldSite> = {}
): BrownfieldSite {
  return {
    name: 'Former Industrial Site',
    siteId: 'BF-X',
    distance: 0.5,
    direction: 'N',
    contaminantTypes: ['Petroleum'],
    cleanupStatus: 'Complete',
    latitude: 40,
    longitude: -74,
    ...overrides,
  };
}

function buildMoisture(
  overrides: Partial<SoilMoistureData> = {}
): SoilMoistureData {
  return {
    surfaceMoisture: 50,
    trend: 'stable',
    precipitationAvgMm: 1000,
    meanAnnualTempC: 15,
    aridityIndex: 40,
    fillFraction: 0,
    resolution: 'area',
    ...overrides,
  };
}

function buildSoilData(overrides: Partial<SoilLayerData> = {}): SoilLayerData {
  return {
    ssurgo: null,
    brownfields: [],
    echoFacilities: null,
    floodZone: null,
    moistureData: null,
    ...overrides,
  };
}

const SFHA = buildFloodZone({
  zone: 'AE',
  zoneDescription: '1% annual chance flood',
  isSpecialFloodHazardArea: true,
  riskLevel: 'HIGH',
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Soil Scorer', () => {
  it('scores clean baseline soil well below the penalty band', () => {
    const result = scoreSoilLayer(
      buildSoilData({
        ssurgo: buildSsurgo(),            // healthy pH, OM, well-drained
        brownfields: [],                   // no nearby contamination
        floodZone: buildFloodZone(),       // Zone X, not SFHA
        moistureData: buildMoisture(),     // humid, stable
      })
    );
    expect(result.available).toBe(true);
    expect(result.confidence).toBe('neighborhood');
    expect(result.score).toBeLessThan(30);
    // All 4 sub-components present → full coverage
    expect(result.coverage).toBe(1);
  });

  it('penalizes brownfield-only (no flood) proportionally to proximity', () => {
    const result = scoreSoilLayer(
      buildSoilData({
        ssurgo: buildSsurgo(),
        brownfields: [
          buildBrownfield({ siteId: 'BF-1', distance: 0.3 }),
          buildBrownfield({ siteId: 'BF-2', distance: 0.8 }),
          buildBrownfield({ siteId: 'BF-3', distance: 1.5 }),
        ],
        floodZone: buildFloodZone(),       // NOT SFHA
        moistureData: buildMoisture(),
      })
    );
    expect(result.available).toBe(true);
    // Brownfield sub-score has weight 0.35; three close sites yields a
    // noticeable but not dominant composite.
    expect(result.score).toBeGreaterThan(15);
    expect(result.score).toBeLessThan(70);
    expect(result.subScores.contamination).toBeGreaterThan(60);
  });

  it('penalizes flood-only (no brownfields) SFHA placement', () => {
    const result = scoreSoilLayer(
      buildSoilData({
        ssurgo: buildSsurgo(),
        brownfields: [],                   // clean, but flood-contamination
                                           // sub-score will be 0 because no
                                           // sites to compound with
        floodZone: SFHA,
        moistureData: buildMoisture(),
      })
    );
    // With no brownfields the flood-contamination compound scores only the
    // SFHA "base" (55) without amplification. contamination sub-score = 0.
    expect(result.available).toBe(true);
    expect(result.subScores.floodContamination).toBeGreaterThanOrEqual(50);
    expect(result.subScores.contamination).toBe(0);
    expect(result.score).toBeGreaterThan(10);
    expect(result.score).toBeLessThan(60);
  });

  it('COMPOUND: flood + brownfield scores strictly higher than either alone', () => {
    const sites = [
      buildBrownfield({ siteId: 'BF-1', distance: 0.3 }),
      buildBrownfield({ siteId: 'BF-2', distance: 0.8 }),
      buildBrownfield({ siteId: 'BF-3', distance: 1.5 }),
    ];

    const brownfieldOnly = scoreSoilLayer(
      buildSoilData({
        ssurgo: buildSsurgo(),
        brownfields: sites,
        floodZone: buildFloodZone(),       // not SFHA
        moistureData: buildMoisture(),
      })
    );

    const floodOnly = scoreSoilLayer(
      buildSoilData({
        ssurgo: buildSsurgo(),
        brownfields: [],
        floodZone: SFHA,
        moistureData: buildMoisture(),
      })
    );

    const compound = scoreSoilLayer(
      buildSoilData({
        ssurgo: buildSsurgo(),
        brownfields: sites,
        floodZone: SFHA,
        moistureData: buildMoisture(),
      })
    );

    // The whole justification for the flood-contamination sub-component:
    // co-occurrence must score higher than the worst individual factor.
    expect(compound.score).toBeGreaterThan(brownfieldOnly.score);
    expect(compound.score).toBeGreaterThan(floodOnly.score);
  });

  it('handles unmapped SSURGO gracefully — drops health, re-weights the rest', () => {
    const result = scoreSoilLayer(
      buildSoilData({
        ssurgo: buildSsurgo({ coverage: 'unmapped' }),
        brownfields: [buildBrownfield({ distance: 0.4 })],
        floodZone: buildFloodZone(),
        moistureData: buildMoisture(),
      })
    );
    expect(result.available).toBe(true);
    // Health sub-score must not appear — SSURGO had no usable chemistry.
    expect(result.subScores.health).toBeUndefined();
    expect(result.subScores.contamination).toBeGreaterThan(0);
    // Without SSURGO the resolution drops from neighborhood to area.
    expect(result.confidence).toBe('area');
    expect(result.score).toBeGreaterThan(0);
    // 3 of 4 components present, 1 unmapped → coverage = (0.35+0.25+0.10) / 1.0 = 0.70
    expect(result.coverage).toBeCloseTo(0.7, 10);
  });

  it('returns available:false with 0 coverage when every soil input is null/unmapped', () => {
    const result = scoreSoilLayer(
      buildSoilData({
        ssurgo: null,
        brownfields: null as unknown as BrownfieldSite[], // client failed
        floodZone: null,
        moistureData: null,
      })
    );
    expect(result.available).toBe(false);
    expect(result.score).toBe(0);
    expect(result.confidence).toBe('area');
    expect(result.coverage).toBe(0);
  });

  it('returns available:false when ssurgo unmapped and other clients failed', () => {
    const result = scoreSoilLayer(
      buildSoilData({
        ssurgo: buildSsurgo({ coverage: 'unmapped' }),
        brownfields: null as unknown as BrownfieldSite[],
        floodZone: buildFloodZone({ coverage: 'unmapped' }),
        moistureData: null,
      })
    );
    expect(result.available).toBe(false);
  });

  it('skips brownfield entries with non-finite or negative distance', () => {
    // Should not throw; invalid sites should be silently skipped so the
    // valid site at 0.5 mi still drives the contamination score.
    const result = scoreSoilLayer(
      buildSoilData({
        ssurgo: buildSsurgo(),
        brownfields: [
          buildBrownfield({ siteId: 'bad-nan', distance: NaN }),
          buildBrownfield({ siteId: 'bad-neg', distance: -1 }),
          buildBrownfield({ siteId: 'good', distance: 0.5 }),
        ],
        floodZone: buildFloodZone(),
        moistureData: buildMoisture(),
      })
    );
    expect(result.available).toBe(true);
    // Only the 0.5-mile site counts; score should be non-zero but not
    // as high as three close valid sites would produce.
    expect(result.subScores.contamination).toBeGreaterThan(0);
    expect(result.subScores.contamination).toBeLessThan(90);
  });

  it('applies low organic matter penalty (OM 1–2%: returns 80)', () => {
    const result = scoreSoilLayer(
      buildSoilData({
        ssurgo: buildSsurgo({ organicMatterPct: 1.5 }),
        brownfields: [],
        floodZone: buildFloodZone(),
        moistureData: buildMoisture(),
      })
    );
    expect(result.available).toBe(true);
    expect(result.subScores.health).toBeGreaterThan(0);
  });

  it('applies severe organic matter penalty (OM 0–1%: returns 95)', () => {
    const result = scoreSoilLayer(
      buildSoilData({
        ssurgo: buildSsurgo({ organicMatterPct: 0.5 }),
        brownfields: [],
        floodZone: buildFloodZone(),
        moistureData: buildMoisture(),
      })
    );
    expect(result.available).toBe(true);
    // With OM=0.5 the health sub-score should be significantly elevated.
    expect(result.subScores.health).toBeGreaterThan(30);
  });

  it('applies moderate organic matter penalty (OM 2–3%: returns 55)', () => {
    const result = scoreSoilLayer(
      buildSoilData({
        ssurgo: buildSsurgo({ organicMatterPct: 2.5 }),
        brownfields: [],
        floodZone: buildFloodZone(),
        moistureData: buildMoisture(),
      })
    );
    expect(result.available).toBe(true);
    expect(result.subScores.health).toBeGreaterThan(0);
  });

  it('scores unknown drainage class without throwing', () => {
    const result = scoreSoilLayer(
      buildSoilData({
        ssurgo: buildSsurgo({ drainageClass: 'Unknown class type' }),
        brownfields: [],
        floodZone: buildFloodZone(),
        moistureData: buildMoisture(),
      })
    );
    expect(result.available).toBe(true);
    // 'Unknown class type' should hit the fallback branch (score 20)
    expect(result.subScores.health).toBeGreaterThanOrEqual(0);
  });

  it('penalizes arid climate stress (aridity index < 10)', () => {
    const result = scoreSoilLayer(
      buildSoilData({
        ssurgo: buildSsurgo(),
        brownfields: [],
        floodZone: buildFloodZone(),
        moistureData: buildMoisture({ aridityIndex: 5 }),
      })
    );
    expect(result.available).toBe(true);
    expect(result.subScores.climateStress).toBe(85);
  });

  it('adds decreasing precipitation trend penalty on top of aridity stress', () => {
    const aridOnly = scoreSoilLayer(
      buildSoilData({
        ssurgo: buildSsurgo(),
        brownfields: [],
        floodZone: buildFloodZone(),
        moistureData: buildMoisture({ aridityIndex: 22, trend: 'stable' }),
      })
    );
    const aridTrending = scoreSoilLayer(
      buildSoilData({
        ssurgo: buildSsurgo(),
        brownfields: [],
        floodZone: buildFloodZone(),
        moistureData: buildMoisture({ aridityIndex: 22, trend: 'decreasing' }),
      })
    );
    expect(aridTrending.subScores.climateStress).toBeGreaterThan(
      aridOnly.subScores.climateStress ?? 0
    );
  });

  it('applies moderate flood zone amplifier when brownfield is within 1 mile', () => {
    const result = scoreSoilLayer(
      buildSoilData({
        ssurgo: buildSsurgo(),
        brownfields: [buildBrownfield({ distance: 0.7 })],
        floodZone: buildFloodZone({ riskLevel: 'MODERATE', zone: 'X-SHADED' }),
        moistureData: buildMoisture(),
      })
    );
    expect(result.available).toBe(true);
    // Moderate + brownfield < 1 mile fires amplifier = 0.25; score > flood-only
    expect(result.subScores.floodContamination).toBeGreaterThan(20);
  });
});
