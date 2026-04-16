import { describe, it, expect } from 'vitest';
import { scoreAirLayer } from '@/lib/scoring/air-scorer';
import { AirLayerData, AirQualityData, AqsData, NonattainmentStatus } from '@/types/exposure';

function makeOpenaq(pm25: number, distKm: number): AirQualityData {
  return {
    stationName: 'Test Station',
    distanceKm: distKm,
    latitude: 40.0,
    longitude: -74.0,
    measurements: [
      { parameter: 'pm25', value: pm25, unit: 'µg/m³', lastUpdated: '2024-01-01T00:00:00Z' },
    ],
    exceedsWhoGuideline: pm25 > 15,
  };
}

function makeAqs(pm25Annual: number | null, ozoneMax: number | null): AqsData {
  return {
    summaries: [],
    pm25Annual,
    ozoneMax,
    year: 2024,
  };
}

function makeNonattainment(
  isNonattainment: boolean,
  pollutants: string[] = [],
  classification = 'attainment'
): NonattainmentStatus {
  return { isNonattainment, pollutants, classification, countyFips: '06037' };
}

describe('scoreAirLayer', () => {
  it('scores clean air location near zero', () => {
    const data: AirLayerData = {
      openaq: makeOpenaq(3.0, 2.0),
      aqs: makeAqs(3.0, 0.030),
      nonattainment: makeNonattainment(false),
      triEmitters: 0,
    };

    const result = scoreAirLayer(data);

    expect(result.available).toBe(true);
    expect(result.score).toBeLessThan(15);
    expect(result.confidence).toBe('property');
    expect(result.coverage).toBeGreaterThan(0.9);
  });

  it('scores moderate pollution mid-range', () => {
    const data: AirLayerData = {
      openaq: makeOpenaq(12.0, 8.0),
      aqs: makeAqs(11.0, 0.070),
      nonattainment: makeNonattainment(true, ['Ozone'], 'Moderate'),
      triEmitters: 5,
    };

    const result = scoreAirLayer(data);

    expect(result.available).toBe(true);
    expect(result.score).toBeGreaterThan(30);
    expect(result.score).toBeLessThan(70);
    expect(result.confidence).toBe('neighborhood');
  });

  it('scores heavy pollution area high', () => {
    const data: AirLayerData = {
      openaq: makeOpenaq(30.0, 3.0),
      aqs: makeAqs(25.0, 0.095),
      nonattainment: makeNonattainment(true, ['PM2.5', 'Ozone'], 'Serious'),
      triEmitters: 25,
    };

    const result = scoreAirLayer(data);

    expect(result.available).toBe(true);
    expect(result.score).toBeGreaterThan(70);
    expect(result.confidence).toBe('property');
  });

  it('works with only nonattainment and TRI data (no monitors)', () => {
    const data: AirLayerData = {
      openaq: null,
      aqs: null,
      nonattainment: makeNonattainment(true, ['PM2.5', 'Ozone'], 'Moderate'),
      triEmitters: 8,
    };

    const result = scoreAirLayer(data);

    expect(result.available).toBe(true);
    expect(result.score).toBeGreaterThan(20);
    expect(result.confidence).toBe('area');
  });

  it('returns unavailable when all data sources fail', () => {
    const data: AirLayerData = {
      openaq: null,
      aqs: null,
      nonattainment: null,
      triEmitters: -1,
    };

    const result = scoreAirLayer(data);

    expect(result.available).toBe(false);
    expect(result.score).toBe(0);
    expect(result.coverage).toBe(0);
  });

  it('uses AQS PM2.5 as fallback when OpenAQ has no PM2.5', () => {
    const openaqNoPm25: AirQualityData = {
      stationName: 'Ozone Only Station',
      distanceKm: 5.0,
      latitude: 40.0,
      longitude: -74.0,
      measurements: [
        { parameter: 'o3', value: 0.04, unit: 'ppm', lastUpdated: '2024-01-01T00:00:00Z' },
      ],
      exceedsWhoGuideline: false,
    };

    const data: AirLayerData = {
      openaq: openaqNoPm25,
      aqs: makeAqs(15.0, 0.060),
      nonattainment: makeNonattainment(false),
      triEmitters: 0,
    };

    const result = scoreAirLayer(data);

    expect(result.available).toBe(true);
    expect(result.rawData.pm25).toBe(15.0);
  });

  it('applies multi-pollutant boost for nonattainment', () => {
    const singlePollutant: AirLayerData = {
      openaq: null,
      aqs: null,
      nonattainment: makeNonattainment(true, ['Ozone'], 'Moderate'),
      triEmitters: 0,
    };

    const multiPollutant: AirLayerData = {
      openaq: null,
      aqs: null,
      nonattainment: makeNonattainment(true, ['PM2.5', 'Ozone', 'Lead'], 'Moderate'),
      triEmitters: 0,
    };

    const singleResult = scoreAirLayer(singlePollutant);
    const multiResult = scoreAirLayer(multiPollutant);

    expect(multiResult.subScores.nonattainment).toBeGreaterThan(singleResult.subScores.nonattainment!);
  });

  it('includes coverage breakdown in rawData', () => {
    const data: AirLayerData = {
      openaq: makeOpenaq(10.0, 3.0),
      aqs: makeAqs(9.0, 0.060),
      nonattainment: makeNonattainment(false),
      triEmitters: 2,
    };

    const result = scoreAirLayer(data);

    expect(result.rawData.coverageBreakdown).toHaveLength(4);
    expect(result.rawData.weightsUsed).toBeDefined();
  });

  it('handles extreme nonattainment classification', () => {
    const data: AirLayerData = {
      openaq: null,
      aqs: null,
      nonattainment: makeNonattainment(true, ['PM2.5', 'Ozone'], 'Extreme'),
      triEmitters: 0,
    };

    const result = scoreAirLayer(data);

    expect(result.subScores.nonattainment).toBeGreaterThanOrEqual(95);
  });
});
