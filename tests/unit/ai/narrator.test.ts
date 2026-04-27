import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { ExposureAssessment } from '@/types/exposure';

function makeAssessment(overrides: Partial<ExposureAssessment> = {}): ExposureAssessment {
  return {
    id: 'test-id',
    address: {
      raw: '100 Park Ave, New York, NY',
      normalized: '100 Park Ave, New York, NY 10017',
      latitude: 40.7506,
      longitude: -73.9781,
      fipsState: '36',
      fipsCounty: '36061',
      censusTract: '010800',
      censusBlockGroup: '1',
    },
    compositeScore: {
      score: 42,
      confidence: 'moderate',
      sufficient: true,
      coverage: 0.75,
      scoringVersion: 4,
      layersIncluded: ['water', 'soil'],
      layerScores: {
        water: {
          score: 60,
          confidence: 'area',
          available: true,
          coverage: 0.8,
          subScores: {},
          rawData: {},
        },
        soil: {
          score: 30,
          confidence: 'neighborhood',
          available: true,
          coverage: 0.7,
          subScores: {},
          rawData: {},
        },
      },
    },
    dataFreshness: '2026-01-01',
    createdAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('generateNarrative — no API key', () => {
  beforeEach(() => {
    delete process.env.ANTHROPIC_API_KEY;
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns a fallback narrative with no error when ANTHROPIC_API_KEY is absent', async () => {
    const { generateNarrative } = await import('@/lib/ai/narrator');
    const result = await generateNarrative(makeAssessment());
    expect(result.error).toBeNull();
    expect(result.summary).toBeTruthy();
    expect(result.summary.length).toBeGreaterThan(50);
  });

  it('fallback mentions the normalized address', async () => {
    const { generateNarrative } = await import('@/lib/ai/narrator');
    const result = await generateNarrative(makeAssessment());
    expect(result.summary).toContain('100 Park Ave, New York, NY 10017');
  });

  it('fallback includes composite score', async () => {
    const { generateNarrative } = await import('@/lib/ai/narrator');
    const result = await generateNarrative(makeAssessment());
    expect(result.summary).toContain('42');
  });

  it('fallback uses "insufficient" language when sufficient=false', async () => {
    const { generateNarrative } = await import('@/lib/ai/narrator');
    const assessment = makeAssessment({
      compositeScore: {
        score: 10,
        confidence: 'insufficient',
        sufficient: false,
        coverage: 0.3,
        scoringVersion: 4,
        layersIncluded: ['water'],
        layerScores: {},
      },
    });
    const result = await generateNarrative(assessment);
    expect(result.summary).toContain('insufficient data');
  });

  it('fallback includes PFAS detail when water data has detections', async () => {
    const { generateNarrative } = await import('@/lib/ai/narrator');
    const assessment = makeAssessment({
      waterData: {
        pfas: {
          systemId: 'MA0101000',
          systemName: 'Springfield Water',
          analytes: [{ name: 'PFOA', concentration: 9.2, mcl: 4, exceedsMcl: true }],
          maxIndividual: 9.2,
          totalPfas: 9.2,
          exceedsMcl: true,
          testingPeriod: '2023',
        },
        wqpPfas: null,
        violations: [],
        leadRisk: null,
        systemName: 'Springfield Water',
        systemId: 'MA0101000',
      },
    });
    const result = await generateNarrative(assessment);
    expect(result.summary).toContain('Springfield Water');
    expect(result.summary).toContain('9.2 ppt');
    expect(result.summary).toContain('exceeds the EPA Maximum Contaminant Level');
  });

  it('fallback includes brownfield count when soil data has brownfields', async () => {
    const { generateNarrative } = await import('@/lib/ai/narrator');
    const assessment = makeAssessment({
      soilData: {
        ssurgo: {
          mapUnitName: 'Urban Land',
          mapUnitKey: 'u1',
          components: [],
          dominantTexture: 'loam',
          phRange: [6.0, 7.2],
          organicMatterPct: 2.5,
          drainageClass: 'well drained',
          hydrologicSoilGroup: 'B',
          sandPct: 40,
          clayPct: 20,
          cec: 12,
          ksat: 5,
          coverage: 'mapped',
        },
        brownfields: [
          {
            name: 'Old Mill Site',
            siteId: 'BF001',
            distance: 0.8,
            direction: 'NW',
            contaminantTypes: ['Lead'],
            cleanupStatus: 'Active',
            latitude: 40.75,
            longitude: -73.97,
          },
          {
            name: 'Former Gasworks',
            siteId: 'BF002',
            distance: 1.4,
            direction: 'SE',
            contaminantTypes: ['VOCs'],
            cleanupStatus: 'Complete',
            latitude: 40.75,
            longitude: -73.98,
          },
        ],
        echoFacilities: null,
        floodZone: null,
        moistureData: null,
      },
    });
    const result = await generateNarrative(assessment);
    expect(result.summary).toContain('2 brownfield site(s)');
  });
});

describe('generateNarrative — API key present', () => {
  beforeEach(() => {
    process.env.ANTHROPIC_API_KEY = 'test-key';
    vi.resetModules();
  });

  afterEach(() => {
    delete process.env.ANTHROPIC_API_KEY;
    vi.restoreAllMocks();
  });

  it('returns fallback + error message when fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network failure')));
    const { generateNarrative } = await import('@/lib/ai/narrator');
    const result = await generateNarrative(makeAssessment());
    expect(result.error).toContain('Network failure');
    expect(result.summary).toBeTruthy();
  });

  it('returns fallback + error when API returns non-OK status', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 429 } as Response)
    );
    const { generateNarrative } = await import('@/lib/ai/narrator');
    const result = await generateNarrative(makeAssessment());
    expect(result.error).toContain('429');
    expect(result.summary).toBeTruthy();
  });

  it('returns fallback + error when API response has no text', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ content: [] }),
      } as unknown as Response)
    );
    const { generateNarrative } = await import('@/lib/ai/narrator');
    const result = await generateNarrative(makeAssessment());
    expect(result.error).toContain('Empty response');
    expect(result.summary).toBeTruthy();
  });

  it('returns AI text when API responds successfully', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          content: [{ type: 'text', text: 'AI-generated summary here.' }],
        }),
      } as unknown as Response)
    );
    const { generateNarrative } = await import('@/lib/ai/narrator');
    const result = await generateNarrative(makeAssessment());
    expect(result.error).toBeNull();
    expect(result.summary).toBe('AI-generated summary here.');
  });
});
