import { NarrativeRequest } from '../types';

export function buildFreeSummaryPrompt(data: NarrativeRequest): string {
  return `Generate a 3–4 paragraph environmental exposure summary for this address.

Paragraph 1: Lead with the most significant finding. What is the single biggest exposure concern at this location?

Paragraph 2: Summarize the other layer(s), noting how this location compares to national or state averages where data is available.

Paragraph 3: Briefly note the confidence level of the data (which data points are property-level vs. neighborhood-level vs. area-level).

Do NOT include recommendations or advice — those are provided separately.

DATA PAYLOAD:
Address: ${data.address}
Composite Exposure Score: ${data.compositeScore}/100 (confidence: ${data.confidence})
Layers included: ${data.layersIncluded.join(', ')}
${data.waterScore !== null ? `Water Score: ${data.waterScore}/100 — ${data.waterSummary}` : 'Water layer: data unavailable'}
${data.soilScore !== null ? `Soil Score: ${data.soilScore}/100 — ${data.soilSummary}` : 'Soil layer: data unavailable'}`;
}
