import { describe, it, expect, vi, afterEach } from 'vitest';
import { fetchWqpPfasData } from '@/lib/data-sources/usgs-wqp';

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
  } as unknown as Response);
}

describe('fetchWqpPfasData', () => {
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

  it('parses WQP result rows into WqpDetection objects', async () => {
    const rows = [
      {
        CharacteristicName: 'Perfluorooctanoic acid',
        ResultMeasureValue: '12.5',
        'ResultMeasure/MeasureUnitCode': 'ng/l',
        ActivityStartDate: '2023-06-15',
        MonitoringLocationIdentifier: 'USGS-01234',
        OrganizationFormalName: 'USGS New York',
      },
      {
        CharacteristicName: 'Perfluorooctanesulfonic acid (PFOS)',
        ResultMeasureValue: '2.1',
        'ResultMeasure/MeasureUnitCode': 'ng/l',
        ActivityStartDate: '2023-06-15',
        MonitoringLocationIdentifier: 'USGS-01234',
        OrganizationFormalName: 'USGS New York',
      },
    ];
    vi.stubGlobal('fetch', makeFetchOk(rows));

    const result = await fetchWqpPfasData(42.8, -73.3);

    expect(result.error).toBeNull();
    expect(result.data).not.toBeNull();
    expect(result.data!.detections).toHaveLength(2);
    expect(result.data!.maxDetectionPpt).toBe(12.5);
    expect(result.data!.monitoringLocationCount).toBe(1);
    expect(result.data!.exceedsMcl).toBe(true); // 12.5 > 4 ppt
    // Sorted by concentration descending
    expect(result.data!.detections[0].characteristicName).toBe('Perfluorooctanoic acid');
  });

  it('converts ug/l to ppt correctly', async () => {
    const rows = [
      {
        CharacteristicName: 'Perfluorooctanoic acid',
        ResultMeasureValue: '0.005',
        'ResultMeasure/MeasureUnitCode': 'ug/l',
        ActivityStartDate: '2023-01-01',
        MonitoringLocationIdentifier: 'LOC-1',
        OrganizationFormalName: 'State Lab',
      },
    ];
    vi.stubGlobal('fetch', makeFetchOk(rows));

    const result = await fetchWqpPfasData(40.0, -74.0);

    expect(result.data!.detections[0].valuePpt).toBe(5); // 0.005 ug/l × 1000 = 5 ppt
    expect(result.data!.exceedsMcl).toBe(true); // 5 > 4
  });

  it('returns empty data when API returns no results', async () => {
    vi.stubGlobal('fetch', makeFetchOk([]));

    const result = await fetchWqpPfasData(44.0, -110.0);

    expect(result.error).toBeNull();
    expect(result.data!.detections).toHaveLength(0);
    expect(result.data!.maxDetectionPpt).toBe(0);
    expect(result.data!.exceedsMcl).toBe(false);
  });

  it('returns error on HTTP failure', async () => {
    vi.stubGlobal('fetch', makeFetchError(503));

    const result = await fetchWqpPfasData(40.0, -74.0);

    expect(result.data).toBeNull();
    expect(result.error).toMatch(/503/);
  });

  it('returns error when fetch throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('timeout')));

    const result = await fetchWqpPfasData(40.0, -74.0);

    expect(result.data).toBeNull();
    expect(result.error).toBeTruthy();
  });

  it('skips rows with missing or negative values', async () => {
    const rows = [
      {
        CharacteristicName: 'Perfluorooctanoic acid',
        ResultMeasureValue: '',
        'ResultMeasure/MeasureUnitCode': 'ng/l',
        ActivityStartDate: '2023-01-01',
        MonitoringLocationIdentifier: 'LOC-1',
      },
      {
        CharacteristicName: 'Perfluorooctanoic acid',
        ResultMeasureValue: '-1',
        'ResultMeasure/MeasureUnitCode': 'ng/l',
        ActivityStartDate: '2023-01-01',
        MonitoringLocationIdentifier: 'LOC-2',
      },
      {
        CharacteristicName: 'Perfluorooctanoic acid',
        ResultMeasureValue: '3.0',
        'ResultMeasure/MeasureUnitCode': 'ng/l',
        ActivityStartDate: '2023-01-01',
        MonitoringLocationIdentifier: 'LOC-3',
      },
    ];
    vi.stubGlobal('fetch', makeFetchOk(rows));

    const result = await fetchWqpPfasData(40.0, -74.0);

    expect(result.data!.detections).toHaveLength(1);
    expect(result.data!.detections[0].valuePpt).toBe(3.0);
  });

  it('rejects invalid coordinates', async () => {
    const result = await fetchWqpPfasData(NaN, -74.0);
    expect(result.data).toBeNull();
    expect(result.error).toMatch(/Invalid/);
  });
});
