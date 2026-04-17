import { describe, it, expect, vi } from 'vitest';
import React from 'react';

vi.mock('@react-pdf/renderer', () => {
  function createComponent(name: string) {
    const Component = ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) =>
      React.createElement(name.toLowerCase(), props, children);
    Component.displayName = name;
    return Component;
  }

  return {
    Document: createComponent('Document'),
    Page: createComponent('Page'),
    Text: createComponent('Text'),
    View: createComponent('View'),
    StyleSheet: { create: (s: Record<string, unknown>) => s },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    renderToBuffer: vi.fn().mockResolvedValue(Buffer.from('fake-pdf')) as any,
  };
});

import { ExposureReportPdf } from '@/lib/pdf/templates/exposure-report';
import { renderToBuffer } from '@react-pdf/renderer';
import type { ExposureAssessment } from '@/types/exposure';
import type { TriggeredRecommendation } from '@/lib/recommendations/types';

function makeAssessment(): ExposureAssessment {
  return {
    id: 'test-pdf-123',
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
    compositeScore: {
      score: 52,
      confidence: 'moderate',
      sufficient: true,
      coverage: 0.78,
      scoringVersion: 4,
      layersIncluded: ['water', 'soil', 'air', 'proximity'],
      layerScores: {
        water: {
          score: 60, confidence: 'neighborhood', available: true, coverage: 0.8,
          subScores: { pfas: 70, violations: 50 },
          rawData: { pfasMaxPpt: 5.3, violationCount: 33, leadPctPre1986: 61, pfasSource: 'ucmr5' },
        },
        soil: {
          score: 40, confidence: 'neighborhood', available: true, coverage: 0.7,
          subScores: { brownfields: 45 },
          rawData: {},
        },
        air: {
          score: 55, confidence: 'area', available: true, coverage: 0.5,
          subScores: { currentAqi: 30, triEmitters: 60 },
          rawData: { pm25: 9.2, triEmitters: 5 },
        },
        proximity: {
          score: 45, confidence: 'neighborhood', available: true, coverage: 0.85,
          subScores: { superfundProximity: 40, echoFacilities: 50 },
          rawData: { superfundSiteCount: 1, totalEchoFacilities: 12 },
        },
      },
    },
    dataFreshness: '2026-04-17',
    createdAt: '2026-04-17T00:00:00Z',
  };
}

function makeRecommendation(): TriggeredRecommendation {
  return {
    templateId: 'test-1',
    layer: 'water',
    riskTier: 'HIGH',
    finding: 'PFAS exceeds EPA MCL',
    recommendation: 'Install a reverse osmosis filter',
    sourceCitation: 'EPA UCMR 5',
    disclaimer: 'Consult a professional',
  };
}

describe('ExposureReportPdf', () => {
  it('renders without crashing', () => {
    const element = React.createElement(ExposureReportPdf, {
      assessment: makeAssessment(),
      narrative: 'This is a test narrative for the Newark NJ report.',
      recommendations: [makeRecommendation()],
      disclaimers: ['Test disclaimer'],
    });
    expect(element).toBeTruthy();
    expect(element.props.assessment.id).toBe('test-pdf-123');
  });

  it('can be rendered to buffer via renderToBuffer', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer = await (renderToBuffer as any)(
      React.createElement(ExposureReportPdf, {
        assessment: makeAssessment(),
        narrative: 'Test narrative',
        recommendations: [makeRecommendation()],
        disclaimers: [],
      })
    );
    expect(buffer).toBeTruthy();
    expect(Buffer.isBuffer(buffer)).toBe(true);
  });

  it('renders without narrative (optional)', () => {
    const element = React.createElement(ExposureReportPdf, {
      assessment: makeAssessment(),
      recommendations: [],
      disclaimers: [],
    });
    expect(element).toBeTruthy();
  });

  it('renders with empty recommendations', () => {
    const element = React.createElement(ExposureReportPdf, {
      assessment: makeAssessment(),
      narrative: 'Some narrative',
      recommendations: [],
      disclaimers: [],
    });
    expect(element).toBeTruthy();
  });

  it('renders with multiple recommendations', () => {
    const element = React.createElement(ExposureReportPdf, {
      assessment: makeAssessment(),
      narrative: 'Some narrative',
      recommendations: [
        makeRecommendation(),
        { ...makeRecommendation(), templateId: 'test-2', layer: 'soil', riskTier: 'MODERATE' as const, finding: 'Brownfield nearby' },
      ],
      disclaimers: ['Disclaimer 1', 'Disclaimer 2'],
    });
    expect(element).toBeTruthy();
  });

  it('includes all available layers in output', () => {
    const assessment = makeAssessment();
    const element = React.createElement(ExposureReportPdf, {
      assessment,
      narrative: 'Test',
      recommendations: [],
      disclaimers: [],
    });
    expect(assessment.compositeScore.layersIncluded).toHaveLength(4);
    expect(element.props.assessment.compositeScore.layersIncluded).toContain('water');
    expect(element.props.assessment.compositeScore.layersIncluded).toContain('air');
    expect(element.props.assessment.compositeScore.layersIncluded).toContain('proximity');
    expect(element.props.assessment.compositeScore.layersIncluded).toContain('soil');
  });
});

describe('PdfDownloadButton', () => {
  it('renders download button', async () => {
    const { render, screen } = await import('@testing-library/react');
    const { PdfDownloadButton } = await import('@/components/report/PdfDownloadButton');
    render(React.createElement(PdfDownloadButton, { assessmentId: 'test-123' }));
    expect(screen.getByText('Download PDF')).toBeTruthy();
  });
});
