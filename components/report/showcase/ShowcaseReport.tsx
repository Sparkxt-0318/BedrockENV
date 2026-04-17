'use client';

import { useState, useCallback } from 'react';
import type { ExposureAssessment, ExposureLayer, LayerScore } from '@/types/exposure';
import type { TriggeredRecommendation } from '@/lib/recommendations/types';
import { ShowcaseIntro } from './ShowcaseIntro';
import { LayerChapterShowcase } from './LayerChapterShowcase';
import { StickyScoreSidebar } from './StickyScoreSidebar';
import { RecommendationsShowcase } from './RecommendationsShowcase';
import { DataCoverageBreakdown } from './DataCoverageBreakdown';
import { MethodologyFootnotes } from './MethodologyFootnotes';
import { StickyColumn } from '@/components/ui/StickyColumn';
import { DisclaimerBanner } from '@/components/report/DisclaimerBanner';
import { PdfDownloadButton } from '@/components/report/PdfDownloadButton';

interface ShowcaseReportProps {
  assessment: ExposureAssessment;
  recommendations: TriggeredRecommendation[];
}

function extractLayerChapterData(
  layer: ExposureLayer,
  ls: LayerScore,
  assessment: ExposureAssessment
): {
  title: string;
  heroStat: { value: number; suffix?: string; label: string };
  dataPoints: { label: string; value: string | number; source: string; agency: string }[];
} {
  const raw = ls.rawData as Record<string, unknown>;

  switch (layer) {
    case 'water': {
      const pfasMax = raw.pfasMaxPpt as number | null;
      const violationCount = raw.violationCount as number;
      const leadPct = raw.leadPctPre1986 as number | null;
      const systemName = raw.waterSystemName as string | null;
      return {
        title: 'Water Contamination',
        heroStat: { value: ls.score, label: 'Water exposure sub-score' },
        dataPoints: [
          ...(pfasMax !== null ? [{
            label: 'Peak PFAS concentration detected',
            value: `${pfasMax} ppt`,
            source: raw.pfasSource === 'ucmr5' ? 'UCMR 5' : 'WQP',
            agency: 'EPA',
          }] : []),
          {
            label: 'SDWIS violations on record',
            value: violationCount,
            source: 'SDWIS',
            agency: 'EPA',
          },
          ...(leadPct !== null ? [{
            label: 'Housing built before 1986 (lead risk proxy)',
            value: `${leadPct}%`,
            source: 'ACS B25034',
            agency: 'Census',
          }] : []),
          ...(systemName ? [{
            label: 'Water system',
            value: systemName,
            source: 'SDWIS',
            agency: 'EPA',
          }] : []),
        ],
      };
    }

    case 'air': {
      const pm25 = raw.pm25 as number | null;
      const triCount = raw.triEmitters as number;
      const isNonattainment = raw.nonattainment as boolean | null;
      const pollutants = raw.nonattainmentPollutants as string[];
      return {
        title: 'Air Quality',
        heroStat: { value: ls.score, label: 'Air quality sub-score' },
        dataPoints: [
          ...(pm25 !== null ? [{
            label: 'PM2.5 annual mean (EPA NAAQS: 9 µg/m³)',
            value: `${pm25.toFixed(1)} µg/m³`,
            source: 'AQS / OpenAQ',
            agency: 'EPA',
          }] : []),
          {
            label: 'TRI air emitters within 3 mi',
            value: triCount ?? 0,
            source: 'ECHO',
            agency: 'EPA',
          },
          {
            label: 'Nonattainment status',
            value: isNonattainment ? `Yes — ${pollutants?.join(', ')}` : 'Attainment',
            source: 'Green Book',
            agency: 'EPA',
          },
        ],
      };
    }

    case 'proximity': {
      const sfCount = raw.superfundSiteCount as number;
      const closestSf = raw.closestSuperfundKm as number | null;
      const echoTotal = raw.totalEchoFacilities as number;
      const sncCount = raw.sncCount as number;
      return {
        title: 'Toxic Proximity',
        heroStat: { value: ls.score, label: 'Proximity sub-score' },
        dataPoints: [
          {
            label: 'Superfund NPL sites within 5 mi',
            value: sfCount,
            source: 'FRS / SEMS',
            agency: 'EPA',
          },
          ...(closestSf !== null ? [{
            label: 'Nearest Superfund site',
            value: `${closestSf.toFixed(1)} km`,
            source: 'FRS',
            agency: 'EPA',
          }] : []),
          {
            label: 'Regulated facilities within radius',
            value: echoTotal ?? 0,
            source: 'ECHO',
            agency: 'EPA',
          },
          {
            label: 'Facilities in significant non-compliance',
            value: sncCount ?? 0,
            source: 'ECHO',
            agency: 'EPA',
          },
        ],
      };
    }

    case 'soil': {
      const brownfieldCount = assessment.soilData?.brownfields?.length ?? 0;
      const ssurgo = assessment.soilData?.ssurgo;
      const floodZone = assessment.soilData?.floodZone;
      return {
        title: 'Soil & Land',
        heroStat: { value: ls.score, label: 'Soil & land sub-score' },
        dataPoints: [
          ...(ssurgo ? [{
            label: 'Dominant soil texture',
            value: ssurgo.dominantTexture || 'Unknown',
            source: 'SSURGO',
            agency: 'USDA',
          }] : []),
          {
            label: 'Brownfield sites within 2 mi',
            value: brownfieldCount,
            source: 'Brownfields',
            agency: 'EPA',
          },
          ...(floodZone ? [{
            label: 'FEMA flood zone',
            value: `Zone ${floodZone.zone}${floodZone.isSpecialFloodHazardArea ? ' (SFHA)' : ''}`,
            source: 'NFHL',
            agency: 'FEMA',
          }] : []),
          ...(ssurgo?.phRange ? [{
            label: 'Soil pH range',
            value: `${ssurgo.phRange[0]}–${ssurgo.phRange[1]}`,
            source: 'SSURGO',
            agency: 'USDA',
          }] : []),
        ],
      };
    }

    case 'ej': {
      const ejscreen = assessment.ejData?.ejscreen;
      const svi = assessment.ejData?.svi;
      return {
        title: 'Environmental Justice',
        heroStat: { value: ls.score, label: 'EJ burden sub-score' },
        dataPoints: [
          ...(ejscreen?.ejIndex != null ? [{
            label: 'EJScreen EJ Index percentile',
            value: `${Math.round(ejscreen.ejIndex)}th`,
            source: 'EJScreen',
            agency: 'EPA',
          }] : []),
          ...(svi?.overallSvi != null ? [{
            label: 'CDC Social Vulnerability Index',
            value: (svi.overallSvi * 100).toFixed(0) + 'th pctile',
            source: 'SVI',
            agency: 'CDC',
          }] : []),
          ...(ejscreen?.demographicIndex != null ? [{
            label: 'Demographic Index percentile',
            value: `${Math.round(ejscreen.demographicIndex)}th`,
            source: 'EJScreen',
            agency: 'EPA',
          }] : []),
        ],
      };
    }
  }
}

