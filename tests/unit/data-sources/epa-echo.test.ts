import { describe, it, expect, vi, afterEach } from 'vitest';
import { fetchEchoFacilities } from '@/lib/data-sources/epa-echo';

// ECHO uses a two-step API: get_facilities → QueryID, then get_qid → facilities
function makeEchoMock(queryRows: number, sncRows: number, facilities: unknown[]) {
  let callCount = 0;
  return vi.fn().mockImplementation(() => {
    callCount++;
    if (callCount === 1) {
      // Step 1: get_facilities → QueryID
      return Promise.resolve({
        ok: true,
        json: async () => ({
          Results: {
            Message: 'Success',
            QueryID: '42',
            QueryRows: String(queryRows),
            SVRows: String(sncRows),
            CAARows: '0',
            CWARows: '0',
            RCRRows: '0',
            TRIRows: '0',
          },
        }),
      } as unknown as Response);
    }
    // Step 2: get_qid → facilities
    return Promise.resolve({
      ok: true,
      json: async () => ({
        Results: { Facilities: facilities, QueryRows: String(queryRows) },
      }),
    } as unknown as Response);
  });
}

describe('fetchEchoFacilities', () => {
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

  it('parses ECHO two-step response into EchoData', async () => {
    const facilities = [
      {
        RegistryID: '110000123456',
        FacName: 'ACME CHEMICAL PLANT',
        FacLat: '40.7350',
        FacActiveFlag: 'Y',
        FacSNCFlg: 'Y',
        FacComplianceStatus: 'Significant Violation',
        CWAComplianceStatus: 'Significant Violation',
        RCRAComplianceStatus: 'No Violation Identified',
        CAAComplianceStatus: 'None',
        AIRFlag: 'N',
        TRIFlag: 'Y',
      },
      {
        RegistryID: '110000789012',
        FacName: 'CLEAN WATER TREATMENT',
        FacLat: '40.7400',
        FacActiveFlag: 'Y',
        FacSNCFlg: 'N',
        FacComplianceStatus: 'No Violation Identified',
        CWAComplianceStatus: 'No Violation Identified',
        RCRAComplianceStatus: 'None',
        CAAComplianceStatus: 'None',
        AIRFlag: 'N',
        TRIFlag: 'N',
      },
    ];

    vi.stubGlobal('fetch', makeEchoMock(2375, 12, facilities));

    const result = await fetchEchoFacilities(40.735, -74.17);

    expect(result.error).toBeNull();
    expect(result.data).not.toBeNull();
    expect(result.data!.facilities).toHaveLength(2);
    expect(result.data!.totalCount).toBe(2375); // from QueryRows
    expect(result.data!.significantViolationCount).toBe(1); // from parsed facilities

    const acme = result.data!.facilities.find((f) => f.name === 'ACME CHEMICAL PLANT')!;
    expect(acme.programs).toContain('CWA');
    expect(acme.programs).toContain('TRI');
    expect(acme.programs).not.toContain('CAA'); // CAAComplianceStatus was 'None'
    expect(acme.significantViolation).toBe(true);
  });

  it('returns empty data when QueryRows is 0', async () => {
    const mock = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        Results: { Message: 'Success', QueryID: '1', QueryRows: '0', SVRows: '0' },
      }),
    } as unknown as Response);
    vi.stubGlobal('fetch', mock);

    const result = await fetchEchoFacilities(44.0, -110.0);

    expect(result.error).toBeNull();
    expect(result.data!.facilities).toHaveLength(0);
    expect(result.data!.totalCount).toBe(0);
    // Should NOT have made a second call
    expect(mock).toHaveBeenCalledTimes(1);
  });

  it('returns error on HTTP failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false, status: 500, json: async () => ({}),
    } as unknown as Response));

    const result = await fetchEchoFacilities(40.0, -74.0);

    expect(result.data).toBeNull();
    expect(result.error).toMatch(/500/);
  });

  it('returns error when fetch throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')));

    const result = await fetchEchoFacilities(40.0, -74.0);

    expect(result.data).toBeNull();
    expect(result.error).toBeTruthy();
  });

  it('rejects invalid coordinates', async () => {
    const result = await fetchEchoFacilities(Infinity, -74.0);
    expect(result.data).toBeNull();
    expect(result.error).toMatch(/Invalid/);
  });

  it('skips inactive facilities', async () => {
    const facilities = [
      { RegistryID: '1', FacName: 'ACTIVE', FacLat: '40.74', FacActiveFlag: 'Y', FacSNCFlg: 'N' },
      { RegistryID: '2', FacName: 'CLOSED', FacLat: '40.73', FacActiveFlag: 'N', FacSNCFlg: 'N' },
    ];
    vi.stubGlobal('fetch', makeEchoMock(2, 0, facilities));

    const result = await fetchEchoFacilities(40.735, -74.17);

    expect(result.data!.facilities).toHaveLength(1);
    expect(result.data!.facilities[0].name).toBe('ACTIVE');
  });
});
