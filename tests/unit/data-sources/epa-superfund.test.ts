import { describe, it, expect, vi, afterEach } from 'vitest';
import { fetchSuperfundSites } from '@/lib/data-sources/epa-superfund';

function makeFetchOk(body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => body,
  } as unknown as Response);
}

describe('fetchSuperfundSites', () => {
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

  it('parses FRS response into SuperfundSite array', async () => {
    const body = {
      FRSFacility: [
        {
          RegistryId: 'REG001',
          FacilityName: 'Old Chemical Plant',
          Latitude83: '40.735',
          Longitude83: '-74.17',
          ProgramList: [
            { ProgramSystemAcronym: 'SEMS', ProgramSystemId: 'NJD12345' },
          ],
        },
        {
          RegistryId: 'REG002',
          FacilityName: 'Abandoned Landfill',
          Latitude83: '40.74',
          Longitude83: '-74.18',
          ProgramList: [
            { ProgramSystemAcronym: 'SEMS', ProgramSystemId: 'NJD67890' },
          ],
        },
      ],
    };
    vi.stubGlobal('fetch', makeFetchOk(body));

    const result = await fetchSuperfundSites(40.735, -74.17);

    expect(result.error).toBeNull();
    expect(result.data).not.toBeNull();
    expect(result.data).toHaveLength(2);
    expect(result.data![0].siteId).toBe('NJD12345');
    expect(result.data![0].name).toBe('Old Chemical Plant');
    expect(result.data![0].distanceKm).toBeGreaterThanOrEqual(0);
  });

  it('returns empty array when no sites found', async () => {
    vi.stubGlobal('fetch', makeFetchOk({ FRSFacility: [] }));

    const result = await fetchSuperfundSites(44.5, -110.5);

    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(0);
  });

  it('returns empty array for missing FRSFacility key', async () => {
    vi.stubGlobal('fetch', makeFetchOk({}));

    const result = await fetchSuperfundSites(40.0, -74.0);

    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(0);
  });

  it('returns error on HTTP failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false, status: 503, json: async () => ({}),
    } as unknown as Response));

    const result = await fetchSuperfundSites(40.0, -74.0);

    expect(result.data).toBeNull();
    expect(result.error).toMatch(/503/);
  });

  it('returns error on network failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ECONNRESET')));

    const result = await fetchSuperfundSites(40.0, -74.0);

    expect(result.data).toBeNull();
    expect(result.error).toBe('ECONNRESET');
  });

  it('rejects invalid coordinates', async () => {
    const result = await fetchSuperfundSites(NaN, -74.0);
    expect(result.data).toBeNull();
    expect(result.error).toMatch(/Invalid/);
  });

  it('sorts sites by distance', async () => {
    const body = {
      FRSFacility: [
        {
          RegistryId: 'FAR',
          FacilityName: 'Far Site',
          Latitude83: '41.0',
          Longitude83: '-74.5',
          ProgramList: [{ ProgramSystemAcronym: 'SEMS', ProgramSystemId: 'FAR1' }],
        },
        {
          RegistryId: 'NEAR',
          FacilityName: 'Near Site',
          Latitude83: '40.736',
          Longitude83: '-74.171',
          ProgramList: [{ ProgramSystemAcronym: 'SEMS', ProgramSystemId: 'NEAR1' }],
        },
      ],
    };
    vi.stubGlobal('fetch', makeFetchOk(body));

    const result = await fetchSuperfundSites(40.735, -74.17);

    expect(result.data![0].name).toBe('Near Site');
    expect(result.data![1].name).toBe('Far Site');
    expect(result.data![0].distanceKm).toBeLessThan(result.data![1].distanceKm);
  });
});
