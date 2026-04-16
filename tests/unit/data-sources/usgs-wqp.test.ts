import { describe, it, expect, vi, afterEach } from 'vitest';
import { fetchWqpPfasData, parseCsv, toPpt } from '@/lib/data-sources/usgs-wqp';

function makeFetchOk(body: string) {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    text: async () => body,
  } as unknown as Response);
}

function makeFetchError(status: number) {
  return vi.fn().mockResolvedValue({
    ok: false,
    status,
    text: async () => '',
  } as unknown as Response);
}

const CSV_HEADER = 'Org_Identifier,Org_FormalName,Location_Identifier,Activity_StartDate,Result_Characteristic,Result_Measure,Result_MeasureUnit';

const CSV_ROW_1 = '21NYDECA_WQX,New York State Dec,21NYDECA_WQX-2923,2021-08-18,Perfluorooctanoic acid,22,ng/L';
const CSV_ROW_2 = '21NYDECA_WQX,New York State Dec,21NYDECA_WQX-2923,2021-04-13,Perfluorooctanoic acid,8.6,ng/L';
const CSV_ROW_3 = 'USGS,US Geological Survey,USGS-01234,2022-06-01,Perfluorooctanesulfonic acid (PFOS),2.1,ng/L';

describe('parseCsv', () => {
  it('parses a simple CSV into objects', () => {
    const csv = [CSV_HEADER, CSV_ROW_1, CSV_ROW_2].join('\n');
    const rows = parseCsv(csv);
    expect(rows).toHaveLength(2);
    expect(rows[0].Result_Characteristic).toBe('Perfluorooctanoic acid');
    expect(rows[0].Result_Measure).toBe('22');
    expect(rows[1].Result_Measure).toBe('8.6');
  });

  it('handles quoted fields with commas', () => {
    const csv = 'Name,Value\n"Smith, John",42\n';
    const rows = parseCsv(csv);
    expect(rows).toHaveLength(1);
    expect(rows[0].Name).toBe('Smith, John');
    expect(rows[0].Value).toBe('42');
  });

  it('returns empty array for header-only CSV', () => {
    expect(parseCsv(CSV_HEADER)).toHaveLength(0);
  });

  it('returns empty array for empty input', () => {
    expect(parseCsv('')).toHaveLength(0);
  });
});

describe('toPpt', () => {
  it('returns ng/L as-is', () => {
    expect(toPpt(5, 'ng/L')).toBe(5);
  });

  it('converts ug/L to ng/L (×1000)', () => {
    expect(toPpt(0.005, 'ug/l')).toBe(5);
  });

  it('converts mg/L to ng/L (×1_000_000)', () => {
    expect(toPpt(0.000005, 'mg/l')).toBeCloseTo(5, 2);
  });

  it('defaults to ng/L for unknown units', () => {
    expect(toPpt(10, 'ppb')).toBe(10);
  });
});

describe('fetchWqpPfasData', () => {
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

  it('parses WQP CSV into WqpDetection objects', async () => {
    const csv = [CSV_HEADER, CSV_ROW_1, CSV_ROW_2, CSV_ROW_3].join('\n');
    vi.stubGlobal('fetch', makeFetchOk(csv));

    const result = await fetchWqpPfasData(42.8, -73.3);

    expect(result.error).toBeNull();
    expect(result.data).not.toBeNull();
    expect(result.data!.detections).toHaveLength(3);
    expect(result.data!.maxDetectionPpt).toBe(22);
    expect(result.data!.monitoringLocationCount).toBe(2); // 2 unique locations
    expect(result.data!.exceedsMcl).toBe(true); // 22 > 4 ppt
    // Sorted by concentration descending
    expect(result.data!.detections[0].valuePpt).toBe(22);
    expect(result.data!.detections[1].valuePpt).toBe(8.6);
  });

  it('returns empty data when API returns header-only CSV', async () => {
    vi.stubGlobal('fetch', makeFetchOk(CSV_HEADER + '\n'));

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
    const csv = [
      CSV_HEADER,
      '21NYDECA_WQX,NY,LOC-1,2023-01-01,Perfluorooctanoic acid,,ng/L',     // empty value
      '21NYDECA_WQX,NY,LOC-2,2023-01-01,Perfluorooctanoic acid,-1,ng/L',    // negative
      '21NYDECA_WQX,NY,LOC-3,2023-01-01,Perfluorooctanoic acid,3.0,ng/L',   // valid
    ].join('\n');
    vi.stubGlobal('fetch', makeFetchOk(csv));

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
