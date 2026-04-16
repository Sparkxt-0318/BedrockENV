import { NextRequest, NextResponse } from 'next/server';
import { fetchFullAssessment } from '@/lib/data-sources';
import { checkRateLimit, hashIp, UserTier } from '@/lib/rate-limit';
import { createServerClient } from '@supabase/ssr';
import { SCORING_VERSION } from '@/lib/scoring/version';

/**
 * GET /api/exposure-assessment?address=...
 *
 * Orchestrator endpoint: geocodes the address, fetches all data layers,
 * computes scores, and returns a complete ExposureAssessment.
 *
 * Features:
 * - Supabase caching: reuses recent assessments for the same normalized address
 * - Pro tier detection: checks user subscription_tier in profiles table
 * - Rate limited: anonymous 3/day, authenticated free 10/month, pro unlimited
 * - Graceful degradation: returns partial data when individual APIs fail
 */
export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get('address');

  if (!address || address.trim().length < 5) {
    return NextResponse.json(
      { error: 'Please provide a valid U.S. address.' },
      { status: 400 }
    );
  }

  // Determine user tier for rate limiting
  let tier: UserTier = 'anonymous';
  let userId: string | null = null;
  let identifier = hashIp(
    request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? '127.0.0.1'
  );

  // Helper to create Supabase server client for this request
  function getSupabase() {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return null;
    }
    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() { return request.cookies.getAll(); },
          setAll() { /* read-only in route handlers */ },
        },
      }
    );
  }

  // Check if user is authenticated + detect pro tier
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        userId = user.id;
        identifier = user.id;
        tier = 'authenticated';

        // Check subscription tier from profiles table
        const { data: profile } = await supabase
          .from('profiles')
          .select('subscription_tier')
          .eq('id', user.id)
          .single();

        if (profile?.subscription_tier === 'pro') {
          tier = 'pro';
        }
      }
    } catch {
      // Auth check failed — fall through to anonymous
    }
  }

  // Rate limit check.
  //
  // Integration tests need to issue several assessment requests against a
  // local dev server in one run. When NODE_ENV !== 'production' and the
  // request includes `x-bedrock-test-bypass: <token>` matching the
  // `BEDROCK_TEST_BYPASS_TOKEN` env var, skip the rate limiter entirely.
  // The bypass is guarded so it is impossible to trip in production even
  // if the env var leaks.
  const bypassToken = process.env.BEDROCK_TEST_BYPASS_TOKEN;
  const bypassHeader = request.headers.get('x-bedrock-test-bypass');
  const isTestBypass =
    process.env.NODE_ENV !== 'production' &&
    !!bypassToken &&
    bypassHeader === bypassToken;

  const rateLimit = isTestBypass
    ? { allowed: true, remaining: Infinity, resetAt: 0 }
    : checkRateLimit(identifier, tier);
  if (!rateLimit.allowed) {
    const resetDate = new Date(rateLimit.resetAt).toLocaleDateString();
    return NextResponse.json(
      {
        error: tier === 'anonymous'
          ? `You've reached the limit of 3 free searches per day. Create a free account for 10 searches/month, or try again after ${resetDate}.`
          : `You've reached your search limit. Upgrade to Pro for unlimited searches, or try again after ${resetDate}.`,
        rateLimited: true,
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Remaining': String(rateLimit.remaining),
          'X-RateLimit-Reset': String(rateLimit.resetAt),
        },
      }
    );
  }

  // Check Supabase cache for recent assessment of same address (within 24h).
  // The integration test bypass header also skips the read cache so runs
  // exercise the current scoring pipeline instead of stale rows.
  if (supabase && !isTestBypass) {
    try {
      const normalizedSearch = address.trim().toUpperCase();
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: cached } = await supabase
        .from('exposure_assessments')
        .select('*')
        .eq('address_normalized', normalizedSearch)
        .gte('created_at', oneDayAgo)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // Skip rows whose scoring_version doesn't match the current pipeline.
      // NULL scoring_version (pre-Step-1 rows) is treated as version 0 → stale.
      if (cached && (cached.scoring_version ?? 0) === SCORING_VERSION) {
        // Log the search
        await logSearch(supabase, userId, address, cached.id, identifier);

        // Reconstruct ExposureAssessment from cached row
        const cachedCoverage = cached.coverage != null ? Number(cached.coverage) : 0;
        const cachedSufficient = cached.sufficient ?? false;
        return NextResponse.json({
          data: {
            id: cached.id,
            address: {
              raw: cached.address_raw,
              normalized: cached.address_normalized,
              latitude: cached.latitude,
              longitude: cached.longitude,
              fipsState: cached.fips_state || '',
              fipsCounty: cached.fips_county || '',
              censusTract: cached.census_tract || '',
              censusBlockGroup: cached.census_block_group || '',
              waterSystemId: cached.water_system_id || undefined,
            },
            compositeScore: {
              score: Number(cached.composite_score) || 0,
              confidence: cached.composite_confidence || 'low',
              sufficient: cachedSufficient,
              coverage: cachedCoverage,
              scoringVersion: cached.scoring_version ?? 0,
              layersIncluded: cached.layers_available || [],
              layerScores: {
                water: cached.water_score != null ? {
                  score: Number(cached.water_score),
                  confidence: cached.water_confidence || 'area',
                  available: true,
                  coverage: 1,
                  subScores: {},
                  rawData: {},
                } : undefined,
                soil: cached.soil_score != null ? {
                  score: Number(cached.soil_score),
                  confidence: cached.soil_confidence || 'area',
                  available: true,
                  coverage: 1,
                  subScores: {},
                  rawData: {},
                } : undefined,
              },
            },
            waterData: cached.raw_water_data || undefined,
            soilData: cached.raw_soil_data || undefined,
            dataFreshness: cached.data_freshness,
            createdAt: cached.created_at,
          },
          cached: true,
          rateLimit: {
            remaining: rateLimit.remaining,
            tier,
          },
        });
      }
    } catch {
      // Cache lookup failed — proceed with fresh fetch
    }
  }

  // Fetch fresh assessment
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

  // Cache the result in Supabase
  if (supabase && result.assessment) {
    try {
      const a = result.assessment;
      const waterScore = a.compositeScore.layerScores.water;
      const soilScore = a.compositeScore.layerScores.soil;

      const { data: inserted } = await supabase
        .from('exposure_assessments')
        .upsert({
          id: a.id,
          address_raw: a.address.raw,
          address_normalized: a.address.normalized,
          latitude: a.address.latitude,
          longitude: a.address.longitude,
          fips_state: a.address.fipsState,
          fips_county: a.address.fipsCounty,
          census_tract: a.address.censusTract,
          census_block_group: a.address.censusBlockGroup,
          water_system_id: a.address.waterSystemId || null,
          composite_score: a.compositeScore.score,
          composite_confidence: a.compositeScore.confidence,
          scoring_version: a.compositeScore.scoringVersion,
          coverage: a.compositeScore.coverage,
          sufficient: a.compositeScore.sufficient,
          water_score: waterScore?.score ?? null,
          water_confidence: waterScore?.confidence ?? null,
          soil_score: soilScore?.score ?? null,
          soil_confidence: soilScore?.confidence ?? null,
          raw_water_data: a.waterData || null,
          raw_soil_data: a.soilData || null,
          layers_available: a.compositeScore.layersIncluded,
          data_freshness: a.dataFreshness,
        }, { onConflict: 'address_normalized' })
        .select('id')
        .single();

      // Log the search
      const assessmentId = inserted?.id || a.id;
      await logSearch(supabase, userId, address, assessmentId, identifier);
    } catch (err) {
      console.error('Failed to cache assessment in Supabase:', err);
      // Non-fatal — return the assessment anyway
    }
  }

  return NextResponse.json({
    data: result.assessment,
    warnings: result.errors.length > 0 ? result.errors : undefined,
    rateLimit: {
      remaining: rateLimit.remaining,
      tier,
    },
  });
}

/**
 * Log a search to the search_log table.
 */
async function logSearch(
  supabase: ReturnType<typeof createServerClient>,
  userId: string | null,
  address: string,
  assessmentId: string,
  ipHash: string
) {
  try {
    await supabase.from('search_log').insert({
      user_id: userId,
      address_searched: address,
      assessment_id: assessmentId,
      ip_hash: ipHash,
    });
  } catch {
    // Non-fatal
  }
}
