import { describe, it, expect, vi, afterEach } from 'vitest';
import { fetchSsurgoData } from '@/lib/data-sources/usda-ssurgo';

// ---------------------------------------------------------------------------
// SDA response fixtures — array-of-arrays shape (format=JSON+COLUMNNAME).
// Column order must match the SELECT list in usda-ssurgo.ts.
// ---------------------------------------------------------------------------

const HEADERS = [
  'muname',
  'mukey',
  'compname',
  'compkind',
  'comppct_r',
  'drainagecl',
  'hydgrp',
  'hzname',
  'hzdept_r',
  'hzdepb_r',
  'sandtotal_r',
  'silttotal_r',
  'claytotal_r',
  'ph1to1h2o_r',
  'om_r',
  'cec7_r',
  'ksat_r',
];

type Row = (string | number | null)[];

function tableResponse(rows: Row[]): { Table: unknown[][] } {
  return { Table: [HEADERS, ...rows] };
}

function mockFetchJson(body: unknown, status = 200) {
  return vi.fn().mockResolvedValue({
    ok: status < 400,
    status,
    statusText: `HTTP ${status}`,
    json: async () => body,
  } as unknown as Response);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('fetchSsurgoData', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('aggregates a single-component loam profile and reports mapped coverage', async () => {
    // A single "Salinas clay loam" component at 95% with two horizons:
    //   A horizon: 0–18 cm, pH 6.8, OM 3.5%
    //   Bt horizon: 18–50 cm, pH 7.0, OM 1.2%  (only 18–25 falls in the 0–25 band)
    const rows: Row[] = [
      ['Salinas clay loam', 'MU-1', 'Salinas', 'Series', 95, 'Well drained', 'B',
        'A', 0, 18, 30, 40, 30, 6.8, 3.5, 18, 10],
      ['Salinas clay loam', 'MU-1', 'Salinas', 'Series', 95, 'Well drained', 'B',
        'Bt', 18, 50, 25, 40, 35, 7.0, 1.2, 20, 5],
    ];
    vi.stubGlobal('fetch', mockFetchJson(tableResponse(rows)));

    const result = await fetchSsurgoData(36.645, -121.59);

    expect(result.error).toBeNull();
    expect(result.data).not.toBeNull();
    expect(result.data!.coverage).toBe('mapped');
    expect(result.data!.mapUnitName).toBe('Salinas clay loam');
    expect(result.data!.mapUnitKey).toBe('MU-1');
    expect(result.data!.drainageClass).toBe('Well drained');
    // pH range spans the two horizons' surface-weighted pH values.
    expect(result.data!.phRange[0]).toBeGreaterThan(6.7);
    expect(result.data!.phRange[1]).toBeLessThanOrEqual(7.0);
    // Organic matter is dominated by the thick (18 cm) A horizon, so
    // weighted OM should be closer to 3.5 than 1.2.
    expect(result.data!.organicMatterPct).toBeGreaterThan(2.5);
    expect(result.data!.organicMatterPct).toBeLessThanOrEqual(3.5);
    expect(['Clay loam', 'Loam', 'Silt loam']).toContain(
      result.data!.dominantTexture
    );
    expect(result.source).toBe('USDA SSURGO');
  });

  it('weights across components by comppct_r', async () => {
    // 70% clay (pH 5.0) + 30% sandy loam (pH 7.5). Weighted pH → 5.75 ish.
    const rows: Row[] = [
      ['Mixed unit', 'MU-2', 'Heavy Clay', 'Series', 70, 'Poorly drained', 'D',
        'A', 0, 20, 10, 30, 60, 5.0, 2.0, 20, 1],
      ['Mixed unit', 'MU-2', 'Sandy', 'Series', 30, 'Well drained', 'A',
        'A', 0, 20, 70, 20, 10, 7.5, 1.0, 10, 15],
    ];
    vi.stubGlobal('fetch', mockFetchJson(tableResponse(rows)));

    const result = await fetchSsurgoData(40.0, -100.0);

    expect(result.error).toBeNull();
    expect(result.data!.coverage).toBe('mapped');
    expect(result.data!.drainageClass).toBe('Poorly drained'); // dominant
    // phRange captures both extremes.
    expect(result.data!.phRange[0]).toBeCloseTo(5.0, 1);
    expect(result.data!.phRange[1]).toBeCloseTo(7.5, 1);
    // Weighted OM: (2.0*70 + 1.0*30) / 100 = 1.7
    expect(result.data!.organicMatterPct).toBeCloseTo(1.7, 1);
  });

  it('skips miscellaneous-area components (rock outcrop, urban land)', async () => {
    // 50% Rock outcrop (miscellaneous area, no chemistry) + 50% real soil.
    const rows: Row[] = [
      ['Mixed', 'MU-3', 'Rock outcrop', 'Miscellaneous area', 50, '', null,
        null, null, null, null, null, null, null, null, null, null],
      ['Mixed', 'MU-3', 'Good Soil', 'Series', 50, 'Well drained', 'B',
        'A', 0, 25, 40, 40, 20, 6.5, 3.0, 15, 10],
    ];
    vi.stubGlobal('fetch', mockFetchJson(tableResponse(rows)));

    const result = await fetchSsurgoData(40.0, -100.0);

    expect(result.error).toBeNull();
    expect(result.data!.coverage).toBe('mapped');
    // Aggregates should be dominated entirely by the surveyed component,
    // not dragged toward zero by the rock outcrop.
    expect(result.data!.organicMatterPct).toBeCloseTo(3.0, 1);
    expect(result.data!.phRange[0]).toBeCloseTo(6.5, 1);
  });

  it('returns partial coverage when every component has null chemistry', async () => {
    // "Urban land" — intersection found but no usable chemistry.
    const rows: Row[] = [
      ['Urban land', 'MU-4', 'Urban land', 'Series', 100, '', null,
        null, null, null, null, null, null, null, null, null, null],
    ];
    vi.stubGlobal('fetch', mockFetchJson(tableResponse(rows)));

    const result = await fetchSsurgoData(40.7, -74.0);

    expect(result.error).toBeNull();
    expect(result.data).not.toBeNull();
    expect(result.data!.coverage).toBe('partial');
    expect(result.data!.organicMatterPct).toBe(0);
  });

  it('returns unmapped coverage when SDA returns zero rows', async () => {
    vi.stubGlobal('fetch', mockFetchJson({ Table: [] }));

    const result = await fetchSsurgoData(64.0, -153.0); // middle of Alaska

    expect(result.error).toBeNull();
    expect(result.data).not.toBeNull();
    expect(result.data!.coverage).toBe('unmapped');
    expect(result.data!.mapUnitName).toBe('');
  });

  it('accepts the array-of-objects response shape as well', async () => {
    const body = {
      Table: [
        {
          muname: 'Objects Shape Unit',
          mukey: 'MU-5',
          compname: 'ObjComp',
          compkind: 'Series',
          comppct_r: 100,
          drainagecl: 'Well drained',
          hydgrp: 'C',
          hzname: 'A',
          hzdept_r: 0,
          hzdepb_r: 20,
          sandtotal_r: 40,
          silttotal_r: 40,
          claytotal_r: 20,
          ph1to1h2o_r: 6.8,
          om_r: 2.5,
          cec7_r: 12,
          ksat_r: 8,
        },
      ],
    };
    vi.stubGlobal('fetch', mockFetchJson(body));

    const result = await fetchSsurgoData(40.0, -100.0);
    expect(result.error).toBeNull();
    expect(result.data!.mapUnitName).toBe('Objects Shape Unit');
    expect(result.data!.coverage).toBe('mapped');
  });

  it('returns an error on HTTP failure', async () => {
    vi.stubGlobal('fetch', mockFetchJson({}, 500));

    const result = await fetchSsurgoData(40.0, -100.0);
    expect(result.data).toBeNull();
    expect(result.error).toMatch(/500/);
  });

  it('returns an error on malformed JSON (no Table key)', async () => {
    vi.stubGlobal('fetch', mockFetchJson({ somethingElse: [] }));

    const result = await fetchSsurgoData(40.0, -100.0);
    expect(result.data).toBeNull();
    expect(result.error).toMatch(/malformed/i);
  });

  it('returns an error when fetch throws (network failure)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ECONNRESET')));

    const result = await fetchSsurgoData(40.0, -100.0);
    expect(result.data).toBeNull();
    expect(result.error).toMatch(/ECONNRESET/);
  });

  it('rejects non-finite coordinates', async () => {
    const result = await fetchSsurgoData(Number.NaN, -100.0);
    expect(result.data).toBeNull();
    expect(result.error).toMatch(/finite/);
  });
});
