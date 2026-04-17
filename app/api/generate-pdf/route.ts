import { NextRequest, NextResponse } from 'next/server';
import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { createServerClient } from '@supabase/ssr';
import { ExposureReportPdf } from '@/lib/pdf/templates/exposure-report';
import { evaluateRecommendations } from '@/lib/recommendations/engine';
import { getApplicableDisclaimers } from '@/lib/recommendations/disclaimers';
import { generateNarrative } from '@/lib/ai/narrator';
import type { ExposureAssessment } from '@/types/exposure';

export async function POST(request: NextRequest) {
  try {
    const { assessmentId } = await request.json();

    if (!assessmentId) {
      return NextResponse.json({ error: 'assessmentId required' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll() { /* read-only */ },
      },
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single();

    const isPro = profile?.subscription_tier === 'pro';

    const { data: purchasedReport } = await supabase
      .from('reports')
      .select('id')
      .eq('user_id', user.id)
      .eq('assessment_id', assessmentId)
      .in('report_type', ['consumer', 'pro'])
      .limit(1)
      .maybeSingle();

    if (!isPro && !purchasedReport) {
      return NextResponse.json({ error: 'Report not purchased' }, { status: 403 });
    }

    const { data: assessmentRow } = await supabase
      .from('exposure_assessments')
      .select('*')
      .eq('id', assessmentId)
      .single();

    if (!assessmentRow) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }

    const assessment = rowToAssessment(assessmentRow);

    const recommendations = evaluateRecommendations(assessment);
    const disclaimers = getApplicableDisclaimers(assessment.compositeScore.layersIncluded);

    let narrative: string | undefined;
    try {
      const result = await generateNarrative(assessment);
      narrative = result.summary || undefined;
    } catch {
      narrative = undefined;
    }

    const pdfElement = React.createElement(ExposureReportPdf, {
      assessment,
      narrative,
      recommendations,
      disclaimers,
    });
    // @react-pdf/renderer types require DocumentProps but our wrapper component is valid
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfBuffer = await renderToBuffer(pdfElement as any);

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (serviceKey && supabaseUrl) {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const admin = createClient(supabaseUrl, serviceKey);
        const fileName = `reports/${assessmentId}/${Date.now()}.pdf`;

        await admin.storage.from('bedrock-reports').upload(fileName, pdfBuffer, {
          contentType: 'application/pdf',
          upsert: true,
        });

        const { data: urlData } = admin.storage.from('bedrock-reports').getPublicUrl(fileName);

        if (urlData?.publicUrl) {
          await admin.from('reports')
            .update({ pdf_url: urlData.publicUrl })
            .eq('assessment_id', assessmentId)
            .eq('user_id', user.id);
        }
      } catch {
        // Storage upload failed — still return the PDF directly
      }
    }

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="bedrock-report-${assessmentId.slice(0, 8)}.pdf"`,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (err) {
    console.error('PDF generation failed:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'PDF generation failed' },
      { status: 500 }
    );
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToAssessment(row: any): ExposureAssessment {
  return {
    id: row.id,
    address: {
      raw: row.address_raw,
      normalized: row.address_normalized,
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
      fipsState: row.fips_state || '',
      fipsCounty: row.fips_county || '',
      censusTract: row.census_tract || '',
      censusBlockGroup: row.census_block_group || '',
      waterSystemId: row.water_system_id || undefined,
    },
    compositeScore: {
      score: Number(row.composite_score),
      confidence: row.composite_confidence || 'moderate',
      sufficient: row.sufficient ?? true,
      coverage: Number(row.coverage || 0),
      scoringVersion: row.scoring_version || 4,
      layersIncluded: row.layers_available || [],
      layerScores: buildLayerScores(row),
    },
    waterData: row.raw_water_data || undefined,
    soilData: row.raw_soil_data || undefined,
    airData: row.raw_air_data || undefined,
    proximityData: row.raw_proximity_data || undefined,
    ejData: row.raw_ej_data || undefined,
    dataFreshness: row.data_freshness || row.created_at,
    createdAt: row.created_at,
  };
}

const LAYER_KEYS = ['water', 'soil', 'air', 'proximity', 'ej'] as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildLayerScores(row: any): Record<string, any> {
  const scores: Record<string, unknown> = {};
  for (const layer of LAYER_KEYS) {
    const scoreField = `${layer}_score`;
    const confField = `${layer}_confidence`;
    if (row[scoreField] != null) {
      const rawDataField = `raw_${layer}_data`;
      scores[layer] = {
        score: Number(row[scoreField]),
        confidence: row[confField] || 'neighborhood',
        available: true,
        coverage: 0.8,
        subScores: {},
        rawData: row[rawDataField] || {},
      };
    }
  }
  return scores;
}
