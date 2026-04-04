import { RecommendationTemplate } from '../types';

export const waterPfasTemplates: RecommendationTemplate[] = [
  {
    id: 'PFAS-HIGH-001',
    layer: 'water',
    triggerField: 'pfas_max_individual',
    triggerOperator: '>',
    triggerValue: 4,
    riskTier: 'HIGH',
    finding:
      'Your water system ({water_system_name}) reported {pfas_analyte} at {pfas_value} ppt in EPA UCMR 5 testing, which exceeds the EPA Maximum Contaminant Level of 4 ppt established in April 2024.',
    recommendation:
      'NSF/ANSI 53 or 58 certified point-of-use filtration systems (activated carbon or reverse osmosis) have been shown to reduce PFAS concentrations in drinking water. Estimated cost for point-of-use systems: $150–$400. For whole-house treatment, consult a certified water treatment professional. You can also contact your water utility ({water_system_name}) to ask about their PFAS mitigation plans.',
    sourceCitation:
      'EPA NPDWR for PFAS, 89 FR 32532 (April 26, 2024); EPA UCMR 5 testing data.',
    disclaimer:
      'This information is based on water-system-level EPA testing data, not tap-level testing at your specific property. Actual PFAS levels at your tap may differ. This is not a substitute for professional water testing.',
  },
  {
    id: 'PFAS-MOD-001',
    layer: 'water',
    triggerField: 'pfas_any_detection',
    triggerOperator: '==',
    triggerValue: true,
    riskTier: 'MODERATE',
    finding:
      'Your water system ({water_system_name}) had detectable levels of PFAS in EPA UCMR 5 testing ({pfas_summary}), though reported concentrations were below current EPA Maximum Contaminant Levels.',
    recommendation:
      'While below current regulatory thresholds, some health researchers have raised concerns about cumulative PFAS exposure at any detectable level. Point-of-use activated carbon filters can further reduce PFAS in drinking water. If you would like certainty about your specific tap water, consider an EPA-certified laboratory test (typically $200–$400).',
    sourceCitation:
      'EPA UCMR 5 testing data; NIEHS PFAS health research.',
    disclaimer:
      'PFAS below EPA MCLs does not necessarily indicate a health risk. Science on low-level PFAS exposure is evolving.',
  },
];
