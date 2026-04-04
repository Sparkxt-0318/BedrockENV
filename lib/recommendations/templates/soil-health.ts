import { RecommendationTemplate } from '../types';

export const soilHealthTemplates: RecommendationTemplate[] = [
  {
    id: 'SOIL-HEALTH-001',
    layer: 'soil',
    triggerField: 'soil_organic_matter_pct',
    triggerOperator: '<',
    triggerValue: 1.0,
    riskTier: 'ELEVATED',
    finding:
      'Soil survey data for your area indicates low organic matter content ({om_pct}%), suggesting degraded soil health. Combined with {soil_texture} soil texture and {drainage_class} drainage, this may affect water infiltration and nutrient availability.',
    recommendation:
      'Low organic matter in soil can be improved through composting, mulching, and cover cropping. If you maintain a garden, consider adding organic amendments. For agricultural land, consult your local USDA Natural Resources Conservation Service (NRCS) office for soil health improvement programs.',
    sourceCitation:
      'USDA SSURGO Soil Survey, map unit {soil_mukey}.',
    disclaimer:
      'Soil survey data represents the dominant soil type in this map unit (typically 1–100 acres) and may not reflect exact conditions at your specific property.',
  },
  {
    id: 'SOIL-FLOOD-001',
    layer: 'soil',
    triggerField: 'flood_contamination_risk',
    triggerOperator: '==',
    triggerValue: 'HIGH',
    riskTier: 'HIGH',
    finding:
      'Your property is in FEMA Flood Zone {flood_zone} and is within {distance} miles of {contamination_source}. Flooding can mobilize contaminants from nearby sites into residential areas, posing a compounded exposure risk.',
    recommendation:
      'Properties in flood zones near contamination sources face elevated risk during flood events. Consider soil testing after any flood event. Maintain awareness of your flood insurance options through the National Flood Insurance Program (NFIP). Avoid contact with floodwater, which may contain mobilized contaminants.',
    sourceCitation:
      'FEMA NFHL flood zone data; EPA {flood_source_type} data.',
    disclaimer:
      'This assessment combines flood zone and contamination proximity data to identify potential compounded risk. Actual contamination transport during floods depends on many site-specific factors.',
  },
];
