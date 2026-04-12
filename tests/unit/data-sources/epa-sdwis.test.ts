import { describe, it, expect, vi, afterEach } from 'vitest';
import { lookupWaterSystem, fetchSdwisViolations, computeViolationStats } from '@/lib/data-sources/epa-sdwis';
import type { WaterViolation } from '@/types/exposure';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeFetchOk(body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => body,
  } as unknown as Response);
}

function makeFetchError(status: number) {
  return vi.fn().mockResolvedValue({
    ok: false,
    status,
    json: async () => ({}),
    statusText: `HTTP ${status}`,
  } as unknown as Response);
}

const SAMPLE_SYSTEMS = [
  {
    PWSID: 'DC0000001',
    PWS_NAME: 'DC WATER AND SEWER AUTHORITY',
    STATE_CODE: 'DC',
    PWS_TYPE_CODE: 'CWS',
    PWS_ACTIVITY_CODE: 'A',
    POPULATION_SERVED_COUNT: '650000',
    PRIMARY_SOURCE_CODE: 'SW',
    COUNTIES_SERVED: 'District of Columbia',
  },
  {
    PWSID: 'DC0000099',
    PWS_NAME: 'SMALL DC SYSTEM',
    STATE_CODE: 'DC',
    PWS_TYPE_CODE: 'CWS',
    PWS_ACTIVITY_CODE: 'A',
    POPULATION_SERVED_COUNT: '500',
    PRIMARY_SOURCE_CODE: 'GW',
    COUNTIES_SERVED: '',
  },
];

// ---------------------------------------------------------------------------
// lookupWaterSystem
// ---------------------------------------------------------------------------

describe('lookupWaterSystem', () => {
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

  it('returns the largest CWS when no county match exists', async () => {
    vi.stubGlobal('fetch', makeFetchOk(SAMPLE_SYSTEMS));

    const result = await lookupWaterSystem('11', '001');

    expect(result).not.toBeNull();
    expect(result!.pwsid).toBe('DC0000001');
    expect(result!.name).toBe('DC WATER AND SEWER AUTHORITY');
    expect(result!.populationServed).toBe(650000);
    expect(result!.primarySource).toBe('SW');
  });

  it('prefers county-matching system over larger one', async () => {
    const systems = [
      { ...SAMPLE_SYSTEMS[0], COUNTIES_SERVED: 'Fairfax', POPULATION_SERVED_COUNT: '1000000' },
      { ...SAMPLE_SYSTEMS[1], COUNTIES_SERVED: '001', POPULATION_SERVED_COUNT: '500' },
    ];
    vi.stubGlobal('fetch', makeFetchOk(systems));

    // fipsCounty '001' matches the second system's COUNTIES_SERVED
    const result = await lookupWaterSystem('11', '001');

    expect(result!.pwsid).toBe('DC0000099');
  });

  it('returns null for unknown FIPS state code', async () => {
    const result = await lookupWaterSystem('99', '001');
    expect(result).toBeNull();
  });

  it('returns null when API returns empty array', async () => {
    vi.stubGlobal('fetch', makeFetchOk([]));

    const result = await lookupWaterSystem('06', '037');
    expect(result).toBeNull();
  });

  it('returns null on API HTTP error', async () => {
    vi.stubGlobal('fetch', makeFetchError(500));

    const result = await lookupWaterSystem('06', '037');
    expect(result).toBeNull();
  });

  it('returns null when fetch throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network failure')));

    const result = await lookupWaterSystem('06', '037');
    expect(result).toBeNull();
  });

  it('converts FIPS state to abbreviation before querying', async () => {
    const fetchMock = makeFetchOk(SAMPLE_SYSTEMS);
    vi.stubGlobal('fetch', fetchMock);

    await lookupWaterSystem('48', '201'); // TX, Harris County

    const calledUrl: string = fetchMock.mock.calls[0][0] as string;
    expect(calledUrl).toContain('STATE_CODE/TX');
    expect(calledUrl).toContain('PWS_TYPE_CODE/CWS');
    expect(calledUrl).toContain('PWS_ACTIVITY_CODE/A');
  });
});

// ---------------------------------------------------------------------------
// fetchSdwisViolations
// ---------------------------------------------------------------------------

