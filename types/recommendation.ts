import { ExposureLayer, RiskTier } from './exposure';

export interface RecommendationTemplate {
  id: string;
  layer: ExposureLayer | 'general';
  triggerField: string;
  triggerOperator: '>' | '<' | '==' | '>=' | '<=';
  triggerValue: number | string | boolean;
  riskTier: RiskTier;
  finding: string; // Template with {placeholders}
  recommendation: string;
  sourceCitation: string;
  disclaimer: string;
}

export interface TriggeredRecommendation {
  templateId: string;
  layer: ExposureLayer | 'general';
  riskTier: RiskTier;
  finding: string; // Hydrated with actual values
  recommendation: string;
  sourceCitation: string;
  disclaimer: string;
}
