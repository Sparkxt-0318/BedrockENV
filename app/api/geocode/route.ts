import { NextRequest, NextResponse } from 'next/server';
import { geocodeAddress, lookupWaterSystem } from '@/lib/data-sources/geocoding';
import { checkPerMinuteLimit, hashIp } from '@/lib/rate-limit';

const GEOCODE_RATE_LIMIT = 10; // requests per minute per IP

/**
 * POST /api/geocode
 * Body: { address: string }
 *
 * Geocodes a U.S. address and returns:
 *   - lat/lng, FIPS codes, census geography
 *   - serving water system (PWSID, name, populationServed, primarySource)
 *   - source: 'census' | 'mapbox'
 *
 * Status codes:
 *   200  Geocoding succeeded
 *   400  Missing or too-short address
 *   404  Address could not be geocoded
 *   429  Rate limit exceeded (10 req/min per IP)
 *   503  Upstream geocoding service timed out
 */
export async function POST(request: NextRequest) {
  // ── Rate limit ────────────────────────────────────────────────────────────
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    '127.0.0.1';
  const ipKey = hashIp(ip);
  const rateLimit = checkPerMinuteLimit(ipKey, GEOCODE_RATE_LIMIT);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please wait before making another request.' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(rateLimit.resetAt),
          'Retry-After': String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)),
        },
      }
    );
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  let address: string;
  try {
    const body = await request.json();
    address = typeof body?.address === 'string' ? body.address.trim() : '';
  } catch {
    return NextResponse.json(
      { error: 'Request body must be JSON with an "address" field.' },
      { status: 400 }
    );
  }

  if (address.length < 5) {
    return NextResponse.json(
      { error: 'Please provide a valid U.S. address (at least 5 characters).' },
      { status: 400 }
    );
  }

  // ── Geocode ───────────────────────────────────────────────────────────────
  let geocoded;
  try {
    geocoded = await geocodeAddress(address);
  } catch (err) {
    // Distinguish upstream timeout from unexpected errors
    const isTimeout =
      err instanceof Error &&
      (err.name === 'AbortError' ||
        err.message.toLowerCase().includes('abort') ||
        err.message.toLowerCase().includes('timeout'));

    if (isTimeout) {
      return NextResponse.json(
        { error: 'Geocoding service timed out. Please try again.' },
        { status: 503 }
      );
    }
    console.error('Unexpected geocoding error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred during geocoding.' },
      { status: 500 }
    );
  }

  if (!geocoded) {
    return NextResponse.json(
      {
        error:
          'Could not geocode this address. Check that it is a valid U.S. address and try again.',
      },
      { status: 404 }
    );
  }

  // ── PWSID lookup ──────────────────────────────────────────────────────────
  // Non-fatal: PWSID lookup failure doesn't block the geocode response.
  if (geocoded.fipsState && geocoded.fipsCounty) {
    try {
      const waterSystem = await lookupWaterSystem(
        geocoded.fipsState,
        geocoded.fipsCounty
      );
      if (waterSystem) {
        geocoded.waterSystemId = waterSystem.pwsid;
        geocoded.waterSystemName = waterSystem.name;
      }
    } catch (err) {
      // Log but do not fail the entire request
      console.warn('PWSID lookup failed (non-fatal):', err);
    }
  }

  return NextResponse.json(
    { data: geocoded },
    {
      headers: {
        'X-RateLimit-Remaining': String(rateLimit.remaining),
        'X-RateLimit-Reset': String(rateLimit.resetAt),
      },
    }
  );
}
