import { NextRequest, NextResponse } from 'next/server';
import { ExposureAssessment } from '@/types/exposure';
import { generateNarrative } from '@/lib/ai/narrator';
import { evaluateRecommendations } from '@/lib/recommendations/engine';
import { getApplicableDisclaimers } from '@/lib/recommendations/disclaimers';

/**
 * POST /api/generate-narrative
 *
 * Takes an ExposureAssessment payload, generates:
 * 1. AI narrative summary (Claude API — describes data only)
 * 2. Deterministic recommendations (from template engine)
 * 3. Applicable disclaimers
 *
 * The AI call is the LAST step in the pipeline — all scoring and
 * recommendation matching happens before narrative generation.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const assessment = body.assessment as ExposureAssessment;

    if (!assessment || !assessment.address) {
      return NextResponse.json(
        { error: 'Invalid assessment data' },
        { status: 400 }
      );
    }

    // Step 1: Evaluate deterministic recommendations
    const recommendations = evaluateRecommendations(assessment);

    // Step 2: Get applicable disclaimers
    const disclaimers = getApplicableDisclaimers(
      assessment.compositeScore.layersIncluded
    );

    // Step 3: Generate AI narrative (last step — receives pre-computed data)
    const narrative = await generateNarrative(assessment);

    return NextResponse.json({
      narrative: narrative.summary,
      recommendations,
      disclaimers,
      narrativeError: narrative.error,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to generate narrative' },
      { status: 500 }
    );
  }
}
