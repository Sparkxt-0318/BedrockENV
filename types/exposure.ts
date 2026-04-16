import { DataResolution } from './resolution';

export type RiskTier = 'LOW' | 'MODERATE' | 'ELEVATED' | 'HIGH';

export type ExposureLayer = 'water' | 'soil' | 'air' | 'proximity' | 'ej';

export interface LayerScore {
  score: number; // 0–100
  confidence: DataResolution;
  available: boolean;
  /**
   * Fraction (0..1) of this layer's scoring model that was actually
   * populated for this location. 1.0 means every sub-component we care
   * about returned real data; 0.0 means nothing useful landed and the
   * layer is effectively empty.
   */
  coverage: number;
  subScores: Record<string, number>;
  rawData: Record<string, unknown>;
}

export type CompositeConfidence = 'high' | 'moderate' | 'low' | 'insufficient';

export interface CompositeScore {
  score: number; // 0–100 (still emitted when insufficient — gated by `sufficient`)
  confidence: CompositeConfidence;
  /**
   * Whether the composite has enough coverage to publish a number as
   * the headline. When `false`, the UI should show "Insufficient data
   * for full scoring" and surface only the per-layer sub-scores we do
   * have, alongside the `coverage` fraction.
   */
  sufficient: boolean;
  /** 0..1 — reweighted-weighted mean of included layers' coverages. */
  coverage: number;
  /** Snapshot of the scoring pipeline version this composite was built with. */
  scoringVersion: number;
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
  /**
   * Which geocoder produced this result.
   * 'census' = Census Bureau (full FIPS + tract data available).
   * 'mapbox' = Mapbox fallback (fipsCounty, censusTract, censusBlockGroup are empty).
   * Undefined for legacy cached records that pre-date this field.
   */
  source?: 'census' | 'mapbox';
  waterSystemId?: string;
  waterSystemName?: string;
}

export interface ExposureAssessment {
  id: string;
  address: GeocodedAddress;
  compositeScore: CompositeScore;
  waterData?: WaterLayerData;
  soilData?: SoilLayerData;
  airData?: AirLayerData;
  dataFreshness: string; // ISO date
  createdAt: string;
}

export interface WaterLayerData {
  pfas: PfasData | null;
  /** Ambient PFAS monitoring from USGS WQP (bbox-based, not tied to a PWSID). */
  wqpPfas: WqpPfasData | null;
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
  /** Regulated facilities from EPA ECHO within search radius. */
  echoFacilities: EchoData | null;
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
  /**
   * Coverage classification:
   *  - 'mapped'   — survey returned usable soil chemistry
   *  - 'partial'  — mapunit intersected but chemistry fields mostly null
   *                (e.g. 'Urban land' or 'Water' component types)
   *  - 'unmapped' — point falls outside any SSURGO survey polygon
   */
  coverage: 'mapped' | 'partial' | 'unmapped';
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
  /** Highest-hazard zone among all intersecting features (the "headline"). */
  zone: string;
  zoneDescription: string;
  isSpecialFloodHazardArea: boolean;
  riskLevel: RiskTier;
  /** Base flood elevation in feet (NAVD88); null when not established. */
  staticBfe: number | null;
  /**
   * Every flood-hazard feature that intersects the query point. A single
   * parcel can sit in overlapping zones (e.g. coastal VE + AE) and the
   * scorer/recommendation engine may need the full list.
   */
  features: FloodZoneFeature[];
  /**
   * 'mapped'   — at least one NFHL feature intersected the point
   * 'unmapped' — no feature at this location (county not digitized yet
   *              or outside NFHL coverage). This is distinct from a
   *              genuine Zone X (minimal flood hazard).
   */
  coverage: 'mapped' | 'unmapped';
}

export interface FloodZoneFeature {
  /** Raw FLD_ZONE from NFHL (e.g. "X", "AE", "VE"). */
  zone: string;
  subtype: string | null;
  sfha: boolean;
  staticBfe: number | null;
  description: string;
  riskLevel: RiskTier;
}

export interface SoilMoistureData {
  surfaceMoisture: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  /** Mean annual precipitation in mm (sum of monthly means × 12). */
  precipitationAvgMm: number;
  /** Mean annual temperature in °C (averaged across the requested window). */
  meanAnnualTempC: number;
  /**
   * De Martonne aridity index = P / (T + 10). Diagnostic only — POWER is a
   * ~50 km reanalysis cell so this is not a property-level signal.
   * < 10 arid, 10–20 semi-arid, 20–24 dry subhumid, 24–28 humid, > 28 very humid.
   * null when the temperature floor would produce a non-physical divisor.
   */
  aridityIndex: number | null;
  /** Fraction of requested months that came back as fill values (-999). */
  fillFraction: number;
  resolution: DataResolution;
}

