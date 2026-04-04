import { ExposureLayer } from './exposure';
import { TriggeredRecommendation } from './recommendation';
import { ResolutionInfo } from './resolution';

export type ReportType = 'free' | 'consumer' | 'pro';

export interface Report {
  id: string;
  userId?: string;
  assessmentId: string;
  reportType: ReportType;
  narrativeSummary: string;
  fullNarrative?: string;
  recommendations: TriggeredRecommendation[];
  layersIncluded: ExposureLayer[];
  resolutionNotes: Record<string, ResolutionInfo>;
  disclaimers: string[];
  pdfUrl?: string;
  createdAt: string;
}
