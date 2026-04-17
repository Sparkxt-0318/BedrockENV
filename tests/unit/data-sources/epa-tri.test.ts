import { describe, it, expect, vi, afterEach, type Mock } from 'vitest';

import {
  fetchTriReleasesByCounty,
  fetchTriReleasesByFips,
} from '@/lib/data-sources/epa-tri';

// ---------------------------------------------------------------------------
// Mock fetchWithRetry at the module level so we never hit the network or
// trigger real retry/backoff logic.
// ---------------------------------------------------------------------------

vi.mock('@/lib/data-sources/types', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/data-sources/types')>();
  return {
    ...actual,
    fetchWithRetry: vi.fn(),
  };
});

// Re-import after mock registration so we can control the mock.
import { fetchWithRetry } from '@/lib/data-sources/types';

const mockedFetch = fetchWithRetry as Mock;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a fake Response resolved by mockedFetch. */
function fakeResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 400,
    status,
    statusText: `HTTP ${status}`,
    json: async () => body,
  } as unknown as Response;
}

/** Build an array of TRI_REPORTING_FORM rows. */
function triRows(
  rows: Array<{
    facilityId?: string;
    chemical?: string;
    qty?: number | string | null;
  }>,
) {
  return rows.map((r, i) => ({
    doc_ctrl_num: `DOC-${i}`,
    tri_facility_id: r.facilityId ?? `FAC-${i}`,
    cas_chem_name: r.chemical ?? 'LEAD',
    reporting_year: '2022',
    one_time_release_qty: r.qty ?? 100,
  }));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('fetchTriReleasesByCounty', () => {
  afterEach(() => {
    mockedFetch.mockClear();
  });

  // ---- 1. Successful response with multiple facilities and chemicals ------

  it('parses a successful response with multiple facilities and chemicals', async () => {
    const rows = triRows([
      { facilityId: 'FAC-A', chemical: 'LEAD', qty: 500 },
      { facilityId: 'FAC-A', chemical: 'BENZENE', qty: 300 },
      { facilityId: 'FAC-B', chemical: 'LEAD', qty: 200 },
      { facilityId: 'FAC-C', chemical: 'TOLUENE', qty: 150 },
    ]);

    mockedFetch.mockResolvedValueOnce(fakeResponse(rows));

    const result = await fetchTriReleasesByCounty('NJ', 'Essex');

    expect(result.error).toBeNull();
    expect(result.source).toBe('EPA TRI');
    expect(result.cached).toBe(false);
    expect(result.data).not.toBeNull();
    expect(result.data!.facilityCount).toBe(3);
    expect(result.data!.totalOnSiteReleaseLbs).toBe(1150);
    expect(result.data!.topChemicals).toHaveLength(3);
    // Sorted descending by lbs
    expect(result.data!.topChemicals[0]).toEqual({ chemical: 'LEAD', lbs: 700 });
    expect(result.data!.topChemicals[1]).toEqual({ chemical: 'BENZENE', lbs: 300 });
    expect(result.data!.topChemicals[2]).toEqual({ chemical: 'TOLUENE', lbs: 150 });
  });

  // ---- 2. Empty response (no TRI data for county) ------------------------

  it('returns zero counts for an empty array response', async () => {
    mockedFetch.mockResolvedValueOnce(fakeResponse([]));

    const result = await fetchTriReleasesByCounty('NJ', 'Essex');

    expect(result.error).toBeNull();
    expect(result.data).toEqual({
      totalOnSiteReleaseLbs: 0,
      facilityCount: 0,
      topChemicals: [],
    });
  });

  it('returns zero counts for a non-array response', async () => {
    mockedFetch.mockResolvedValueOnce(fakeResponse('not an array'));

    const result = await fetchTriReleasesByCounty('NJ', 'Essex');

    expect(result.error).toBeNull();
    expect(result.data).toEqual({
      totalOnSiteReleaseLbs: 0,
      facilityCount: 0,
      topChemicals: [],
    });
  });

  // ---- 3. HTTP error response (non-ok) — both years fail ------------------

  it('returns an error when both 2022 and 2021 requests fail', async () => {
    // First call (2022) returns 500
    mockedFetch.mockResolvedValueOnce(fakeResponse({}, 500));
    // Second call (2021 fallback) returns 503
    mockedFetch.mockResolvedValueOnce(fakeResponse({}, 503));

    const result = await fetchTriReleasesByCounty('NJ', 'Essex');

    expect(result.data).toBeNull();
    expect(result.error).toMatch(/HTTP 500/);
    expect(result.source).toBe('EPA TRI');
  });

  // ---- 4. Fallback to 2021 when 2022 fails --------------------------------

  it('falls back to 2021 data when 2022 returns non-ok', async () => {
    const rows = triRows([
      { facilityId: 'FAC-OLD', chemical: 'MERCURY', qty: 42 },
    ]);

    // 2022 request fails
    mockedFetch.mockResolvedValueOnce(fakeResponse({}, 500));
    // 2021 fallback succeeds
    mockedFetch.mockResolvedValueOnce(fakeResponse(rows));

    const result = await fetchTriReleasesByCounty('TX', 'Harris');

    expect(result.error).toBeNull();
    expect(result.data).not.toBeNull();
    expect(result.data!.facilityCount).toBe(1);
    expect(result.data!.totalOnSiteReleaseLbs).toBe(42);
    expect(result.data!.topChemicals).toEqual([{ chemical: 'MERCURY', lbs: 42 }]);

    // Verify 2022 was tried first, then 2021
    expect(mockedFetch).toHaveBeenCalledTimes(2);
    const firstUrl = mockedFetch.mock.calls[0][0] as string;
    const secondUrl = mockedFetch.mock.calls[1][0] as string;
    expect(firstUrl).toContain('REPORTING_YEAR/2022');
    expect(secondUrl).toContain('REPORTING_YEAR/2021');
  });

  // ---- 5. Network/fetch error handling ------------------------------------

  it('returns an error when fetchWithRetry throws a network error', async () => {
    mockedFetch.mockRejectedValueOnce(new Error('ECONNREFUSED'));

    const result = await fetchTriReleasesByCounty('CA', 'Los Angeles');

    expect(result.data).toBeNull();
    expect(result.error).toBe('ECONNREFUSED');
    expect(result.source).toBe('EPA TRI');
  });

  it('handles non-Error throws gracefully', async () => {
    mockedFetch.mockRejectedValueOnce('string error');

    const result = await fetchTriReleasesByCounty('CA', 'Kern');

    expect(result.data).toBeNull();
    expect(result.error).toBe('Unknown TRI fetch error');
  });

  // ---- 7. Top chemicals sorted correctly, limited to 5 --------------------

  it('limits topChemicals to 5, sorted by total lbs descending', async () => {
    const rows = triRows([
      { facilityId: 'F1', chemical: 'CHEM-A', qty: 100 },
      { facilityId: 'F1', chemical: 'CHEM-B', qty: 200 },
      { facilityId: 'F1', chemical: 'CHEM-C', qty: 300 },
      { facilityId: 'F1', chemical: 'CHEM-D', qty: 400 },
      { facilityId: 'F1', chemical: 'CHEM-E', qty: 500 },
      { facilityId: 'F1', chemical: 'CHEM-F', qty: 600 },
      { facilityId: 'F1', chemical: 'CHEM-G', qty: 50 },
    ]);

    mockedFetch.mockResolvedValueOnce(fakeResponse(rows));

    const result = await fetchTriReleasesByCounty('PA', 'Allegheny');

    expect(result.data).not.toBeNull();
    expect(result.data!.topChemicals).toHaveLength(5);
    // Verify descending order
    const lbsValues = result.data!.topChemicals.map((c) => c.lbs);
    expect(lbsValues).toEqual([600, 500, 400, 300, 200]);
    // Ensure the smallest two (100, 50) were excluded
    const names = result.data!.topChemicals.map((c) => c.chemical);
    expect(names).not.toContain('CHEM-A');
    expect(names).not.toContain('CHEM-G');
  });

  // ---- 8. Proper county name normalization --------------------------------

  it('strips "County" suffix from county name', async () => {
    mockedFetch.mockResolvedValueOnce(fakeResponse([]));

    await fetchTriReleasesByCounty('NJ', 'Essex County');

    const url = mockedFetch.mock.calls[0][0] as string;
    // Should contain ESSEX, not ESSEX COUNTY
    expect(url).toContain('COUNTY_NAME/ESSEX/');
    expect(url).not.toContain('COUNTY_NAME/ESSEX%20COUNTY');
  });

  it('normalizes state abbreviation to uppercase', async () => {
    mockedFetch.mockResolvedValueOnce(fakeResponse([]));

    await fetchTriReleasesByCounty('nj', 'essex');

    const url = mockedFetch.mock.calls[0][0] as string;
    expect(url).toContain('STATE_ABBR/NJ/');
    expect(url).toContain('COUNTY_NAME/ESSEX/');
  });

  // ---- Misc edge cases ----------------------------------------------------

  it('handles rows with null/undefined/empty qty values', async () => {
    const rows = [
      { tri_facility_id: 'F1', cas_chem_name: 'LEAD', one_time_release_qty: null },
      { tri_facility_id: 'F1', cas_chem_name: 'ZINC', one_time_release_qty: undefined },
      { tri_facility_id: 'F2', cas_chem_name: 'COPPER', one_time_release_qty: '' },
      { tri_facility_id: 'F2', cas_chem_name: 'IRON', one_time_release_qty: 75 },
    ];

    mockedFetch.mockResolvedValueOnce(fakeResponse(rows));

    const result = await fetchTriReleasesByCounty('OH', 'Cuyahoga');

    expect(result.data).not.toBeNull();
    expect(result.data!.facilityCount).toBe(2);
    expect(result.data!.totalOnSiteReleaseLbs).toBe(75);
    // Only IRON had a positive qty, so it's the sole top chemical
    expect(result.data!.topChemicals).toEqual([{ chemical: 'IRON', lbs: 75 }]);
  });

  it('treats negative qty values as 0', async () => {
    const rows = [
      { tri_facility_id: 'F1', cas_chem_name: 'LEAD', one_time_release_qty: -50 },
      { tri_facility_id: 'F1', cas_chem_name: 'ZINC', one_time_release_qty: 100 },
    ];

    mockedFetch.mockResolvedValueOnce(fakeResponse(rows));

    const result = await fetchTriReleasesByCounty('OH', 'Franklin');

    expect(result.data!.totalOnSiteReleaseLbs).toBe(100);
    expect(result.data!.topChemicals).toEqual([{ chemical: 'ZINC', lbs: 100 }]);
  });

  it('labels rows without cas_chem_name as "Unknown"', async () => {
    const rows = [
      { tri_facility_id: 'F1', one_time_release_qty: 200 },
    ];

    mockedFetch.mockResolvedValueOnce(fakeResponse(rows));

    const result = await fetchTriReleasesByCounty('IL', 'Cook');

    expect(result.data!.topChemicals).toEqual([{ chemical: 'Unknown', lbs: 200 }]);
  });

  it('passes timeoutMs option through to fetchWithRetry', async () => {
    mockedFetch.mockResolvedValueOnce(fakeResponse([]));

    await fetchTriReleasesByCounty('CA', 'Orange', { timeoutMs: 5000 });

    expect(mockedFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ timeoutMs: 5000, retries: 2 }),
    );
  });
});

