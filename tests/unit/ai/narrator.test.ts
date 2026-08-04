import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { ExposureAssessment } from '@/types/exposure';
import { generateNarrative } from '@/lib/ai/narrator';

// ---------------------------------------------------------------------------
// Minimal mock assessment factories
// ---------------------------------------------------------------------------

function makeAssessment(overrides: Partial<ExposureAssessment> = {}): ExposureAssessment {
  return {
    id: 'test-id',
    address: {
      raw: '123 Main St, Newark, NJ 07102',
      normalized: '123 Main St, Newark, NJ 07102',
      latitude: 40.7357,
      longitude: -74.1724,
      fipsState: '34',
      fipsCounty: '013',
      censusTract: '000600',
      censusBlockGroup: '1',
    },
    compositeScore: {
      score: 55,
      confidence: 'moderate',
      sufficient: true,
      coverage: 0.82,
      scoringVersion: 4,
      layersIncluded: ['water', 'soil'],
      layerScores: {
        water: { score: 60, confidence: 'area', available: true, coverage: 0.8, subScores: {}, rawData: {} },
        soil: { score: 45, confidence: 'neighborhood', available: true, coverage: 0.85, subScores: {}, rawData: {} },
      },
    },
    dataFreshness: '2026-08-04',
    createdAt: '2026-08-04T00:00:00Z',
    ...overrides,
  };
}

function makeWaterData() {
  return {
    pfas: {
      systemId: 'NJ0714001',
      systemName: 'NEWARK WATER',
      analytes: [{ name: 'PFOA', concentration: 5.2, mcl: 4, exceedsMcl: true }],
      maxIndividual: 5.2,
      totalPfas: 5.2,
      exceedsMcl: true,
      testingPeriod: '2023–2025',
    },
    wqpPfas: null,
    violations: [{ code: 'MCL', description: 'MCL violation', startDate: '2023-01-01', endDate: null }],
    leadRisk: { pctPre1986: 72, medianYearBuilt: 1940, pctPre1960: 55 },
    systemName: 'NEWARK WATER',
    systemId: 'NJ0714001',
  };
}

function makeSoilData() {
  return {
    ssurgo: {
      mapUnitName: 'Urban land',
      mapUnitKey: 'abc',
      components: [],
      dominantTexture: 'loam',
      phRange: [6.0, 6.8] as [number, number],
      organicMatterPct: 2.4,
      drainageClass: 'moderately well drained',
      hydrologicSoilGroup: 'B',
      sandPct: 40,
      clayPct: 20,
      cec: 15,
    },
    brownfields: [
      { id: 'bf1', name: 'Old Factory', distance: 0.8, lat: 40.74, lng: -74.17, status: 'assessed' },
    ],
    echoFacilities: null,
    floodZone: { zone: 'AE', panelNumber: '34013C0001J', isSpecialFloodHazardArea: true },
    moistureData: { precipitationAvgMm: 110, trend: 'stable' },
  };
}

// ---------------------------------------------------------------------------
// Tests: no ANTHROPIC_API_KEY → uses fallback narrative
// ---------------------------------------------------------------------------

