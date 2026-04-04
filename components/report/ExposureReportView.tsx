import { ExposureAssessment } from '@/types/exposure';
import { ExposureScoreGauge } from './ExposureScoreGauge';
import { LayerCard } from './LayerCard';
import { WaterLayerDetails } from './WaterLayerDetails';
import { SoilLayerDetails } from './SoilLayerDetails';
import { DisclaimerBanner } from './DisclaimerBanner';
import { Card, CardContent } from '@/components/ui';

interface ExposureReportViewProps {
  assessment: ExposureAssessment;
  warnings?: string[];
}

export function ExposureReportView({ assessment, warnings }: ExposureReportViewProps) {
  const { address, compositeScore, waterData, soilData } = assessment;
  const waterScore = compositeScore.layerScores.water;
  const soilScore = compositeScore.layerScores.soil;

  // Build water summary line
  let waterSummary = 'Water contamination data for your water system.';
  if (waterData) {
    const parts: string[] = [];
    if (waterData.pfas && waterData.pfas.analytes.length > 0) {
      parts.push(
        `${waterData.pfas.analytes.length} PFAS analyte(s) detected${waterData.pfas.exceedsMcl ? ' — exceeds EPA MCL' : ''}`
      );
    }
    if (waterData.violations.length > 0) {
      parts.push(`${waterData.violations.length} violation(s) on record`);
    }
    if (waterData.leadRisk) {
      parts.push(`${waterData.leadRisk.pctPre1986}% pre-1986 housing (lead risk)`);
    }
    if (parts.length > 0) waterSummary = parts.join(' | ');
  }

  // Build soil summary line
  let soilSummary = 'Soil health and contamination data for your area.';
  if (soilData) {
    const parts: string[] = [];
    if (soilData.ssurgo) {
      parts.push(`${soilData.ssurgo.dominantTexture} soil, ${soilData.ssurgo.organicMatterPct}% OM`);
    }
    if (soilData.brownfields.length > 0) {
      const nearest = soilData.brownfields[0];
      parts.push(`${soilData.brownfields.length} brownfield site(s) within 2 mi (nearest: ${nearest.distance.toFixed(1)} mi)`);
    }
    if (soilData.floodZone) {
      parts.push(`Flood Zone ${soilData.floodZone.zone}`);
      if (soilData.floodZone.isSpecialFloodHazardArea) {
        parts[parts.length - 1] += ' (SFHA)';
      }
    }
    if (parts.length > 0) soilSummary = parts.join(' | ');
  }

  return (
    <div className="pb-0">
      {/* Header */}
      <div className="bg-bg-surface border-b border-border">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
          <p className="text-sm text-text-tertiary mb-1">Exposure Report</p>
          <h1 className="font-[family-name:var(--font-instrument-serif)] text-2xl sm:text-3xl text-text-primary">
            {address.normalized}
          </h1>
          <p className="text-sm text-text-secondary mt-2">
            {address.latitude.toFixed(4)}, {address.longitude.toFixed(4)}
            {address.waterSystemName && (
              <> &middot; Water system: {address.waterSystemName}</>
            )}
          </p>
        </div>
      </div>

      {/* Main content */}
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 space-y-8">
        {/* Warnings */}
        {warnings && warnings.length > 0 && (
          <Card>
            <CardContent className="py-3">
              <p className="text-sm font-medium text-exposure-moderate mb-1">
                Some data sources were unavailable
              </p>
              <ul className="text-xs text-text-secondary space-y-0.5">
                {warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Composite Score Gauge */}
        <div className="flex justify-center">
          <ExposureScoreGauge compositeScore={compositeScore} />
        </div>

        {/* Layer Cards */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-text-primary">Exposure Layers</h2>

          {waterScore && waterScore.available && waterData && (
            <LayerCard
              layer="water"
              layerScore={waterScore}
              title="Water Contamination"
              summary={waterSummary}
            >
              <WaterLayerDetails data={waterData} />
            </LayerCard>
          )}

          {soilScore && soilScore.available && soilData && (
            <LayerCard
              layer="soil"
              layerScore={soilScore}
              title="Soil Health & Contamination"
              summary={soilSummary}
            >
              <SoilLayerDetails data={soilData} />
            </LayerCard>
          )}
        </div>

        {/* Data source footer */}
        <div className="border-t border-border pt-6">
          <h3 className="text-sm font-medium text-text-secondary mb-3">Data Sources</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-text-tertiary">
            <div>EPA UCMR 5 — PFAS testing data (2023–2025)</div>
            <div>EPA SDWIS — Drinking water violation history</div>
            <div>U.S. Census ACS B25034 — Housing age (2022)</div>
            <div>USDA SSURGO — Soil survey data</div>
            <div>EPA Brownfields — Contaminated site proximity</div>
            <div>FEMA NFHL — Flood zone designation</div>
            <div>NASA POWER — Precipitation &amp; moisture data</div>
            <div>U.S. Census Bureau Geocoder</div>
          </div>
          <p className="text-xs text-text-tertiary mt-3">
            Report generated: {new Date(assessment.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Disclaimer */}
      <DisclaimerBanner />
    </div>
  );
}
