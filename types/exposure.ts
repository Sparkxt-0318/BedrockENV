import { DataResolution } from './resolution';

export type RiskTier = 'LOW' | 'MODERATE' | 'ELEVATED' | 'HIGH';

export type ExposureLayer = 'water' | 'soil' | 'air' | 'proximity' | 'ej';

export interface LayerScore {
  score: number; // 0–100
  confidence: DataResolution;
  available: boolean;
  subScores: Record<string, number>;
  rawData: Record<string, unknown>;
}

export interface CompositeScore {
  score: number; // 0–100
  confidence: 'high' | 'moderate' | 'low';
  layersIncluded: ExposureLayer[];
  layerScores: Partial<Record<ExposureLayer, LayerScore>>;
}

export interface GeocodedAddress {
  raw: string;
  normalized: string;
  latitude: number;
  longitude: number;
  fipsState: string;
  fipsCounty: string;
  censusTract: string;
  censusBlockGroup: string;
  waterSystemId?: string;
  waterSystemName?: string;
}

export interface ExposureAssessment {
  id: string;
  address: GeocodedAddress;
  compositeScore: CompositeScore;
  waterData?: WaterLayerData;
  soilData?: SoilLayerData;
  dataFreshness: string; // ISO date
  createdAt: string;
}

export interface WaterLayerData {
  pfas: PfasData | null;
  violations: WaterViolation[];
  leadRisk: LeadRiskData | null;
  systemName: string;
  systemId: string;
}

export interface PfasData {
  systemId: string;
  systemName: string;
  analytes: PfasAnalyte[];
  maxIndividual: number; // highest single PFAS analyte in ppt
  totalPfas: number;
  exceedsMcl: boolean;
  testingPeriod: string;
}

export interface PfasAnalyte {
  name: string;
  concentration: number; // ppt
  mcl: number; // EPA MCL in ppt
  exceedsMcl: boolean;
}

export interface WaterViolation {
  type: string;
  contaminant: string;
  beginDate: string;
  endDate?: string;
  status: string;
  isHealthBased: boolean;
}

export interface LeadRiskData {
  pctPreA1950: number;
  pctPre1986: number;
  riskTier: RiskTier;
  resolution: DataResolution;
}

export interface SoilLayerData {
  ssurgo: SsurgoData | null;
  brownfields: BrownfieldSite[];
  floodZone: FloodZoneData | null;
  moistureData: SoilMoistureData | null;
}

export interface SsurgoData {
  mapUnitName: string;
  mapUnitKey: string;
  components: SoilComponent[];
  dominantTexture: string;
  phRange: [number, number];
  organicMatterPct: number;
  drainageClass: string;
  cec: number; // cation exchange capacity
  ksat: number; // saturated hydraulic conductivity
}

export interface SoilComponent {
  name: string;
  percentage: number;
  horizons: SoilHorizon[];
}

export interface SoilHorizon {
  name: string;
  sand: number;
  silt: number;
  clay: number;
  ph: number;
  organicMatter: number;
  cec: number;
  ksat: number;
}

export interface BrownfieldSite {
  name: string;
  siteId: string;
  distance: number; // miles
  direction: string; // N, NE, E, etc.
  contaminantTypes: string[];
  cleanupStatus: string;
  latitude: number;
  longitude: number;
}

export interface FloodZoneData {
  zone: string;
  zoneDescription: string;
  isSpecialFloodHazardArea: boolean;
  riskLevel: RiskTier;
}

export interface SoilMoistureData {
  surfaceMoisture: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  precipitationAvgMm: number;
  resolution: DataResolution;
}
