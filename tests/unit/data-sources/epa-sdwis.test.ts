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

// Sample data in **lowercase** field names (as the real API returns).
const SAMPLE_SYSTEM_ROW = [
  {
    pwsid: 'FL1260005',
    pws_name: 'MIAMI-DADE WATER AND SEWER',
    state_code: 'FL',
    pws_type_code: 'CWS',
    pws_activity_code: 'A',
    population_served_count: '2700000',
    primary_source_code: 'GW',
  },
];

const SAMPLE_CITY_SYSTEMS = [
  {
    pwsid: 'NJ0714001',
    pws_name: 'NEWARK DEPT OF WATER & SEWER',
    city_name: 'NEWARK',
    state_code: 'NJ',
    pws_type_code: 'CWS',
    pws_activity_code: 'A',
    population_served_count: '280000',
    primary_source_code: 'SW',
  },
];

// ---------------------------------------------------------------------------
// lookupWaterSystem
// ---------------------------------------------------------------------------

describe('lookupWaterSystem', () => {
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

  it('resolves PWSID via city name lookup', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => SAMPLE_SYSTEM_ROW } as Response);
    vi.stubGlobal('fetch', fetchMock);

    const result = await lookupWaterSystem('12', '086', 'MIAMI BEACH');

    expect(result).not.toBeNull();
    expect(result!.pwsid).toBe('FL1260005');
    expect(result!.name).toBe('MIAMI-DADE WATER AND SEWER');
    expect(result!.populationServed).toBe(2700000);

    // Call should be WATER_SYSTEM with CITY_NAME
    const calledUrl: string = fetchMock.mock.calls[0][0] as string;
    expect(calledUrl).toContain('WATER_SYSTEM');
    expect(calledUrl).toContain('CITY_NAME/MIAMI%20BEACH');
  });

  it('falls back to zip lookup when city returns empty', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [] } as Response) // city empty
      .mockResolvedValueOnce({ ok: true, json: async () => SAMPLE_CITY_SYSTEMS } as Response); // zip
    vi.stubGlobal('fetch', fetchMock);

    const result = await lookupWaterSystem('34', '013', 'NoMatch', '07105');

    expect(result).not.toBeNull();
    expect(result!.pwsid).toBe('NJ0714001');

    // Second call should use ZIP_CODE
    const secondUrl: string = fetchMock.mock.calls[1][0] as string;
    expect(secondUrl).toContain('ZIP_CODE/07105');
  });

  it('falls back to largest-in-state when city and zip both fail', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [] } as Response) // city empty
      .mockResolvedValueOnce({ ok: true, json: async () => [] } as Response) // zip empty
      .mockResolvedValueOnce({ ok: true, json: async () => SAMPLE_SYSTEM_ROW } as Response); // state fallback
    vi.stubGlobal('fetch', fetchMock);

    const result = await lookupWaterSystem('12', '999', 'Nonexistent', '99999');

    expect(result).not.toBeNull();
    expect(result!.pwsid).toBe('FL1260005');
  });

  it('returns null for unknown FIPS state code', async () => {
    const result = await lookupWaterSystem('99', '001');
    expect(result).toBeNull();
  });

  it('returns null when all strategies fail', async () => {
    vi.stubGlobal('fetch', makeFetchOk([]));

    const result = await lookupWaterSystem('06', '037', 'NoCity', '00000');
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

  it('handles both uppercase and lowercase field names from API', async () => {
    // Uppercase fields (unit test legacy format) — no city/zip hint, so
    // only 1 fetch call: largest-in-state fallback.
    const upperSystems = [
      {
        PWSID: 'DC0000001',
        PWS_NAME: 'DC WATER',
        PWS_TYPE_CODE: 'CWS',
        PWS_ACTIVITY_CODE: 'A',
        POPULATION_SERVED_COUNT: '650000',
        PRIMARY_SOURCE_CODE: 'SW',
      },
    ];
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => upperSystems } as Response);
    vi.stubGlobal('fetch', fetchMock);

    // No city/zip hint → straight to largest-in-state
    const result = await lookupWaterSystem('11', '001');
    expect(result).not.toBeNull();
    expect(result!.pwsid).toBe('DC0000001');
    expect(result!.populationServed).toBe(650000);
  });
});

// ---------------------------------------------------------------------------
// fetchSdwisViolations
// ---------------------------------------------------------------------------

describe('fetchSdwisViolations', () => {
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

  it('maps lowercase API field names to WaterViolation shape', async () => {
    const rows = [
      {
        violation_type_code: 'MCL',
        contaminant_name: 'ARSENIC',
        compl_per_begin_date: '2020-01-01',
        compl_per_end_date: '2020-06-01',
        compliance_status_code: 'R',
      },
      {
        violation_type_code: 'MR',
        contaminant_name: 'TOTAL COLIFORM',
        compl_per_begin_date: '2019-03-15',
        compl_per_end_date: '',
        compliance_status_code: 'O',
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

  it('also handles uppercase field names (backward compat)', async () => {
    const rows = [
      {
        VIOLATION_TYPE_CODE: 'MCL',
        CONTAMINANT_NAME: 'ARSENIC',
        COMPL_PER_BEGIN_DATE: '2020-01-01',
        COMPL_PER_END_DATE: '2020-06-01',
        COMPLIANCE_STATUS_CODE: 'R',
      },
    ];
    vi.stubGlobal('fetch', makeFetchOk(rows));

    const result = await fetchSdwisViolations('DC0000001');
    expect(result.data).toHaveLength(1);
    expect(result.data![0].type).toBe('MCL');
    expect(result.data![0].contaminant).toBe('ARSENIC');
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
      { violation_type_code: 'MCL', contaminant_name: 'A', compl_per_begin_date: '2015-01-01', compl_per_end_date: '', compliance_status_code: 'R' },
      { violation_type_code: 'MCL', contaminant_name: 'B', compl_per_begin_date: '2022-06-01', compl_per_end_date: '', compliance_status_code: 'R' },
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
