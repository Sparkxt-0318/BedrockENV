export const STANDARD_DISCLAIMERS = {
  general:
    'Bedrock aggregates publicly available environmental data for informational purposes. This is not a substitute for professional environmental testing or medical advice.',
  water:
    'Water system data reflects utility-level testing, not tap-level conditions at individual properties. Actual contaminant levels at your tap may differ.',
  soil:
    'Soil survey data represents dominant soil types within map units (typically 1–100 acres) and may not reflect exact conditions at a specific property.',
  brownfield:
    'Proximity to a contamination site does not confirm contamination at your specific property. Soil contamination can vary significantly over short distances.',
  lead:
    'Housing age is a statistical proxy for lead plumbing risk at the census block group level, not a property-specific assessment.',
  flood:
    'Flood zone designations indicate statistical probability of flooding, not a guarantee of future flooding or its absence.',
} as const;

export function getApplicableDisclaimers(layers: string[]): string[] {
  const disclaimers: string[] = [STANDARD_DISCLAIMERS.general];
  if (layers.includes('water')) disclaimers.push(STANDARD_DISCLAIMERS.water);
  if (layers.includes('soil')) disclaimers.push(STANDARD_DISCLAIMERS.soil);
  return disclaimers;
}
