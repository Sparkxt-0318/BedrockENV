import { ExposureAssessment } from '@/types/exposure';

/**
 * Generates JSON-LD structured data for an exposure report.
 * Uses Schema.org Dataset and GovernmentService types.
 */
export function ReportStructuredData({ assessment }: { assessment: ExposureAssessment }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: `Environmental Exposure Report — ${assessment.address.normalized}`,
    description: `Environmental exposure assessment for ${assessment.address.normalized}, scoring ${assessment.compositeScore.score}/100 based on water contamination, soil health, and proximity to hazardous sites.`,
    url: typeof window !== 'undefined' ? window.location.href : undefined,
    creator: {
      '@type': 'Organization',
      name: 'Bedrock',
      url: 'https://getbedrock.com',
    },
    dateCreated: assessment.createdAt,
    spatialCoverage: {
      '@type': 'Place',
      geo: {
        '@type': 'GeoCoordinates',
        latitude: assessment.address.latitude,
        longitude: assessment.address.longitude,
      },
      address: {
        '@type': 'PostalAddress',
        streetAddress: assessment.address.normalized,
      },
    },
    distribution: [
      {
        '@type': 'DataDownload',
        encodingFormat: 'application/json',
        contentUrl: typeof window !== 'undefined' ? window.location.href : undefined,
      },
    ],
    isBasedOn: [
      { '@type': 'GovernmentService', name: 'EPA UCMR 5 — PFAS Testing', serviceOperator: { '@type': 'GovernmentOrganization', name: 'EPA' } },
      { '@type': 'GovernmentService', name: 'EPA SDWIS — Drinking Water Violations', serviceOperator: { '@type': 'GovernmentOrganization', name: 'EPA' } },
      { '@type': 'GovernmentService', name: 'USDA SSURGO — Soil Survey', serviceOperator: { '@type': 'GovernmentOrganization', name: 'USDA' } },
      { '@type': 'GovernmentService', name: 'FEMA NFHL — Flood Zones', serviceOperator: { '@type': 'GovernmentOrganization', name: 'FEMA' } },
      { '@type': 'GovernmentService', name: 'NASA POWER — Precipitation Data', serviceOperator: { '@type': 'GovernmentOrganization', name: 'NASA' } },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
