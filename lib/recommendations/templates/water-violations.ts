import { RecommendationTemplate } from '../types';

export const waterViolationTemplates: RecommendationTemplate[] = [
  {
    id: 'VIOL-HIGH-001',
    layer: 'water',
    triggerField: 'health_violations_5yr',
    triggerOperator: '>',
    triggerValue: 3,
    riskTier: 'HIGH',
    finding:
      'Your water system ({water_system_name}) has {violation_count} health-based violations recorded in the past 5 years, including violations for {violation_contaminants}.',
    recommendation:
      'Frequent health-based violations may indicate ongoing challenges in your water system\'s treatment capacity. Consider point-of-use filtration appropriate to the contaminants cited. Review your water utility\'s annual Consumer Confidence Report (CCR), which is required to be published by July 1 each year.',
    sourceCitation:
      'EPA Safe Drinking Water Information System (SDWIS).',
    disclaimer:
      'Violation data reflects water system-level compliance, not the quality of water at your specific tap.',
  },
  {
    id: 'VIOL-MOD-001',
    layer: 'water',
    triggerField: 'health_violations_5yr',
    triggerOperator: '>',
    triggerValue: 0,
    riskTier: 'MODERATE',
    finding:
      'Your water system ({water_system_name}) has {violation_count} health-based violation(s) in the past 5 years.',
    recommendation:
      'Review your water utility\'s annual Consumer Confidence Report (CCR) for details on detected contaminants and treatment steps. The CCR is required to be published by July 1 each year and is available from your water utility or at the EPA\'s CCR search page.',
    sourceCitation:
      'EPA Safe Drinking Water Information System (SDWIS).',
    disclaimer:
      'Violation data reflects water system-level compliance, not the quality of water at your specific tap.',
  },
];
