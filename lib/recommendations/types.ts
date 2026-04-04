import { ExposureLayer, RiskTier } from '@/types/exposure';

export interface RecommendationTemplate {
  id: string;
  layer: ExposureLayer | 'general';
  triggerField: string;
  triggerOperator: '>' | '<' | '==' | '>=' | '<=';
  triggerValue: number | string | boolean;
  riskTier: RiskTier;
  finding: string;
  recommendation: string;
  sourceCitation: string;
  disclaimer: string;
}

export interface TriggeredRecommendation {
  templateId: string;
  layer: ExposureLayer | 'general';
  riskTier: RiskTier;
  finding: string;
  recommendation: string;
  sourceCitation: string;
  disclaimer: string;
}

export interface RecommendationContext {
  // Water fields
  pfas_max_individual?: number;
  pfas_any_detection?: boolean;
  pfas_total?: number;
  pfas_analyte?: string;
  pfas_value?: number;
  pfas_summary?: string;
  water_system_name?: string;
  water_system_id?: string;
  pct_housing_pre_1950?: number;
  pct_housing_pre_1986?: number;
  health_violations_5yr?: number;
  violation_count?: number;
  violation_contaminants?: string;

  // Soil fields
  nearest_brownfield_miles?: number;
  brownfield_site_name?: string;
  brownfield_contaminant_types?: string;
  brownfield_cleanup_status?: string;
  brownfield_site_id?: string;
  soil_organic_matter_pct?: number;
  soil_texture?: string;
  drainage_class?: string;
  soil_mukey?: string;
  flood_zone?: string;
  flood_contamination_risk?: string;
  flood_contamination_source?: string;
  flood_contamination_distance?: number;
  flood_source_type?: string;

  // Generic
  om_pct?: string;
  pct_pre1950?: string;
  distance?: string;
  site_name?: string;
  contaminant_types?: string;
  cleanup_status?: string;
  site_id?: string;
  contamination_source?: string;
  composite_score?: number;
}