// ---------------------------------------------------------------------------
// fetchTriReleasesByFips
// ---------------------------------------------------------------------------

describe('fetchTriReleasesByFips', () => {
  afterEach(() => {
    mockedFetch.mockClear();
  });

  // ---- 6. fetchTriReleasesByFips with valid and invalid FIPS --------------

  it('resolves a valid FIPS state code and delegates to fetchTriReleasesByCounty', async () => {
    const rows = triRows([
      { facilityId: 'FAC-1', chemical: 'LEAD', qty: 250 },
    ]);
    mockedFetch.mockResolvedValueOnce(fakeResponse(rows));

    const result = await fetchTriReleasesByFips('34', 'Essex');

    expect(result.error).toBeNull();
    expect(result.data).not.toBeNull();
    expect(result.data!.facilityCount).toBe(1);

    // FIPS 34 = NJ
    const url = mockedFetch.mock.calls[0][0] as string;
    expect(url).toContain('STATE_ABBR/NJ/');
  });

  it('returns an error for an unknown FIPS state code', async () => {
    const result = await fetchTriReleasesByFips('99', 'Nowhere');

    expect(result.data).toBeNull();
    expect(result.error).toBe('Unknown state FIPS: 99');
    expect(result.source).toBe('EPA TRI');
    // fetchWithRetry should not have been called at all
    expect(mockedFetch).not.toHaveBeenCalled();
  });
});
