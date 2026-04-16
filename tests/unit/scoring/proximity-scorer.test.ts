import { describe, it, expect } from 'vitest';
import { scoreProximityLayer } from '@/lib/scoring/proximity-scorer';
import { ProximityLayerData, EchoData, SuperfundSite } from '@/types/exposure';

function makeEcho(opts: {
  rcra?: number;
  tri?: number;
  snc?: number;
  total?: number;
}): EchoData {
  const facilities = [];
  for (let i = 0; i < (opts.rcra ?? 0); i++) {
    facilities.push({
      registryId: `RCRA${i}`,
      name: `RCRA Facility ${i}`,
      distance: 0,
      direction: '',
      latitude: 40.0,
      longitude: -74.0,
      programs: ['RCRA'],
      complianceStatus: 'No Violation',
      significantViolation: false,
    });
  }
  for (let i = 0; i < (opts.tri ?? 0); i++) {
    facilities.push({
      registryId: `TRI${i}`,
      name: `TRI Facility ${i}`,
      distance: 0,
      direction: '',
      latitude: 40.0,
      longitude: -74.0,
      programs: ['TRI'],
      complianceStatus: 'No Violation',
      significantViolation: false,
    });
  }
  return {
    facilities,
    significantViolationCount: opts.snc ?? 0,
    totalCount: opts.total ?? facilities.length,
  };
}

function makeSuperfundSites(distances: number[]): SuperfundSite[] {
  return distances.map((d, i) => ({
    siteId: `NPL${i}`,
    name: `Superfund Site ${i}`,
    nplStatus: 'listed',
    latitude: 40.0,
    longitude: -74.0,
    distanceKm: d,
  }));
}

describe('scoreProximityLayer', () => {
  it('scores clean area near zero', () => {
    const data: ProximityLayerData = {
      superfundSites: [],
      echoFacilities: makeEcho({ rcra: 0, tri: 0, snc: 0 }),
    };

    const result = scoreProximityLayer(data);

    expect(result.available).toBe(true);
    expect(result.score).toBe(0);
    expect(result.confidence).toBe('property');
    expect(result.coverage).toBeGreaterThan(0.9);
  });

  it('scores area near Superfund site high', () => {
    const data: ProximityLayerData = {
      superfundSites: makeSuperfundSites([0.5, 2.0]),
      echoFacilities: makeEcho({ rcra: 3, tri: 2, snc: 1 }),
    };

    const result = scoreProximityLayer(data);

    expect(result.available).toBe(true);
    expect(result.score).toBeGreaterThan(40);
    expect(result.subScores.superfundProximity).toBeGreaterThan(80);
  });

  it('scores industrial area with many RCRA/TRI facilities', () => {
    const data: ProximityLayerData = {
      superfundSites: [],
      echoFacilities: makeEcho({ rcra: 12, tri: 8, snc: 3 }),
    };

    const result = scoreProximityLayer(data);

    expect(result.available).toBe(true);
    expect(result.score).toBeGreaterThan(30);
    expect(result.subScores.rcraFacilities).toBeGreaterThan(60);
  });

  it('gives higher score for closer Superfund sites', () => {
    const nearData: ProximityLayerData = {
      superfundSites: makeSuperfundSites([0.5]),
      echoFacilities: makeEcho({}),
    };
    const farData: ProximityLayerData = {
      superfundSites: makeSuperfundSites([7.0]),
      echoFacilities: makeEcho({}),
    };

    const nearResult = scoreProximityLayer(nearData);
    const farResult = scoreProximityLayer(farData);

    expect(nearResult.subScores.superfundProximity).toBeGreaterThan(
      farResult.subScores.superfundProximity!
    );
  });

  it('returns unavailable when all data sources fail', () => {
    const data: ProximityLayerData = {
      superfundSites: [],
      echoFacilities: null,
    };

    // With superfundSites as empty array (not null), it scores 0 for superfund
    // But ECHO is null so RCRA/TRI/SNC are unavailable
    const result = scoreProximityLayer(data);

    expect(result.available).toBe(true);
    expect(result.score).toBe(0);
    expect(result.confidence).toBe('area');
  });

  it('handles SNC-heavy area', () => {
    const data: ProximityLayerData = {
      superfundSites: [],
      echoFacilities: makeEcho({ rcra: 2, tri: 1, snc: 6 }),
    };

    const result = scoreProximityLayer(data);

    expect(result.subScores.sncFacilities).toBeGreaterThan(60);
  });

  it('includes rawData with facility counts', () => {
    const data: ProximityLayerData = {
      superfundSites: makeSuperfundSites([1.5]),
      echoFacilities: makeEcho({ rcra: 4, tri: 2, snc: 1, total: 10 }),
    };

    const result = scoreProximityLayer(data);

    expect(result.rawData.superfundSiteCount).toBe(1);
    expect(result.rawData.rcraCount).toBe(4);
    expect(result.rawData.triCount).toBe(2);
    expect(result.rawData.sncCount).toBe(1);
    expect(result.rawData.totalEchoFacilities).toBe(10);
    expect(result.rawData.coverageBreakdown).toHaveLength(4);
  });
});