describe('fetchSdwisViolations', () => {
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

  it('maps API rows to WaterViolation shape', async () => {
    const rows = [
      {
        VIOLATION_TYPE_CODE: 'MCL',
        CONTAMINANT_NAME: 'ARSENIC',
        COMPL_PER_BEGIN_DATE: '2020-01-01',
        COMPL_PER_END_DATE: '2020-06-01',
        COMPLIANCE_STATUS_CODE: 'R',
      },
      {
        VIOLATION_TYPE_CODE: 'MR',
        CONTAMINANT_NAME: 'TOTAL COLIFORM',
        COMPL_PER_BEGIN_DATE: '2019-03-15',
        COMPL_PER_END_DATE: '',
        COMPLIANCE_STATUS_CODE: 'O',
      },
    ];
    vi.stubGlobal('fetch', makeFetchOk(rows));

    const result = await fetchSdwisViolations('DC0000001');

    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(2);

    const arsenic = result.data!.find((v) => v.contaminant === 'ARSENIC')!;
    expect(arsenic.type).toBe('MCL');
    expect(arsenic.isHealthBased).toBe(true);
    expect(arsenic.status).toBe('R');

    const coliform = result.data!.find((v) => v.contaminant === 'TOTAL COLIFORM')!;
    expect(coliform.isHealthBased).toBe(false);
  });

  it('returns empty array when API returns empty results', async () => {
    vi.stubGlobal('fetch', makeFetchOk([]));

    const result = await fetchSdwisViolations('XX9999999');
    expect(result.data).toEqual([]);
    expect(result.error).toBeNull();
  });

  it('returns error string on HTTP failure', async () => {
    vi.stubGlobal('fetch', makeFetchError(503));

    const result = await fetchSdwisViolations('DC0000001');
    expect(result.data).toBeNull();
    expect(result.error).toMatch(/503/);
  });

  it('returns error string when fetch throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('connection refused')));

    const result = await fetchSdwisViolations('DC0000001');
    expect(result.data).toBeNull();
    expect(result.error).toBeTruthy();
  });

  it('sorts violations newest-first', async () => {
    const rows = [
      { VIOLATION_TYPE_CODE: 'MCL', CONTAMINANT_NAME: 'A', COMPL_PER_BEGIN_DATE: '2015-01-01', COMPL_PER_END_DATE: '', COMPLIANCE_STATUS_CODE: 'R' },
      { VIOLATION_TYPE_CODE: 'MCL', CONTAMINANT_NAME: 'B', COMPL_PER_BEGIN_DATE: '2022-06-01', COMPL_PER_END_DATE: '', COMPLIANCE_STATUS_CODE: 'R' },
    ];
    vi.stubGlobal('fetch', makeFetchOk(rows));

    const result = await fetchSdwisViolations('DC0000001');
    expect(result.data![0].contaminant).toBe('B'); // 2022 first
    expect(result.data![1].contaminant).toBe('A');
  });
});

// ---------------------------------------------------------------------------
// computeViolationStats
// ---------------------------------------------------------------------------

describe('computeViolationStats', () => {
  function makeViolation(overrides: Partial<WaterViolation>): WaterViolation {
    return {
      type: 'MCL',
      contaminant: 'LEAD',
      beginDate: '2022-01-01',
      status: 'R',
      isHealthBased: true,
      ...overrides,
    };
  }

  it('returns zeros for empty array', () => {
    const stats = computeViolationStats([]);
    expect(stats.total).toBe(0);
    expect(stats.last5Years).toBe(0);
    expect(stats.healthBased5yr).toBe(0);
    expect(stats.activeCount).toBe(0);
  });

  it('counts health-based violations within 5 years', () => {
    const violations = [
      makeViolation({ beginDate: '2023-01-01', isHealthBased: true }),
      makeViolation({ beginDate: '2010-01-01', isHealthBased: true }), // >10 yrs ago
      makeViolation({ beginDate: '2024-01-01', isHealthBased: false }),
    ];
    const stats = computeViolationStats(violations);
    expect(stats.last5Years).toBe(2); // 2023 + 2024
    expect(stats.healthBased5yr).toBe(1); // only 2023
    expect(stats.total).toBe(3);
  });

  it('identifies active violations by missing endDate or Open status', () => {
    const violations = [
      makeViolation({ status: 'O', endDate: undefined }),
      makeViolation({ status: 'R', endDate: '2022-06-01' }),
    ];
    const stats = computeViolationStats(violations);
    expect(stats.activeCount).toBe(1);
  });

  it('de-duplicates contaminants in violationContaminants list', () => {
    const violations = [
      makeViolation({ contaminant: 'LEAD', beginDate: '2023-01-01', isHealthBased: true }),
      makeViolation({ contaminant: 'LEAD', beginDate: '2024-01-01', isHealthBased: true }),
      makeViolation({ contaminant: 'ARSENIC', beginDate: '2023-06-01', isHealthBased: true }),
    ];
    const stats = computeViolationStats(violations);
    expect(stats.violationContaminants).toHaveLength(2);
    expect(stats.violationContaminants).toContain('LEAD');
    expect(stats.violationContaminants).toContain('ARSENIC');
  });
});
