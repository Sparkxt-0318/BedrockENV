import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ContaminationMap } from '@/components/report/ContaminationMap';
import type { ExposureAssessment } from '@/types/exposure';

function buildAssessment(overrides?: Partial<ExposureAssessment>): ExposureAssessment {
  return {
    id: 'test-map',
    address: {
      raw: '123 Test St, Newark, NJ',
      normalized: '123 Test St, Newark, NJ',
      latitude: 40.7357,
      longitude: -74.1724,
      fipsState: '34',
      fipsCounty: '013',
      censusTract: '000600',
      censusBlockGroup: '1',
    },
    compositeScore: {
      score: 50,
      confidence: 'moderate',
      sufficient: true,
      coverage: 0.8,
      scoringVersion: 4,
      layersIncluded: ['water', 'soil', 'proximity'],
      layerScores: {},
    },
    dataFreshness: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('ContaminationMap', () => {
  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  });

  it('renders static fallback when no Mapbox token is set', () => {
    render(<ContaminationMap assessment={buildAssessment()} />);
    expect(screen.getByText('Location Map')).toBeTruthy();
    expect(screen.getByText(/Set NEXT_PUBLIC_MAPBOX_TOKEN/)).toBeTruthy();
  });

  it('shows property coordinates in fallback mode', () => {
    render(<ContaminationMap assessment={buildAssessment()} />);
    expect(screen.getByText('40.7357, -74.1724')).toBeTruthy();
  });

  it('shows brownfield count in fallback when sites exist', () => {
    const assessment = buildAssessment({
      soilData: {
        ssurgo: null,
        brownfields: [
          { name: 'Test Site', latitude: 40.74, longitude: -74.17, distance: 0.5, direction: 'N', cleanupStatus: 'Active', contaminantTypes: ['Lead'] },
          { name: 'Site 2', latitude: 40.73, longitude: -74.18, distance: 1.2, direction: 'W', cleanupStatus: 'Completed', contaminantTypes: ['PCBs'] },
        ],
        echoFacilities: null,
        floodZone: null,
        moistureData: null,
      },
    });
    render(<ContaminationMap assessment={assessment} />);
    expect(screen.getByText('2 brownfield site(s) nearby')).toBeTruthy();
  });

  it('shows Superfund count in fallback when sites exist', () => {
    const assessment = buildAssessment({
      proximityData: {
        superfundSites: [
          { siteId: 'NJD001', name: 'Diamond Alkali', nplStatus: 'Active', latitude: 40.74, longitude: -74.07, distanceKm: 3.2 },
        ],
        echoFacilities: null,
      },
    });
    render(<ContaminationMap assessment={assessment} />);
    expect(screen.getByText('1 Superfund NPL site(s) nearby')).toBeTruthy();
  });

  it('shows ECHO facility count in fallback when facilities exist', () => {
    const assessment = buildAssessment({
      proximityData: {
        superfundSites: [],
        echoFacilities: {
          facilities: [
            { registryId: 'R1', name: 'Facility A', distance: 0.5, direction: 'N', latitude: 40.74, longitude: -74.17, programs: ['TRI'], complianceStatus: 'No Violation' },
          ],
          significantViolationCount: 0,
          totalCount: 1,
        },
      },
    });
    render(<ContaminationMap assessment={assessment} />);
    expect(screen.getByText('1 regulated facilities nearby')).toBeTruthy();
  });

  it('renders address name in fallback', () => {
    render(<ContaminationMap assessment={buildAssessment()} />);
    expect(screen.getByText('123 Test St, Newark, NJ')).toBeTruthy();
  });
});
