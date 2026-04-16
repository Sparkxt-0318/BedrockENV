import { ExposureAssessment } from '@/types/exposure';
import { NarrativeRequest, NarrativeResponse } from './types';
import { SYSTEM_PROMPT } from './prompts/system';
import { buildFreeSummaryPrompt } from './prompts/free-summary';

/**
 * AI Narrative Generator
 *
 * Uses Claude API to generate a plain-English summary of the exposure data.
 * The AI ONLY describes data — it NEVER prescribes actions.
 * Recommendations come from the deterministic template engine.
 */

export async function generateNarrative(
  assessment: ExposureAssessment
): Promise<NarrativeResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return {
      summary: buildFallbackNarrative(assessment),
      error: null,
    };
  }

  const request = buildNarrativeRequest(assessment);
  const userPrompt = buildFreeSummaryPrompt(request);

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!response.ok) {
      console.error(`Claude API error: ${response.status}`);
      return {
        summary: buildFallbackNarrative(assessment),
        error: `Claude API returned ${response.status}`,
      };
    }

    const data = await response.json();
    const text = data?.content?.[0]?.text;

    if (!text) {
      return {
        summary: buildFallbackNarrative(assessment),
        error: 'Empty response from Claude API',
      };
    }

    return { summary: text, error: null };
  } catch (err) {
    console.error('Narrative generation error:', err);
    return {
      summary: buildFallbackNarrative(assessment),
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

function buildNarrativeRequest(assessment: ExposureAssessment): NarrativeRequest {
  const waterScore = assessment.compositeScore.layerScores.water;
  const soilScore = assessment.compositeScore.layerScores.soil;

  // Build water summary
  let waterSummary = 'No water data available.';
  if (assessment.waterData) {
    const parts: string[] = [];
    const wd = assessment.waterData;
    if (wd.pfas && wd.pfas.analytes.length > 0) {
      parts.push(
        `PFAS detected: ${wd.pfas.analytes.length} analyte(s), max ${wd.pfas.maxIndividual} ppt${wd.pfas.exceedsMcl ? ' (exceeds EPA MCL of 4 ppt)' : ''}`
      );
    } else {
      parts.push('No PFAS detections in UCMR 5 testing');
    }
    if (wd.violations.length > 0) {
      parts.push(`${wd.violations.length} water system violation(s) on record`);
    }
    if (wd.leadRisk) {
      parts.push(`${wd.leadRisk.pctPre1986}% pre-1986 housing (lead risk indicator)`);
    }
    waterSummary = parts.join('. ');
  }

  // Build soil summary
  let soilSummary = 'No soil data available.';
  if (assessment.soilData) {
    const parts: string[] = [];
    const sd = assessment.soilData;
    if (sd.ssurgo) {
      parts.push(`${sd.ssurgo.dominantTexture} soil, pH ${sd.ssurgo.phRange[0].toFixed(1)}-${sd.ssurgo.phRange[1].toFixed(1)}, ${sd.ssurgo.organicMatterPct}% organic matter, ${sd.ssurgo.drainageClass} drainage`);
    }
    if (sd.brownfields.length > 0) {
      parts.push(`${sd.brownfields.length} brownfield site(s) within 2 miles, nearest at ${sd.brownfields[0].distance.toFixed(1)} miles`);
    }
    if (sd.floodZone) {
      parts.push(`FEMA Flood Zone ${sd.floodZone.zone}${sd.floodZone.isSpecialFloodHazardArea ? ' (Special Flood Hazard Area)' : ''}`);
    }
    if (sd.moistureData) {
      parts.push(`Avg precipitation ${sd.moistureData.precipitationAvgMm} mm/month, trend: ${sd.moistureData.trend}`);
    }
    soilSummary = parts.join('. ');
  }

  return {
    address: assessment.address.normalized,
    compositeScore: assessment.compositeScore.score,
    confidence: assessment.compositeScore.confidence,
    waterScore: waterScore?.score ?? null,
    soilScore: soilScore?.score ?? null,
    waterSummary,
    soilSummary,
    layersIncluded: assessment.compositeScore.layersIncluded,
  };
}

/**
 * Fallback narrative when Claude API is unavailable.
 * Uses a deterministic template — no AI involved.
 */
function buildFallbackNarrative(assessment: ExposureAssessment): string {
  const { address, compositeScore, waterData, soilData } = assessment;
  const paragraphs: string[] = [];

  // Paragraph 1: Lead finding — handle insufficient-data case
  if (compositeScore.sufficient === false) {
    const pct = Math.round((compositeScore.coverage ?? 0) * 100);
    paragraphs.push(
      `The environmental exposure assessment for ${address.normalized} has insufficient data coverage (${pct}%) to produce a reliable composite score. The score of ${compositeScore.score} out of 100 is based on ${compositeScore.layersIncluded.length} data layer(s), but key sub-components could not be populated for this location. The per-layer scores below may still be useful.`
    );
  } else {
    const score = compositeScore.score;
    const level = score <= 25 ? 'low' : score <= 50 ? 'moderate' : score <= 75 ? 'elevated' : 'high';
    paragraphs.push(
      `The environmental exposure assessment for ${address.normalized} shows a composite score of ${score} out of 100, indicating ${level} cumulative environmental exposure burden based on ${compositeScore.layersIncluded.length} data layer(s) analyzed.`
    );
  }

  // Paragraph 2: Layer details
  if (waterData) {
    const parts: string[] = [];
    if (waterData.pfas && waterData.pfas.analytes.length > 0) {
      parts.push(
        `Your water system (${waterData.systemName}) reported ${waterData.pfas.analytes.length} PFAS analyte(s) detected in EPA UCMR 5 testing, with a maximum individual concentration of ${waterData.pfas.maxIndividual} ppt${waterData.pfas.exceedsMcl ? ', which exceeds the EPA Maximum Contaminant Level of 4 ppt' : ''}.`
      );
    }
    if (waterData.violations.length > 0) {
      parts.push(`The water system has ${waterData.violations.length} violation(s) on record.`);
    }
    if (parts.length > 0) paragraphs.push(parts.join(' '));
  }

  if (soilData) {
    const parts: string[] = [];
    if (soilData.ssurgo) {
      parts.push(
        `Soil survey data indicates ${soilData.ssurgo.dominantTexture} soil with ${soilData.ssurgo.organicMatterPct}% organic matter.`
      );
    }
    if (soilData.brownfields.length > 0) {
      parts.push(
        `${soilData.brownfields.length} brownfield site(s) were identified within 2 miles of your property.`
      );
    }
    if (soilData.floodZone) {
      parts.push(`Your property is in FEMA Flood Zone ${soilData.floodZone.zone}.`);
    }
    if (parts.length > 0) paragraphs.push(parts.join(' '));
  }

  // Paragraph 3: Confidence
  if (compositeScore.confidence === 'insufficient') {
    paragraphs.push(
      `Data coverage for this location is limited. Some data sources did not return results, which reduces the reliability of the overall score. Per-layer details above reflect only the data that was available.`
    );
  } else {
    paragraphs.push(
      `This assessment is based on ${compositeScore.confidence} confidence data. Water data is reported at the water system level (area-level resolution), while soil and flood zone data ranges from neighborhood to property-level precision.`
    );
  }

  return paragraphs.join('\n\n');
}
