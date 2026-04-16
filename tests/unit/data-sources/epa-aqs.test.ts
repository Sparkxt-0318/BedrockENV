import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { fetchAqsData } from '@/lib/data-sources/epa-aqs';

function makeFetchOk(body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => body,
  } as unknown as Response);
}

describe('fetchAqsData', () => {
  beforeEach(() => {
    vi.stubGlobal('process', {
      ...process,
      env: { ...process.env, EPA_AQS_EMAIL: 'test@test.com', EPA_AQS_KEY: 'test-key' },
    });
  });

  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

  it('parses AQS annual summary with PM2.5 and ozone', async () => {
    const body = {
      Header: [{ status: 'Success', rows: 2 }],
      Data: [
        {
          parameter_code: '88101',
          parameter: 'PM2.5 - Local Conditions',
          arithmetic_mean: '10.5',
          first_max_value: '35.2',
          units_of_measure: 'Micrograms/cubic meter (25 C)',
          year: '2024',
          observation_count: '350',
          local_site_name: 'Newark Firehouse',
          latitude: '40.735',
          longitude: '-74.17',
        },
        {
          parameter_code: '44201',
          parameter: 'Ozone',
          arithmetic_mean: '0.042',
          first_max_value: '0.078',
          units_of_measure: 'Parts per million',
          year: '2024',
          observation_count: '280',
          local_site_name: 'Newark Firehouse',
          latitude: '40.735',
          longitude: '-74.17',
        },
      ],
    };
    vi.stubGlobal('fetch', makeFetchOk(body));

    const result = await fetchAqsData(40.735, -74.17);

    expect(result.error).toBeNull();
    expect(result.data).not.toBeNull();
    expect(result.data!.pm25Annual).toBe(10.5);
    expect(result.data!.ozoneMax).toBe(0.078);
    expect(result.data!.summaries).toHaveLength(2);
  });

  it('returns null pm25/ozone when no data rows', async () => {
    const body = {
      Header: [{ status: 'Success', rows: 0 }],
      Data: [],
    };
    vi.stubGlobal('fetch', makeFetchOk(body));

    const result = await fetchAqsData(44.5, -110.5);

    expect(result.error).toBeNull();
    expect(result.data!.pm25Annual).toBeNull();
    expect(result.data!.ozoneMax).toBeNull();
    expect(result.data!.summaries).toHaveLength(0);
  });

  it('returns error when credentials are missing', async () => {
    vi.stubGlobal('process', {
      ...process,
      env: { ...process.env, EPA_AQS_EMAIL: undefined, EPA_AQS_KEY: undefined },
    });

    const result = await fetchAqsData(40.0, -74.0);

    expect(result.data).toBeNull();
    expect(result.error).toMatch(/credentials not configured/);
  });

  it('returns error on HTTP failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false, status: 429, json: async () => ({}),
    } as unknown as Response));

    const result = await fetchAqsData(40.0, -74.0);

    expect(result.data).toBeNull();
    expect(result.error).toMatch(/429/);
  });

  it('handles failed API status gracefully', async () => {
    const body = {
      Header: [{ status: 'Failed' }],
    };
    vi.stubGlobal('fetch', makeFetchOk(body));

    const result = await fetchAqsData(40.0, -74.0);

    expect(result.data).not.toBeNull();
    expect(result.data!.pm25Annual).toBeNull();
    expect(result.data!.ozoneMax).toBeNull();
  });

  it('rejects invalid coordinates', async () => {
    const result = await fetchAqsData(NaN, -74.0);
    expect(result.data).toBeNull();
    expect(result.error).toMatch(/Invalid/);
  });

  it('picks highest PM2.5 mean across multiple monitors', async () => {
    const body = {
      Header: [{ status: 'Success', rows: 2 }],
      Data: [
        {
          parameter_code: '88101',
          arithmetic_mean: '8.0',
          first_max_value: '20.0',
          latitude: '40.7',
          longitude: '-74.1',
          year: '2024',
        },
        {
          parameter_code: '88101',
          arithmetic_mean: '12.5',
          first_max_value: '30.0',
          latitude: '40.8',
          longitude: '-74.2',
          year: '2024',
        },
      ],
    };
    vi.stubGlobal('fetch', makeFetchOk(body));

    const result = await fetchAqsData(40.735, -74.17);

    expect(result.data!.pm25Annual).toBe(12.5);
  });

  it('returns error on network failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ECONNRESET')));

    const result = await fetchAqsData(40.0, -74.0);

    expect(result.data).toBeNull();
    expect(result.error).toBe('ECONNRESET');
  });
});
