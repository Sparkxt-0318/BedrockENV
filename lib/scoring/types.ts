import { ExposureLayer } from '@/types/exposure';

export interface ScoringInput {
  // PFAS
  pfasMaxIndividual: number;
  pfasAnyDetection: boolean;
  pfasTotalConcentration: number;

  // Lead
  pctHousingPre1950: number;
  pctHousingPre1986: number;

  // Violations
  healthViolations5yr: number;
  activeViolations: number;
  totalViolations10yr: number;
}

export interface ScoringResult {
  score: number; // 0–100
  subScores: Record<string, number>;
  details: Record<string, string>;
}

export type LayerWeights = Partial<Record<ExposureLayer, number>>;
