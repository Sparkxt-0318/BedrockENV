import { RecommendationTemplate } from '../types';

export const soilContaminationTemplates: RecommendationTemplate[] = [
  {
    id: 'SOIL-BROWN-001',
    layer: 'soil',
    triggerField: 'nearest_brownfield_miles',
    triggerOperator: '<',
    triggerValue: 0.5,
    riskTier: 'HIGH',
    finding:
      'Your property is {distance} miles from {site_name}, a site in EPA\'s Brownfields database with reported contamination ({contaminant_types}). Cleanup status: {cleanup_status}.',
    recommendation:
      'For properties near brownfield sites, EPA recommends avoiding direct contact with bare soil and considering soil testing before gardening or allowing children to play in bare soil. Raised garden beds with imported soil are a common mitigation approach. Contact your state environmental agency for site-specific information.',
    sourceCitation:
      'EPA Brownfields Program, site ID {site_id}.',
    disclaimer:
      'Proximity to a brownfield site does not confirm contamination at your specific property. Soil contamination can vary over short distances.',
  },
  {
    id: 'SOIL-BROWN-002',
    layer: 'soil',
    triggerField: 'nearest_brownfield_miles',
    triggerOperator: '<',
    triggerValue: 1.0,
    riskTier: 'ELEVATED',
    finding:
      'Your property is {distance} miles from {site_name}, a brownfield site with reported contamination ({contaminant_types}).',
    recommendation:
      'Consider soil testing if you plan to garden or if children regularly play in bare soil. Your local Cooperative Extension office can recommend accredited soil testing laboratories.',
    sourceCitation:
      'EPA Brownfields Program, site ID {site_id}.',
    disclaimer:
      'Proximity to a brownfield site does not confirm contamination at your specific property.',
  },
];
