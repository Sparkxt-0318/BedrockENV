import { describe, it, expect, afterEach, vi } from 'vitest';
import {
  fetchUcmr5PfasData,
  ucmr5BundleAgeDays,
  __setUcmr5BundleForTests,
  __resetUcmr5BundleCache,
  type UcmrBundle,
} from '@/lib/data-sources/epa-ucmr5';

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

function makeBundle(
  systems: UcmrBundle['systems'],
  overrides: Partial<UcmrBundle> = {}
): UcmrBundle {
  return {
    generatedAt: '2026-02-10T00:00:00.000Z',
    epaReleaseDate: '2026-02-12',
    source: 'EPA UCMR 5 Occurrence Data',
    sourceUrl: 'https://www.epa.gov/system/files/other-files/2023-08/ucmr5-occurrence-data.zip',
    rowCount: 3,
    pwsidCount: Object.keys(systems).length,
    systems,
    ...overrides,
  };
}

const SAMPLE_BUNDLE = makeBundle({
  DC0000003: {
    systemName: 'NAVAL STATION WASHINGTON - WNY',
    state: 'DC',
    size: 'S',
    analytes: [
      { name: 'PFOA', concentration: 6.1, mcl: 4, exceedsMcl: true },
      { name: 'PFHxS', concentration: 3.2, mcl: 10, exceedsMcl: false },
    ],
    maxIndividual: 6.1,
    totalPfas: 9.3,
    exceedsMcl: true,
    firstSampleDate: '2023-09-12',
    lastSampleDate: '2024-06-18',
  },
  IL1895600: {
    systemName: 'WASHINGTON COUNTY WATER COMPANY',
    state: 'IL',
    size: 'S',
    analytes: [{ name: 'PFBS', concentration: 8.2, mcl: 0, exceedsMcl: false }],
    maxIndividual: 8.2,
    totalPfas: 8.2,
    exceedsMcl: false,
    firstSampleDate: '2024-02-03',
    lastSampleDate: '2024-02-03',
  },
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('fetchUcmr5PfasData', () => {
  afterEach(() => __resetUcmr5BundleCache());

  it('returns PFAS data for a PWSID present in the bundle', async () => {
    __setUcmr5BundleForTests(SAMPLE_BUNDLE);

    const result = await fetchUcmr5PfasData('DC0000003', 'Naval Station Washington');

    expect(result.error).toBeNull();
    expect(result.data).not.toBeNull();
    expect(result.data!.systemId).toBe('DC0000003');
    expect(result.data!.systemName).toBe('NAVAL STATION WASHINGTON - WNY');
    expect(result.data!.analytes).toHaveLength(2);
    expect(result.data!.maxIndividual).toBe(6.1);
    expect(result.data!.totalPfas).toBe(9.3);
    expect(result.data!.exceedsMcl).toBe(true);
    expect(result.data!.testingPeriod).toBe('2023-09-12 – 2024-06-18');
    expect(result.source).toContain('EPA UCMR 5');
    expect(result.cached).toBe(true);
  });

  it('preserves analyte ordering from the bundle (highest first)', async () => {
    __setUcmr5BundleForTests(SAMPLE_BUNDLE);

    const result = await fetchUcmr5PfasData('DC0000003', 'Navy');
    const names = result.data!.analytes.map((a) => a.name);
    expect(names[0]).toBe('PFOA');
    expect(names[1]).toBe('PFHxS');
  });

  it('falls back to the caller-provided system name when the bundle entry is blank', async () => {
    __setUcmr5BundleForTests(
      makeBundle({
        XX9999999: {
          systemName: '',
          state: 'XX',
          size: 'S',
          analytes: [],
          maxIndividual: 0,
          totalPfas: 0,
          exceedsMcl: false,
          firstSampleDate: '',
          lastSampleDate: '',
        },
      })
    );

    const result = await fetchUcmr5PfasData('XX9999999', 'Caller Provided Name');
    expect(result.data!.systemName).toBe('Caller Provided Name');
    // With empty sample dates, testingPeriod should fall back to the rule window
    expect(result.data!.testingPeriod).toMatch(/UCMR 5/);
  });

  it('returns null (not an error) for PWSIDs missing from the bundle', async () => {
    __setUcmr5BundleForTests(SAMPLE_BUNDLE);

    const result = await fetchUcmr5PfasData('NY9999999', 'Unknown system');
    expect(result.data).toBeNull();
    expect(result.error).toBeNull();
    expect(result.source).toContain('EPA UCMR 5');
  });

  it('returns an error result when the bundle is missing', async () => {
    __setUcmr5BundleForTests(null);

    const result = await fetchUcmr5PfasData('DC0000003', 'Navy');
    expect(result.data).toBeNull();
    expect(result.error).toBeTruthy();
    expect(result.source).toBe('EPA UCMR 5');
  });

  it('returns an error when PWSID is empty', async () => {
    __setUcmr5BundleForTests(SAMPLE_BUNDLE);

    const result = await fetchUcmr5PfasData('', 'Navy');
    expect(result.data).toBeNull();
    expect(result.error).toMatch(/PWSID is required/);
  });

  it('handles bundles with no systems', async () => {
    __setUcmr5BundleForTests(makeBundle({}));

    const result = await fetchUcmr5PfasData('DC0000003', 'Navy');
    expect(result.data).toBeNull();
    expect(result.error).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Bundle staleness
// ---------------------------------------------------------------------------

describe('ucmr5BundleAgeDays', () => {
  it('returns null when the bundle has no epaReleaseDate', () => {
    expect(ucmr5BundleAgeDays({ epaReleaseDate: undefined })).toBeNull();
  });

  it('returns null when the date is malformed', () => {
    expect(ucmr5BundleAgeDays({ epaReleaseDate: 'not-a-date' })).toBeNull();
  });

  it('computes whole-day age relative to a fixed clock', () => {
    const now = new Date('2026-04-13T12:00:00Z');
    expect(ucmr5BundleAgeDays({ epaReleaseDate: '2026-02-12' }, now)).toBe(60);
  });
});

describe('UCMR 5 stale-bundle warning', () => {
  afterEach(() => {
    __resetUcmr5BundleCache();
    vi.restoreAllMocks();
  });

  it('does not warn for a fresh bundle (within 100 days)', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const fresh = new Date();
    fresh.setUTCDate(fresh.getUTCDate() - 30);
    const isoDate = fresh.toISOString().slice(0, 10);

    __setUcmr5BundleForTests(makeBundle({}, { epaReleaseDate: isoDate }));
    await fetchUcmr5PfasData('XX', 'X');

    const stale = warn.mock.calls.find((c) =>
      String(c[0]).includes('days old')
    );
    expect(stale).toBeUndefined();
  });

  it('warns once when the bundle exceeds 100 days', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    // Pick a release date guaranteed to be >100 days before "now".
    const old = new Date();
    old.setUTCDate(old.getUTCDate() - 200);
    const isoDate = old.toISOString().slice(0, 10);

    __setUcmr5BundleForTests(makeBundle({}, { epaReleaseDate: isoDate }));

    // Trigger two reads — should warn exactly once.
    await fetchUcmr5PfasData('XX', 'X');
    await fetchUcmr5PfasData('YY', 'Y');

    const stalenessCalls = warn.mock.calls.filter((c) =>
      String(c[0]).includes('days old')
    );
    expect(stalenessCalls.length).toBe(1);
    expect(String(stalenessCalls[0][0])).toContain(isoDate);
  });

  it('warns when the bundle is missing epaReleaseDate', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    __setUcmr5BundleForTests(makeBundle({}, { epaReleaseDate: undefined }));

    await fetchUcmr5PfasData('XX', 'X');

    const noDate = warn.mock.calls.find((c) =>
      String(c[0]).includes('no epaReleaseDate')
    );
    expect(noDate).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Real-bundle smoke check (runs against the committed data file)
// ---------------------------------------------------------------------------

describe('fetchUcmr5PfasData (real bundle)', () => {
  afterEach(() => __resetUcmr5BundleCache());

  it('resolves a known PFAS-detected PWSID from the committed bundle', async () => {
    // No override — let the client load the real data file.
    __resetUcmr5BundleCache();

    const result = await fetchUcmr5PfasData('DC0000003', 'Naval Station Washington');

    // The committed UCMR 5 bundle should contain this system. If the bundle
    // is regenerated from a future EPA release and drops this PWSID, update
    // the test to use a current system.
    expect(result.error).toBeNull();
    expect(result.data).not.toBeNull();
    expect(result.data!.analytes.length).toBeGreaterThan(0);
  });
});