// ---------------------------------------------------------------------------
// WQP — USGS Water Quality Portal detections (bbox-based PFAS monitoring)
// ---------------------------------------------------------------------------

export interface WqpDetection {
  /** Characteristic name from WQP (e.g. "Perfluorooctanoic acid"). */
  characteristicName: string;
  /** Measured value in the result's unit. */
  value: number;
  /** Unit string from WQP (e.g. "ug/l", "ng/l"). */
  unit: string;
  /** Value normalized to ng/L (parts per trillion). */
  valuePpt: number;
  /** Date of sampling. */
  sampleDate: string;
  /** Monitoring location identifier. */
  monitoringLocationId: string;
  /** Name of the monitoring organization. */
  organizationName: string;
}

export interface WqpPfasData {
  detections: WqpDetection[];
  /** Highest single detection in ppt across all results. */
  maxDetectionPpt: number;
  /** Number of unique monitoring locations that returned data. */
  monitoringLocationCount: number;
  /** Whether any detection exceeds the 4 ppt EPA MCL for PFOS/PFOA. */
  exceedsMcl: boolean;
}

// ---------------------------------------------------------------------------
// ECHO — EPA Enforcement and Compliance History Online (regulated facilities)
// ---------------------------------------------------------------------------

export interface EchoFacility {
  /** EPA Registry ID. */
  registryId: string;
  /** Facility name. */
  name: string;
  /** Distance from query point in miles. */
  distance: number;
  /** Cardinal direction from query point. */
  direction: string;
  /** Latitude of facility. */
  latitude: number;
  /** Longitude of facility. */
  longitude: number;
  /** Programs this facility is regulated under (e.g. "CWA", "RCRA", "CAA"). */
  programs: string[];
  /** Current compliance status. */
  complianceStatus: string;
  /** Whether the facility is currently in significant non-compliance. */
  significantViolation: boolean;
}

export interface EchoData {
  facilities: EchoFacility[];
  /** Number of facilities with significant violations within radius. */
  significantViolationCount: number;
  /** Total regulated facilities found within radius. */
  totalCount: number;
}

// ---------------------------------------------------------------------------
// OpenAQ — Air Quality monitoring data
// ---------------------------------------------------------------------------

export interface AirQualityMeasurement {
  /** Parameter name (e.g. "pm25", "pm10", "o3", "no2", "so2", "co"). */
  parameter: string;
  /** Most recent measurement value. */
  value: number;
  /** Unit (e.g. "µg/m³", "ppm"). */
  unit: string;
  /** ISO timestamp of last measurement. */
  lastUpdated: string;
}

export interface AirQualityData {
  /** Nearest monitoring station name. */
  stationName: string;
  /** Distance to station in km. */
  distanceKm: number;
  /** Station latitude. */
  latitude: number;
  /** Station longitude. */
  longitude: number;
  measurements: AirQualityMeasurement[];
  /** Whether any PM2.5 reading exceeds WHO guideline (15 µg/m³ annual). */
  exceedsWhoGuideline: boolean;
}

// ---------------------------------------------------------------------------
// Air Layer — composite air quality data for scoring
// ---------------------------------------------------------------------------

export interface AirLayerData {
  openaq: AirQualityData | null;
  aqs: AqsData | null;
  nonattainment: NonattainmentStatus | null;
  /** ECHO facilities with TRI flag, extracted from soil layer ECHO data. */
  triEmitters: number;
}

// ---------------------------------------------------------------------------
// EPA AQS — Air Quality System historical data
// ---------------------------------------------------------------------------

export interface AqsAnnualSummary {
  parameter: string;
  parameterCode: string;
  arithmeticMean: number;
  firstMaxValue: number;
  unit: string;
  year: number;
  observationCount: number;
  monitorSiteName: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
}

export interface AqsData {
  summaries: AqsAnnualSummary[];
  pm25Annual: number | null;
  ozoneMax: number | null;
  year: number;
}

// ---------------------------------------------------------------------------
// EPA Green Book — Nonattainment area designations
// ---------------------------------------------------------------------------

export interface NonattainmentStatus {
  isNonattainment: boolean;
  pollutants: string[];
  classification: string;
  countyFips: string;
}
