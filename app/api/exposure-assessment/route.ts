import { NextRequest, NextResponse } from 'next/server';
import { fetchFullAssessment } from '@/lib/data-sources';
import { checkRateLimit, hashIp, UserTier } from '@/lib/rate-limit';
import { createServerClient } from '@supabase/ssr';

/**
 * GET /api/exposure-assessment?address=...
 *
 * Orchestrator endpoint: geocodes the address, fetches all data layers,
 * computes scores, and returns a complete ExposureAssessment.
 *
 * Rate limited:
 * - Anonymous: 3 searches/day
 * - Authenticated free: 10 searches/month
 * - Pro: unlimited
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

  // Determine user tier for rate limiting
  let tier: UserTier = 'anonymous';
  let identifier = hashIp(
    request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? '127.0.0.1'
  );

  // Check if user is authenticated
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
          cookies: {
            getAll() { return request.cookies.getAll(); },
            setAll() { /* read-only in route handlers */ },
          },
        }
      );
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        identifier = user.id;
        tier = 'authenticated'; // TODO: check subscription_tier for 'pro'
      }
    } catch {
      // Auth check failed — fall through to anonymous
    }
  }

  // Rate limit check
  const rateLimit = checkRateLimit(identifier, tier);
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
    rateLimit: {
      remaining: rateLimit.remaining,
      tier,
    },
  });
}
