import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';
import type { ExposureAssessment, ExposureLayer, LayerScore } from '@/types/exposure';
import type { TriggeredRecommendation } from '@/lib/recommendations/types';

const INK = '#0D1F1C';
const PAPER = '#F7F4EE';
const FOREST = '#1A3E2A';
const SIGNAL_RED = '#C23B22';
const AMBER = '#D97706';
const DATA_GRAY = '#86807A';
const BORDER = '#DDD9D2';

function scoreColor(value: number): string {
  if (value >= 70) return SIGNAL_RED;
  if (value >= 40) return AMBER;
  return FOREST;
}

const s = StyleSheet.create({
  page: { padding: 48, fontFamily: 'Helvetica', fontSize: 10, color: INK, backgroundColor: PAPER },
  coverPage: { padding: 48, fontFamily: 'Helvetica', backgroundColor: PAPER, justifyContent: 'center', alignItems: 'center' },
  h1: { fontSize: 28, fontFamily: 'Helvetica-Bold', color: INK, marginBottom: 8 },
  h2: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: INK, marginBottom: 12, marginTop: 24 },
  h3: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: INK, marginBottom: 8, marginTop: 16 },
  body: { fontSize: 10, lineHeight: 1.5, color: INK },
  muted: { fontSize: 9, color: DATA_GRAY },
  mono: { fontFamily: 'Courier', fontSize: 9, color: DATA_GRAY },
  label: { fontSize: 8, textTransform: 'uppercase', letterSpacing: 1, color: DATA_GRAY, marginBottom: 4 },
  scoreCircle: { width: 72, height: 72, borderRadius: 36, borderWidth: 3, justifyContent: 'center', alignItems: 'center' },
  scoreText: { fontSize: 28, fontFamily: 'Helvetica-Bold' },
  divider: { borderBottomWidth: 1, borderBottomColor: BORDER, marginVertical: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dataRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: BORDER },
  tag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 3, fontSize: 8, fontFamily: 'Helvetica-Bold' },
  card: { border: `1 solid ${BORDER}`, borderRadius: 4, padding: 16, marginBottom: 12 },
  footer: { position: 'absolute', bottom: 24, left: 48, right: 48, flexDirection: 'row', justifyContent: 'space-between', fontSize: 8, color: DATA_GRAY },
  coverLogo: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: FOREST, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 48 },
  coverScore: { width: 96, height: 96, borderRadius: 48, borderWidth: 4, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  coverScoreText: { fontSize: 36, fontFamily: 'Helvetica-Bold' },
  recCard: { border: `1 solid ${BORDER}`, borderRadius: 4, padding: 12, marginBottom: 8 },
  coverageBar: { height: 8, borderRadius: 4, backgroundColor: BORDER, marginVertical: 4 },
  coverageFill: { height: 8, borderRadius: 4 },
});

const LAYER_NAMES: Record<ExposureLayer, string> = {
  water: 'Water Contamination',
  air: 'Air Quality',
  proximity: 'Toxic Proximity',
  soil: 'Soil & Land',
  ej: 'Environmental Justice',
};

interface ExposureReportPdfProps {
  assessment: ExposureAssessment;
  narrative?: string;
  recommendations: TriggeredRecommendation[];
  disclaimers: string[];
}

