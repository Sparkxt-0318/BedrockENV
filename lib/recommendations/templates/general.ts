import { RecommendationTemplate } from '../types';

export const generalTemplates: RecommendationTemplate[] = [
  {
    id: 'GEN-TESTING-001',
    layer: 'general',
    triggerField: 'composite_score',
    triggerOperator: '>',
    triggerValue: 50,
    riskTier: 'ELEVATED',
    finding:
      'Your composite Environmental Exposure Score of {composite_score}/100 indicates elevated cumulative environmental exposure burden across the data layers analyzed.',
    recommendation:
      'Given the elevated cumulative exposure indicators, consider professional environmental testing for your property. A certified environmental consultant can perform site-specific soil and water testing to confirm or rule out the exposure concerns identified from federal data. Contact your state environmental agency for a list of certified testing laboratories.',
    sourceCitation:
      'Bedrock composite scoring methodology using EPA, USDA, FEMA, NASA, and Census data.',
    disclaimer:
      'The composite score aggregates multiple federal data sources at varying spatial resolutions. It is an indicator of cumulative exposure burden, not a definitive assessment of property-level contamination.',
  },
];