describe('generateNarrative — no API key', () => {
  beforeEach(() => {
    vi.stubEnv('ANTHROPIC_API_KEY', '');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns a fallback summary with no error', async () => {
    const result = await generateNarrative(makeAssessment());
    expect(result.error).toBeNull();
    expect(result.summary).toBeTruthy();
    expect(typeof result.summary).toBe('string');
  });

  it('mentions the normalized address in the fallback', async () => {
    const result = await generateNarrative(makeAssessment());
    expect(result.summary).toContain('123 Main St, Newark, NJ 07102');
  });

  it('includes the composite score in the fallback', async () => {
    const result = await generateNarrative(makeAssessment());
    expect(result.summary).toContain('55');
  });

  it('describes "insufficient" confidence when sufficient=false', async () => {
    const assessment = makeAssessment({
      compositeScore: {
        score: 12,
        confidence: 'insufficient',
        sufficient: false,
        coverage: 0.35,
        scoringVersion: 4,
        layersIncluded: ['water'],
        layerScores: {},
      },
    });
    const result = await generateNarrative(assessment);
    expect(result.summary).toContain('insufficient');
  });

  it('uses level label "low" for score ≤25', async () => {
    const assessment = makeAssessment({
      compositeScore: {
        score: 18,
        confidence: 'low',
        sufficient: true,
        coverage: 0.6,
        scoringVersion: 4,
        layersIncluded: ['water'],
        layerScores: {
          water: { score: 18, confidence: 'area', available: true, coverage: 0.6, subScores: {}, rawData: {} },
        },
      },
    });
    const result = await generateNarrative(assessment);
    expect(result.summary).toContain('low');
  });

  it('uses level label "high" for score >75', async () => {
    const assessment = makeAssessment({
      compositeScore: {
        score: 82,
        confidence: 'high',
        sufficient: true,
        coverage: 0.95,
        scoringVersion: 4,
        layersIncluded: ['water', 'soil'],
        layerScores: {
          water: { score: 82, confidence: 'area', available: true, coverage: 0.95, subScores: {}, rawData: {} },
        },
      },
    });
    const result = await generateNarrative(assessment);
    expect(result.summary).toContain('high');
  });

  it('mentions PFAS when waterData has detections', async () => {
    const assessment = makeAssessment({ waterData: makeWaterData() as ExposureAssessment['waterData'] });
    const result = await generateNarrative(assessment);
    expect(result.summary).toContain('PFAS');
    expect(result.summary).toContain('NEWARK WATER');
  });

  it('mentions MCL when PFAS exceeds it', async () => {
    const assessment = makeAssessment({ waterData: makeWaterData() as ExposureAssessment['waterData'] });
    const result = await generateNarrative(assessment);
    expect(result.summary).toContain('Maximum Contaminant Level');
  });

  it('mentions violation count when violations present', async () => {
    const assessment = makeAssessment({ waterData: makeWaterData() as ExposureAssessment['waterData'] });
    const result = await generateNarrative(assessment);
    expect(result.summary).toContain('violation');
  });

  it('mentions brownfields when soilData has them', async () => {
    const assessment = makeAssessment({ soilData: makeSoilData() as ExposureAssessment['soilData'] });
    const result = await generateNarrative(assessment);
    expect(result.summary).toContain('brownfield');
  });

  it('mentions flood zone when present in soilData', async () => {
    const assessment = makeAssessment({ soilData: makeSoilData() as ExposureAssessment['soilData'] });
    const result = await generateNarrative(assessment);
    expect(result.summary).toContain('Flood Zone AE');
  });

  it('mentions ssurgo texture when soil data includes it', async () => {
    const assessment = makeAssessment({ soilData: makeSoilData() as ExposureAssessment['soilData'] });
    const result = await generateNarrative(assessment);
    expect(result.summary).toContain('loam');
  });

  it('includes confidence level text in final paragraph', async () => {
    const result = await generateNarrative(makeAssessment());
    expect(result.summary).toContain('moderate');
  });
});

// ---------------------------------------------------------------------------
// Tests: with API key — happy path and error branches
// ---------------------------------------------------------------------------

describe('generateNarrative — with API key', () => {
  const FAKE_KEY = 'sk-ant-test';

  beforeEach(() => {
    vi.stubEnv('ANTHROPIC_API_KEY', FAKE_KEY);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('returns the Claude API text on a 200 response', async () => {
    const mockText = 'AI-generated narrative here.';
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({ content: [{ type: 'text', text: mockText }] }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );
    const result = await generateNarrative(makeAssessment());
    expect(result.error).toBeNull();
    expect(result.summary).toBe(mockText);
  });

  it('falls back when API returns non-200 status', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response('Unauthorized', { status: 401 })
    );
    const result = await generateNarrative(makeAssessment());
    expect(result.error).toContain('401');
    expect(result.summary).toBeTruthy();
    expect(result.summary).toContain('123 Main St');
  });

  it('falls back when API response has no content text', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ content: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
    const result = await generateNarrative(makeAssessment());
    expect(result.error).toBe('Empty response from Claude API');
    expect(result.summary).toContain('123 Main St');
  });

  it('falls back when fetch throws a network error', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network failure'));
    const result = await generateNarrative(makeAssessment());
    expect(result.error).toBe('Network failure');
    expect(result.summary).toContain('123 Main St');
  });

  it('sends the correct Claude model and API version header', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({ content: [{ type: 'text', text: 'ok' }] }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );
    await generateNarrative(makeAssessment());
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('anthropic.com');
    const body = JSON.parse(init.body as string);
    expect(body.model).toMatch(/claude/);
    expect((init.headers as Record<string, string>)['anthropic-version']).toBeTruthy();
  });
});
