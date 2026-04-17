import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ShowcaseIntro } from '@/components/report/showcase/ShowcaseIntro';
import { DataCoverageBreakdown } from '@/components/report/showcase/DataCoverageBreakdown';
import { MethodologyFootnotes } from '@/components/report/showcase/MethodologyFootnotes';
import { RecommendationsShowcase } from '@/components/report/showcase/RecommendationsShowcase';
import { StickyScoreSidebar } from '@/components/report/showcase/StickyScoreSidebar';
import type { ExposureAssessment, CompositeScore, LayerScore } from '@/types/exposure';

beforeEach(() => {
  vi.stubGlobal('IntersectionObserver', class {
    observe = vi.fn();
    disconnect = vi.fn();
    unobserve = vi.fn();
    constructor(private cb: IntersectionObserverCallback) {
      setTimeout(() => {
        cb([{ isIntersecting: true } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
      }, 0);
    }
  });
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query.includes('reduce'),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
});

function makeLayerScore(score: number): LayerScore {
  return {
    score,
    confidence: 'neighborhood',
    available: true,
    coverage: 0.8,
    subScores: {},
    rawData: {},
  };
}

function makeComposite(): CompositeScore {
  return {
    score: 52,
    confidence: 'moderate',
    sufficient: true,
    coverage: 0.78,
    scoringVersion: 4,
    layersIncluded: ['water', 'soil', 'air', 'proximity'],
    layerScores: {
      water: makeLayerScore(60),
      soil: makeLayerScore(40),
      air: makeLayerScore(55),
      proximity: makeLayerScore(45),
    },
  };
}

function makeAssessment(): ExposureAssessment {
  return {
    id: 'test-123',
    address: {
      raw: '100 Iron St, Newark, NJ 07105',
      normalized: '100 Iron St, Newark, NJ 07105',
      latitude: 40.7128,
      longitude: -74.006,
      fipsState: '34',
      fipsCounty: '013',
      censusTract: '001100',
      censusBlockGroup: '1',
    },
    compositeScore: makeComposite(),
    dataFreshness: '2026-04-17',
    createdAt: '2026-04-17T00:00:00Z',
  };
}

describe('ShowcaseIntro', () => {
  it('renders address and composite score', () => {
    render(<ShowcaseIntro assessment={makeAssessment()} />);
    expect(screen.getByText('100 Iron St, Newark, NJ 07105')).toBeTruthy();
    expect(screen.getAllByRole('meter').length).toBeGreaterThan(0);
  });

  it('shows layer count and scoring version', () => {
    render(<ShowcaseIntro assessment={makeAssessment()} />);
    expect(screen.getByText('4 of 5 layers')).toBeTruthy();
    expect(screen.getByText('v4')).toBeTruthy();
  });
});

describe('DataCoverageBreakdown', () => {
  it('renders all 5 layers', () => {
    render(<DataCoverageBreakdown compositeScore={makeComposite()} />);
    expect(screen.getByText('Water')).toBeTruthy();
    expect(screen.getByText('Air Quality')).toBeTruthy();
    expect(screen.getByText('Toxic Proximity')).toBeTruthy();
    expect(screen.getByText('Soil & Land')).toBeTruthy();
    expect(screen.getByText('Environmental Justice')).toBeTruthy();
  });

  it('marks unavailable layers', () => {
    render(<DataCoverageBreakdown compositeScore={makeComposite()} />);
    expect(screen.getByText('Unavailable')).toBeTruthy();
  });
});

describe('MethodologyFootnotes', () => {
  it('renders scoring version', () => {
    render(<MethodologyFootnotes scoringVersion={4} />);
    expect(screen.getByText('Scoring v4')).toBeTruthy();
  });

  it('links to methodology page', () => {
    render(<MethodologyFootnotes scoringVersion={4} />);
    const link = screen.getByText('Full methodology');
    expect(link.getAttribute('href')).toBe('/methodology');
  });
});

describe('RecommendationsShowcase', () => {
  it('shows empty state when no recommendations', () => {
    render(<RecommendationsShowcase recommendations={[]} />);
    expect(screen.getByText(/No specific recommendations/)).toBeTruthy();
  });

  it('renders recommendations when present', () => {
    render(
      <RecommendationsShowcase
        recommendations={[
          {
            templateId: 'test-1',
            layer: 'water',
            riskTier: 'HIGH',
            finding: 'PFAS exceeds EPA MCL',
            recommendation: 'Install a reverse osmosis filter',
            sourceCitation: 'EPA UCMR 5',
            disclaimer: 'Consult a professional',
          },
        ]}
      />
    );
    expect(screen.getByText('PFAS exceeds EPA MCL')).toBeTruthy();
    expect(screen.getByText('Install a reverse osmosis filter')).toBeTruthy();
  });
});

describe('StickyScoreSidebar', () => {
  it('shows composite score when no active layer', () => {
    render(
      <StickyScoreSidebar
        compositeScore={makeComposite()}
        activeLayer={null}
        layerScores={makeComposite().layerScores}
      />
    );
    expect(screen.getByText('Composite')).toBeTruthy();
  });

  it('shows layer score when active layer set', () => {
    render(
      <StickyScoreSidebar
        compositeScore={makeComposite()}
        activeLayer="water"
        layerScores={makeComposite().layerScores}
      />
    );
    expect(screen.getAllByText('Water').length).toBeGreaterThan(0);
  });

  it('renders layer list with scores', () => {
    render(
      <StickyScoreSidebar
        compositeScore={makeComposite()}
        activeLayer={null}
        layerScores={makeComposite().layerScores}
      />
    );
    expect(screen.getByText('60')).toBeTruthy();
    expect(screen.getByText('40')).toBeTruthy();
  });
});
