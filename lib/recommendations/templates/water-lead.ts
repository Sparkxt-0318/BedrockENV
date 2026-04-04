import { RecommendationTemplate } from '../types';

export const waterLeadTemplates: RecommendationTemplate[] = [
  {
    id: 'LEAD-HIGH-001',
    layer: 'water',
    triggerField: 'pct_housing_pre_1950',
    triggerOperator: '>',
    triggerValue: 30,
    riskTier: 'HIGH',
    finding:
      'Neighborhood-level census data indicates that {pct_pre1950}% of housing in your census block group was built before 1950, when lead service lines and lead-based plumbing solder were commonly used. This is significantly above the national average.',
    recommendation:
      'EPA recommends running cold water for 30 seconds to 2 minutes before using it for drinking or cooking if your home has been sitting for several hours. NSF 53-certified water filters designed for lead removal can reduce lead levels. For definitive testing, contact your water utility about free or subsidized lead testing programs under the EPA Lead and Copper Rule Revisions (LCRR).',
    sourceCitation:
      'U.S. Census Bureau ACS 2022, Table B25034; EPA Lead and Copper Rule.',
    disclaimer:
      'Housing age is a statistical proxy for lead plumbing risk, not a definitive indicator. Only physical inspection or water testing can confirm the presence of lead in your specific plumbing.',
  },
  {
    id: 'LEAD-ELEV-001',
    layer: 'water',
    triggerField: 'pct_housing_pre_1986',
    triggerOperator: '>',
    triggerValue: 50,
    riskTier: 'ELEVATED',
    finding:
      'Neighborhood-level census data indicates that {pct_pre1950}% of housing in your census block group was built before 1986, when lead solder was commonly used in plumbing connections.',
    recommendation:
      'Consider using NSF 53-certified water filters for drinking and cooking water. Contact your water utility to learn if your service line has been inventoried under the EPA Lead and Copper Rule Revisions.',
    sourceCitation:
      'U.S. Census Bureau ACS 2022, Table B25034; EPA Lead and Copper Rule Revisions (LCRR).',
    disclaimer:
      'Housing age is a statistical proxy for lead plumbing risk at the block group level, not a property-specific assessment.',
  },
];
