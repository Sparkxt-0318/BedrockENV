import { describe, it, expect, vi, afterEach } from 'vitest';
import { fetchEjScreenData } from '@/lib/data-sources/epa-ejscreen';

function makeFetchOk(body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => body,
  } as unknown as Response);
}

describe('fetchEjScreenData', () => {
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

  it('parses EJScreen response into EjScreenData', async () => {
    const body = {
      data: [
        {
          ID: '340130001001',
          S_E_PCTILE: 72,
          S_E_SUPP_PCTILE: 68,
          S_PM25_PCTILE: 55,
          S_OZONE_PCTILE: 42,
          S_DSLPM_PCTILE: 60,
          S_TRAFPROX_PCTILE: 48,
          S_LDPNT_PCTILE: 65,
          S_NPL_PCTILE: 30,
          S_RMP_PCTILE: 45,
          S_TSDF_PCTILE: 50,
          S_WTRPROX_PCTILE: 35,
          S_DEMOGIDX_PCTILE: 80,
          S_MINORPCT: 62.5,
          S_LOWINCPCT: 38.2,
          S_LINGISOPCT: 12.3,
          S_LESSHSPCT: 18.5,
          S_UNDER5PCT: 6.2,
          S_OVER64PCT: 14.1,
        },
      ],
    };
    vi.stubGlobal('fetch', makeFetchOk(body));

    const result = await fetchEjScreenData(40.735, -74.17);

    expect(result.error).toBeNull();
    expect(result.data).not.toBeNull();
    expect(result.data!.ejIndex).toBe(72);
    expect(result.data!.demographicIndex).toBe(80);
    expect(result.data!.minorityPct).toBe(62.5);
    expect(result.data!.blockGroup).toBe('340130001001');
  });

  it('returns error when no data rows', async () => {
    vi.stubGlobal('fetch', makeFetchOk({ data: [] }));

    const result = await fetchEjScreenData(44.5, -110.5);

    expect(result.data).toBeNull();
    expect(result.error).toMatch(/No EJScreen data/);
  });

  it('returns error on HTTP failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false, status: 500, json: async () => ({}),
    } as unknown as Response));

    const result = await fetchEjScreenData(40.0, -74.0);

    expect(result.data).toBeNull();
    expect(result.error).toMatch(/500/);
  });

  it('returns error on network failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ECONNRESET')));

    const result = await fetchEjScreenData(40.0, -74.0);

    expect(result.data).toBeNull();
    expect(result.error).toBe('ECONNRESET');
  });

  it('rejects invalid coordinates', async () => {
    const result = await fetchEjScreenData(NaN, -74.0);
    expect(result.data).toBeNull();
    expect(result.error).toMatch(/Invalid/);
  });

  it('handles null values in response gracefully', async () => {
    const body = {
      data: [
        {
          ID: '340130001001',
          S_E_PCTILE: 72,
          S_E_SUPP_PCTILE: null,
          S_PM25_PCTILE: null,
          S_DEMOGIDX_PCTILE: 65,
        },
      ],
    };
    vi.stubGlobal('fetch', makeFetchOk(body));

    const result = await fetchEjScreenData(40.0, -74.0);

    expect(result.data!.ejIndex).toBe(72);
    expect(result.data!.ejIndexSupplemental).toBeNull();
    expect(result.data!.pm25Pctile).toBeNull();
    expect(result.data!.demographicIndex).toBe(65);
  });
});
