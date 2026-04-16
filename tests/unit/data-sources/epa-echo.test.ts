import { describe, it, expect, vi, afterEach } from 'vitest';
import { fetchEchoFacilities } from '@/lib/data-sources/epa-echo';

function makeFetchOk(body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => body,
  } as unknown as Response);
}

describe('fetchEchoFacilities', () => {
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

  it('parses ECHO facility rows into EchoFacility objects', async () => {
    const body = {
      Results: {
        Facilities: [
          {
            RegistryID: '110000123456',
            FacName: 'ACME CHEMICAL PLANT',
            FacLat: '40.7350',
            FacLong: '-74.1700',
            CWAPermitStatusFlag: 'Y',
            RCRAPermitStatusFlag: 'N',
            CAAPermitStatusFlag: 'Y',
            SDWISFlag: 'N',
            TRIFlag: 'Y',
            CurrSvFlag: 'Y',
            CurrVioFlag: 'Y',
            CurrComplianceStatus: 'Significant Violation',
          },
          {
            RegistryID: '110000789012',
            FacName: 'CLEAN WATER TREATMENT',
            FacLat: '40.7400',
            FacLong: '-74.1650',
            CWAPermitStatusFlag: 'Y',
            RCRAPermitStatusFlag: 'N',
            CAAPermitStatusFlag: 'N',
            SDWISFlag: 'Y',
            TRIFlag: 'N',
            CurrSvFlag: 'N',
            CurrVioFlag: 'N',
            CurrComplianceStatus: 'No Violation',
          },
        ],
      },
    };
    vi.stubGlobal('fetch', makeFetchOk(body));

    const result = await fetchEchoFacilities(40.735, -74.17);

    expect(result.error).toBeNull();
    expect(result.data).not.toBeNull();
    expect(result.data!.facilities).toHaveLength(2);
    expect(result.data!.significantViolationCount).toBe(1);
    expect(result.data!.totalCount).toBe(2);

    const acme = result.data!.facilities.find((f) => f.name === 'ACME CHEMICAL PLANT')!;
    expect(acme.programs).toContain('CWA');
    expect(acme.programs).toContain('CAA');
    expect(acme.programs).toContain('TRI');
    expect(acme.programs).not.toContain('RCRA');
    expect(acme.significantViolation).toBe(true);
  });

  it('returns empty data when no facilities found', async () => {
    vi.stubGlobal('fetch', makeFetchOk({ Results: { Facilities: [] } }));

    const result = await fetchEchoFacilities(44.0, -110.0);

    expect(result.error).toBeNull();
    expect(result.data!.facilities).toHaveLength(0);
    expect(result.data!.totalCount).toBe(0);
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

  it('sorts facilities by distance', async () => {
    const body = {
      Results: {
        Facilities: [
          {
            RegistryID: '1',
            FacName: 'FAR',
            FacLat: '40.75',
            FacLong: '-74.15',
            CurrSvFlag: 'N',
          },
          {
            RegistryID: '2',
            FacName: 'NEAR',
            FacLat: '40.7351',
            FacLong: '-74.1701',
            CurrSvFlag: 'N',
          },
        ],
      },
    };
    vi.stubGlobal('fetch', makeFetchOk(body));

    const result = await fetchEchoFacilities(40.735, -74.17);

    expect(result.data!.facilities[0].name).toBe('NEAR');
    expect(result.data!.facilities[1].name).toBe('FAR');
  });
});
