export interface NarrativeRequest {
  address: string;
  compositeScore: number;
  confidence: string;
  waterScore: number | null;
  soilScore: number | null;
  waterSummary: string;
  soilSummary: string;
  layersIncluded: string[];
}

export interface NarrativeResponse {
  summary: string;
  error: string | null;
}
