import { describe, it, expect, vi, afterEach } from 'vitest';
import { fetchSviData } from '@/lib/data-sources/cdc-svi';

function makeFetchOk(body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => body,
  } as unknown as Response);
}

describe('fetchSviData', () => {
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

  it('parses SVI ArcGIS response into SviData', async () => {
    const body = {
      features: [
        {
          attributes: {
            FIPS: '34013000100',
            RPL_THEMES: 0.72,
            RPL_THEME1: 0.65,
            RPL_THEME2: 0.55,
            RPL_THEME3: 0.80,
            RPL_THEME4: 0.68,
            E_TOTPOP: 4250,
          },
        },
      ],
    };
    vi.stubGlobal('fetch', makeFetchOk(body));

    const result = await fetchSviData('34', '013', '000100');

    expect(result.error).toBeNull();
    expect(result.data).not.toBeNull();
    expect(result.data!.overallSvi).toBe(0.72);
    expect(result.data!.socioeconomicSvi).toBe(0.65);
    expect(result.data!.minoritySvi).toBe(0.80);
    expect(result.data!.totalPopulation).toBe(4250);
    expect(result.data!.tractFips).toBe('34013000100');
  });

  it('returns error when no features found', async () => {
    vi.stubGlobal('fetch', makeFetchOk({ features: [] }));

    const result = await fetchSviData('99', '999', '999999');

    expect(result.data).toBeNull();
    expect(result.error).toMatch(/No SVI data/);
  });

  it('returns error when census tract not available', async () => {
    const result = await fetchSviData('34', '013', '');

    expect(result.data).toBeNull();
    expect(result.error).toMatch(/Census tract not available/);
  });

  it('returns error on HTTP failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false, status: 503, json: async () => ({}),
    } as unknown as Response));

    const result = await fetchSviData('34', '013', '000100');

    expect(result.data).toBeNull();
    expect(result.error).toMatch(/503/);
  });

  it('returns error on network failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ECONNRESET')));

    const result = await fetchSviData('34', '013', '000100');

    expect(result.data).toBeNull();
    expect(result.error).toBe('ECONNRESET');
  });

  it('handles API error response', async () => {
    vi.stubGlobal('fetch', makeFetchOk({ error: { message: 'Invalid query' } }));

    const result = await fetchSviData('34', '013', '000100');

    expect(result.data).toBeNull();
    expect(result.error).toMatch(/Invalid query/);
  });

  it('handles -999 sentinel values as 0', async () => {
    const body = {
      features: [
        {
          attributes: {
            FIPS: '34013000100',
            RPL_THEMES: -999,
            RPL_THEME1: 0.5,
            RPL_THEME2: -999,
            RPL_THEME3: 0.3,
            RPL_THEME4: 0.4,
            E_TOTPOP: 1000,
          },
        },
      ],
    };
    vi.stubGlobal('fetch', makeFetchOk(body));

    const result = await fetchSviData('34', '013', '000100');

    expect(result.data!.overallSvi).toBe(0);
    expect(result.data!.householdSvi).toBe(0);
    expect(result.data!.socioeconomicSvi).toBe(0.5);
  });
});