export function ShowcaseReport({ assessment, recommendations }: ShowcaseReportProps) {
  const [activeLayer, setActiveLayer] = useState<ExposureLayer | null>(null);
  const { compositeScore } = assessment;
  const layerScores = compositeScore.layerScores;

  const handleLayerVisible = useCallback((layer: ExposureLayer) => {
    setActiveLayer(layer);
  }, []);

  const layerChapters = compositeScore.layersIncluded
    .map((layer) => {
      const ls = layerScores[layer];
      if (!ls || !ls.available) return null;
      const data = extractLayerChapterData(layer, ls, assessment);
      return { layer, ls, ...data };
    })
    .filter(Boolean) as Array<{
      layer: ExposureLayer;
      ls: LayerScore;
      title: string;
      heroStat: { value: number; suffix?: string; label: string };
      dataPoints: { label: string; value: string | number; source: string; agency: string }[];
    }>;

  const leftContent = (
    <>
      {layerChapters.map((ch) => (
        <LayerChapterShowcase
          key={ch.layer}
          layer={ch.layer}
          title={ch.title}
          layerScore={ch.ls}
          heroStat={ch.heroStat}
          dataPoints={ch.dataPoints}
          onVisible={handleLayerVisible}
        />
      ))}
    </>
  );

  const rightContent = (
    <StickyScoreSidebar
      compositeScore={compositeScore}
      activeLayer={activeLayer}
      layerScores={layerScores as Partial<Record<ExposureLayer, LayerScore>>}
    />
  );

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
      <ShowcaseIntro assessment={assessment} />

      <StickyColumn left={leftContent} right={rightContent} />

      <div className="max-w-3xl">
        <RecommendationsShowcase recommendations={recommendations} />
        <DataCoverageBreakdown compositeScore={compositeScore} />
        <PdfDownloadButton assessmentId={assessment.id} className="py-8 border-t border-border" />
        <MethodologyFootnotes scoringVersion={compositeScore.scoringVersion} />
        <DisclaimerBanner />
      </div>
    </div>
  );
}
