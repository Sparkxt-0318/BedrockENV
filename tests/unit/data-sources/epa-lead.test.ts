import { describe, it, expect, vi, afterEach } from 'vitest';
import { fetchLeadRiskData } from '@/lib/data-sources/epa-lead';

// ---------------------------------------------------------------------------
// ACS B25034 field order (must match FIELDS list in epa-lead.ts)
//   _001E total, _007E 70s, _008E 60s, _009E 50s, _010E 40s, _011E <1940
// The Census API returns [[headers], [values]] with geography columns after.
// ---------------------------------------------------------------------------

function acsResponse(values: {
  total: number;
  s70s: number;
  s60s: number;
  s50s: number;
  s40s: number;
  pre1940: number;
}) {
  const headers = [
    'B25034_001E',
    'B25034_007E',
    'B25034_008E',
    'B25034_009E',
    'B25034_010E',
    'B25034_011E',
    'state',
    'county',
    'tract',
    'block group',
  ];
  const row = [
    String(values.total),
    String(values.s70s),
    String(values.s60s),
    String(values.s50s),
    String(values.s40s),
    String(values.pre1940),
    '11',
    '001',
    '000100',
    '1',
  ];
  return [headers, row];
}

function makeFetchOk(body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => body,
  } as unknown as Response);
}

function makeFetchStatus(status: number, body: unknown = {}) {
  return vi.fn().mockResolvedValue({
    ok: false,
    status,
    statusText: `HTTP ${status}`,
    json: async () => body,
  } as unknown as Response);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('fetchLeadRiskData', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    delete process.env.CENSUS_API_KEY;
  });

  it('classifies a mostly-pre-1950 block group as HIGH risk', async () => {
    // 80 total, 50 pre-1950 (40 in 40s + 10 pre-1940) → 62% pre-1950
    const json = acsResponse({
      total: 80, s70s: 5, s60s: 10, s50s: 15, s40s: 40, pre1940: 10,
    });
    vi.stubGlobal('fetch', makeFetchOk(json));

    const result = await fetchLeadRiskData('36', '083', '020402', '1');

    expect(result.error).toBeNull();
    expect(result.data).not.toBeNull();
    expect(result.data!.pctPreA1950).toBe(63); // (50/80)*100 = 62.5 → 63
    expect(result.data!.riskTier).toBe('HIGH');
    expect(result.data!.resolution).toBe('neighborhood');
    expect(result.source).toContain('B25034');
  });

  it('classifies pctPre1986 > 50% as ELEVATED when pre-1950 is low', async () => {
    // 100 total, 10 pre-1950, 55 pre-1986
    const json = acsResponse({
      total: 100, s70s: 20, s60s: 15, s50s: 10, s40s: 5, pre1940: 5,
    });
    vi.stubGlobal('fetch', makeFetchOk(json));

    const result = await fetchLeadRiskData('11', '001', '000100', '1');

    expect(result.data!.pctPreA1950).toBe(10);
    expect(result.data!.pctPre1986).toBe(55);
    expect(result.data!.riskTier).toBe('ELEVATED');
  });

  it('classifies 25% < pctPre1986 <= 50% as MODERATE', async () => {
    // 100 total, 35 pre-1986, low pre-1950
    const json = acsResponse({
      total: 100, s70s: 15, s60s: 10, s50s: 5, s40s: 3, pre1940: 2,
    });
    vi.stubGlobal('fetch', makeFetchOk(json));

    const result = await fetchLeadRiskData('06', '037', '123456', '2');

    expect(result.data!.pctPre1986).toBe(35);
    expect(result.data!.riskTier).toBe('MODERATE');
  });

  it('classifies minimal old housing as LOW', async () => {
    // 100 total, 5 pre-1986 (5%)
    const json = acsResponse({
      total: 100, s70s: 2, s60s: 1, s50s: 1, s40s: 1, pre1940: 0,
    });
    vi.stubGlobal('fetch', makeFetchOk(json));

    const result = await fetchLeadRiskData('48', '201', '111111', '3');

    expect(result.data!.riskTier).toBe('LOW');
  });

  it('returns error when the block group has no housing units', async () => {
    const json = acsResponse({
      total: 0, s70s: 0, s60s: 0, s50s: 0, s40s: 0, pre1940: 0,
    });
    vi.stubGlobal('fetch', makeFetchOk(json));

    const result = await fetchLeadRiskData('06', '037', '999999', '9');

    expect(result.data).toBeNull();
    expect(result.error).toMatch(/no housing units/i);
  });

  it('returns error on HTTP failure', async () => {
    vi.stubGlobal('fetch', makeFetchStatus(500));

    const result = await fetchLeadRiskData('06', '037', '123456', '1');

    expect(result.data).toBeNull();
    expect(result.error).toMatch(/500/);
  });

  it('returns error when Census response is empty', async () => {
    vi.stubGlobal('fetch', makeFetchOk([]));

    const result = await fetchLeadRiskData('06', '037', '123456', '1');
    expect(result.data).toBeNull();
    expect(result.error).toMatch(/no housing age data/i);
  });

  it('returns error when Census returns malformed payload (headers only)', async () => {
    vi.stubGlobal('fetch', makeFetchOk([['B25034_001E']]));

    const result = await fetchLeadRiskData('06', '037', '123456', '1');
    expect(result.data).toBeNull();
    expect(result.error).toBeTruthy();
  });

  it('returns error when fetch throws (network failure)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ECONNRESET')));

    const result = await fetchLeadRiskData('06', '037', '123456', '1');
    expect(result.data).toBeNull();
    expect(result.error).toMatch(/ECONNRESET/);
  });

  it('gracefully handles negative or NaN Census values (treated as 0)', async () => {
    // Census sentinel for suppressed data is -666666666 etc.; we should not
    // let a negative value blow up the percentage computation.
    const headers = [
      'B25034_001E', 'B25034_007E', 'B25034_008E', 'B25034_009E',
      'B25034_010E', 'B25034_011E', 'state', 'county', 'tract', 'block group',
    ];
    const row = ['50', '-666666666', 'NaN', '10', '5', '0', '11', '001', '000100', '1'];
    vi.stubGlobal('fetch', makeFetchOk([headers, row]));

    const result = await fetchLeadRiskData('11', '001', '000100', '1');
    expect(result.error).toBeNull();
    // Sanitized values: s70s=0, s60s=0, s50s=10, s40s=5, pre1940=0
    // pre1950 = 5, pre1986 = 15, total = 50 → 10% pre-1950, 30% pre-1986
    expect(result.data!.pctPreA1950).toBe(10);
    expect(result.data!.pctPre1986).toBe(30);
    expect(result.data!.riskTier).toBe('MODERATE');
  });

  it('includes the API key in the request URL when CENSUS_API_KEY is set', async () => {
    // Obviously-synthetic literal — kept simple so the gitleaks pre-commit
    // hook does not flag it as a high-entropy secret.
    const fakeKey = 'fake-key';
    process.env.CENSUS_API_KEY = fakeKey;
    const fetchMock = makeFetchOk(
      acsResponse({ total: 100, s70s: 5, s60s: 5, s50s: 5, s40s: 2, pre1940: 1 })
    );
    vi.stubGlobal('fetch', fetchMock);

    await fetchLeadRiskData('11', '001', '000100', '1');

    const calledUrl = fetchMock.mock.calls[0][0] as string;
    expect(calledUrl).toContain(`key=${fakeKey}`);
    expect(calledUrl).toContain('B25034_001E');
    expect(calledUrl).toContain('block%20group:1');
  });
});