function CoverPage({ assessment }: { assessment: ExposureAssessment }) {
  const { compositeScore, address } = assessment;
  const color = scoreColor(compositeScore.score);

  return (
    <Page size="A4" style={s.coverPage}>
      <Text style={s.coverLogo}>Bedrock</Text>
      <View style={[s.coverScore, { borderColor: color }]}>
        <Text style={[s.coverScoreText, { color }]}>{compositeScore.score}</Text>
      </View>
      <Text style={[s.label, { marginBottom: 8 }]}>Composite Exposure Score</Text>
      <Text style={s.h1}>{address.normalized || address.raw}</Text>
      <Text style={s.muted}>
        {compositeScore.layersIncluded.length} of 5 layers · Scoring v{compositeScore.scoringVersion} · {Math.round(compositeScore.coverage * 100)}% coverage
      </Text>
      <Text style={[s.muted, { marginTop: 8 }]}>
        Generated {new Date(assessment.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
      </Text>
      <View style={[s.footer, { position: 'absolute', bottom: 48 }]}>
        <Text>Bedrock Environmental Exposure Report</Text>
        <Text>Informational use only — not a substitute for professional testing</Text>
      </View>
    </Page>
  );
}

function NarrativePage({ narrative }: { narrative: string }) {
  return (
    <Page size="A4" style={s.page}>
      <Text style={s.h2}>Executive Summary</Text>
      {narrative.split('\n\n').map((para, i) => (
        <Text key={i} style={[s.body, { marginBottom: 8 }]}>{para.trim()}</Text>
      ))}
      <PageFooter />
    </Page>
  );
}

function LayerPage({ layer, ls, assessment }: { layer: ExposureLayer; ls: LayerScore; assessment: ExposureAssessment }) {
  const color = scoreColor(ls.score);
  const dataPoints = extractDataPoints(layer, ls, assessment);

  return (
    <Page size="A4" style={s.page}>
      <View style={s.row}>
        <Text style={s.h2}>{LAYER_NAMES[layer]}</Text>
        <View style={[s.scoreCircle, { borderColor: color, width: 48, height: 48, borderRadius: 24 }]}>
          <Text style={[s.scoreText, { color, fontSize: 18 }]}>{ls.score}</Text>
        </View>
      </View>

      <View style={s.row}>
        <Text style={s.muted}>Confidence: {ls.confidence}</Text>
        <Text style={s.muted}>Coverage: {Math.round(ls.coverage * 100)}%</Text>
      </View>

      <View style={s.divider} />

      {Object.entries(ls.subScores).length > 0 && (
        <>
          <Text style={s.h3}>Sub-Component Scores</Text>
          {Object.entries(ls.subScores).map(([key, val]) => (
            <View key={key} style={s.dataRow}>
              <Text style={s.body}>{formatSubScoreName(key)}</Text>
              <Text style={[s.body, { fontFamily: 'Courier', color: scoreColor(val) }]}>{val}/100</Text>
            </View>
          ))}
        </>
      )}

      {dataPoints.length > 0 && (
        <>
          <Text style={s.h3}>Key Data Points</Text>
          {dataPoints.map((dp, i) => (
            <View key={i} style={s.dataRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.body}>{dp.label}</Text>
                <Text style={s.mono}>{dp.source} · {dp.agency}</Text>
              </View>
              <Text style={[s.body, { fontFamily: 'Courier', textAlign: 'right' }]}>
                {String(dp.value)}
              </Text>
            </View>
          ))}
        </>
      )}

      <PageFooter />
    </Page>
  );
}

function RecommendationsPage({ recommendations }: { recommendations: TriggeredRecommendation[] }) {
  return (
    <Page size="A4" style={s.page}>
      <Text style={s.h2}>Recommendations</Text>

      {recommendations.length === 0 ? (
        <Text style={s.body}>No specific recommendations triggered for this location.</Text>
      ) : (
        recommendations.map((rec, i) => (
          <View key={i} style={s.recCard}>
            <View style={s.row}>
              <Text style={[s.tag, {
                backgroundColor: rec.riskTier === 'HIGH' ? '#FEE2E2' : rec.riskTier === 'ELEVATED' ? '#FEF3C7' : '#F0FDF4',
                color: rec.riskTier === 'HIGH' ? SIGNAL_RED : rec.riskTier === 'ELEVATED' ? AMBER : FOREST,
              }]}>
                {rec.riskTier}
              </Text>
              <Text style={s.mono}>{rec.layer}</Text>
            </View>
            <Text style={[s.body, { fontFamily: 'Helvetica-Bold', marginTop: 6 }]}>{rec.finding}</Text>
            <Text style={[s.body, { marginTop: 4 }]}>{rec.recommendation}</Text>
            <Text style={[s.mono, { marginTop: 4 }]}>Source: {rec.sourceCitation}</Text>
            {rec.disclaimer && (
              <Text style={[s.muted, { fontStyle: 'italic', marginTop: 4 }]}>{rec.disclaimer}</Text>
            )}
          </View>
        ))
      )}

      <PageFooter />
    </Page>
  );
}

function CoveragePage({ assessment }: { assessment: ExposureAssessment }) {
  const ALL_LAYERS: ExposureLayer[] = ['water', 'air', 'proximity', 'soil', 'ej'];

  return (
    <Page size="A4" style={s.page}>
      <Text style={s.h2}>Data Coverage Breakdown</Text>
      <Text style={[s.body, { marginBottom: 16 }]}>
        Scores are computed from 15 federal data sources using a weighted five-layer composite.
        When a layer is unavailable, remaining layers are re-weighted proportionally.
      </Text>

      {ALL_LAYERS.map((layer) => {
        const ls = assessment.compositeScore.layerScores[layer];
        const available = ls?.available ?? false;
        const coverage = ls?.coverage ?? 0;
        const coveragePct = Math.round(coverage * 100);

        return (
          <View key={layer} style={{ marginBottom: 12 }}>
            <View style={s.row}>
              <Text style={[s.body, { fontFamily: 'Helvetica-Bold' }]}>{LAYER_NAMES[layer]}</Text>
              <Text style={s.mono}>{available ? `${ls!.score}/100 · ${coveragePct}%` : 'Unavailable'}</Text>
            </View>
            <View style={s.coverageBar}>
              <View style={[s.coverageFill, {
                width: `${coveragePct}%`,
                backgroundColor: !available ? DATA_GRAY : coverage >= 0.6 ? FOREST : coverage >= 0.35 ? AMBER : SIGNAL_RED,
              }]} />
            </View>
          </View>
        );
      })}

      <View style={[s.divider, { marginTop: 24 }]} />

      <Text style={s.h3}>Methodology</Text>
      <Text style={s.body}>
        Scoring v{assessment.compositeScore.scoringVersion}. Layer weights: Water 25%, Air 25%, Proximity 20%, Soil 15%, EJ 15%.
        All recommendations are deterministic — sourced from expert-written templates triggered by specific data thresholds, not generated by AI.
      </Text>

      <View style={s.divider} />

      <Text style={s.h3}>Disclaimer</Text>
      <Text style={s.body}>
        This report aggregates publicly available federal data for informational purposes.
        It is not a substitute for professional environmental testing, inspection, or medical advice.
      </Text>

      <PageFooter />
    </Page>
  );
}

function PageFooter() {
  return (
    <View style={s.footer} fixed>
      <Text>Bedrock Environmental Exposure Report</Text>
      <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
    </View>
  );
}

export function ExposureReportPdf({ assessment, narrative, recommendations }: ExposureReportPdfProps) {
  const { compositeScore } = assessment;
  const availableLayers = compositeScore.layersIncluded.filter((layer) => {
    const ls = compositeScore.layerScores[layer];
    return ls && ls.available;
  });

  return (
    <Document
      title={`Bedrock Report — ${assessment.address.normalized || assessment.address.raw}`}
      author="Bedrock"
      subject="Environmental Exposure Assessment"
    >
      <CoverPage assessment={assessment} />

      {narrative && <NarrativePage narrative={narrative} />}

      {availableLayers.map((layer) => (
        <LayerPage
          key={layer}
          layer={layer}
          ls={compositeScore.layerScores[layer]!}
          assessment={assessment}
        />
      ))}

      <RecommendationsPage recommendations={recommendations} />

      <CoveragePage assessment={assessment} />
    </Document>
  );
}

function formatSubScoreName(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

function extractDataPoints(
  layer: ExposureLayer,
  ls: LayerScore,
  assessment: ExposureAssessment,
): { label: string; value: string | number; source: string; agency: string }[] {
  const raw = ls.rawData as Record<string, unknown>;

  switch (layer) {
    case 'water': {
      const points: { label: string; value: string | number; source: string; agency: string }[] = [];
      const pfasMax = raw.pfasMaxPpt as number | null;
      if (pfasMax !== null) {
        points.push({ label: 'Peak PFAS concentration', value: `${pfasMax} ppt`, source: raw.pfasSource === 'ucmr5' ? 'UCMR 5' : 'WQP', agency: 'EPA' });
      }
      const violations = raw.violationCount as number;
      if (violations != null) {
        points.push({ label: 'SDWIS violations', value: violations, source: 'SDWIS', agency: 'EPA' });
      }
      const leadPct = raw.leadPctPre1986 as number | null;
      if (leadPct != null) {
        points.push({ label: 'Housing pre-1986', value: `${leadPct}%`, source: 'ACS B25034', agency: 'Census' });
      }
      return points;
    }
    case 'air': {
      const points: { label: string; value: string | number; source: string; agency: string }[] = [];
      const pm25 = raw.pm25 as number | null;
      if (pm25 != null) points.push({ label: 'PM2.5 annual mean', value: `${pm25.toFixed(1)} µg/m³`, source: 'AQS/OpenAQ', agency: 'EPA' });
      const triCount = raw.triEmitters as number;
      if (triCount != null) points.push({ label: 'TRI emitters within 3 mi', value: triCount, source: 'ECHO', agency: 'EPA' });
      return points;
    }
    case 'proximity': {
      const points: { label: string; value: string | number; source: string; agency: string }[] = [];
      const sfCount = raw.superfundSiteCount as number;
      if (sfCount != null) points.push({ label: 'Superfund NPL sites (5 mi)', value: sfCount, source: 'FRS/SEMS', agency: 'EPA' });
      const echoTotal = raw.totalEchoFacilities as number;
      if (echoTotal != null) points.push({ label: 'Regulated facilities', value: echoTotal, source: 'ECHO', agency: 'EPA' });
      return points;
    }
    case 'soil': {
      const points: { label: string; value: string | number; source: string; agency: string }[] = [];
      const brownfieldCount = assessment.soilData?.brownfields?.length ?? 0;
      points.push({ label: 'Brownfield sites (2 mi)', value: brownfieldCount, source: 'Brownfields', agency: 'EPA' });
      const ssurgo = assessment.soilData?.ssurgo;
      if (ssurgo?.dominantTexture) points.push({ label: 'Soil texture', value: ssurgo.dominantTexture, source: 'SSURGO', agency: 'USDA' });
      const fz = assessment.soilData?.floodZone;
      if (fz) points.push({ label: 'FEMA flood zone', value: `Zone ${fz.zone}`, source: 'NFHL', agency: 'FEMA' });
      return points;
    }
    case 'ej': {
      const points: { label: string; value: string | number; source: string; agency: string }[] = [];
      const ejscreen = assessment.ejData?.ejscreen;
      if (ejscreen?.ejIndex != null) points.push({ label: 'EJ Index percentile', value: `${Math.round(ejscreen.ejIndex)}th`, source: 'EJScreen', agency: 'EPA' });
      return points;
    }
  }
}
