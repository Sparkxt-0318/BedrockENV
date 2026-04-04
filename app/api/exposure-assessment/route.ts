import { NextRequest, NextResponse } from 'next/server';
import { fetchFullAssessment } from '@/lib/data-sources';

/**
 * GET /api/exposure-assessment?address=...
 *
 * Orchestrator endpoint: geocodes the address, fetches all data layers,
 * computes scores, and returns a complete ExposureAssessment.
 *
 * Degrades gracefully — returns partial data when individual APIs fail.
 */
export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get('address');

  if (!address || address.trim().length < 5) {
    return NextResponse.json(
      { error: 'Please provide a valid U.S. address.' },
      { status: 400 }
    );
  }

  const result = await fetchFullAssessment(address);

  if (!result.assessment) {
    return NextResponse.json(
      {
        error: 'Could not generate an exposure assessment for this address.',
        details: result.errors,
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    data: result.assessment,
    warnings: result.errors.length > 0 ? result.errors : undefined,
  });
}
